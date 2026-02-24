"""Rent Comps — free rental comp analysis via HomeHarvest + HUD FMR + Overpass API."""

import asyncio
import logging
import math
import os
from datetime import datetime
from typing import Optional

import httpx

logger = logging.getLogger("agent_finder.scrapers.rent_comps")


# ─── Geo utils ─────────────────────────────────────────────────────────────────

def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return great-circle distance in miles between two lat/lng points."""
    R = 3958.8
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _cross(o, a, b) -> float:
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def segments_intersect(p1, p2, p3, p4) -> bool:
    """Return True if line segment p1→p2 intersects p3→p4 (2-D cross-product test)."""
    d1 = _cross(p3, p4, p1)
    d2 = _cross(p3, p4, p2)
    d3 = _cross(p1, p2, p3)
    d4 = _cross(p1, p2, p4)
    if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and (
        (d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)
    ):
        return True
    return False


# ─── Geocoding ─────────────────────────────────────────────────────────────────

async def geocode(address: str, client: httpx.AsyncClient) -> Optional[tuple]:
    """Geocode address via Nominatim. Returns (lat, lon, zip) or None."""
    try:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": address, "format": "json", "limit": 1, "addressdetails": 1},
            headers={"User-Agent": "DispoDojo/1.0 (rentcomps@dispodojo.com)"},
            timeout=10,
        )
        data = resp.json()
        if not data:
            return None
        item = data[0]
        lat = float(item["lat"])
        lon = float(item["lon"])
        zip_code = item.get("address", {}).get("postcode", "")
        return lat, lon, zip_code
    except Exception as e:
        logger.warning("Geocode failed for '%s': %s", address, e)
        return None


# ─── Major road crossing detection ─────────────────────────────────────────────

async def crosses_major_road(
    lat1: float, lon1: float, lat2: float, lon2: float, client: httpx.AsyncClient
) -> bool:
    """
    Returns True if the straight-line path between two points crosses a major road
    (motorway, trunk, primary, secondary) per OpenStreetMap via Overpass API.
    Returns False on any error so we don't exclude comps if the check fails.
    """
    pad = 0.001
    bbox = f"{min(lat1,lat2)-pad},{min(lon1,lon2)-pad},{max(lat1,lat2)+pad},{max(lon1,lon2)+pad}"
    query = f"""
