"""Redfin Stingray API scraper - Primary source for listing agent data."""

import json
import logging
import re
from typing import Optional
from urllib.parse import quote

import httpx

from ..config import REDFIN, REDFIN_BASE_URL, REDFIN_STINGRAY_BASE
from ..models import AgentInfo, Property
from ..utils import get_api_headers, clean_name, clean_phone, compute_days_on_market, STREET_SUFFIXES
from .base import BaseScraper

logger = logging.getLogger("agent_finder.scrapers.redfin")

# Reverse map: abbreviation -> full name (for trying alternate queries)
_SUFFIX_REVERSE = {v: k.title() for k, v in STREET_SUFFIXES.items()}


class RedfinScraper(BaseScraper):
    """
    Scrapes Redfin's undocumented Stingray API for listing agent information.

    Pipeline:
    1. Search for the property via autocomplete → get URL path
    2. Get propertyId + listingId via initialInfo endpoint
    3. Get agent details via belowTheFold endpoint
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(REDFIN, client)

    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """Search Redfin for a property's listing agent, with fallback queries."""
        queries = self._build_query_variants(prop)

        for query in queries:
            try:
                url_path = await self._search_property(query)
                if not url_path:
                    continue

                property_id, listing_id = await self._get_ids(url_path)
                if not property_id:
                    continue

                agent_info = await self._get_agent_details(property_id, listing_id, url_path)
                if agent_info:
                    self._success_count += 1
                    return agent_info

            except (httpx.HTTPStatusError, httpx.TimeoutException, json.JSONDecodeError) as e:
                logger.info("Redfin failed for query '%s': %s: %s", query, type(e).__name__, e)
                continue

        return None

    def _build_query_variants(self, prop: Property) -> list[str]:
        """Build query variants to try against Redfin autocomplete."""
        variants = [prop.search_query]  # Original (normalized) first

        addr = prop.address_line or prop.raw_address

        # Variant: Strip unit/apt number
        stripped = re.sub(
            r"\s*(APT|APARTMENT|STE|SUITE|UNIT|BLDG|#)\s*\S+",
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
            variant = ", ".join(parts)
            if variant not in variants:
                variants.append(variant)

        # Variant: Swap abbreviated suffix for full name (or vice versa)
        addr_upper = addr.upper()
        for abbr, full in _SUFFIX_REVERSE.items():
            if f" {abbr} " in addr_upper or addr_upper.endswith(f" {abbr}"):
                alt = re.sub(rf"\b{abbr}\b", full, addr, flags=re.IGNORECASE)
                if alt != addr:
                    full_q = ", ".join(
                        p for p in [alt, prop.city, prop.state, prop.zip_code] if p
                    )
                    if full_q not in variants:
                        variants.append(full_q)
                break  # Only try one suffix swap

        return variants[:3]  # Max 3 variants

    async def _search_property(self, query: str) -> Optional[str]:
        """Use Redfin autocomplete to find a property URL path."""
        url = f"{REDFIN_STINGRAY_BASE}/do/location-autocomplete"
        params = {
            "location": query,
            "start": "0",
            "count": "5",
            "v": "2",
            "al": "1",
            "iss": "false",
            "ooa": "true",
            "mrs": "false",
        }
        headers = get_api_headers()
        headers["Referer"] = REDFIN_BASE_URL

        response = await self._get(url, headers=headers, params=params)
        if response.status_code != 200:
            return None

        # Redfin returns "{}&&{...}" format - strip the prefix
        text = response.text
        if text.startswith("{}&&"):
            text = text[4:]

        data = json.loads(text)
        results = data.get("payload", {}).get("exactMatch", {})

        if results and results.get("url"):
            return results["url"]

        # Fall back to sections search
        sections = data.get("payload", {}).get("sections", [])
        for section in sections:
            rows = section.get("rows", [])
            for row in rows:
                if row.get("type") == "1" and row.get("url"):  # type 1 = address
                    return row["url"]

        return None

    async def _get_ids(self, url_path: str) -> tuple[Optional[str], Optional[str]]:
        """Get propertyId and listingId from the initialInfo endpoint."""
        url = f"{REDFIN_STINGRAY_BASE}/api/home/details/initialInfo"
        params = {"path": url_path}
        headers = get_api_headers()
        headers["Referer"] = f"{REDFIN_BASE_URL}{url_path}"

        response = await self._get(url, headers=headers, params=params)
        if response.status_code != 200:
            return None, None

        text = response.text
        if text.startswith("{}&&"):
            text = text[4:]

        data = json.loads(text)
        payload = data.get("payload", {})
        property_id = payload.get("propertyId")
        listing_id = payload.get("listingId")

        return str(property_id) if property_id else None, str(listing_id) if listing_id else None

    async def _get_agent_details(self, property_id: str,
                                  listing_id: Optional[str],
                                  url_path: str = "") -> Optional[AgentInfo]:
        """Get agent details from the belowTheFold endpoint."""
        url = f"{REDFIN_STINGRAY_BASE}/api/home/details/belowTheFold"
        params = {"propertyId": property_id}
        if listing_id:
            params["listingId"] = listing_id

        headers = get_api_headers()
        headers["Referer"] = REDFIN_BASE_URL

        response = await self._get(url, headers=headers, params=params)
        if response.status_code != 200:
            return None

        text = response.text
        if text.startswith("{}&&"):
            text = text[4:]

        data = json.loads(text)
        payload = data.get("payload", {})

        agent_info = self._extract_agent_from_payload(payload, url_path)
        return agent_info

    def _extract_agent_from_payload(self, payload: dict,
                                     url_path: str = "") -> Optional[AgentInfo]:
        """Extract agent info from Redfin's belowTheFold payload — checks all known paths."""
        agent_name = ""
        brokerage = ""
        phone = ""
        list_date = ""
        days_on_market = ""
        listing_price = ""

        # Path 1: listingBroker section (most common for active listings)
        broker_info = payload.get("listingBroker", {})
        if broker_info:
            agent_name = broker_info.get("listingAgentName", "")
            brokerage = (broker_info.get("brokerName", "")
                         or broker_info.get("listingBrokerName", ""))
            phone = (broker_info.get("listingAgentPhone", "")
                     or broker_info.get("brokerPhone", ""))
            list_date = broker_info.get("listingDate", "") or ""

        # Path 2: propertyHistoryInfo → events
        if not agent_name:
            history = payload.get("propertyHistoryInfo", {})
            events = history.get("events", [])
            for event in events:
                if event.get("eventType") in ("Listed", "listed", "Listing"):
                    agent_name = event.get("listingAgentName", "")
                    brokerage = event.get("listingBrokerName", "")
                    if not list_date:
                        list_date = event.get("eventDate", "") or ""
                    break

        # Extract DOM from propertyHistoryInfo even if agent was found elsewhere
        if not list_date:
            history = payload.get("propertyHistoryInfo", {})
            for event in history.get("events", []):
                if event.get("eventType") in ("Listed", "listed", "Listing"):
                    list_date = event.get("eventDate", "") or ""
                    break

        # Path 3: mainHouseInfo
        if not agent_name:
            main_info = payload.get("mainHouseInfo", {})
            agent_name = main_info.get("listingAgentName", "")
            brokerage = main_info.get("listingBrokerName", "")

        # Try mainHouseInfo for DOM data
        main_info = payload.get("mainHouseInfo", {})
        if not days_on_market:
            dom_val = main_info.get("daysOnMarket", "") or main_info.get("timeOnRedfin", "")
            if dom_val:
                days_on_market = str(dom_val)

        # Path 4: publicRecordsInfo
        if not agent_name:
            pr_info = payload.get("publicRecordsInfo", {})
            agent_name = pr_info.get("listingAgentName", "")
            brokerage = pr_info.get("listingBrokerName", "")

        # Path 5: aboveTheFoldInfo
        if not agent_name:
            atf = payload.get("aboveTheFoldInfo", {})
            agent_name = atf.get("listingAgentName", "")
            brokerage = atf.get("listingBrokerName", "")
            if not agent_name:
                atf_broker = atf.get("listingBroker", {})
                if atf_broker:
                    agent_name = atf_broker.get("listingAgentName", "")
                    brokerage = atf_broker.get("brokerName", "")

        # Path 6: root-level listingAgent
        if not agent_name:
            listing_agent = payload.get("listingAgent", {})
            if listing_agent:
                agent_name = (listing_agent.get("name", "")
                              or listing_agent.get("agentName", ""))
                phone = listing_agent.get("phone", "") or phone
                brokerage = listing_agent.get("officeName", "") or brokerage

        if not agent_name:
            return None

        # Compute DOM from list_date if not directly available
        if not days_on_market and list_date:
            days_on_market = compute_days_on_market(list_date)

        # Extract listing price
        main_info = payload.get("mainHouseInfo", {})
        price_val = (
            payload.get("listingPrice")
            or payload.get("price")
            or main_info.get("listingPrice")
            or main_info.get("price")
            or payload.get("aboveTheFoldInfo", {}).get("price")
            or payload.get("aboveTheFoldInfo", {}).get("listingPrice")
        )
        if price_val:
            try:
                listing_price = f"${int(price_val):,}"
            except (ValueError, TypeError):
                listing_price = str(price_val)

        listing_url = f"{REDFIN_BASE_URL}{url_path}" if url_path else ""

        return AgentInfo(
            agent_name=clean_name(agent_name),
            brokerage=brokerage.strip(),
            phone=clean_phone(phone),
            email="",
            source="redfin",
            listing_url=listing_url,
            list_date=list_date,
            days_on_market=days_on_market,
            listing_price=listing_price,
        )
