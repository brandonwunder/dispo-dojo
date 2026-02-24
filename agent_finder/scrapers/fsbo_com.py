"""FSBO.com scraper — dedicated FSBO listing site with owner contact info."""

import json
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
            logger.debug("fsbo.com search page %d: status=%d len=%d",
                         page, resp.status_code, len(resp.text))
            if resp.status_code != 200:
                logger.info("fsbo.com: non-200 response on page %d: %d", page, resp.status_code)
                return []

            soup = BeautifulSoup(resp.text, "lxml")

            # Try multiple selector strategies
            links = (
                soup.select("a[href*='/listing/']")
                or soup.select("a[href*='/property/']")
                or soup.select(".listing-card a")
                or soup.select(".property-card a")
                or soup.select("[class*='listing'] a[href]")
                or soup.select("[class*='property'] a[href]")
            )

            if not links:
                logger.info("fsbo.com: no links found with HTML selectors on page %d — trying __NEXT_DATA__", page)
                if soup.find("script", id="__NEXT_DATA__"):
                    return self._extract_urls_from_nextdata(soup)
                logger.info("fsbo.com: no __NEXT_DATA__ either — site may require JS rendering")
                return []

            seen = set()
            result = []
            for a in links:
                href = a.get("href", "")
                if href and href not in seen:
                    full = href if href.startswith("http") else urljoin(BASE_URL, href)
                    seen.add(href)
                    result.append(full)
            logger.debug("fsbo.com: found %d listing links on page %d", len(result), page)
            return result
        except Exception as e:
            logger.debug("fsbo.com search page %d failed: %s", page, e)
            return []

    def _extract_urls_from_nextdata(self, soup: BeautifulSoup) -> List[str]:
        """Extract listing URLs from Next.js __NEXT_DATA__ JSON if HTML is empty."""
        script = soup.find("script", id="__NEXT_DATA__")
        if not script:
            return []
        try:
            data = json.loads(script.string)
            urls: List[str] = []
            self._find_listing_urls_in_json(data, urls, 0)
            logger.info("fsbo.com: extracted %d listing URLs from __NEXT_DATA__", len(urls))
            return urls[:50]
        except Exception as e:
            logger.debug("fsbo.com __NEXT_DATA__ parse failed: %s", e)
            return []

    def _find_listing_urls_in_json(self, node, urls: list, depth: int) -> None:
        """Recursively search JSON for URLs containing '/listing/' or '/property/'."""
        if depth > 8:
            return
        if isinstance(node, str):
            if (node.startswith("/") or node.startswith("http")) and ("/listing/" in node or "/property/" in node) and len(node) < 300:
                full = node if node.startswith("http") else urljoin(BASE_URL, node)
                if full not in urls:
                    urls.append(full)
        elif isinstance(node, list):
            for item in node:
                self._find_listing_urls_in_json(item, urls, depth + 1)
        elif isinstance(node, dict):
            for val in node.values():
                self._find_listing_urls_in_json(val, urls, depth + 1)

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

        # Apply price filters
        if criteria.min_price and price is not None and price < criteria.min_price:
            return None
        if criteria.max_price and price is not None and price > criteria.max_price:
            return None

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

        # Apply beds/baths filters
        if criteria.min_beds and beds is not None and beds < criteria.min_beds:
            return None
        if criteria.min_baths and baths is not None and baths < criteria.min_baths:
            return None

        # DOM — look for "X days on market" pattern
        dom = None
        dom_el = soup.find(string=re.compile(r"days? on market", re.I))
        if dom_el:
            m = re.search(r"(\d+)", str(dom_el))
            if m:
                dom = int(m.group(1))
        if criteria.max_days_on_market and dom is not None and dom > criteria.max_days_on_market:
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
