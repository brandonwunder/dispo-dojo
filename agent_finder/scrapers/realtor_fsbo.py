"""Realtor.com FSBO scraper — uses HomeHarvest library for area search."""

import asyncio
import logging
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
            results = await asyncio.to_thread(self._sync_search, criteria)
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
        if agent_name_raw and broker_raw and len(agent_name_raw) > 3 and len(broker_raw) > 3:
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

        if criteria.min_price is not None and price is not None and price < criteria.min_price:
            return None
        if criteria.max_price is not None and price is not None and price > criteria.max_price:
            return None

        beds_raw = safe(row.get("beds") or row.get("bedrooms", ""))
        baths_raw = safe(row.get("baths") or row.get("bathrooms", ""))
        beds = int(float(beds_raw)) if beds_raw else None
        baths = float(baths_raw) if baths_raw else None

        if criteria.min_beds is not None and beds is not None and beds < criteria.min_beds:
            return None
        if criteria.min_baths is not None and baths is not None and baths < criteria.min_baths:
            return None

        dom_raw = safe(row.get("days_on_market") or row.get("dom", ""))
        dom = int(float(dom_raw)) if dom_raw else None
        if criteria.max_days_on_market is not None and dom is not None and dom > criteria.max_days_on_market:
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
