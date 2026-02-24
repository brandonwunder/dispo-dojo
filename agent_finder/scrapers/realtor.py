"""Realtor.com direct scraper - Tertiary source, parses __NEXT_DATA__ JSON."""

import json
import logging
import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from ..config import REALTOR, REALTOR_BASE_URL
from ..models import AgentInfo, Property
from ..utils import (
    get_rotating_headers, clean_name, clean_phone, clean_email,
    normalize_state, compute_days_on_market,
)
from .base import BaseScraper

logger = logging.getLogger("agent_finder.scrapers.realtor")


class RealtorScraper(BaseScraper):
    """
    Scrapes Realtor.com property pages for agent information.

    Realtor.com embeds structured JSON data in a __NEXT_DATA__ script tag.
    This scraper constructs the property URL, fetches the page, and parses
    the embedded JSON for agent details.
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(REALTOR, client)

    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """Search Realtor.com for a property's listing agent."""
        try:
            # Try direct URL first (if we have enough address components)
            url = self._build_url(prop)
            agent_info = None
            if url:
                agent_info = await self._fetch_and_parse(url)

            # ALWAYS try search fallback if direct URL failed
            if not agent_info:
                agent_info = await self._search_and_parse(prop)

            if agent_info:
                self._success_count += 1
            return agent_info

        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            logger.info("Realtor.com failed for '%s': %s: %s",
                        prop.search_query, type(e).__name__, e)
            return None

    def _build_url(self, prop: Property) -> Optional[str]:
        """Build a Realtor.com property detail URL. Returns None only if address is empty."""
        address = prop.address_line or prop.raw_address
        city = prop.city
        state = normalize_state(prop.state)

        if not address:
            return None

        addr_slug = re.sub(r"[^a-zA-Z0-9]+", "-", address.strip()).strip("-")

        if city and state:
            city_slug = re.sub(r"[^a-zA-Z0-9]+", "-", city.strip()).strip("-")
            url = f"{REALTOR_BASE_URL}/realestateandhomes-detail/{addr_slug}_{city_slug}_{state}"
            if prop.zip_code:
                url += f"_{prop.zip_code}"
            return url

        # Partial: address + zip only
        if prop.zip_code:
            return f"{REALTOR_BASE_URL}/realestateandhomes-detail/{addr_slug}_{prop.zip_code}"

        return None  # Not enough info for direct URL, will use search fallback

    async def _fetch_and_parse(self, url: str) -> Optional[AgentInfo]:
        """Fetch a Realtor.com page and parse agent info from __NEXT_DATA__."""
        headers = get_rotating_headers()
        headers["Referer"] = REALTOR_BASE_URL

        response = await self._get(url, headers=headers)
        if response.status_code != 200:
            return None

        return self._parse_next_data(response.text)

    async def _search_and_parse(self, prop: Property) -> Optional[AgentInfo]:
        """Search Realtor.com and parse the first result."""
        query = prop.search_query
        # Clean up query for URL: remove special chars, replace spaces
        clean_query = re.sub(r"[^a-zA-Z0-9\s,-]", "", query)
        search_url = (
            f"{REALTOR_BASE_URL}/realestateandhomes-search/"
            f"{clean_query.replace(' ', '-').replace(',', '').replace('--', '-')}"
        )

        headers = get_rotating_headers()
        headers["Referer"] = REALTOR_BASE_URL

        try:
            response = await self._get(search_url, headers=headers)
            if response.status_code != 200:
                return None

            # Try to find property links in search results
            soup = BeautifulSoup(response.text, "lxml")
            links = soup.select('a[href*="/realestateandhomes-detail/"]')
            if not links:
                return None

            detail_url = links[0].get("href", "")
            if detail_url.startswith("/"):
                detail_url = f"{REALTOR_BASE_URL}{detail_url}"

            return await self._fetch_and_parse(detail_url)
        except Exception as e:
            logger.info("Realtor.com search fallback failed for '%s': %s: %s",
                        query, type(e).__name__, e)
            return None

    def _parse_next_data(self, html: str) -> Optional[AgentInfo]:
        """Parse agent info from Realtor.com's __NEXT_DATA__ JSON blob."""
        soup = BeautifulSoup(html, "lxml")
        script = soup.find("script", id="__NEXT_DATA__")
        if not script:
            return None

        try:
            data = json.loads(script.string)
        except (json.JSONDecodeError, TypeError):
            return None

        # Navigate the nested structure to find agent info
        try:
            props = data.get("props", {}).get("pageProps", {})

            # Try multiple known paths
            property_data = (
                props.get("property", {})
                or props.get("initialState", {}).get("propertyDetails", {}).get("propertyDetails", {})
                or {}
            )

            agent_name = ""
            brokerage = ""
            phone = ""
            email = ""

            # Path: property.listing
            listing = property_data.get("listing", {})

            # Agent info paths
            list_agent = listing.get("list_agent", {}) or {}
            list_office = listing.get("list_office", {}) or {}

            agent_name = list_agent.get("name", "") or list_agent.get("agent_name", "")
            phone = list_agent.get("phone", "") or list_agent.get("phones", [{}])[0].get("number", "") if isinstance(list_agent.get("phones"), list) and list_agent.get("phones") else ""
            email = list_agent.get("email", "")
            brokerage = list_office.get("name", "") or list_office.get("office_name", "")

            # Alternate path: property.branding
            if not agent_name:
                branding = property_data.get("branding", [])
                if isinstance(branding, list):
                    for brand in branding:
                        if brand.get("type") == "Agent":
                            agent_name = brand.get("name", "")
                        elif brand.get("type") == "Office":
                            brokerage = brand.get("name", "")
                        if brand.get("phone"):
                            phone = brand["phone"]

            if not agent_name:
                return None

            # Extract list date and days on market
            list_date = ""
            days_on_market = ""
            description = property_data.get("description", {}) or {}
            list_date = (listing.get("list_date", "")
                         or description.get("list_date", "")
                         or property_data.get("list_date", "")
                         or "")
            dom_val = (description.get("days_on_market", "")
                       or property_data.get("days_on_market", "")
                       or "")
            if dom_val:
                days_on_market = str(dom_val)
            elif list_date:
                days_on_market = compute_days_on_market(list_date)

            # Extract listing price
            listing_price = ""
            price_val = (
                listing.get("list_price")
                or description.get("list_price")
                or property_data.get("list_price")
                or property_data.get("price")
            )
            if price_val:
                try:
                    listing_price = f"${int(price_val):,}"
                except (ValueError, TypeError):
                    listing_price = str(price_val)

            return AgentInfo(
                agent_name=clean_name(agent_name),
                brokerage=brokerage.strip(),
                phone=clean_phone(phone),
                email=clean_email(email),
                source="realtor",
                listing_url="",
                list_date=list_date,
                days_on_market=days_on_market,
                listing_price=listing_price,
            )

        except (KeyError, IndexError, TypeError) as e:
            logger.info("Realtor.com __NEXT_DATA__ parsing failed: %s", e)
            return None
