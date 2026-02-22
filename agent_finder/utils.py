"""Utility functions - address normalization, header rotation, helpers."""

import re
import random
from typing import Optional

from fake_useragent import UserAgent

# Initialize user agent rotator
_ua = UserAgent(browsers=["Chrome", "Edge"], os=["Windows", "macOS"], min_version=120.0)

# Common street suffix abbreviations for normalization
STREET_SUFFIXES = {
    "STREET": "ST", "AVENUE": "AVE", "BOULEVARD": "BLVD", "DRIVE": "DR",
    "LANE": "LN", "ROAD": "RD", "COURT": "CT", "CIRCLE": "CIR",
    "PLACE": "PL", "TERRACE": "TER", "WAY": "WAY", "TRAIL": "TRL",
    "PARKWAY": "PKWY", "HIGHWAY": "HWY",
}

# Directional abbreviations
DIRECTIONALS = {
    "NORTH": "N", "SOUTH": "S", "EAST": "E", "WEST": "W",
    "NORTHEAST": "NE", "NORTHWEST": "NW", "SOUTHEAST": "SE", "SOUTHWEST": "SW",
}

# US state abbreviations
STATE_ABBREVS = {
    "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
    "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
    "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
    "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
    "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
    "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
    "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
    "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
    "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
    "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI",
    "SOUTH CAROLINA": "SC", "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX",
    "UTAH": "UT", "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA",
    "WEST VIRGINIA": "WV", "WISCONSIN": "WI", "WYOMING": "WY",
    "DISTRICT OF COLUMBIA": "DC",
}


def get_rotating_headers() -> dict:
    """Generate realistic browser headers with a rotated user agent."""
    return {
        "User-Agent": _ua.random,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }


def get_api_headers() -> dict:
    """Headers for API-style requests (JSON responses)."""
    return {
        "User-Agent": _ua.random,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
    }


def normalize_address(address: str) -> str:
    """Address normalization: uppercase, abbreviate suffixes/directions/unit types."""
    if not address:
        return ""

    addr = address.upper().strip()

    # Remove extra whitespace
    addr = re.sub(r"\s+", " ", addr)

    # Remove common punctuation
    addr = addr.replace(".", "").replace("#", "APT ")

    # Normalize unit designators
    addr = re.sub(r"\bSUITE\b", "STE", addr)
    addr = re.sub(r"\bAPARTMENT\b", "APT", addr)
    addr = re.sub(r"\bBUILDING\b", "BLDG", addr)
    addr = re.sub(r"\bFLOOR\b", "FL", addr)

    # Normalize name prefixes (before suffix abbreviation since ST is also STREET)
    addr = re.sub(r"\bMOUNT\b", "MT", addr)
    addr = re.sub(r"\bSAINT\b", "ST", addr)
    addr = re.sub(r"\bFORT\b", "FT", addr)

    # Abbreviate directionals
    for full, abbr in DIRECTIONALS.items():
        addr = re.sub(rf"\b{full}\b", abbr, addr)

    # Abbreviate street suffixes
    for full, abbr in STREET_SUFFIXES.items():
        addr = re.sub(rf"\b{full}\b", abbr, addr)

    return addr


def normalize_state(state: str) -> str:
    """Convert full state name to 2-letter abbreviation."""
    if not state:
        return ""
    state_upper = state.upper().strip()
    if len(state_upper) == 2:
        return state_upper
    return STATE_ABBREVS.get(state_upper, state_upper)


def build_redfin_search_url(address: str, city: str = "", state: str = "") -> str:
    """Build a Redfin-compatible address slug for URL construction."""
    parts = [address]
    if city:
        parts.append(city)
    if state:
        parts.append(normalize_state(state))
    full = " ".join(parts)
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", full.lower()).strip("-")
    return slug


def build_realtor_url(address: str, city: str, state: str, zip_code: str = "") -> str:
    """Build a Realtor.com property URL from address components."""
    # Realtor.com URL format: /realestateandhomes-detail/{slug}
    addr_slug = re.sub(r"[^a-zA-Z0-9]+", "-", address.lower()).strip("-")
    city_slug = re.sub(r"[^a-zA-Z0-9]+", "-", city.lower()).strip("-")
    state_abbr = normalize_state(state)

    slug = f"{addr_slug}_{city_slug}_{state_abbr}"
    if zip_code:
        slug += f"_{zip_code}"

    return f"https://www.realtor.com/realestateandhomes-detail/{slug}"


def detect_captcha(response_text: str) -> bool:
    """Check if a response contains CAPTCHA/challenge markers."""
    indicators = [
        "captcha", "recaptcha", "hcaptcha", "cf-turnstile",
        "challenge-platform", "cf-chl-bypass", "challenge-form",
        "just a moment...", "checking your browser",
        "access denied", "automated access",
    ]
    text_lower = response_text.lower()
    return any(indicator in text_lower for indicator in indicators)


