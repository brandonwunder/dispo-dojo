"""Craigslist FSBO scraper — scrapes ‘real estate - by owner’ posts."""

import json
import logging
import re
from datetime import datetime
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
    Scrapes Craigslist’s ‘real estate - by owner’ (reo) section.

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

        # Strip state suffix formats: "phoenix, az" or "phoenix az"
        city = location.split(",")[0].strip()
        # Also strip trailing 2-letter state code without comma: "phoenix az" -> "phoenix"
        city = re.sub(r'\s+[a-z]{2}$', '', city).strip()

        # Try lookups from most specific to least
        for candidate in [location, city]:
            if candidate in CRAIGSLIST_AREAS:
                logger.debug("craigslist: resolved %r → %s via key %r", location, CRAIGSLIST_AREAS[candidate], candidate)
                return CRAIGSLIST_AREAS[candidate]

        # Partial match — key starts with city or city starts with key
        for key, val in CRAIGSLIST_AREAS.items():
            if len(city) > 3 and (key == city or key.startswith(city) or city.startswith(key)):
                logger.debug("craigslist: partial match %r → %s via key %r", city, val, key)
                return val

        logger.info("craigslist: no area found for location=%r (tried city=%r)", location, city)
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
                if criteria.max_days_on_market is not None and posted_date is not None:
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

        # Try selectors from newest to oldest Craigslist layout
        items = (
            soup.select("li.cl-search-result")
            or soup.select("li.result-row")
            or soup.select(".cl-search-view-mode-list li")
        )

        if not items:
            logger.info("craigslist: no result items found with known selectors (page len=%d)", len(str(soup)))
            if soup.select_one(".cl-search-empty") or "no results" in soup.get_text().lower():
                logger.info("craigslist: search returned 0 listings for this area")
            return []

        logger.debug("craigslist: found %d result items", len(items))

        for item in items:
            a = (
                item.select_one("a.cl-app-anchor")
                or item.select_one("a.result-title")
                or item.select_one("a[href*='/d/']")
                or item.select_one("a")
            )
            if not a:
                continue
            href = a.get("href", "")
            if not href:
                continue
            full = href if href.startswith("http") else urljoin(base, href)

            date_el = (
                item.select_one("time")
                or item.select_one(".result-date")
                or item.select_one("[datetime]")
            )
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

        if criteria.min_price is not None and price is not None and price < criteria.min_price:
            return None
        if criteria.max_price is not None and price is not None and price > criteria.max_price:
            return None

        # Beds/baths from title
        beds = baths = None
        beds_match = re.search(r"(\d+)\s*(?:bd|bed|BR)", full_text, re.I)
        baths_match = re.search(r"([\d.]+)\s*(?:ba|bath|BTH)", full_text, re.I)
        if beds_match:
            beds = int(beds_match.group(1))
        if baths_match:
            baths = float(baths_match.group(1))

        if criteria.min_beds is not None and beds is not None and beds < criteria.min_beds:
            return None
        if criteria.min_baths is not None and baths is not None and baths < criteria.min_baths:
            return None

        # DOM from posted_date
        dom = None
        if posted_date is not None:
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
