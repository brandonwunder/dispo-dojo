"""ForSaleByOwner.com scraper — secondary dedicated FSBO site."""

import json
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
            logger.debug("forsalebyowner.com page %d: status=%d url=%s len=%d",
                         page, resp.status_code, search_url, len(resp.text))
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, "lxml")

            links = (
                soup.select("a[href*='/homes/']")
                or soup.select("a[href*='/listing/']")
                or soup.select(".property-card a")
                or soup.select(".listing-card a")
                or soup.select("[class*='property'] a[href]")
                or soup.select("[class*='listing'] a[href]")
                or soup.select("h2 a")
                or soup.select("h3 a")
            )

            if not links:
                logger.info("forsalebyowner.com: no links found on page %d — trying __NEXT_DATA__", page)
                if soup.find("script", id="__NEXT_DATA__"):
                    return self._extract_urls_from_nextdata(soup)
                return []

            seen = set()
            result = []
            for a in links:
                href = a.get("href", "")
                if href and href not in seen:
                    full = href if href.startswith("http") else urljoin(BASE_URL, href)
                    seen.add(href)
                    result.append(full)
            logger.debug("forsalebyowner.com: found %d listing links on page %d", len(result), page)
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

    def _extract_urls_from_nextdata(self, soup: BeautifulSoup) -> List[str]:
        """Extract listing URLs from Next.js __NEXT_DATA__ JSON."""
        script = soup.find("script", id="__NEXT_DATA__")
        if not script:
            return []
        try:
            data = json.loads(script.string)
            urls: List[str] = []
            self._find_listing_urls_in_json(data, urls, 0)
            logger.info("forsalebyowner.com: extracted %d URLs from __NEXT_DATA__", len(urls))
            return urls[:50]
        except Exception as e:
            logger.debug("forsalebyowner.com __NEXT_DATA__ parse failed: %s", e)
            return []

    def _find_listing_urls_in_json(self, node, urls: list, depth: int) -> None:
        if depth > 8:
            return
        if isinstance(node, str):
            if "/homes/" in node and node.startswith("/") and len(node) < 300:
                full = urljoin(BASE_URL, node)
                if full not in urls:
                    urls.append(full)
        elif isinstance(node, list):
            for item in node:
                self._find_listing_urls_in_json(item, urls, depth + 1)
        elif isinstance(node, dict):
            for val in node.values():
                self._find_listing_urls_in_json(val, urls, depth + 1)

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

        if criteria.min_price is not None and price is not None and price < criteria.min_price:
            return None
        if criteria.max_price is not None and price is not None and price > criteria.max_price:
            return None

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

        if criteria.min_beds is not None and beds is not None and beds < criteria.min_beds:
            return None
        if criteria.min_baths is not None and baths is not None and baths < criteria.min_baths:
            return None
        if criteria.max_days_on_market is not None and dom is not None and dom > criteria.max_days_on_market:
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
            owner_name=owner_name, phone=phone or None, email=email or None,
            listing_url=url, source="forsalebyowner.com",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
