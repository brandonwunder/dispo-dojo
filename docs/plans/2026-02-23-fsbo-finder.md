# FSBO Finder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real backend for the FSBO Finder page that searches 5 sources concurrently, merges/enriches contact info (owner name, phone, email), streams SSE progress, and wires up the existing FSBOFinder.jsx frontend.

**Architecture:** New `FSBOPipeline` fires all 5 scrapers concurrently via `asyncio.gather()`, deduplicates by normalized address, enriches partial-contact results, and streams progress via SSE. Each scraper extends a new `FSBOBaseScraper` that shares the same HTTP infrastructure as `BaseScraper` (rate limiting, retry, circuit breaker) but has a `search_area(criteria)` → `List[FSBOListing]` interface instead of `search(prop)` → `Optional[AgentInfo]`.

**Tech Stack:** Python 3.14, FastAPI, httpx, aiolimiter, tenacity, BeautifulSoup4/lxml, homeharvest (existing), React 19, Framer Motion

**Reference files:**
- `agent_finder/scrapers/base.py` — HTTP infrastructure to mirror
- `agent_finder/config.py` — SourceConfig pattern to follow
- `agent_finder/app.py` — SSE + job lifecycle pattern to follow
- `frontend/src/pages/FSBOFinder.jsx` — existing UI to wire up (keep all visual design)

---

## Task 1: FSBO Data Models

**Files:**
- Create: `agent_finder/fsbo_models.py`

**Step 1: Create the file with both dataclasses**

```python
"""Data models for the FSBO Finder pipeline."""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class FSBOSearchCriteria:
    """Search parameters submitted by the user."""
    location: str                        # "85001" or "85001,85002" or "Phoenix, AZ"
    location_type: str                   # "zip" | "city_state"
    radius_miles: int = 25
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    property_type: Optional[str] = None  # "single_family"|"condo"|"multi_family"|"land"|None
    max_days_on_market: Optional[int] = None


@dataclass
class FSBOListing:
    """A single FSBO listing result."""
    address: str
    city: str
    state: str
    zip_code: str
    price: Optional[int]
    beds: Optional[int]
    baths: Optional[float]
    sqft: Optional[int]
    property_type: Optional[str]
    days_on_market: Optional[int]
    owner_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    listing_url: str
    source: str          # "fsbo.com"|"forsalebyowner.com"|"zillow"|"realtor"|"craigslist"
    contact_status: str  # "complete"|"partial"|"phone_only"|"anonymous"|"none"
    scraped_at: datetime = field(default_factory=datetime.now)

    def compute_contact_status(self) -> str:
        """Derive contact_status from available fields."""
        has_name = bool(self.owner_name and self.owner_name.strip())
        has_phone = bool(self.phone and self.phone.strip())
        has_email = bool(self.email and self.email.strip())
        if has_name and has_phone and has_email:
            return "complete"
        if has_phone and not has_email:
            return "phone_only"
        if has_name and (has_phone or has_email):
            return "partial"
        return "none"

    def merge(self, other: "FSBOListing") -> "FSBOListing":
        """Merge another listing into this one, filling missing fields."""
        if not self.owner_name and other.owner_name:
            self.owner_name = other.owner_name
        if not self.phone and other.phone:
            self.phone = other.phone
        if not self.email and other.email:
            self.email = other.email
        if not self.price and other.price:
            self.price = other.price
        if not self.beds and other.beds:
            self.beds = other.beds
        if not self.baths and other.baths:
            self.baths = other.baths
        if not self.sqft and other.sqft:
            self.sqft = other.sqft
        if not self.days_on_market and other.days_on_market:
            self.days_on_market = other.days_on_market
        self.contact_status = self.compute_contact_status()
        return self
```

**Step 2: Verify the file parses without errors**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
python -c "from agent_finder.fsbo_models import FSBOSearchCriteria, FSBOListing; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add agent_finder/fsbo_models.py
git commit -m "feat: add FSBOSearchCriteria and FSBOListing data models"
```

---

## Task 2: FSBO Config Entries

**Files:**
- Modify: `agent_finder/config.py`

**Step 1: Add FSBO source configs and constants at the bottom of `config.py`**

Append after the `GOOGLE_SEARCH` block:

```python
# ── FSBO-specific source configs ──

FSBO_COM = SourceConfig(
    name="fsbo.com",
    requests_per_second=0.5,
    max_concurrent=2,
    max_retries=2,
    timeout_seconds=30.0,
)

FORSALEBYOWNER_COM = SourceConfig(
    name="forsalebyowner.com",
    requests_per_second=0.5,
    max_concurrent=2,
    max_retries=2,
    timeout_seconds=30.0,
)

ZILLOW_FSBO = SourceConfig(
    name="zillow",
    requests_per_second=1.0,
    max_concurrent=3,
    max_retries=2,
    timeout_seconds=30.0,
)

REALTOR_FSBO = SourceConfig(
    name="realtor",
    requests_per_second=0.5,
    max_concurrent=2,
    max_retries=2,
    timeout_seconds=45.0,
)

CRAIGSLIST_FSBO = SourceConfig(
    name="craigslist",
    requests_per_second=1.0,
    max_concurrent=3,
    max_retries=2,
    timeout_seconds=20.0,
)

# FSBO pipeline settings
FSBO_CACHE_TTL_HOURS = 24
FSBO_MAX_PAGES = 5  # max pages to scrape per source
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.config import FSBO_COM, FORSALEBYOWNER_COM, ZILLOW_FSBO, REALTOR_FSBO, CRAIGSLIST_FSBO; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add agent_finder/config.py
git commit -m "feat: add FSBO source config entries"
```

---

## Task 3: FSBO Base Scraper

**Files:**
- Create: `agent_finder/scrapers/fsbo_base.py`

**Step 1: Create the abstract base class** (mirrors `base.py` but with `search_area` instead of `search`)

```python
"""Abstract base class for FSBO area scrapers."""

import asyncio
import logging
from abc import ABC, abstractmethod
from typing import List, Optional

import httpx
from aiolimiter import AsyncLimiter
from tenacity import (
    retry, stop_after_attempt, wait_exponential,
    retry_if_exception_type,
)

from ..config import SourceConfig
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import get_rotating_headers, detect_captcha

logger = logging.getLogger("agent_finder.scrapers.fsbo_base")


