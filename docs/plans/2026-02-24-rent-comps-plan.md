# Rent Comps Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "Rent Comps" page to the Resources sidebar section that generates a free 4-strategy rental analysis report (LTR, Section 8, MTR, STR) from a property address and downloads it as a PDF.

**Architecture:** Python FastAPI backend new endpoint `/api/rent-comps` that geocodes the address via Nominatim, pulls rental listings via HomeHarvest `for_rent`, filters comps by standard REI criteria including major-road-crossing detection via Overpass API, fetches Section 8 FMR data from HUD API, derives MTR/STR estimates via formula, and returns structured JSON. React frontend page renders the 6-section report and downloads PDF using jsPDF (already installed).

**Tech Stack:** Python + FastAPI + HomeHarvest + httpx + Nominatim + Overpass API + HUD FMR API | React 19 + jsPDF (^4.2.0, already in package.json) + Framer Motion + lucide-react

---

## Task 1: Create the Rent Comps Backend Module

**Files:**
- Create: `agent_finder/scrapers/rent_comps.py`

**Step 1: Create the file**

```python
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
    Returns False on any error (conservative: don't exclude comps if check fails).
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
        return False  # Don't exclude comp if check fails


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
    """Run HomeHarvest for_rent search synchronously (called from executor)."""
    from homeharvest import scrape_property
    try:
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
) -> list[dict]:
    """
    Pull rental listings via HomeHarvest and filter by REI comp criteria:
    - Same general area (within 0.5-mile radius)
    - Bed count ±1
    - Sqft ±25% (if provided)
    - Year built ±20 years (if provided)
    - Active listing (DOM < 90 days)
    - No major road crossing (Overpass API)
    Returns up to 5 best comps sorted by distance.
    """
    # Use city+state as search location for broader rental search
    parts = [p.strip() for p in address.split(",")]
    if len(parts) >= 3:
        location = f"{parts[-2]}, {parts[-1]}"  # "City, State ZIP"
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
            if rent <= 100:  # Skip invalid rents
                continue

            # Extract comp attributes
            try:
                comp_beds = int(float(_safe(row, "beds", 0) or 0))
                comp_baths = float(_safe(row, "baths", 0) or 0)
                comp_sqft_raw = _safe(row, "sqft", 0)
                comp_sqft = int(float(comp_sqft_raw) or 0) if comp_sqft_raw else 0
                comp_year_raw = _safe(row, "year_built", 0)
                comp_year = int(float(comp_year_raw) or 0) if comp_year_raw else 0
                comp_lat_raw = _safe(row, "latitude", 0)
                comp_lon_raw = _safe(row, "longitude", 0)
                comp_lat = float(comp_lat_raw or 0)
                comp_lon = float(comp_lon_raw or 0)
            except Exception:
                continue

            # Need coordinates for distance/road check
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
            blocked = await crosses_major_road(
                subject_lat, subject_lon, comp_lat, comp_lon, client
            )
            if blocked:
                logger.info("Comp at (%.4f, %.4f) excluded — crosses major road", comp_lat, comp_lon)
                continue

            # Build comp address
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

            # Skip if listing is stale (> 90 days on market)
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

    # If fewer than 3, relax bed filter and re-include nearby results
    if len(comps) < 3:
        logger.info("Only %d comps found — relaxed filters would help (not implemented in v1)", len(comps))

    return comps[:5]


# ─── Estimate derivation ────────────────────────────────────────────────────────

def derive_estimates(comps: list[dict], beds: int, hud: Optional[dict]) -> dict:
    """
    Derive all four strategy monthly income estimates:
    - LTR: median of comp rents
    - Section 8: HUD FMR (or 90% of LTR if HUD unavailable)
    - MTR: LTR × 1.15–1.20 furnished premium
    - STR: (LTR / 21) × 1.7 daily multiplier × 0.72 occupancy × 30 days
    """
    if not comps:
        return {}

    rents = sorted(c["monthly_rent"] for c in comps)
    # Median for robustness against outliers
    mid = len(rents) // 2
    ltr_monthly = rents[mid] if len(rents) % 2 else (rents[mid - 1] + rents[mid]) // 2

    # MTR premium: 15% base, 20% if market rent > $2k
    mtr_pct = 0.15 if ltr_monthly < 2000 else 0.20
    mtr_monthly = round(ltr_monthly * (1 + mtr_pct))

    # STR: daily rate derived from LTR, 72% occupancy
    str_daily = round(ltr_monthly / 21 * 1.7)
    str_monthly = round(str_daily * 30 * 0.72)

    # Section 8
    if hud:
        bed_keys = ["fmr_0br", "fmr_1br", "fmr_2br", "fmr_3br", "fmr_4br"]
        idx = min(beds or 3, 4)
        s8_fmr = hud.get(bed_keys[idx], 0)
        s8_payment = round(s8_fmr * 1.10)  # PHA typically pays 110% of FMR
    else:
        s8_fmr = round(ltr_monthly * 0.90)   # Fallback: ~90% of market
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

    # Determine recommended strategy
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
            "data_source": "HomeHarvest (Realtor.com) + HUD FMR API (huduser.gov)",
            "generated_at": datetime.now().isoformat(),
            "hud_available": hud is not None,
        },
    }
```