def compute_days_on_market(date_str: str) -> str:
    """Compute days on market from a date string. Returns empty string if unparseable."""
    if not date_str:
        return ""
    from datetime import datetime
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%SZ",
                "%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S.%fZ",
                "%m/%d/%Y", "%m-%d-%Y", "%b %d, %Y"):
        try:
            parsed = datetime.strptime(date_str.strip()[:26], fmt)
            delta = datetime.now() - parsed
            return str(max(0, delta.days))
        except (ValueError, TypeError):
            continue
    try:
        ts = int(date_str)
        if ts > 1e12:
            ts = ts / 1000
        parsed = datetime.fromtimestamp(ts)
        delta = datetime.now() - parsed
        return str(max(0, delta.days))
    except (ValueError, TypeError, OSError):
        pass
    return ""


def clean_phone(phone: str) -> str:
    """Normalize a phone number to (XXX) XXX-XXXX format."""
    if not phone:
        return ""
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    return phone.strip()


def clean_email(email: str) -> str:
    """Basic email validation and cleanup."""
    if not email:
        return ""
    email = email.strip().lower()
    if re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        return email
    return ""


def clean_name(name: str) -> str:
    """Clean up an agent name."""
    if not name:
        return ""
    name = name.strip()
    # Remove common suffixes like "DRE#12345"
    name = re.sub(r"\s*DRE\s*#?\s*\d+", "", name, flags=re.IGNORECASE)
    # Remove license numbers
    name = re.sub(r"\s*(?:lic|license)\s*#?\s*\d+", "", name, flags=re.IGNORECASE)
    # Title case
    name = name.title()
    return name.strip()


def names_match(name1: str, name2: str, threshold: int = 85) -> bool:
    """Check if two agent names match using fuzzy string matching."""
    if not name1 or not name2:
        return False
    # Normalize: lowercase, remove punctuation and common suffixes
    n1 = _normalize_name_for_comparison(name1)
    n2 = _normalize_name_for_comparison(name2)
    if n1 == n2:
        return True
    try:
        from thefuzz import fuzz
        return fuzz.ratio(n1, n2) >= threshold
    except ImportError:
        # Fallback: check if one contains the other
        return n1 in n2 or n2 in n1


def _normalize_name_for_comparison(name: str) -> str:
    """Normalize a name for fuzzy comparison."""
    n = re.sub(r"[^a-zA-Z\s]", "", name).strip().lower()
    # Remove common designations
    for suffix in ["jr", "sr", "iii", "ii", "iv", "pa", "gri", "crs", "abr",
                    "srs", "crs", "crb", "green", "epro", "rea"]:
        n = re.sub(rf"\b{suffix}\b", "", n)
    return re.sub(r"\s+", " ", n).strip()


def normalize_brokerage(name: str) -> str:
    """Normalize brokerage name for comparison."""
    if not name:
        return ""
    n = name.upper().strip()
    # Remove common suffixes
    for suffix in ["LLC", "INC", "CORP", "CORPORATION", "CO", "COMPANY",
                    "GROUP", "ASSOCIATES", "REALTORS"]:
        n = re.sub(rf"\b{suffix}\b\.?", "", n)
    # Normalize known brands
    brand_aliases = {
        "KW": "KELLER WILLIAMS",
        "BHHS": "BERKSHIRE HATHAWAY",
        "CB": "COLDWELL BANKER",
        "C21": "CENTURY 21",
    }
    for alias, full in brand_aliases.items():
        if re.match(rf"^{alias}\b", n):
            n = re.sub(rf"^{alias}\b", full, n)
    return re.sub(r"\s+", " ", n).strip()


def address_variants(prop) -> list[str]:
    """Generate simplified address variants for retry searches."""
    variants = []
    addr = prop.address_line or prop.raw_address

    # Variant 1: Strip unit/apt numbers
    stripped = re.sub(
        r"\s*(APT|APARTMENT|STE|SUITE|UNIT|BLDG|BUILDING|FL|FLOOR|#)\s*\S+",
        "", addr, flags=re.IGNORECASE
    ).strip()
    if stripped and stripped != addr:
        parts = [stripped]
        if prop.city:
            parts.append(prop.city)
        if prop.state:
            parts.append(prop.state)
        if prop.zip_code:
            parts.append(prop.zip_code)
        variants.append(", ".join(parts))

    # Variant 2: Just street number + street name + zip
    match = re.match(r"^(\d+\s+\S+(?:\s+\S+)?)", addr)
    if match and prop.zip_code:
        simple = f"{match.group(1)}, {prop.zip_code}"
        if simple not in variants:
            variants.append(simple)

    return variants