[out:json][timeout:10];
way["highway"~"^(motorway|trunk|primary|secondary)$"]({bbox});
out geom;
"""
    try:
        resp = await client.post(
            "https://overpass-api.de/api/interpreter",
            data={"data": query},
            timeout=15,
        )
        elements = resp.json().get("elements", [])
        subject = (lat1, lon1)
        comp_pt = (lat2, lon2)
        for way in elements:
            geom = way.get("geometry", [])
            for i in range(len(geom) - 1):
                road_a = (geom[i]["lat"], geom[i]["lon"])
                road_b = (geom[i + 1]["lat"], geom[i + 1]["lon"])
                if segments_intersect(subject, comp_pt, road_a, road_b):
                    return True
        return False
    except Exception as e:
        logger.warning("Overpass road check failed: %s", e)
        return False


# ─── HUD Fair Market Rent ───────────────────────────────────────────────────────

async def get_hud_fmr(zip_code: str, client: httpx.AsyncClient) -> Optional[dict]:
    """
    Fetch HUD Fair Market Rent data by ZIP via HUD API.
    Requires HUDUSER_API_TOKEN env var (free at huduser.gov/hudapi/public/register/developer).
    Returns None if token not set or request fails.
    """
    token = os.environ.get("HUDUSER_API_TOKEN", "")
    if not token or not zip_code:
        return None
    try:
        resp = await client.get(
            f"https://www.huduser.gov/hudapi/public/fmr/query/{zip_code}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        body = resp.json()
        d = body.get("data", {})
        if not d:
            return None
        return {
            "zip": zip_code,
            "area_name": d.get("metroarea_name", d.get("area_name", zip_code)),
            "fmr_0br": int(d.get("Efficiency", 0) or 0),
            "fmr_1br": int(d.get("One-Bedroom", 0) or 0),
            "fmr_2br": int(d.get("Two-Bedroom", 0) or 0),
            "fmr_3br": int(d.get("Three-Bedroom", 0) or 0),
            "fmr_4br": int(d.get("Four-Bedroom", 0) or 0),
        }
    except Exception as e:
        logger.warning("HUD FMR lookup failed for ZIP %s: %s", zip_code, e)
        return None


# ─── HomeHarvest rental search ─────────────────────────────────────────────────

def _safe(row, col, default=""):
    """Safe row value extraction — treats NaN/None as default."""
    try:
        import pandas as pd
        val = row.get(col)
        if val is None or (isinstance(val, float) and math.isnan(val)):
            return default
        s = str(val).strip()
        return default if s.lower() in ("", "nan", "none", "<na>", "na") else s
    except Exception:
        return default


def _sync_search_rentals(location: str):
    """Run HomeHarvest for_rent search synchronously (called from thread executor)."""
    try:
        from homeharvest import scrape_property
        df = scrape_property(location=location, listing_type="for_rent")
        return df
    except Exception as e:
        logger.warning("HomeHarvest for_rent failed for '%s': %s", location, e)
        return None


async def search_rental_comps(
    address: str,
    subject_lat: float,
    subject_lon: float,
    beds: int,
    baths: float,
    sqft: int,
    year_built: int,
) -> list:
    """
    Pull rental listings via HomeHarvest and filter by REI comp criteria:
    - Within 0.5-mile radius
    - Bed count ±1
    - Sqft ±25% (if provided)
    - Year built ±20 years (if provided)
    - Active ≤ 90 days on market
    - No major road crossing (Overpass API)
    Returns up to 5 best comps sorted by distance.
    """
    parts = [p.strip() for p in address.split(",")]
    if len(parts) >= 3:
        location = f"{parts[-2]}, {parts[-1]}"
    elif len(parts) == 2:
        location = parts[-1]
    else:
        location = address

    loop = asyncio.get_event_loop()
    df = await loop.run_in_executor(None, _sync_search_rentals, location)

    if df is None or df.empty:
        logger.info("No HomeHarvest for_rent results for location '%s'", location)
        return []

    comps = []
    async with httpx.AsyncClient() as client:
        for _, row in df.iterrows():
            # Extract monthly rent
            rent = 0.0
            for col in ["list_price", "price", "monthly_rent", "rent"]:
                try:
                    v = float(_safe(row, col, 0) or 0)
                    if v > 0:
                        rent = v
                        break
                except Exception:
                    pass
            if rent <= 100:
                continue

            try:
                comp_beds = int(float(_safe(row, "beds", 0) or 0))
                comp_baths = float(_safe(row, "baths", 0) or 0)
                comp_sqft_raw = _safe(row, "sqft", 0)
                comp_sqft = int(float(comp_sqft_raw) or 0) if comp_sqft_raw else 0
                comp_year_raw = _safe(row, "year_built", 0)
                comp_year = int(float(comp_year_raw) or 0) if comp_year_raw else 0
                comp_lat = float(_safe(row, "latitude", 0) or 0)
                comp_lon = float(_safe(row, "longitude", 0) or 0)
            except Exception:
                continue

            if not comp_lat or not comp_lon:
                continue

            # Filter: radius ≤ 0.5 miles
            distance = haversine_miles(subject_lat, subject_lon, comp_lat, comp_lon)
            if distance > 0.5:
                continue

            # Filter: beds within ±1
            if beds and comp_beds and abs(comp_beds - beds) > 1:
                continue

            # Filter: sqft within ±25%
            if sqft and comp_sqft:
                if comp_sqft < sqft * 0.75 or comp_sqft > sqft * 1.25:
                    continue

            # Filter: year_built within 20 years
            if year_built and comp_year and abs(comp_year - year_built) > 20:
                continue

            # Filter: no major road crossing
            blocked = await crosses_major_road(subject_lat, subject_lon, comp_lat, comp_lon, client)
            if blocked:
                logger.info("Comp at (%.4f, %.4f) excluded — crosses major road", comp_lat, comp_lon)
                continue

            comp_addr = ""
            for col in ["full_street_line", "street_address", "address"]:
                v = _safe(row, col, "")
                if v:
                    comp_addr = v
                    break

            dom_raw = _safe(row, "days_on_market", _safe(row, "dom", ""))
            try:
                dom = int(float(dom_raw)) if dom_raw else None
            except Exception:
                dom = None

            if dom is not None and dom > 90:
                continue

            comps.append({
                "address": comp_addr,
                "beds": comp_beds,
                "baths": comp_baths,
                "sqft": comp_sqft,
                "year_built": comp_year,
                "monthly_rent": int(rent),
                "rent_per_sqft": round(rent / comp_sqft, 2) if comp_sqft else 0,
                "distance_miles": round(distance, 2),
                "days_on_market": dom,
                "listing_url": _safe(row, "property_url", _safe(row, "url", "")),
                "latitude": comp_lat,
                "longitude": comp_lon,
            })

    comps.sort(key=lambda c: c["distance_miles"])
    return comps[:5]


# ─── Estimate derivation ────────────────────────────────────────────────────────

def derive_estimates(comps: list, beds: int, hud: Optional[dict]) -> dict:
    """
    Derive all four strategy monthly income estimates.
    LTR: median of comp rents
    Section 8: HUD FMR (or 90% of LTR fallback)
    MTR: LTR × 1.15–1.20 furnished premium
    STR: (LTR / 21) × 1.7 daily multiplier × 0.72 occupancy × 30 days
    """
    if not comps:
        return {}

    rents = sorted(c["monthly_rent"] for c in comps)
    mid = len(rents) // 2
    ltr_monthly = rents[mid] if len(rents) % 2 else (rents[mid - 1] + rents[mid]) // 2

    mtr_pct = 0.15 if ltr_monthly < 2000 else 0.20
    mtr_monthly = round(ltr_monthly * (1 + mtr_pct))

    str_daily = round(ltr_monthly / 21 * 1.7)
    str_monthly = round(str_daily * 30 * 0.72)

    if hud:
        bed_keys = ["fmr_0br", "fmr_1br", "fmr_2br", "fmr_3br", "fmr_4br"]
        idx = min(beds or 3, 4)
        s8_fmr = hud.get(bed_keys[idx], 0)
        s8_payment = round(s8_fmr * 1.10)
    else:
        s8_fmr = round(ltr_monthly * 0.90)
        s8_payment = s8_fmr

    confidence = "high" if len(comps) >= 4 else "medium" if len(comps) >= 2 else "low"

    return {
        "ltr_monthly": ltr_monthly,
        "ltr_annual": ltr_monthly * 12,
        "ltr_confidence": confidence,
        "section8_fmr": s8_fmr,
        "section8_payment_standard": s8_payment,
        "section8_annual": s8_payment * 12,
        "mtr_monthly": mtr_monthly,
        "mtr_premium_pct": round(mtr_pct * 100),
        "mtr_annual": mtr_monthly * 12,
        "str_daily_rate": str_daily,
        "str_monthly_gross": str_monthly,
        "str_annual_gross": str_monthly * 12,
        "str_occupancy_assumed": 0.72,
    }


# ─── Main entry point ───────────────────────────────────────────────────────────

async def get_rent_comps(
    address: str,
    beds: int,
    baths: float = None,
    sqft: int = None,
    year_built: int = None,
    property_type: str = "SFH",
) -> dict:
    """Orchestrate geocoding, comp search, HUD lookup, and estimate derivation."""
    async with httpx.AsyncClient() as client:
        geo = await geocode(address, client)
        if not geo:
            raise ValueError(f"Could not geocode address: {address}")
        lat, lon, zip_code = geo
        hud = await get_hud_fmr(zip_code, client)

    comps = await search_rental_comps(
        address=address,
        subject_lat=lat,
        subject_lon=lon,
        beds=beds or 3,
        baths=baths or 2.0,
        sqft=sqft or 0,
        year_built=year_built or 0,
    )

    estimates = derive_estimates(comps, beds or 3, hud)

    monthly_values = {
        "Long-Term Rental": estimates.get("ltr_monthly", 0),
        "Section 8": estimates.get("section8_payment_standard", 0),
        "Midterm Rental": estimates.get("mtr_monthly", 0),
        "Short-Term Rental": estimates.get("str_monthly_gross", 0),
    }
    best_strategy = max(monthly_values, key=monthly_values.get) if monthly_values else "Long-Term Rental"

    return {
        "subject": {
            "address": address,
            "coords": [lat, lon],
            "zip": zip_code,
            "beds": beds,
            "baths": baths,
            "sqft": sqft,
            "year_built": year_built,
            "property_type": property_type,
        },
        "comps": comps,
        "estimates": estimates,
        "hud": hud,
        "recommended_strategy": best_strategy,
        "meta": {
            "comps_found": len(comps),
            "data_source": "HomeHarvest (Realtor.com) + HUD FMR API",
            "generated_at": datetime.now().isoformat(),
            "hud_available": hud is not None,
        },
    }
