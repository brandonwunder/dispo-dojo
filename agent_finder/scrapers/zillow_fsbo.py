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

    Uses Zillow's homes search with /fsbo/ URL path.
    Parses __NEXT_DATA__ JSON for listing results.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(ZILLOW_FSBO, client)

    async def search_area(self, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        if self.is_circuit_open:
            return []
        try:
            results = await self._search(criteria)
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

    def _find_list_results(self, data: dict) -> list:
        """
        Recursively search __NEXT_DATA__ JSON for a list of property objects.
        Zillow restructures this frequently — search for known keys rather than
        using a hardcoded path.
        """
        LIST_KEYS = {"listResults", "list_results", "searchResults", "mapResults"}

        def _search(node, depth=0):
            if depth > 8:
                return []
            if isinstance(node, list):
                if node and isinstance(node[0], dict) and (
                    "zpid" in node[0] or "address" in node[0] or "detailUrl" in node[0]
                ):
                    return node
                for item in node:
                    found = _search(item, depth + 1)
                    if found:
                        return found
            elif isinstance(node, dict):
                for key, val in node.items():
                    if key in LIST_KEYS and isinstance(val, list) and val:
                        logger.debug("zillow_fsbo: found listing array at key=%r len=%d", key, len(val))
                        return val
                for val in node.values():
                    found = _search(val, depth + 1)
                    if found:
                        return found
            return []

        return _search(data)

    def _parse_search_results(self, html: str, criteria: FSBOSearchCriteria) -> List[FSBOListing]:
        soup = BeautifulSoup(html, "lxml")
        results = []

        script = soup.find("script", id="__NEXT_DATA__")
        if not script:
            logger.info("zillow_fsbo: no __NEXT_DATA__ script found in response (len=%d)", len(html))
            return results

        try:
            data = json.loads(script.string)
            list_results = self._find_list_results(data)
            logger.info("zillow_fsbo: found %d raw items in listing array", len(list_results))

            for item in list_results:
                listing = self._item_to_listing(item, criteria)
                if listing:
                    results.append(listing)

            if not list_results:
                logger.info("zillow_fsbo: listing array empty — Zillow may be blocking or restructured JSON")

        except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
            logger.warning("zillow_fsbo parse failed: %s", e)

        return results

    def _item_to_listing(self, item: dict, criteria: FSBOSearchCriteria) -> Optional[FSBOListing]:
        address = item.get("address", "") or item.get("streetAddress", "")
        if not address:
            return None

        price_raw = item.get("price", "") or item.get("unformattedPrice", 0)
        price = None
        if price_raw:
            digits = re.sub(r"[^\d]", "", str(price_raw))
            price = int(digits) if digits else None

        if criteria.min_price is not None and price is not None and price < criteria.min_price:
            return None
        if criteria.max_price is not None and price is not None and price > criteria.max_price:
            return None

        beds = item.get("beds") or item.get("bedrooms")
        baths = item.get("baths") or item.get("bathrooms")
        if beds is not None:
            try:
                beds = int(beds)
            except (ValueError, TypeError):
                beds = None
        if baths is not None:
            try:
                baths = float(baths)
            except (ValueError, TypeError):
                baths = None

        if criteria.min_beds is not None and beds is not None and beds < criteria.min_beds:
            return None
        if criteria.min_baths is not None and baths is not None and baths < criteria.min_baths:
            return None

        dom = item.get("daysOnZillow") or item.get("timeOnZillow")
        if dom is not None:
            try:
                dom = int(dom)
            except (ValueError, TypeError):
                dom = None
        if criteria.max_days_on_market is not None and dom is not None and dom > criteria.max_days_on_market:
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
            source="zillow_fsbo",
            contact_status="none",
        )
        listing.contact_status = listing.compute_contact_status()
        return listing