**Step 2: Verify file created**
```
ls agent_finder/scrapers/rent_comps.py
```
Expected: file exists, no Python syntax errors.

**Step 3: Commit**
```bash
git add agent_finder/scrapers/rent_comps.py
git commit -m "feat: add rent_comps backend module (HomeHarvest + HUD FMR + Overpass)"
```

---

## Task 2: Register the /api/rent-comps Endpoint in app.py

**Files:**
- Modify: `agent_finder/app.py`

**Step 1: Add the import and route handler**

Find the line `# ── Register API router ──` in `agent_finder/app.py` and insert the new endpoint BEFORE it:

```python
# ── Rent Comps endpoint ──

from .scrapers.rent_comps import get_rent_comps as _get_rent_comps

@api.get("/rent-comps")
async def rent_comps_endpoint(
    address: str,
    beds: int = 3,
    baths: float = 2.0,
    sqft: int = None,
    year_built: int = None,
    property_type: str = "SFH",
):
    """
    Generate a free rental comp report for a property address.
    Sources: HomeHarvest (Realtor.com), HUD FMR API, Overpass/OSM.
    """
    if not address or len(address.strip()) < 5:
        raise HTTPException(400, "A valid property address is required.")
    try:
        result = await _get_rent_comps(
            address=address.strip(),
            beds=beds,
            baths=baths,
            sqft=sqft,
            year_built=year_built,
            property_type=property_type,
        )
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("Rent comps failed for '%s': %s", address, e, exc_info=True)
        raise HTTPException(500, f"Comp search failed: {e}")
```

**Step 2: Test the endpoint manually**

Start the backend:
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
python -m agent_finder.app
```

In a separate terminal, test:
```bash
curl "http://localhost:9000/api/rent-comps?address=123+Main+St+Atlanta+GA+30318&beds=3&sqft=1400"
```
Expected: JSON response with `subject`, `comps`, `estimates`, `meta` keys. `comps` may be empty in dev if HomeHarvest returns no rentals.

**Step 3: Commit**
```bash
git add agent_finder/app.py
git commit -m "feat: register /api/rent-comps FastAPI endpoint"
```

---

## Task 3: Create RentComps.jsx Frontend Page

**Files:**
- Create: `frontend/src/pages/RentComps.jsx`

**Step 1: Create the file**

```jsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, AlertTriangle, ExternalLink, Download, ChevronDown, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import ShurikenLoader from '../components/ShurikenLoader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:9000'

const PROPERTY_TYPES = ['SFH', 'Duplex', 'Triplex', 'Quadplex', 'Apartment/Condo', 'Townhouse']

// ─── Styling constants ──────────────────────────────────────────────────────

const inputClass =
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(0,198,255,0.15)] rounded-sm px-4 py-3 ' +
  'text-[#F4F7FA] placeholder:text-[#C8D1DA]/40 font-body text-sm ' +
  'focus:outline-none focus:border-[rgba(0,198,255,0.5)] transition-colors w-full'

const labelClass =
  'block font-heading text-[#F6C445]/80 tracking-widest uppercase text-xs font-semibold mb-1.5'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
      >
        {placeholder && (
          <option value="" disabled className="bg-[#0B0F14] text-[#C8D1DA]/60">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0B0F14] text-[#F4F7FA]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C8D1DA]/50"
      />
    </div>
  )
}