class FSBOBaseScraper(ABC):
    """Abstract base for all FSBO area scrapers."""

    def __init__(self, config: SourceConfig, client: httpx.AsyncClient):
        self.config = config
        self.client = client
        self.rate_limiter = AsyncLimiter(config.requests_per_second, 1.0)
        self.semaphore = asyncio.Semaphore(config.max_concurrent)
        self._request_count = 0
        self._success_count = 0
        self._block_count = 0
        self._circuit_open = False
        self._consecutive_failures = 0
        self._CIRCUIT_THRESHOLD = 10

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def is_circuit_open(self) -> bool:
        return self._circuit_open

    @abstractmethod
    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        """Search for FSBO listings matching the given criteria."""
        ...

    def _record_success(self):
        self._success_count += 1
        self._consecutive_failures = 0
        self._circuit_open = False

    def _record_failure(self):
        self._consecutive_failures += 1
        if self._consecutive_failures >= self._CIRCUIT_THRESHOLD:
            self._circuit_open = True
            logger.warning("%s: circuit breaker opened after %d failures",
                           self.name, self._consecutive_failures)

    async def _get(self, url: str, headers: Optional[dict] = None,
                   params: Optional[dict] = None) -> httpx.Response:
        """Rate-limited, retried GET request."""
        async with self.semaphore:
            await self.rate_limiter.acquire()
            self._request_count += 1

            req_headers = headers or get_rotating_headers()
            response = await self._fetch_with_retry(url, req_headers, params)

            if response.status_code == 403:
                self._block_count += 1
                self._record_failure()
                raise httpx.HTTPStatusError(
                    "Blocked (403)", request=response.request, response=response
                )
            if response.status_code == 429:
                self._block_count += 1
                self._record_failure()
                raise httpx.HTTPStatusError(
                    "Rate limited (429)", request=response.request, response=response
                )
            if detect_captcha(response.text):
                self._block_count += 1
                self._record_failure()
                raise httpx.HTTPStatusError(
                    "CAPTCHA detected", request=response.request, response=response
                )

            return response

    @retry(
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=15),
        reraise=True,
    )
    async def _fetch_with_retry(self, url: str, headers: dict,
                                 params: Optional[dict] = None) -> httpx.Response:
        return await self.client.get(
            url, headers=headers, params=params,
            timeout=self.config.timeout_seconds,
        )
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.scrapers.fsbo_base import FSBOBaseScraper; print('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
git add agent_finder/scrapers/fsbo_base.py
git commit -m "feat: add FSBOBaseScraper abstract base class"
```

---

## Task 4: Craigslist Area Map

**Files:**
- Create: `agent_finder/data/craigslist_areas.json`

**Step 1: Create the JSON file** mapping lowercase city/metro names → Craigslist subdomain

```json
{
  "phoenix": "phoenix", "scottsdale": "phoenix", "tempe": "phoenix", "mesa": "phoenix",
  "chandler": "phoenix", "glendale": "phoenix", "peoria": "phoenix", "gilbert": "phoenix",
  "los angeles": "losangeles", "la": "losangeles", "long beach": "losangeles",
  "san diego": "sandiego", "san francisco": "sfbay", "san jose": "sfbay",
  "oakland": "sfbay", "berkeley": "sfbay", "sacramento": "sacramento",
  "las vegas": "lasvegas", "henderson": "lasvegas", "reno": "reno",
  "seattle": "seattle", "tacoma": "seattle", "bellevue": "seattle",
  "portland": "portland", "eugene": "eugene",
  "denver": "denver", "colorado springs": "cosprings", "boulder": "boulder",
  "dallas": "dallas", "fort worth": "dallas", "arlington": "dallas",
  "houston": "houston", "austin": "austin", "san antonio": "sanantonio",
  "chicago": "chicago", "naperville": "chicago", "evanston": "chicago",
  "new york": "newyork", "brooklyn": "newyork", "queens": "newyork",
  "nyc": "newyork", "manhattan": "newyork", "bronx": "newyork",
  "miami": "miami", "fort lauderdale": "miami", "boca raton": "miami",
  "orlando": "orlando", "tampa": "tampa", "jacksonville": "jacksonville",
  "atlanta": "atlanta", "savannah": "savannah", "augusta": "augusta",
  "charlotte": "charlotte", "raleigh": "raleigh", "durham": "raleigh",
  "nashville": "nashville", "memphis": "memphis", "knoxville": "knoxville",
  "minneapolis": "minneapolis", "st paul": "minneapolis",
  "detroit": "detroit", "ann arbor": "annarbor", "grand rapids": "grandrapids",
  "cleveland": "cleveland", "columbus": "columbus", "cincinnati": "cincinnati",
  "pittsburgh": "pittsburgh", "philadelphia": "philadelphia",
  "washington": "washingtondc", "dc": "washingtondc", "arlington": "washingtondc",
  "baltimore": "baltimore", "richmond": "richmond",
  "boston": "boston", "cambridge": "boston", "worcester": "boston",
  "new haven": "newhaven", "hartford": "hartford",
  "albany": "albany", "buffalo": "buffalo", "rochester": "rochester",
  "st louis": "stlouis", "kansas city": "kansascity",
  "salt lake city": "saltlakecity", "provo": "saltlakecity",
  "albuquerque": "albuquerque", "tucson": "tucson", "flagstaff": "flagstaff",
  "oklahoma city": "oklahomacity", "tulsa": "tulsa",
  "omaha": "omaha", "lincoln": "lincoln",
  "milwaukee": "milwaukee", "madison": "madison",
  "indianapolis": "indianapolis", "fort wayne": "fortwayne",
  "louisville": "louisville", "lexington": "lexington",
  "new orleans": "neworleans", "baton rouge": "batonrouge",
  "birmingham": "birmingham", "huntsville": "huntsville",
  "jackson": "jackson", "little rock": "littlerock",
  "anchorage": "anchorage", "honolulu": "honolulu",
  "portland maine": "maine", "burlington": "vermont"
}
```

**Step 2: Verify the file is valid JSON**

```bash
python -c "import json; data = json.load(open('agent_finder/data/craigslist_areas.json')); print(f'Loaded {len(data)} area mappings')"
```

Expected: `Loaded N area mappings` (>80)

**Step 3: Commit**

```bash
git add agent_finder/data/craigslist_areas.json
git commit -m "feat: add Craigslist city-to-subdomain area map (100 metros)"
```

---

## Task 5: FSBO.com Scraper

**Files:**
- Create: `agent_finder/scrapers/fsbo_com.py`

**Step 1: Create the scraper**

```python
"""FSBO.com scraper — dedicated FSBO listing site with owner contact info."""

import logging
import re
from typing import List, Optional
from urllib.parse import quote_plus, urljoin

import httpx
from bs4 import BeautifulSoup

from ..config import FSBO_COM, FSBO_MAX_PAGES
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import clean_phone, clean_email, clean_name
from .fsbo_base import FSBOBaseScraper

logger = logging.getLogger("agent_finder.scrapers.fsbo_com")

BASE_URL = "https://www.fsbo.com"


class FsboComScraper(FSBOBaseScraper):
    """
    Scrapes FSBO.com for owner-listed properties.

    Flow:
    1. Build search URL from criteria (zip or city/state)
    2. Paginate through search results, collecting listing URLs
    3. For each listing page, extract contact info and property details
    4. Apply price/bed/bath/DOM filters
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(FSBO_COM, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open:
            logger.info("fsbo.com: circuit open, skipping")
            return []
        try:
            listing_urls = await self._get_listing_urls(criteria)
            results = []
            for url in listing_urls:
                listing = await self._scrape_listing(url, criteria)
                if listing:
                    results.append(listing)
            if results:
                self._record_success()
            logger.info("fsbo.com: found %d listings", len(results))
            return results
        except Exception as e:
            self._record_failure()
            logger.info("fsbo.com failed: %s: %s", type(e).__name__, e)
            return []

    async def _get_listing_urls(self, criteria: FSBOSearchCriteria) -> List[str]:
        """Paginate through search results and collect listing URLs."""
        urls = []
        for page in range(1, FSBO_MAX_PAGES + 1):
            page_urls = await self._scrape_search_page(criteria, page)
            if not page_urls:
                break
            urls.extend(page_urls)
        return urls

    async def _scrape_search_page(self, criteria: FSBOSearchCriteria, page: int) -> List[str]:
        """Scrape one page of search results and return listing URLs."""
        params = self._build_search_params(criteria, page)
        try:
            resp = await self._get(f"{BASE_URL}/search", params=params)
            if resp.status_code != 200:
                return []
            soup = BeautifulSoup(resp.text, "lxml")
            # IMPORTANT: Verify these selectors against the live site during implementation.
            # Common patterns on FSBO.com:
            links = soup.select("a[href*='/listing/']") or soup.select(".listing-card a") or soup.select("h2.listing-title a")
            seen = set()
            result = []
            for a in links:
                href = a.get("href", "")
                if href and href not in seen:
                    full = href if href.startswith("http") else urljoin(BASE_URL, href)
                    seen.add(href)
                    result.append(full)
            return result
        except Exception as e:
            logger.debug("fsbo.com search page %d failed: %s", page, e)
            return []

    def _build_search_params(self, criteria: FSBOSearchCriteria, page: int) -> dict:
        params: dict = {"page": page}
        if criteria.location_type == "zip":
            # Take first zip if multiple provided
            first_zip = criteria.location.split(",")[0].strip()
            params["zip"] = first_zip
        else:
            # "City, ST" format
            parts = criteria.location.split(",", 1)
            params["city"] = parts[0].strip()
            if len(parts) > 1:
                params["state"] = parts[1].strip()
        if criteria.min_price:
            params["min_price"] = criteria.min_price
        if criteria.max_price:
            params["max_price"] = criteria.max_price
        if criteria.min_beds:
            params["min_beds"] = criteria.min_beds
        return params

    async def _scrape_listing(self, url: str, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        """Scrape a single listing page for contact + property details."""
        try:
            resp = await self._get(url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "lxml")
            return self._parse_listing(soup, url, criteria)
        except Exception as e:
            logger.debug("fsbo.com listing failed %s: %s", url, e)
            return None

    def _parse_listing(self, soup: BeautifulSoup, url: str,
                       criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        """Parse listing page HTML into an FSBOListing."""
        # IMPORTANT: These selectors need to be verified against the live FSBO.com site.
        # Adjust them during implementation by inspecting the actual HTML.

        # Address
        address_el = (soup.select_one("h1.listing-address")
                      or soup.select_one("[class*='address']")
                      or soup.select_one("h1"))
        if not address_el:
            return None
        raw_address = address_el.get_text(strip=True)

        # Price
        price = None
        price_el = soup.select_one("[class*='price']") or soup.select_one(".listing-price")
        if price_el:
            price_text = re.sub(r"[^\d]", "", price_el.get_text())
            price = int(price_text) if price_text else None

        # Beds/baths
        beds = baths = None
        beds_el = soup.select_one("[class*='bed']")
        baths_el = soup.select_one("[class*='bath']")
        if beds_el:
            m = re.search(r"(\d+)", beds_el.get_text())
            if m:
                beds = int(m.group(1))
        if baths_el:
            m = re.search(r"([\d.]+)", baths_el.get_text())
            if m:
                baths = float(m.group(1))

        # DOM — look for "X days on market" pattern
        dom = None
        dom_el = soup.find(string=re.compile(r"days? on market", re.I))
        if dom_el:
            m = re.search(r"(\d+)", str(dom_el))
            if m:
                dom = int(m.group(1))
        if criteria.max_days_on_market and dom and dom > criteria.max_days_on_market:
            return None  # filtered out

        # Owner contact
        owner_name = phone = email = None
        contact_section = soup.select_one("[class*='contact']") or soup.select_one("[class*='owner']")
        if contact_section:
            name_el = contact_section.select_one("[class*='name']") or contact_section.select_one("strong")
            if name_el:
                owner_name = clean_name(name_el.get_text(strip=True))
            phone_el = contact_section.select_one("[href^='tel:']") or contact_section.select_one("[class*='phone']")
            if phone_el:
                phone_text = phone_el.get("href", "").replace("tel:", "") or phone_el.get_text(strip=True)
                phone = clean_phone(phone_text)
            email_el = contact_section.select_one("[href^='mailto:']")
            if email_el:
                email = clean_email(email_el.get("href", "").replace("mailto:", ""))

        # If no contact at all, still return the listing (enrich later)
        city = state = zip_code = ""
        # Parse address components — FSBO.com usually shows "City, ST XXXXX"
        addr_parts = re.search(r"([^,]+),\s*([A-Z]{2})\s*(\d{5})?", raw_address)
        if addr_parts:
            city = addr_parts.group(1).strip()
            state = addr_parts.group(2)
            zip_code = addr_parts.group(3) or ""

        listing = FSBOListing(
            address=raw_address,
            city=city,
            state=state,
            zip_code=zip_code,
            price=price,
            beds=beds,
            baths=baths,
            sqft=None,
            property_type=None,
            days_on_market=dom,
            owner_name=owner_name,
            phone=phone,
            email=email,
            listing_url=url,
            source="fsbo.com",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
```

**Step 2: Run a quick sanity check (no network)**

```bash
python -c "
from agent_finder.scrapers.fsbo_com import FsboComScraper
print('Import OK — FsboComScraper defined')
"
```

Expected: `Import OK — FsboComScraper defined`

**Step 3: Commit**

```bash
git add agent_finder/scrapers/fsbo_com.py
git commit -m "feat: add FSBO.com scraper"
```

> **Implementation note:** During testing, load the FSBO.com search page in a browser and inspect the HTML to verify/adjust CSS selectors. The selectors in `_parse_listing` and `_scrape_search_page` are best guesses — adjust them to match actual element classes/IDs.

---

## Task 6: ForSaleByOwner.com Scraper

**Files:**
- Create: `agent_finder/scrapers/forsalebyowner_com.py`

**Step 1: Create the scraper** (same pattern as FSBO.com)

```python
"""ForSaleByOwner.com scraper — secondary dedicated FSBO site."""

import logging
import re
from typing import List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from ..config import FORSALEBYOWNER_COM, FSBO_MAX_PAGES
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import clean_phone, clean_email, clean_name
from .fsbo_base import FSBOBaseScraper

logger = logging.getLogger("agent_finder.scrapers.forsalebyowner_com")

BASE_URL = "https://www.forsalebyowner.com"


class ForSaleByOwnerScraper(FSBOBaseScraper):
    """
    Scrapes ForSaleByOwner.com for FSBO listings.
    Similar approach to FsboComScraper — search → listing pages.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(FORSALEBYOWNER_COM, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open:
            return []
        try:
            listing_urls = await self._get_listing_urls(criteria)
            results = []
            for url in listing_urls:
                listing = await self._scrape_listing(url, criteria)
                if listing:
                    results.append(listing)
            if results:
                self._record_success()
            logger.info("forsalebyowner.com: found %d listings", len(results))
            return results
        except Exception as e:
            self._record_failure()
            logger.info("forsalebyowner.com failed: %s: %s", type(e).__name__, e)
            return []

    async def _get_listing_urls(self, criteria: FSBOSearchCriteria) -> List[str]:
        urls = []
        for page in range(1, FSBO_MAX_PAGES + 1):
            page_urls = await self._scrape_search_page(criteria, page)
            if not page_urls:
                break
            urls.extend(page_urls)
        return urls

    async def _scrape_search_page(self, criteria: FSBOSearchCriteria, page: int) -> List[str]:
        search_url = self._build_search_url(criteria, page)
        try:
            resp = await self._get(search_url)
            if resp.status_code != 200:
                return []
            soup = BeautifulSoup(resp.text, "lxml")
            # IMPORTANT: Verify selectors against live site during implementation
            links = (soup.select("a[href*='/homes/']")
                     or soup.select(".property-card a")
                     or soup.select("h2 a"))
            seen = set()
            result = []
            for a in links:
                href = a.get("href", "")
                if href and "/homes/" in href and href not in seen:
                    full = href if href.startswith("http") else urljoin(BASE_URL, href)
                    seen.add(href)
                    result.append(full)
            return result
        except Exception as e:
            logger.debug("forsalebyowner.com page %d failed: %s", page, e)
            return []

    def _build_search_url(self, criteria: FSBOSearchCriteria, page: int) -> str:
        if criteria.location_type == "zip":
            first_zip = criteria.location.split(",")[0].strip()
            return f"{BASE_URL}/homes/search/?zip={first_zip}&page={page}"
        parts = criteria.location.split(",", 1)
        city = parts[0].strip().lower().replace(" ", "-")
        state = parts[1].strip().lower() if len(parts) > 1 else ""
        return f"{BASE_URL}/homes/for-sale/{state}/{city}/?page={page}"

    async def _scrape_listing(self, url: str, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        try:
            resp = await self._get(url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "lxml")
            return self._parse_listing(soup, url, criteria)
        except Exception as e:
            logger.debug("forsalebyowner.com listing failed %s: %s", url, e)
            return None

    def _parse_listing(self, soup: BeautifulSoup, url: str,
                       criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        # IMPORTANT: Verify these selectors against the live site during implementation.
        address_el = (soup.select_one("h1")
                      or soup.select_one("[class*='address']"))
        if not address_el:
            return None
        raw_address = address_el.get_text(strip=True)

        price = None
        price_el = soup.select_one("[class*='price']")
        if price_el:
            digits = re.sub(r"[^\d]", "", price_el.get_text())
            price = int(digits) if digits else None

        beds = baths = dom = None
        beds_match = re.search(r"(\d+)\s*bed", soup.get_text(), re.I)
        baths_match = re.search(r"([\d.]+)\s*bath", soup.get_text(), re.I)
        dom_match = re.search(r"(\d+)\s*days?\s*on\s*market", soup.get_text(), re.I)
        if beds_match:
            beds = int(beds_match.group(1))
        if baths_match:
            baths = float(baths_match.group(1))
        if dom_match:
            dom = int(dom_match.group(1))
        if criteria.max_days_on_market and dom and dom > criteria.max_days_on_market:
            return None

        owner_name = phone = email = None
        # Phone: look for tel: links or phone-pattern text
        tel_link = soup.select_one("a[href^='tel:']")
        if tel_link:
            phone = clean_phone(tel_link.get("href", "").replace("tel:", ""))
        if not phone:
            phone_match = re.search(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", soup.get_text())
            if phone_match:
                phone = clean_phone(phone_match.group(0))
        mailto_link = soup.select_one("a[href^='mailto:']")
        if mailto_link:
            email = clean_email(mailto_link.get("href", "").replace("mailto:", ""))
        name_el = soup.select_one("[class*='seller']") or soup.select_one("[class*='owner-name']")
        if name_el:
            owner_name = clean_name(name_el.get_text(strip=True))

        city = state = zip_code = ""
        addr_parts = re.search(r"([^,]+),\s*([A-Z]{2})\s*(\d{5})?", raw_address)
        if addr_parts:
            city = addr_parts.group(1).strip()
            state = addr_parts.group(2)
            zip_code = addr_parts.group(3) or ""

        listing = FSBOListing(
            address=raw_address,
            city=city, state=state, zip_code=zip_code,
            price=price, beds=beds, baths=baths, sqft=None,
            property_type=None, days_on_market=dom,
            owner_name=owner_name, phone=phone, email=email,
            listing_url=url, source="forsalebyowner.com",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.scrapers.forsalebyowner_com import ForSaleByOwnerScraper; print('OK')"
```

**Step 3: Commit**

```bash
git add agent_finder/scrapers/forsalebyowner_com.py
git commit -m "feat: add ForSaleByOwner.com scraper"
```

---

## Task 7: Zillow FSBO Scraper

**Files:**
- Create: `agent_finder/scrapers/zillow_fsbo.py`

**Step 1: Create the scraper** (searches Zillow area results with FSBO filter)

```python
"""Zillow FSBO scraper — searches Zillow's owner-listed properties by area."""

import json
import logging
import re
from typing import List, Optional
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from ..config import ZILLOW_FSBO
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import get_rotating_headers, clean_phone, clean_name
from .fsbo_base import FSBOBaseScraper

logger = logging.getLogger("agent_finder.scrapers.zillow_fsbo")

ZILLOW_BASE = "https://www.zillow.com"


class ZillowFSBOScraper(FSBOBaseScraper):
    """
    Searches Zillow for FSBO (For Sale By Owner) listings in an area.

    Uses Zillow's homes search with ?listingType=by_owner query parameter.
    Parses __NEXT_DATA__ JSON for listing results (same approach as ZillowScraper).
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(ZILLOW_FSBO, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open:
            return []
        try:
            results = await self._search(criteria)
            if results:
                self._record_success()
            logger.info("zillow_fsbo: found %d listings", len(results))
            return results
        except Exception as e:
            self._record_failure()
            logger.info("zillow_fsbo failed: %s: %s", type(e).__name__, e)
            return []

    async def _search(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        location = criteria.location.split(",")[0].strip() if criteria.location_type == "zip" else criteria.location
        search_url = f"{ZILLOW_BASE}/homes/fsbo/{quote_plus(location)}_rb/"
        headers = get_rotating_headers()
        headers["Referer"] = ZILLOW_BASE + "/"
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

        resp = await self._get(search_url, headers=headers)
        if resp.status_code != 200:
            return []

        return self._parse_search_results(resp.text, criteria)

    def _parse_search_results(self, html: str, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        soup = BeautifulSoup(html, "lxml")
        results = []

        script = soup.find("script", id="__NEXT_DATA__")
        if not script:
            return results

        try:
            data = json.loads(script.string)
            # Navigate to listing results
            search_state = (data.get("props", {}).get("pageProps", {})
                            .get("searchPageState", {}))
            cat1 = search_state.get("cat1", {})
            list_results = cat1.get("searchResults", {}).get("listResults", [])

            for item in list_results:
                listing = self._item_to_listing(item, criteria)
                if listing:
                    results.append(listing)
        except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
            logger.debug("zillow_fsbo parse failed: %s", e)

        return results

    def _item_to_listing(self, item: dict, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        # Filter: only FSBO/by owner listings
        listing_type = item.get("listingType", "").lower()
        if listing_type and "owner" not in listing_type and "fsbo" not in listing_type:
            return None

        address = item.get("address", "") or item.get("streetAddress", "")
        if not address:
            return None

        price_raw = item.get("price", "") or item.get("unformattedPrice", 0)
        price = None
        if price_raw:
            digits = re.sub(r"[^\d]", "", str(price_raw))
            price = int(digits) if digits else None

        if criteria.min_price and price and price < criteria.min_price:
            return None
        if criteria.max_price and price and price > criteria.max_price:
            return None

        beds = item.get("beds") or item.get("bedrooms")
        baths = item.get("baths") or item.get("bathrooms")
        if beds:
            try:
                beds = int(beds)
            except (ValueError, TypeError):
                beds = None
        if baths:
            try:
                baths = float(baths)
            except (ValueError, TypeError):
                baths = None

        if criteria.min_beds and beds and beds < criteria.min_beds:
            return None
        if criteria.min_baths and baths and baths < criteria.min_baths:
            return None

        dom = item.get("daysOnZillow") or item.get("timeOnZillow")
        if dom:
            try:
                dom = int(dom)
            except (ValueError, TypeError):
                dom = None
        if criteria.max_days_on_market and dom and dom > criteria.max_days_on_market:
            return None

        detail_url = item.get("detailUrl", "")
        if detail_url and detail_url.startswith("/"):
            detail_url = ZILLOW_BASE + detail_url

        # Owner contact — Zillow sometimes exposes phone for FSBO listings
        phone = None
        contact_phone = item.get("hdpData", {}).get("homeInfo", {}).get("phone", "")
        if contact_phone:
            phone = clean_phone(str(contact_phone))

        # Owner name from listing agent info (for FSBO, this is the seller)
        owner_name = None
        attr = item.get("attributionInfo", {}) or {}
        name = attr.get("agentName", "") or item.get("ownerName", "")
        if name:
            owner_name = clean_name(name)

        # Parse city/state/zip from address components
        city = item.get("city", "") or ""
        state = item.get("state", "") or ""
        zip_code = item.get("zipcode", "") or item.get("zip", "") or ""

        full_address = address
        if city and state:
            full_address = f"{address}, {city}, {state} {zip_code}".strip()

        listing = FSBOListing(
            address=full_address,
            city=city, state=state, zip_code=zip_code,
            price=price, beds=beds, baths=baths,
            sqft=item.get("livingArea"),
            property_type=item.get("homeType"),
            days_on_market=dom,
            owner_name=owner_name, phone=phone, email=None,
            listing_url=detail_url,
            source="zillow",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.scrapers.zillow_fsbo import ZillowFSBOScraper; print('OK')"
```

**Step 3: Commit**

```bash
git add agent_finder/scrapers/zillow_fsbo.py
git commit -m "feat: add Zillow FSBO area search scraper"
```

---

## Task 8: Realtor.com FSBO Scraper

**Files:**
- Create: `agent_finder/scrapers/realtor_fsbo.py`

**Step 1: Create the scraper** (wraps HomeHarvest for area-based FSBO search)

```python
"""Realtor.com FSBO scraper — uses HomeHarvest library for area search."""

import asyncio
import logging
import re
from typing import List, Optional

import httpx

from ..config import REALTOR_FSBO
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import clean_phone, clean_email, clean_name
from .fsbo_base import FSBOBaseScraper

logger = logging.getLogger("agent_finder.scrapers.realtor_fsbo")


class RealtorFSBOScraper(FSBOBaseScraper):
    """
    Uses the HomeHarvest library (Realtor.com backend) to search for
    FSBO listings by area. HomeHarvest is synchronous, so we run it
    in a thread executor.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(REALTOR_FSBO, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open:
            return []
        try:
            loop = asyncio.get_event_loop()
            results = await loop.run_in_executor(None, self._sync_search, criteria)
            if results:
                self._record_success()
            logger.info("realtor_fsbo: found %d listings", len(results))
            return results
        except Exception as e:
            self._record_failure()
            logger.info("realtor_fsbo failed: %s: %s", type(e).__name__, e)
            return []

    def _sync_search(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        try:
            from homeharvest import scrape_property
        except ImportError:
            logger.info("homeharvest library not installed, skipping realtor_fsbo")
            return []

        location = criteria.location
        if criteria.location_type == "zip":
            location = criteria.location.split(",")[0].strip()

        results = []
        try:
            df = scrape_property(location=location, listing_type="for_sale")
            if df is None or df.empty:
                return []

            for _, row in df.iterrows():
                listing = self._row_to_listing(row, criteria)
                if listing:
                    results.append(listing)
        except Exception as e:
            logger.info("homeharvest search failed for '%s': %s", location, e)

        return results

    def _row_to_listing(self, row, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        import pandas as pd

        def safe(val) -> str:
            if val is None or pd.isna(val):
                return ""
            s = str(val).strip()
            return "" if s.lower() in ("nan", "none", "<na>", "na") else s

        # For FSBO filter: skip listings where a professional agent is clearly named
        # (We keep rows where agent info is empty — those are likely FSBO)
        agent_name_raw = safe(row.get("agent_name") or row.get("list_agent_name", ""))
        # Heuristic: if it has a named agent AND a brokerage, likely not FSBO
        broker_raw = safe(row.get("broker_name") or row.get("brokerage", ""))
        if agent_name_raw and broker_raw and len(agent_name_raw) > 3:
            return None  # Skip — has a real estate agent

        address = safe(row.get("full_street_line") or row.get("street_address", ""))
        if not address:
            return None

        city = safe(row.get("city", ""))
        state = safe(row.get("state", ""))
        zip_code = safe(row.get("zip_code") or row.get("postal_code", ""))

        price_raw = safe(row.get("list_price") or row.get("price", ""))
        price = None
        if price_raw:
            try:
                price = int(float(price_raw))
            except (ValueError, TypeError):
                pass

        if criteria.min_price and price and price < criteria.min_price:
            return None
        if criteria.max_price and price and price > criteria.max_price:
            return None

        beds_raw = safe(row.get("beds") or row.get("bedrooms", ""))
        baths_raw = safe(row.get("baths") or row.get("bathrooms", ""))
        beds = int(float(beds_raw)) if beds_raw else None
        baths = float(baths_raw) if baths_raw else None

        if criteria.min_beds and beds and beds < criteria.min_beds:
            return None
        if criteria.min_baths and baths and baths < criteria.min_baths:
            return None

        dom_raw = safe(row.get("days_on_market") or row.get("dom", ""))
        dom = int(float(dom_raw)) if dom_raw else None
        if criteria.max_days_on_market and dom and dom > criteria.max_days_on_market:
            return None

        # Contact info — for FSBO on Realtor.com, seller contact sometimes visible
        phone = clean_phone(safe(row.get("agent_phone") or row.get("list_agent_phone", "")))
        email = clean_email(safe(row.get("agent_email") or row.get("list_agent_email", "")))
        owner_name = clean_name(agent_name_raw) if agent_name_raw else None

        listing_url = safe(row.get("property_url") or row.get("url", ""))

        full_address = f"{address}, {city}, {state} {zip_code}".strip().strip(",")

        listing = FSBOListing(
            address=full_address,
            city=city, state=state, zip_code=zip_code,
            price=price, beds=beds, baths=baths,
            sqft=None, property_type=None, days_on_market=dom,
            owner_name=owner_name, phone=phone or None, email=email or None,
            listing_url=listing_url, source="realtor",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.scrapers.realtor_fsbo import RealtorFSBOScraper; print('OK')"
```

**Step 3: Commit**

```bash
git add agent_finder/scrapers/realtor_fsbo.py
git commit -m "feat: add Realtor.com FSBO scraper via HomeHarvest"
```

---

## Task 9: Craigslist FSBO Scraper

**Files:**
- Create: `agent_finder/scrapers/craigslist_fsbo.py`

**Step 1: Create the scraper**

```python
"""Craigslist FSBO scraper — scrapes 'real estate - by owner' posts."""

import json
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from ..config import CRAIGSLIST_FSBO, FSBO_MAX_PAGES
from ..fsbo_models import FSBOListing, FSBOSearchCriteria
from ..utils import clean_phone
from .fsbo_base import FSBOBaseScraper

logger = logging.getLogger("agent_finder.scrapers.craigslist_fsbo")

# Load area map once at import time
_AREA_MAP_PATH = Path(__file__).parent.parent / "data" / "craigslist_areas.json"
try:
    CRAIGSLIST_AREAS: dict = json.loads(_AREA_MAP_PATH.read_text())
except (FileNotFoundError, json.JSONDecodeError):
    CRAIGSLIST_AREAS = {}
    logger.warning("craigslist_areas.json not found — Craigslist scraper disabled")

PHONE_RE = re.compile(r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}")


class CraigslistFSBOScraper(FSBOBaseScraper):
    """
    Scrapes Craigslist's 'real estate - by owner' (reo) section.

    Contact info notes:
    - Phone: extracted from post body text via regex
    - Email: Craigslist uses relay addresses (xxxx@sale.craigslist.org)
      We do NOT collect relay emails — contact_status is set to "phone_only"
      or "anonymous" depending on whether a phone was found.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(CRAIGSLIST_FSBO, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open or not CRAIGSLIST_AREAS:
            return []

        area = self._resolve_area(criteria)
        if not area:
            logger.info("craigslist: could not resolve area for '%s', skipping", criteria.location)
            return []

        try:
            results = await self._scrape_area(area, criteria)
            if results:
                self._record_success()
            logger.info("craigslist: found %d listings in '%s'", len(results), area)
            return results
        except Exception as e:
            self._record_failure()
            logger.info("craigslist failed: %s: %s", type(e).__name__, e)
            return []

    def _resolve_area(self, criteria: FSBOSearchCriteria) -> Optional[str]:
        """Map location to a Craigslist subdomain."""
        location = criteria.location.lower().strip()
        # Try exact match first
        if location in CRAIGSLIST_AREAS:
            return CRAIGSLIST_AREAS[location]
        # Try city part only (strip state)
        city = location.split(",")[0].strip()
        if city in CRAIGSLIST_AREAS:
            return CRAIGSLIST_AREAS[city]
        # Try partial match
        for key, val in CRAIGSLIST_AREAS.items():
            if key in city or city in key:
                return val
        return None

    async def _scrape_area(self, area: str, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        base = f"https://{area}.craigslist.org"
        results = []
        for page in range(FSBO_MAX_PAGES):
            offset = page * 120  # Craigslist shows 120 per page
            search_url = f"{base}/search/reo"
            params = {"s": offset}
            if criteria.location_type == "zip":
                params["query"] = criteria.location.split(",")[0].strip()

            resp = await self._get(search_url, params=params)
            if resp.status_code != 200:
                break

            soup = BeautifulSoup(resp.text, "lxml")
            post_links = self._get_post_links(soup, base)
            if not post_links:
                break

            for link, posted_date in post_links:
                # Apply DOM filter early based on post date
                if criteria.max_days_on_market and posted_date:
                    days_ago = (datetime.now() - posted_date).days
                    if days_ago > criteria.max_days_on_market:
                        continue

                listing = await self._scrape_post(link, posted_date, criteria)
                if listing:
                    results.append(listing)

        return results

    def _get_post_links(self, soup: BeautifulSoup, base: str) -> List[tuple]:
        """Extract post links and dates from search results page."""
        links = []
        # Craigslist structure: <li class="cl-search-result"> or <li class="result-row">
        for item in (soup.select("li.cl-search-result") or soup.select("li.result-row")):
            a = item.select_one("a.cl-app-anchor") or item.select_one("a.result-title")
            if not a:
                continue
            href = a.get("href", "")
            if not href:
                continue
            full = href if href.startswith("http") else urljoin(base, href)
            # Parse post date
            date_el = item.select_one("time") or item.select_one(".result-date")
            post_date = None
            if date_el:
                dt_str = date_el.get("datetime", "") or date_el.get("title", "")
                try:
                    post_date = datetime.fromisoformat(dt_str[:19]) if dt_str else None
                except ValueError:
                    pass
            links.append((full, post_date))
        return links

    async def _scrape_post(self, url: str, posted_date: Optional[datetime],
                            criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        try:
            resp = await self._get(url)
            if resp.status_code != 200:
                return None
            soup = BeautifulSoup(resp.text, "lxml")
            return self._parse_post(soup, url, posted_date, criteria)
        except Exception as e:
            logger.debug("craigslist post failed %s: %s", url, e)
            return None

    def _parse_post(self, soup: BeautifulSoup, url: str,
                    posted_date: Optional[datetime],
                    criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        title_el = soup.select_one("#titletextonly") or soup.select_one("h1.postingtitle")
        body_el = soup.select_one("#postingbody") or soup.select_one(".postingbody")

        title = title_el.get_text(strip=True) if title_el else ""
        body = body_el.get_text(separator=" ", strip=True) if body_el else ""
        full_text = f"{title} {body}"

        # Price from title or body
        price = None
        price_match = re.search(r"\$\s*([\d,]+)", full_text)
        if price_match:
            digits = re.sub(r"[^\d]", "", price_match.group(1))
            price = int(digits) if digits else None

        if criteria.min_price and price and price < criteria.min_price:
            return None
        if criteria.max_price and price and price > criteria.max_price:
            return None

        # Beds/baths from title
        beds = baths = None
        beds_match = re.search(r"(\d+)\s*(?:bd|bed|BR)", full_text, re.I)
        baths_match = re.search(r"([\d.]+)\s*(?:ba|bath|BTH)", full_text, re.I)
        if beds_match:
            beds = int(beds_match.group(1))
        if baths_match:
            baths = float(baths_match.group(1))

        if criteria.min_beds and beds and beds < criteria.min_beds:
            return None
        if criteria.min_baths and baths and baths < criteria.min_baths:
            return None

        # DOM from posted_date
        dom = None
        if posted_date:
            dom = max(0, (datetime.now() - posted_date).days)

        # Phone — extract from body text
        phone = None
        phone_match = PHONE_RE.search(body)
        if phone_match:
            phone = clean_phone(phone_match.group(0))

        # Address from post body or map embed
        address_el = soup.select_one(".mapaddress") or soup.select_one("[data-latitude]")
        raw_address = ""
        city = state = zip_code = ""
        if address_el:
            raw_address = address_el.get_text(strip=True)
        if not raw_address:
            raw_address = title  # Use title as fallback

        # contact_status: phone_only if phone found, anonymous if not
        contact_status = "phone_only" if phone else "anonymous"

        listing = FSBOListing(
            address=raw_address,
            city=city, state=state, zip_code=zip_code,
            price=price, beds=beds, baths=baths,
            sqft=None, property_type=None, days_on_market=dom,
            owner_name=None, phone=phone, email=None,
            listing_url=url, source="craigslist",
            contact_status=contact_status,
        )
        return listing
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.scrapers.craigslist_fsbo import CraigslistFSBOScraper; print('OK')"
```

**Step 3: Commit**

```bash
git add agent_finder/scrapers/craigslist_fsbo.py
git commit -m "feat: add Craigslist FSBO scraper with phone extraction"
```

---

## Task 10: FSBO Pipeline

**Files:**
- Create: `agent_finder/fsbo_pipeline.py`

**Step 1: Create the pipeline**

```python
"""FSBO Pipeline — orchestrates concurrent FSBO scrapers, deduplicates, enriches."""

import asyncio
import hashlib
import json
import logging
from datetime import datetime
from typing import Callable, List, Optional

import httpx

from .config import FSBO_COM, FORSALEBYOWNER_COM, ZILLOW_FSBO, REALTOR_FSBO, CRAIGSLIST_FSBO
from .fsbo_models import FSBOListing, FSBOSearchCriteria
from .scrapers.fsbo_com import FsboComScraper
from .scrapers.forsalebyowner_com import ForSaleByOwnerScraper
from .scrapers.zillow_fsbo import ZillowFSBOScraper
from .scrapers.realtor_fsbo import RealtorFSBOScraper
from .scrapers.craigslist_fsbo import CraigslistFSBOScraper
from .utils import normalize_address

logger = logging.getLogger("agent_finder.fsbo_pipeline")


def _criteria_cache_key(criteria: FSBOSearchCriteria) -> str:
    """SHA256 hash of all search criteria fields for cache lookup."""
    parts = [
        criteria.location,
        criteria.location_type,
        str(criteria.radius_miles),
        str(criteria.min_price),
        str(criteria.max_price),
        str(criteria.min_beds),
        str(criteria.min_baths),
        str(criteria.property_type),
        str(criteria.max_days_on_market),
    ]
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]


def _normalize_for_dedup(listing: FSBOListing) -> str:
    """Create a normalized address string for deduplication."""
    return normalize_address(listing.address.split(",")[0])  # street line only


class FSBOPipeline:
    """
    Runs all 5 FSBO scrapers concurrently, merges results by address,
    and streams progress via a callback.

    Usage:
        pipeline = FSBOPipeline(progress_callback=cb)
        listings = await pipeline.run(criteria)
    """

    SCRAPERS_TOTAL = 5

    def __init__(self, progress_callback: Optional[Callable] = None):
        self.progress_callback = progress_callback

    async def run(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        """Run all scrapers concurrently and return deduplicated results."""
        all_listings: List[FSBOListing] = []
        scrapers_done = 0

        async def _emit(source: str, new_count: int, done: bool = False):
            nonlocal scrapers_done
            if done:
                scrapers_done += 1
            if self.progress_callback:
                await self.progress_callback({
                    "scrapers_done": scrapers_done,
                    "scrapers_total": self.SCRAPERS_TOTAL,
                    "listings_found": len(all_listings) + new_count,
                    "current_source": source,
                    "status": "complete" if scrapers_done == self.SCRAPERS_TOTAL else "running",
                })

        async with httpx.AsyncClient(
            http2=True,
            follow_redirects=True,
            timeout=45.0,
        ) as client:
            scrapers = [
                FsboComScraper(client),
                ForSaleByOwnerScraper(client),
                ZillowFSBOScraper(client),
                RealtorFSBOScraper(client),
                CraigslistFSBOScraper(client),
            ]

            async def _run_scraper(scraper):
                try:
                    results = await scraper.search_area(criteria)
                    await _emit(scraper.name, len(results), done=True)
                    return results
                except Exception as e:
                    logger.warning("Scraper %s raised: %s", scraper.name, e)
                    await _emit(scraper.name, 0, done=True)
                    return []

            results_per_scraper = await asyncio.gather(
                *[_run_scraper(s) for s in scrapers]
            )

        for scraper_results in results_per_scraper:
            all_listings.extend(scraper_results)

        merged = self._deduplicate_and_merge(all_listings)

        logger.info("FSBOPipeline: %d raw listings → %d after dedup",
                    len(all_listings), len(merged))
        return merged

    def _deduplicate_and_merge(self, listings: List[FSBOListing]) -> List[FSBOListing]:
        """Group by normalized address, merge contact info from multiple sources."""
        seen: dict[str, FSBOListing] = {}

        for listing in listings:
            key = _normalize_for_dedup(listing)
            if not key or len(key) < 4:
                # Address too short to dedup reliably — keep as-is
                key = listing.listing_url or listing.address

            if key in seen:
                seen[key].merge(listing)
            else:
                seen[key] = listing

        return list(seen.values())
```

**Step 2: Verify import**

```bash
python -c "from agent_finder.fsbo_pipeline import FSBOPipeline; print('OK')"
```

**Step 3: Commit**

```bash
git add agent_finder/fsbo_pipeline.py
git commit -m "feat: add FSBOPipeline with concurrent scrapers, dedup, and SSE progress"
```

---

## Task 11: FSBO API Endpoints

**Files:**
- Modify: `agent_finder/app.py`

**Step 1: Add imports at the top of `app.py`** (after existing imports)

```python
from .fsbo_models import FSBOSearchCriteria
from .fsbo_pipeline import FSBOPipeline
```

Also add `from pydantic import BaseModel` if not already imported (check first).

**Step 2: Add FSBO job store and Pydantic request model** (after the existing `jobs` dict, before the first route)

```python
# ── FSBO search store ──
fsbo_searches: dict[str, dict] = {}
_fsbo_tasks: dict[str, asyncio.Task] = {}
FSBO_SEARCHES_FILE = UPLOAD_DIR / "fsbo_searches.json"


class FSBOSearchRequest(BaseModel):
    location: str
    location_type: str = "zip"          # "zip" | "city_state"
    radius_miles: int = 25
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    property_type: Optional[str] = None
    max_days_on_market: Optional[int] = None
```

**Step 3: Add the 5 FSBO endpoints** (append to `app.py` before `app.include_router(api)`)

```python
# ── FSBO endpoints ──

@api.post("/fsbo/search")
async def fsbo_search(req: FSBOSearchRequest):
    """Start a new FSBO search job. Returns search_id."""
    search_id = str(uuid.uuid4())[:8]
    criteria = FSBOSearchCriteria(
        location=req.location,
        location_type=req.location_type,
        radius_miles=req.radius_miles,
        min_price=req.min_price,
        max_price=req.max_price,
        min_beds=req.min_beds,
        min_baths=req.min_baths,
        property_type=req.property_type,
        max_days_on_market=req.max_days_on_market,
    )
    fsbo_searches[search_id] = {
        "status": "running",
        "criteria": req.dict(),
        "progress": [],
        "results": None,
        "total_listings": 0,
        "error": None,
        "created_at": datetime.now().isoformat(),
    }
    task = asyncio.create_task(_run_fsbo_pipeline(search_id, criteria))
    _fsbo_tasks[search_id] = task
    return {"search_id": search_id}


@api.get("/fsbo/progress/{search_id}")
async def fsbo_progress_stream(search_id: str):
    """SSE stream of scraping progress for a FSBO search job."""
    if search_id not in fsbo_searches:
        raise HTTPException(404, "Search not found.")

    async def event_generator():
        last_idx = 0
        while True:
            search = fsbo_searches.get(search_id)
            if not search:
                break
            progress_list = search["progress"]
            while last_idx < len(progress_list):
                data = json.dumps(progress_list[last_idx])
                yield f"data: {data}\n\n"
                last_idx += 1
            if search["status"] == "complete":
                done = json.dumps({
                    "type": "complete",
                    "total_listings": search["total_listings"],
                })
                yield f"data: {done}\n\n"
                break
            elif search["status"] == "error":
                yield f"data: {json.dumps({'type': 'error', 'message': search['error']})}\n\n"
                break
            await asyncio.sleep(0.3)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@api.get("/fsbo/results/{search_id}")
async def fsbo_results(search_id: str, page: int = 1, per_page: int = 20):
    """Return paginated results for a completed FSBO search."""
    search = fsbo_searches.get(search_id)
    if not search:
        raise HTTPException(404, "Search not found.")
    results = search.get("results") or []
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "search_id": search_id,
        "total": len(results),
        "page": page,
        "per_page": per_page,
        "results": results[start:end],
    }


@api.get("/fsbo/download/{search_id}")
async def fsbo_download(search_id: str, fmt: str = "csv"):
    """Download results as CSV or XLSX."""
    import csv
    import io as _io
    search = fsbo_searches.get(search_id)
    if not search or search["status"] != "complete":
        raise HTTPException(404, "Search not ready.")
    results = search.get("results") or []
    if not results:
        raise HTTPException(404, "No results to download.")

    columns = ["address", "city", "state", "zip_code", "price", "beds", "baths",
               "sqft", "property_type", "days_on_market", "owner_name", "phone",
               "email", "source", "contact_status", "listing_url"]

    if fmt == "csv":
        output = _io.StringIO()
        writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(results)
        content = output.getvalue().encode("utf-8")
        return StreamingResponse(
            _io.BytesIO(content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=fsbo_{search_id}.csv"},
        )
    else:
        raise HTTPException(400, "Only fmt=csv supported currently.")


@api.get("/fsbo/searches")
async def fsbo_list_searches():
    """List all past FSBO searches."""
    result = []
    for sid, s in fsbo_searches.items():
        result.append({
            "search_id": sid,
            "status": s["status"],
            "criteria": s.get("criteria", {}),
            "total_listings": s.get("total_listings", 0),
            "created_at": s.get("created_at", ""),
        })
    result.sort(key=lambda x: x["created_at"], reverse=True)
    return result


@api.delete("/fsbo/searches/{search_id}")
async def fsbo_delete_search(search_id: str):
    """Delete a FSBO search job."""
    if search_id not in fsbo_searches:
        raise HTTPException(404, "Search not found.")
    task = _fsbo_tasks.get(search_id)
    if task and not task.done():
        task.cancel()
    del fsbo_searches[search_id]
    _fsbo_tasks.pop(search_id, None)
    return {"ok": True}
```

**Step 4: Add the background task function** (before `app.include_router(api)`)

```python
async def _run_fsbo_pipeline(search_id: str, criteria: FSBOSearchCriteria):
    """Background task that runs the FSBO pipeline and stores results."""
    search = fsbo_searches[search_id]

    async def progress_callback(event: dict):
        search["progress"].append(event)

    try:
        pipeline = FSBOPipeline(progress_callback=progress_callback)
        listings = await pipeline.run(criteria)

        # Serialize listings to dicts for JSON storage
        results = []
        for listing in listings:
            results.append({
                "address": listing.address,
                "city": listing.city,
                "state": listing.state,
                "zip_code": listing.zip_code,
                "price": listing.price,
                "beds": listing.beds,
                "baths": listing.baths,
                "sqft": listing.sqft,
                "property_type": listing.property_type,
                "days_on_market": listing.days_on_market,
                "owner_name": listing.owner_name,
                "phone": listing.phone,
                "email": listing.email,
                "listing_url": listing.listing_url,
                "source": listing.source,
                "contact_status": listing.contact_status,
            })

        search["results"] = results
        search["total_listings"] = len(results)
        search["status"] = "complete"

    except asyncio.CancelledError:
        search["status"] = "cancelled"
    except Exception as e:
        logger.error("FSBO pipeline error for %s: %s", search_id, e, exc_info=True)
        search["status"] = "error"
        search["error"] = str(e)
```

**Step 5: Verify server starts without errors**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
python -c "from agent_finder.app import app; print('App loaded OK')"
```

Expected: `App loaded OK` (no import errors)

**Step 6: Commit**

```bash
git add agent_finder/app.py
git commit -m "feat: add FSBO API endpoints (search, progress SSE, results, download)"
```

---

## Task 12: Frontend Wiring (FSBOFinder.jsx)

**Files:**
- Modify: `frontend/src/pages/FSBOFinder.jsx`

**Step 1: Read the current file** to understand the exact component structure before editing.

**Step 2: Replace the `handleSearch` function and add SSE + results state**

Replace the current `handleSearch` + mock timeout + `MOCK_RESULTS` with a real API integration. The key changes are:

1. **Remove** `MOCK_RESULTS` constant at the top
2. **Add** `searchId`, `progress`, `scrapersStatus` state vars
3. **Replace** `handleSearch` with one that POSTs to `/api/fsbo/search` then opens SSE
4. **Update** results mapping to use API response field names (`owner_name → owner`, etc.)
5. **Add** export button that calls `/api/fsbo/download/{searchId}`
6. **Add** `maxDom` filter state + input (Days on Market field in the filters grid)
7. **Update** progress UI to show source names completing

```jsx
// New state additions (add alongside existing state):
const [searchId, setSearchId] = useState(null)
const [scrapersStatus, setScrapersStatus] = useState({})  // { "zillow": "done", "craigslist": "running" }
const [liveCount, setLiveCount] = useState(0)
const [maxDom, setMaxDom] = useState('')

// Replace handleSearch:
async function handleSearch(e) {
  e.preventDefault()
  if (!query.trim()) return
  setLoading(true)
  setResults(null)
  setSelected(new Set())
  setScrapersStatus({})
  setLiveCount(0)

  // Detect zip vs city/state
  const isZip = /^\d{5}(,\s*\d{5})*$/.test(query.trim())
  const body = {
    location: query.trim(),
    location_type: isZip ? 'zip' : 'city_state',
    min_price: priceMin ? parseInt(priceMin) : null,
    max_price: priceMax ? parseInt(priceMax) : null,
    min_beds: minBeds !== 'Any' ? parseInt(minBeds) : null,
    min_baths: minBaths !== 'Any' ? parseFloat(minBaths) : null,
    property_type: propertyType !== 'All' ? propertyType.toLowerCase().replace(' ', '_') : null,
    max_days_on_market: maxDom ? parseInt(maxDom) : null,
  }

  try {
    const res = await fetch('/api/fsbo/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const { search_id } = await res.json()
    setSearchId(search_id)

    // Open SSE stream
    const sse = new EventSource(`/api/fsbo/progress/${search_id}`)
    sse.onmessage = (ev) => {
      const data = JSON.parse(ev.data)
      if (data.type === 'complete') {
        sse.close()
        setLoading(false)
        // Fetch results
        fetch(`/api/fsbo/results/${search_id}`)
          .then(r => r.json())
          .then(({ results }) => {
            setResults(results.map(r => ({
              ...r,
              id: r.listing_url || r.address,
              owner: r.owner_name,
              dom: r.days_on_market,
            })))
          })
      } else if (data.type === 'error') {
        sse.close()
        setLoading(false)
      } else {
        // Progress event
        setLiveCount(data.listings_found || 0)
        if (data.current_source) {
          setScrapersStatus(prev => ({
            ...prev,
            [data.current_source]: data.scrapers_done > (prev._done || 0) ? 'done' : 'running',
            _done: data.scrapers_done,
          }))
        }
      }
    }
    sse.onerror = () => {
      sse.close()
      setLoading(false)
    }
  } catch (err) {
    console.error('FSBO search failed:', err)
    setLoading(false)
  }
}
```

**Step 3: Update the loading state UI** to show live source progress

Replace the existing loading `WoodPanel` content with:

```jsx
<div className="flex flex-col items-center gap-4 py-8">
  {/* Progress bar */}
  <div className="w-full max-w-md h-1.5 bg-bg-elevated rounded-full overflow-hidden">
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-gold-dim via-gold to-gold-bright"
      initial={{ x: '-100%' }}
      animate={{ x: '100%' }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      style={{ width: '40%' }}
    />
  </div>
  <div className="flex items-center gap-3">
    <ShurikenLoader size={24} />
    <span className="text-text-dim text-sm font-heading tracking-wide">
      Tracking targets... {liveCount > 0 && `(${liveCount} found so far)`}
    </span>
  </div>
  {/* Source status badges */}
  <div className="flex flex-wrap gap-2 justify-center">
    {['fsbo.com', 'forsalebyowner.com', 'zillow', 'realtor', 'craigslist'].map(src => (
      <span
        key={src}
        className={`text-xs px-2 py-0.5 rounded-full font-heading tracking-wide border transition-all ${
          scrapersStatus[src] === 'done'
            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            : 'bg-bg-elevated text-text-muted border-gold-dim/10'
        }`}
      >
        {src} {scrapersStatus[src] === 'done' ? '✓' : '...'}
      </span>
    ))}
  </div>
</div>
```

**Step 4: Add contact status badge to result cards**

In the card `<div className="flex items-center gap-3 mb-3">` section, after the source badge, add:

```jsx
{/* Contact status badge */}
{row.contact_status && (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
    row.contact_status === 'complete'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : row.contact_status === 'anonymous'
      ? 'bg-red-500/10 text-red-400 border-red-500/20'
      : 'bg-gold/[0.08] text-gold-dim border-gold-dim/[0.15]'
  }`}>
    {row.contact_status === 'complete' ? 'Full Contact'
      : row.contact_status === 'anonymous' ? 'Anonymous'
      : row.contact_status === 'phone_only' ? 'Phone Only'
      : 'Partial'}
  </span>
)}
```

**Step 5: Add export button** in the results header area (after the "Send Selected to CRM" button):

```jsx
{searchId && (
  <a
    href={`/api/fsbo/download/${searchId}?fmt=csv`}
    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-heading tracking-wide text-text-dim border border-gold-dim/20 rounded-sm hover:text-gold hover:border-gold/40 transition-colors"
    download
  >
    Export CSV
  </a>
)}
```

**Step 6: Add maxDom filter field** in the filters grid (add a 6th filter cell, or replace an existing one by splitting the grid to 3 rows of 2):

```jsx
<div>
  <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
    Max Days Listed
  </label>
  <input
    type="number"
    placeholder="Any"
    value={maxDom}
    onChange={(e) => setMaxDom(e.target.value)}
    className={`${inputClasses} w-full !py-2.5 text-sm`}
  />
</div>
```

**Step 7: Verify the frontend builds without errors**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder\frontend"
npm run build 2>&1 | tail -20
```

Expected: Build success, no errors.

**Step 8: Commit**

```bash
git add frontend/src/pages/FSBOFinder.jsx
git commit -m "feat: wire FSBOFinder.jsx to real API with SSE progress, contact badges, export"
```

---

## Task 13: End-to-End Smoke Test

**Files:** None (testing only)

**Step 1: Start the backend**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
python -m uvicorn agent_finder.app:app --port 9000 --reload &
```

Wait 2 seconds, then test:

**Step 2: Test the FSBO search endpoint**

```bash
curl -s -X POST http://localhost:9000/api/fsbo/search \
  -H "Content-Type: application/json" \
  -d '{"location": "85001", "location_type": "zip"}' | python -m json.tool
```

Expected: `{ "search_id": "xxxxxxxx" }`

**Step 3: Monitor progress**

```bash
# Replace SEARCH_ID with the actual ID from step 2
curl -s "http://localhost:9000/api/fsbo/progress/SEARCH_ID" --max-time 60
```

Expected: A stream of JSON events, ending with `{"type": "complete", ...}`

**Step 4: Check results**

```bash
curl -s "http://localhost:9000/api/fsbo/results/SEARCH_ID" | python -m json.tool
```

Expected: JSON with `total`, `results` array.

**Step 5: Start the frontend dev server and verify the UI**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder\frontend"
npm run dev &
```

Open `http://localhost:5173`, navigate to FSBO Finder, enter a zip code, click Hunt, observe progress badges, see results populate.

**Step 6: Fix any issues found during smoke test**

Common issues to watch for:
- CSS selector mismatches on FSBO.com / ForSaleByOwner.com → open browser devtools on those sites and update selectors in the scraper files
- Zillow returning 0 results → check if FSBO URL format has changed, try alternate URL patterns
- HomeHarvest returning listings with agents → tighten the FSBO filter in `realtor_fsbo.py`
- Craigslist area not found → add the missing city to `craigslist_areas.json`

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: FSBO Finder end-to-end working — 5 scrapers, SSE progress, real results"
```

---

## Task 14: Deploy

**Step 1: Build frontend**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder\frontend"
npm run build
```

**Step 2: Push to GitHub**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder"
git push origin master
```

**Step 3: Deploy to Vercel**

```bash
cd "c:\Users\brand\OneDrive\Desktop\Agent Finder\frontend"
npx vercel --prod
```

---

## Selector Verification Guide

During Task 13 smoke testing, you will likely need to update HTML selectors for FSBO.com and ForSaleByOwner.com. Here's how:

1. Open the site in Chrome
2. Search for a location (e.g., "Phoenix, AZ" or zip "85001")
3. Right-click a listing card → Inspect
4. Find the element containing the address, price, and contact info
5. Note the class names or IDs
6. Update the `soup.select_one(...)` calls in the scraper to match

The scrapers use a fallback chain (`selector1 or selector2 or selector3`) — add new selectors to the front of the chain when you find the correct ones.