function GlassSection({ title, subtitle, color = '#00C6FF', children, index = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-sm border p-5 mb-4"
      style={{
        background: 'rgba(17,27,36,0.85)',
        borderColor: `${color}22`,
        boxShadow: `0 2px 20px ${color}10`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-6 rounded-full"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}66)` }}
        />
        <div>
          <h3
            className="font-heading text-sm font-bold tracking-widest uppercase"
            style={{ color }}
          >
            {title}
          </h3>
          {subtitle && <p className="text-[#C8D1DA]/60 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function MoneyCard({ label, monthly, annual, color }) {
  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-1"
      style={{ background: `${color}0D`, border: `1px solid ${color}22` }}
    >
      <p className="font-heading text-xs tracking-widest uppercase" style={{ color: `${color}99` }}>
        {label}
      </p>
      <p className="font-heading text-2xl font-bold" style={{ color }}>
        ${monthly?.toLocaleString() ?? '—'}
        <span className="text-sm font-normal opacity-70">/mo</span>
      </p>
      {annual != null && (
        <p className="text-xs" style={{ color: `${color}80` }}>
          ${annual.toLocaleString()}/yr
        </p>
      )}
    </div>
  )
}

function CompCard({ comp, index }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-sm border border-[rgba(0,198,255,0.12)] p-4"
      style={{ background: 'rgba(14,90,136,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-heading text-xs text-[#F4F7FA] tracking-wide leading-tight">
          {comp.address || 'Address not available'}
        </p>
        <span className="shrink-0 text-xs text-[#00C6FF] font-heading">
          {comp.distance_miles}mi
        </span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[#C8D1DA]">
        <span>{comp.beds}bd / {comp.baths}ba</span>
        {comp.sqft > 0 && <span>{comp.sqft.toLocaleString()} sqft</span>}
        {comp.rent_per_sqft > 0 && <span>${comp.rent_per_sqft}/sqft</span>}
        {comp.days_on_market != null && <span>{comp.days_on_market} DOM</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-[#00C6FF]">
          ${comp.monthly_rent.toLocaleString()}<span className="text-sm opacity-60">/mo</span>
        </p>
        {comp.listing_url && (
          <a
            href={comp.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#C8D1DA]/60 hover:text-[#00C6FF] transition-colors"
          >
            View <ExternalLink size={10} />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ─── PDF Generation ─────────────────────────────────────────────────────────

function generatePDF(report, formData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 18
  let y = 20

  const line = () => {
    doc.setDrawColor(0, 198, 255, 30)
    doc.line(margin, y, W - margin, y)
    y += 6
  }

  const heading = (text, size = 16, color = [0, 198, 255]) => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.text(text, margin, y)
    y += size * 0.45 + 3
  }

  const body = (text, size = 9, color = [196, 209, 218]) => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, W - margin * 2)
    doc.text(lines, margin, y)
    y += lines.length * size * 0.42 + 2
  }

  const kv = (label, value, labelColor = [246, 196, 69], valColor = [244, 247, 250]) => {
    doc.setFontSize(8)
    doc.setTextColor(...labelColor)
    doc.text(label.toUpperCase() + ':', margin, y)
    doc.setTextColor(...valColor)
    doc.text(String(value), margin + 40, y)
    y += 6
  }

  // ── Header ──
  doc.setFillColor(11, 15, 20)
  doc.rect(0, 0, W, 32, 'F')
  doc.setFontSize(22)
  doc.setTextColor(0, 198, 255)
  doc.text('DISPO DOJO', margin, 14)
  doc.setFontSize(10)
  doc.setTextColor(246, 196, 69)
  doc.text('Rent Comps Report', margin, 22)
  doc.setFontSize(8)
  doc.setTextColor(200, 209, 218)
  doc.text(report.subject.address, margin, 29)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, W - margin, 29, { align: 'right' })
  y = 42

  // ── Property Details ──
  heading('Property Details', 12, [246, 196, 69])
  line()
  kv('Beds', formData.beds || '—')
  kv('Baths', formData.baths || '—')
  if (formData.sqft) kv('Sqft', Number(formData.sqft).toLocaleString())
  if (formData.year_built) kv('Year Built', formData.year_built)
  kv('Type', formData.property_type)
  kv('ZIP', report.subject.zip || '—')
  y += 4

  // ── Executive Summary ──
  heading('Executive Summary', 12, [246, 196, 69])
  line()
  const e = report.estimates
  const strategies = [
    ['Long-Term Rental', e.ltr_monthly, e.ltr_annual],
    ['Section 8', e.section8_payment_standard, e.section8_annual],
    ['Midterm Rental', e.mtr_monthly, e.mtr_annual],
    ['Short-Term Rental', e.str_monthly_gross, e.str_annual_gross],
  ]
  strategies.forEach(([name, monthly, annual]) => {
    doc.setFontSize(9)
    doc.setTextColor(244, 247, 250)
    doc.text(name, margin, y)
    doc.setTextColor(0, 198, 255)
    doc.text(monthly ? `$${monthly.toLocaleString()}/mo  ($${annual?.toLocaleString()}/yr)` : '—', margin + 50, y)
    y += 6
  })
  body(`★ Recommended: ${report.recommended_strategy}`, 9, [246, 196, 69])
  y += 4

  // ── Rental Comps ──
  heading('Rental Comps Found', 12, [246, 196, 69])
  line()
  if (report.comps.length === 0) {
    body('No comps found within 0.5-mile radius matching filter criteria.', 9, [200, 150, 100])
  } else {
    report.comps.forEach((c, i) => {
      doc.setFontSize(8)
      doc.setTextColor(244, 247, 250)
      doc.text(`${i + 1}. ${c.address || 'N/A'}`, margin, y)
      y += 5
      doc.setTextColor(0, 198, 255)
      doc.text(`$${c.monthly_rent.toLocaleString()}/mo`, margin + 4, y)
      doc.setTextColor(200, 209, 218)
      doc.text(`${c.beds}bd/${c.baths}ba  ${c.sqft ? c.sqft.toLocaleString()+' sqft' : ''}  ${c.distance_miles}mi away`, margin + 30, y)
      y += 7
    })
  }
  y += 2

  // ── Section 8 ──
  heading('Section 8 Analysis', 12, [246, 196, 69])
  line()
  if (report.hud) {
    kv('Area', report.hud.area_name)
    kv('HUD FMR', `$${e.section8_fmr?.toLocaleString() || '—'}/mo`)
    kv('Payment Standard', `$${e.section8_payment_standard?.toLocaleString() || '—'}/mo (110% FMR)`)
    kv('Annual Gross', `$${e.section8_annual?.toLocaleString() || '—'}/yr`)
  } else {
    body('HUD FMR data not available (set HUDUSER_API_TOKEN in .env for exact FMR data).', 8, [200, 150, 100])
    kv('Estimated FMR', `$${e.section8_fmr?.toLocaleString() || '—'}/mo (90% of market)`)
  }
  y += 4

  // ── STR & MTR ──
  if (y > 230) { doc.addPage(); y = 20 }
  heading('Midterm Rental (MTR)', 12, [246, 196, 69])
  line()
  kv('Est. Monthly', `$${e.mtr_monthly?.toLocaleString() || '—'}/mo`)
  kv('Premium vs LTR', `+${e.mtr_premium_pct}%`)
  kv('Annual Gross', `$${e.mtr_annual?.toLocaleString() || '—'}/yr`)
  body('MTR targets 30-89 day tenants: traveling nurses, corporate relocations, construction crews.', 8)
  y += 4

  heading('Short-Term Rental (STR)', 12, [246, 196, 69])
  line()
  kv('Est. Daily Rate', `$${e.str_daily_rate?.toLocaleString() || '—'}/night`)
  kv('Occupancy Assumed', `${Math.round((e.str_occupancy_assumed || 0.72) * 100)}%`)
  kv('Est. Monthly Gross', `$${e.str_monthly_gross?.toLocaleString() || '—'}/mo`)
  kv('Annual Gross', `$${e.str_annual_gross?.toLocaleString() || '—'}/yr`)
  body('STR figures are formula-derived (no free Airbnb API). Cross-verify with AirDNA or Rabbu.', 8, [200, 150, 100])
  y += 4

  // ── Disclaimer footer ──
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setFillColor(20, 30, 40)
  doc.rect(margin, y, W - margin * 2, 22, 'F')
  y += 5
  body('⚠ Free estimation tool — data sourced from public listings and government APIs.', 8, [246, 196, 69])
  body('Always cross-verify rental estimates before making investment decisions.', 8, [200, 209, 218])
  body('For professional underwriting: dispodojo.com/underwriting', 8, [0, 198, 255])

  doc.save(`rent-comps-${report.subject.zip || 'report'}-${Date.now()}.pdf`)
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function RentComps() {
  const navigate = useNavigate()
  const reportRef = useRef(null)

  const [form, setForm] = useState({
    address: '',
    beds: '3',
    baths: '2',
    sqft: '',
    year_built: '',
    property_type: 'SFH',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.address.trim()) {
      setError('Please enter a property address.')
      return
    }
    setError('')
    setLoading(true)
    setReport(null)

    const params = new URLSearchParams({
      address: form.address.trim(),
      beds: form.beds || '3',
      baths: form.baths || '2',
      property_type: form.property_type,
    })
    if (form.sqft) params.set('sqft', form.sqft)
    if (form.year_built) params.set('year_built', form.year_built)

    try {
      const resp = await fetch(`${API}/api/rent-comps?${params}`)
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${resp.status}`)
      }
      const data = await resp.json()
      setReport(data)
    } catch (err) {
      setError(err.message || 'Failed to fetch comps. Check your address and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!report) return
    generatePDF(report, form)
  }

  const e = report?.estimates || {}
  const strategies = report
    ? [
        { label: 'Long-Term Rental', color: '#00C6FF', monthly: e.ltr_monthly, annual: e.ltr_annual },
        { label: 'Section 8', color: '#F6C445', monthly: e.section8_payment_standard, annual: e.section8_annual },
        { label: 'Midterm Rental', color: '#7F00FF', monthly: e.mtr_monthly, annual: e.mtr_annual },
        { label: 'Short-Term Rental', color: '#E53935', monthly: e.str_monthly_gross, annual: e.str_annual_gross },
      ]
    : []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[860px] mx-auto px-4 pb-16"
    >
      {/* ── Page Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0E5A88, #00C6FF44)',
              boxShadow: '0 0 20px rgba(0,198,255,0.25)',
            }}
          >
            <BarChart3 size={20} className="text-[#00C6FF]" />
          </div>
          <div>
            <h1 className="font-display text-4xl text-[#00C6FF]">Rent Comps</h1>
            <p className="text-[#C8D1DA]/60 text-sm font-body">
              Free rental comp analysis · All four investment strategies
            </p>
          </div>
        </div>
      </div>

      <div className="katana-line mb-6" />

      {/* ── Disclaimer Banner ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-sm border border-[rgba(246,196,69,0.25)] p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
        style={{ background: 'rgba(246,196,69,0.05)' }}
      >
        <AlertTriangle size={18} className="text-[#F6C445] shrink-0" />
        <div className="flex-1 text-sm font-body text-[#C8D1DA]">
          <strong className="text-[#F6C445]">Free estimation tool</strong> — data sourced from
          public rental listings &amp; government APIs. Always cross-verify before making investment
          decisions.
        </div>
        <button
          onClick={() => navigate('/underwriting')}
          className="shrink-0 flex items-center gap-1.5 text-sm font-heading text-[#00C6FF] hover:text-white transition-colors"
        >
          Free Underwriting <ArrowRight size={14} />
        </button>
      </motion.div>

      {/* ── Input Form ── */}
      <motion.form
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={1}
        onSubmit={handleSubmit}
        className="rounded-sm border border-[rgba(0,198,255,0.12)] p-6 mb-6"
        style={{ background: 'rgba(17,27,36,0.85)' }}
      >
        <h2 className="font-heading text-sm tracking-widest uppercase text-[#F6C445]/80 mb-5">
          Property Details
        </h2>

        {/* Address (full row) */}
        <div className="mb-4">
          <label className={labelClass}>Property Address *</label>
          <input
            type="text"
            value={form.address}
            onChange={set('address')}
            placeholder="123 Main St, Atlanta, GA 30318"
            className={inputClass}
            required
          />
        </div>

        {/* Grid inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className={labelClass}>Bedrooms *</label>
            <input type="number" min="0" max="10" value={form.beds} onChange={set('beds')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Bathrooms</label>
            <input type="number" min="0" max="10" step="0.5" value={form.baths} onChange={set('baths')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Property Type</label>
            <SelectInput
              value={form.property_type}
              onChange={set('property_type')}
              options={PROPERTY_TYPES}
            />
          </div>
          <div>
            <label className={labelClass}>Sq Footage</label>
            <input type="number" min="0" value={form.sqft} onChange={set('sqft')} placeholder="1,400" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Year Built</label>
            <input type="number" min="1800" max="2030" value={form.year_built} onChange={set('year_built')} placeholder="1995" className={inputClass} />
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#E53935] mb-4 font-body">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-sm font-heading text-sm tracking-widest uppercase text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
          style={{
            background: loading
              ? 'rgba(229,57,53,0.4)'
              : 'linear-gradient(135deg, #E53935, #B3261E)',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(229,57,53,0.3)',
          }}
        >
          {loading ? 'Searching Comps…' : 'Generate Rent Comps Report'}
        </button>
      </motion.form>

      {/* ── Loading State ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-12"
          >
            <ShurikenLoader size={48} />
            <p className="font-heading text-[#C8D1DA] tracking-widest text-sm uppercase">
              Pulling rental comps…
            </p>
            <p className="text-[#C8D1DA]/40 text-xs text-center max-w-xs font-body">
              Searching HomeHarvest listings, checking neighborhood boundaries, fetching Section 8 data…
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Report Output ── */}
      <AnimatePresence>
        {report && !loading && (
          <motion.div
            ref={reportRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Executive Summary */}
            <GlassSection
              title="Executive Summary"
              subtitle={`${report.comps.length} comp${report.comps.length !== 1 ? 's' : ''} found · Confidence: ${e.ltr_confidence || 'low'}`}
              color="#F6C445"
              index={0}
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                {strategies.map((s) => (
                  <MoneyCard
                    key={s.label}
                    label={s.label}
                    monthly={s.monthly}
                    annual={s.annual}
                    color={s.color}
                  />
                ))}
              </div>
              <div
                className="rounded-sm px-4 py-3 flex items-center gap-2"
                style={{ background: 'rgba(246,196,69,0.08)', border: '1px solid rgba(246,196,69,0.2)' }}
              >
                <span className="text-[#F6C445] text-lg">★</span>
                <span className="font-heading text-sm text-[#F4F7FA]">
                  Recommended: <strong className="text-[#F6C445]">{report.recommended_strategy}</strong>
                </span>
              </div>
            </GlassSection>

            {/* Rental Comps */}
            <GlassSection
              title="Rental Comps"
              subtitle="Filtered by 0.5mi radius, same neighborhood, active within 90 days"
              color="#00C6FF"
              index={1}
            >
              {report.comps.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[#C8D1DA]/60 text-sm font-body">
                    No comps found within 0.5-mile radius matching your criteria.
                  </p>
                  <p className="text-[#C8D1DA]/40 text-xs mt-1">
                    Try a different address or relax the sqft / year-built filters.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.comps.map((c, i) => (
                    <CompCard key={i} comp={c} index={i} />
                  ))}
                </div>
              )}
            </GlassSection>

            {/* Section 8 */}
            <GlassSection title="Section 8 Analysis" subtitle="HUD Fair Market Rents" color="#F6C445" index={2}>
              {!report.meta.hud_available && (
                <p className="text-xs text-[#F6C445]/60 mb-3 font-body">
                  Tip: Set HUDUSER_API_TOKEN in your .env for exact HUD FMR data (free at huduser.gov).
                  Showing estimate based on market comps.
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MoneyCard label="FMR Estimate" monthly={e.section8_fmr} annual={null} color="#F6C445" />
                <MoneyCard label="Payment Standard" monthly={e.section8_payment_standard} annual={e.section8_annual} color="#F6C445" />
              </div>
              {report.hud && (
                <p className="text-xs text-[#C8D1DA]/60 font-body">Area: {report.hud.area_name}</p>
              )}
              <div className="mt-3 text-xs font-body space-y-1 text-[#C8D1DA]/70">
                <p>✓ Guaranteed rent payment from housing authority</p>
                <p>✓ Long-term tenants — lower turnover costs</p>
                <p>✗ Property must pass HQS inspection</p>
                <p>✗ Below-market rent in some areas</p>
              </div>
            </GlassSection>

            {/* MTR */}
            <GlassSection title="Midterm Rental (MTR)" subtitle="30–89 day furnished stays" color="#7F00FF" index={3}>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <MoneyCard label="Est. Monthly" monthly={e.mtr_monthly} annual={e.mtr_annual} color="#7F00FF" />
                <div
                  className="rounded-sm p-4 flex flex-col gap-1"
                  style={{ background: 'rgba(127,0,255,0.05)', border: '1px solid rgba(127,0,255,0.15)' }}
                >
                  <p className="font-heading text-xs tracking-widest uppercase text-[#7F00FF]/70">Premium vs LTR</p>
                  <p className="font-heading text-2xl font-bold text-[#7F00FF]">+{e.mtr_premium_pct}%</p>
                </div>
              </div>
              <div className="text-xs font-body space-y-1 text-[#C8D1DA]/70">
                <p>Target tenants: Traveling nurses · Corporate relocations · Construction crews</p>
                <p>Platforms: Furnished Finder · CHBO · Airbnb Monthly</p>
              </div>
            </GlassSection>

            {/* STR */}
            <GlassSection title="Short-Term Rental (STR)" subtitle="Nightly / Airbnb-style · Formula-derived estimate" color="#E53935" index={4}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                <MoneyCard label="Est. Daily Rate" monthly={e.str_daily_rate} annual={null} color="#E53935" />
                <MoneyCard label="Monthly Gross" monthly={e.str_monthly_gross} annual={null} color="#E53935" />
                <div
                  className="rounded-sm p-4 flex flex-col gap-1"
                  style={{ background: 'rgba(229,57,53,0.05)', border: '1px solid rgba(229,57,53,0.15)' }}
                >
                  <p className="font-heading text-xs tracking-widest uppercase text-[#E53935]/70">Occupancy</p>
                  <p className="font-heading text-2xl font-bold text-[#E53935]">{Math.round((e.str_occupancy_assumed || 0.72) * 100)}%</p>
                  <p className="text-xs text-[#E53935]/60">assumed avg</p>
                </div>
              </div>
              <p className="text-xs text-[#E53935]/70 font-body">
                ⚠ STR figures are formula-derived (no free Airbnb API exists). Cross-verify with
                AirDNA, Rabbu, or Inside Airbnb for your market.
              </p>
            </GlassSection>

            {/* Strategy Comparison Table */}
            <GlassSection title="Strategy Comparison" subtitle="Side-by-side at a glance" color="#00C6FF" index={5}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-[rgba(0,198,255,0.1)]">
                      <th className="text-left py-2 pr-4 font-heading text-xs uppercase tracking-widest text-[#C8D1DA]/60">Strategy</th>
                      <th className="text-right py-2 pr-4 font-heading text-xs uppercase tracking-widest text-[#C8D1DA]/60">Monthly</th>
                      <th className="text-right py-2 pr-4 font-heading text-xs uppercase tracking-widest text-[#C8D1DA]/60">Annual</th>
                      <th className="text-right py-2 font-heading text-xs uppercase tracking-widest text-[#C8D1DA]/60">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Long-Term Rental', monthly: e.ltr_monthly, annual: e.ltr_annual, risk: 'Low', color: '#00C6FF' },
                      { name: 'Section 8', monthly: e.section8_payment_standard, annual: e.section8_annual, risk: 'Low', color: '#F6C445' },
                      { name: 'Midterm Rental', monthly: e.mtr_monthly, annual: e.mtr_annual, risk: 'Med', color: '#7F00FF' },
                      { name: 'Short-Term Rental', monthly: e.str_monthly_gross, annual: e.str_annual_gross, risk: 'High', color: '#E53935' },
                    ].map((row) => (
                      <tr
                        key={row.name}
                        className={`border-b border-[rgba(0,198,255,0.06)] ${row.name === report.recommended_strategy ? 'bg-[rgba(246,196,69,0.05)]' : ''}`}
                      >
                        <td className="py-2.5 pr-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                          <span style={{ color: row.color === '#F6C445' ? '#F6C445' : '#F4F7FA' }}>
                            {row.name}
                            {row.name === report.recommended_strategy && (
                              <span className="ml-2 text-[10px] text-[#F6C445]">★ Best</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-right font-heading" style={{ color: row.color }}>
                          ${row.monthly?.toLocaleString() ?? '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-[#C8D1DA]/70">
                          ${row.annual?.toLocaleString() ?? '—'}
                        </td>
                        <td className={`py-2.5 text-right text-xs font-heading ${
                          row.risk === 'Low' ? 'text-green-400' : row.risk === 'Med' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {row.risk}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassSection>

            {/* CTA for Underwriting */}
            <motion.div
              variants={fadeUp}
              custom={6}
              className="rounded-sm border border-[rgba(0,198,255,0.2)] p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"
              style={{ background: 'rgba(14,90,136,0.12)' }}
            >
              <div className="flex-1">
                <p className="font-heading text-sm text-[#F4F7FA] mb-1">Want a full underwriting analysis?</p>
                <p className="text-xs text-[#C8D1DA]/60 font-body">
                  Our free underwriting service goes deeper — ARV, repair costs, deal analysis, and expert review.
                </p>
              </div>
              <button
                onClick={() => navigate('/underwriting')}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-sm font-heading text-sm tracking-wide text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 4px 16px rgba(229,57,53,0.25)' }}
              >
                Free Underwriting <ArrowRight size={14} />
              </button>
            </motion.div>

            {/* Download Button */}
            <motion.button
              variants={fadeUp}
              custom={7}
              initial="hidden"
              animate="visible"
              onClick={handleDownload}
              className="w-full py-4 rounded-sm font-heading text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
              style={{
                background: 'linear-gradient(135deg, #F6C445, #E0A800)',
                color: '#0B0F14',
                boxShadow: '0 4px 20px rgba(246,196,69,0.3)',
              }}
            >
              <Download size={16} />
              Download PDF Report
            </motion.button>

            {/* Data source note */}
            <p className="text-center text-xs text-[#C8D1DA]/30 font-body mt-4">
              Data: HomeHarvest (Realtor.com) · HUD FMR API · OpenStreetMap
              {' · '}Generated {new Date().toLocaleDateString()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

**Step 2: Verify the file was created**
```
ls frontend/src/pages/RentComps.jsx
```

**Step 3: Commit**
```bash
git add frontend/src/pages/RentComps.jsx
git commit -m "feat: add RentComps.jsx frontend page with 6-section report and PDF download"
```

---

## Task 4: Add Route to App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Add import**

After the existing imports (around line 18 before the `function ProtectedRoute`), add:
```jsx
import RentComps from './pages/RentComps'
```

**Step 2: Add route**

Inside the `<Route path="/">` element, after the existing `boots-on-ground` route, add:
```jsx
<Route path="rent-comps" element={<RentComps />} />
```

**Step 3: Verify App.jsx compiles**
```bash
cd frontend && npm run build 2>&1 | head -30
```
Expected: build succeeds or shows only unrelated warnings.

**Step 4: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: add /rent-comps route to App.jsx"
```

---

## Task 5: Add Rent Comps to Sidebar Resources Section

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Add BarChart3 to the lucide-react import**

Find this line in Sidebar.jsx:
```jsx
import { LogOut, MapPin, Send, Search, MessageSquare, LayoutDashboard, Monitor, Calculator, FileSignature, HandCoins, Footprints, PawPrint, House, MessageCircle, DollarSign } from 'lucide-react'
```

Replace with (add `BarChart3` to the import):
```jsx
import { LogOut, MapPin, Send, Search, MessageSquare, LayoutDashboard, Monitor, Calculator, FileSignature, HandCoins, Footprints, PawPrint, House, MessageCircle, DollarSign, BarChart3 } from 'lucide-react'
```

**Step 2: Add nav item to Resources section**

Find the Resources section items array (the one with `Scripts & Objections`):
```js
{
  title: 'Resources',
  items: [
    { to: '/scripts', icon: MessageCircle, label: 'Scripts & Objections' },
    { to: '/direct-agent', icon: House, label: 'DTA Process' },
    { to: '/bird-dog', icon: DollarSign, label: 'Bird Dog Network' },
    { to: '/boots-on-ground', icon: Footprints, label: 'Boots on Ground' },
  ],
},
```

Replace with:
```js
{
  title: 'Resources',
  items: [
    { to: '/scripts', icon: MessageCircle, label: 'Scripts & Objections' },
    { to: '/direct-agent', icon: House, label: 'DTA Process' },
    { to: '/bird-dog', icon: DollarSign, label: 'Bird Dog Network' },
    { to: '/boots-on-ground', icon: Footprints, label: 'Boots on Ground' },
    { to: '/rent-comps', icon: BarChart3, label: 'Rent Comps' },
  ],
},
```

**Step 3: Verify no syntax errors**
```bash
cd frontend && npm run build 2>&1 | head -30
```

**Step 4: Commit**
```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: add Rent Comps to Resources sidebar section"
```

---

## Task 6: Add Upgrade Roadmap Section to AdminDashboard

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Read the full AdminDashboard.jsx to find the end of the component**

Identify the last `</motion.div>` that closes the main container, just before the export default closing.

**Step 2: Add imports (if not already present)**

Ensure `TrendingUp` and `Zap` are imported from lucide-react. Add them to the import line at the top of AdminDashboard.jsx:
```jsx
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock, TrendingUp, Zap } from 'lucide-react'
```

**Step 3: Add Upgrade Roadmap section**

Before the final `</motion.div>` closing tag of the main container, add this section:

```jsx
{/* ── Upgrade Roadmap ── */}
<div className="mt-10">
  <div className="flex items-center gap-3 mb-4">
    <div className="hanko-seal w-9 h-9 rounded-full flex items-center justify-center">
      <TrendingUp size={16} className="text-white" />
    </div>
    <div>
      <h2 className="font-heading text-lg text-gold tracking-wide">Upgrade Roadmap</h2>
      <p className="text-text-dim text-xs">Paid improvements to unlock as the platform grows</p>
    </div>
  </div>
  <div className="katana-line mb-5" />
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {[
      {
        priority: 'HIGH',
        title: 'Rental Comps API — Rentcast Pro or AirDNA',
        description:
          'Replace formula-derived STR/MTR estimates and HomeHarvest scraping with real market data. Rentcast provides verified LTR comps; AirDNA provides actual Airbnb occupancy and daily rate data.',
        cost: '~$29–$99/mo',
        impact: 'Comp accuracy improves 10×. STR figures become market-validated.',
      },
      {
        priority: 'MEDIUM',
        title: 'HUD API Token — Free but Required',
        description:
          'Register for a free HUD UDAPI token at huduser.gov to unlock exact HUD Fair Market Rent data for Section 8 analysis. Currently using 90%-of-market fallback.',
        cost: 'Free (requires sign-up)',
        impact: 'Section 8 FMR data becomes exact per ZIP/county.',
      },
      {
        priority: 'MEDIUM',
        title: 'Saved Reports — Firestore Storage',
        description:
          'Allow users to save rent comp reports to their profile in Firestore, share with partners, and access report history.',
        cost: 'Firestore storage (~$0.06/GB)',
        impact: 'Users retain and share reports; repeat use increases.',
      },
      {
        priority: 'LOW',
        title: 'Interactive Comp Map — Google Maps or Mapbox',
        description:
          'Show comps pinned on an interactive neighborhood map to visualize distance and road boundaries visually instead of text.',
        cost: 'Mapbox free tier or ~$7/mo Google Maps',
        impact: 'Visual neighborhood comparison for user confidence.',
      },
    ].map((item) => (
      <WoodPanel key={item.title} hover={false} className="relative">
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 px-2 py-0.5 rounded-sm text-[10px] font-heading font-bold tracking-widest"
            style={{
              background:
                item.priority === 'HIGH'
                  ? 'rgba(229,57,53,0.2)'
                  : item.priority === 'MEDIUM'
                  ? 'rgba(246,196,69,0.15)'
                  : 'rgba(0,198,255,0.1)',
              color:
                item.priority === 'HIGH'
                  ? '#E53935'
                  : item.priority === 'MEDIUM'
                  ? '#F6C445'
                  : '#00C6FF',
            }}
          >
            {item.priority}
          </div>
        </div>
        <h3 className="font-heading text-sm text-parchment mt-2 mb-1">{item.title}</h3>
        <p className="text-text-dim text-xs font-body mb-3 leading-relaxed">{item.description}</p>
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-gold-dim font-heading">Cost: <span className="text-gold">{item.cost}</span></span>
          <span className="text-gold-dim font-heading">Impact: <span className="text-parchment">{item.impact}</span></span>
        </div>
      </WoodPanel>
    ))}
  </div>
</div>
```

**Step 4: Build to verify**
```bash
cd frontend && npm run build 2>&1 | head -30
```

**Step 5: Commit**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: add Upgrade Roadmap section to Admin Dashboard"
```

---

## Task 7: Install html2canvas (if PDF screenshots are needed) — SKIP

jsPDF v4.2.0 is already in `package.json`. Use jsPDF programmatic API only (no html2canvas needed). The `generatePDF` function in Task 3 uses only jsPDF's built-in `text`, `rect`, `line`, and `addPage` methods.

---

## Task 8: End-to-End Smoke Test

**Step 1: Start the backend**
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
python -m agent_finder.app
```
Expected: server starts on port 9000.

**Step 2: Start the frontend dev server**
```bash
cd frontend && npm run dev
```
Expected: Vite starts on port 5173 (or next available).

**Step 3: Manual test flow**
1. Navigate to `http://localhost:5173`
2. Log in
3. Click "Rent Comps" in the sidebar → page loads
4. Enter a real address: `123 Peachtree St NE, Atlanta, GA 30303`, beds=3, property_type=SFH
5. Click "Generate Rent Comps Report"
6. Verify: ShurikenLoader appears, then report renders
7. Verify: All 6 sections show (even if comps=0, report still renders with estimates)
8. Click "Download PDF Report" → verify PDF downloads and opens correctly
9. Click "Free Underwriting →" → verify it navigates to /underwriting
10. Navigate to /admin (if admin user) → verify Upgrade Roadmap section appears at bottom

**Step 4: Deploy**
```bash
cd frontend && npx vercel --prod
```
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
git push origin master
```

---

## Summary of Files Changed

| File | Action |
|---|---|
| `agent_finder/scrapers/rent_comps.py` | CREATE — full scraper module |
| `agent_finder/app.py` | MODIFY — add `/api/rent-comps` endpoint |
| `frontend/src/pages/RentComps.jsx` | CREATE — full React page |
| `frontend/src/App.jsx` | MODIFY — import + route |
| `frontend/src/components/Sidebar.jsx` | MODIFY — add nav item |
| `frontend/src/pages/AdminDashboard.jsx` | MODIFY — add Upgrade Roadmap section |

## Environment Variables (Optional)

Add to backend `.env` for exact Section 8 FMR data:
```
HUDUSER_API_TOKEN=your_free_token_from_huduser.gov
```
Free registration at: https://www.huduser.gov/hudapi/public/register/developer
