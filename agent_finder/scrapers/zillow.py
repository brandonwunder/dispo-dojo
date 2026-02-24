"""Zillow scraper - searches by address, parses __NEXT_DATA__ for agent attribution."""

import json
import logging
import re
from typing import Optional
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from ..config import ZILLOW
from ..models import AgentInfo, Property
from ..utils import get_rotating_headers, clean_name, clean_phone, clean_email, compute_days_on_market
from .base import BaseScraper

logger = logging.getLogger("agent_finder.scrapers.zillow")


class ZillowScraper(BaseScraper):
    """
    Scrapes Zillow property pages for listing agent information.

    Flow:
    1. Search Zillow for the address to find the detail page URL
    2. Fetch the property detail page
    3. Parse __NEXT_DATA__ → attributionInfo for agent data
    """

    def __init__(self, client: httpx.AsyncClient):
        super().__init__(ZILLOW, client)

    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """Search Zillow for a property's listing agent."""
        try:
            # Step 1: Search for the property
            detail_url = await self._search_property(prop)
            if not detail_url:
                return None

            # Step 2: Fetch and parse the detail page
            agent_info = await self._fetch_detail_page(detail_url)
            if agent_info:
                self._success_count += 1
            return agent_info

        except (httpx.HTTPStatusError, httpx.TimeoutException) as e:
            logger.info("Zillow failed for '%s': %s: %s",
                        prop.search_query, type(e).__name__, e)
            return None

    async def _search_property(self, prop: Property) -> Optional[str]:
        """Search Zillow to find a property's detail page URL."""
        query = prop.search_query
        search_url = f"https://www.zillow.com/homes/{quote_plus(query)}_rb/"

        headers = get_rotating_headers()
        headers["Referer"] = "https://www.zillow.com/"
        headers["Accept"] = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"

        response = await self._get(search_url, headers=headers)
        if response.status_code != 200:
            return None

        # Check if we landed on a detail page directly (redirect)
        final_url = str(response.url)
        if "/homedetails/" in final_url:
            return final_url

        # Parse search results for detail links
        soup = BeautifulSoup(response.text, "lxml")

        # Try __NEXT_DATA__ for search results
        script = soup.find("script", id="__NEXT_DATA__")
        if script:
            try:
                data = json.loads(script.string)
                results = (data.get("props", {}).get("pageProps", {})
                           .get("searchPageState", {}).get("cat1", {})
                           .get("searchResults", {}).get("listResults", []))
                if results:
                    detail_url = results[0].get("detailUrl", "")
                    if detail_url:
                        if detail_url.startswith("/"):
                            detail_url = f"https://www.zillow.com{detail_url}"
                        return detail_url
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        # Fallback: find links to /homedetails/
        links = soup.select('a[href*="/homedetails/"]')
        if links:
            href = links[0].get("href", "")
            if href.startswith("/"):
                href = f"https://www.zillow.com{href}"
            return href

        return None

    async def _fetch_detail_page(self, url: str) -> Optional[AgentInfo]:
        """Fetch a Zillow property page and extract agent info."""
        headers = get_rotating_headers()
        headers["Referer"] = "https://www.zillow.com/"

        response = await self._get(url, headers=headers)
        if response.status_code != 200:
            return None

        return self._parse_zillow_page(response.text, url)

    def _parse_zillow_page(self, html: str, listing_url: str) -> Optional[AgentInfo]:
        """Parse agent info from Zillow's page data."""
        soup = BeautifulSoup(html, "lxml")

        agent_name = ""
        brokerage = ""
        phone = ""
        email = ""

        # Try __NEXT_DATA__
        script = soup.find("script", id="__NEXT_DATA__")
        if script:
            try:
                data = json.loads(script.string)
                props = data.get("props", {}).get("pageProps", {})

                # Navigate to property data
                property_data = props.get("property", {}) or {}

                # If property data is nested inside gdpClientCache
                if not property_data.get("attributionInfo"):
                    gdp_cache = (props.get("componentProps", {})
                                 .get("gdpClientCache", {}))
                    if isinstance(gdp_cache, str):
                        try:
                            gdp_cache = json.loads(gdp_cache)
                        except json.JSONDecodeError:
                            gdp_cache = {}
                    if isinstance(gdp_cache, dict):
                        for key in gdp_cache:
                            nested = gdp_cache[key]
                            if isinstance(nested, dict) and "property" in nested:
                                property_data = nested["property"]
                                break

                # Path 1: attributionInfo (primary)
                attr = property_data.get("attributionInfo", {})
                if attr:
                    agent_name = attr.get("agentName", "") or ""
                    phone = attr.get("agentPhoneNumber", "") or ""
                    brokerage = attr.get("brokerName", "") or ""
                    if not phone:
                        phone = attr.get("brokerPhoneNumber", "") or ""

                # Path 2: listingAgent
                if not agent_name:
                    listing_agent = property_data.get("listingAgent", {})
                    if listing_agent:
                        agent_name = listing_agent.get("name", "") or ""
                        phone = listing_agent.get("phone", "") or phone

            except (json.JSONDecodeError, KeyError, TypeError, AttributeError):
                pass

        # Fallback: search all application/json script tags
        if not agent_name:
            for script_tag in soup.find_all("script", type="application/json"):
                try:
                    sdata = json.loads(script_tag.string or "")
                    found_name = self._deep_find(sdata, "agentName")
                    if found_name:
                        agent_name = found_name
                        phone = self._deep_find(sdata, "agentPhoneNumber") or ""
                        brokerage = self._deep_find(sdata, "brokerName") or ""
                        break
                except (json.JSONDecodeError, TypeError):
                    continue

        if not agent_name:
            return None

        # Extract list date and days on market from Zillow data
        list_date = ""
        days_on_market = ""
        if script:
            try:
                zdata = json.loads(script.string)
                zprop = (zdata.get("props", {}).get("pageProps", {})
                         .get("property", {})) or {}
                list_date = (zprop.get("datePosted", "")
                             or zprop.get("dateSold", "")
                             or "")
                dom_val = (zprop.get("daysOnZillow", "")
                           or zprop.get("timeOnZillow", "")
                           or "")
                if dom_val:
                    days_on_market = str(dom_val)
            except (json.JSONDecodeError, KeyError, TypeError, AttributeError):
                pass

        if not days_on_market and list_date:
            days_on_market = compute_days_on_market(list_date)

        # Extract listing price
        listing_price = ""
        if script:
            try:
                zdata = json.loads(script.string)
                zprop = (zdata.get("props", {}).get("pageProps", {})
                         .get("property", {})) or {}
                price_val = (
                    zprop.get("price")
                    or zprop.get("listingPrice")
                    or zprop.get("list_price")
                    or (property_data.get("price") if property_data else None)
                )
                if price_val:
                    try:
                        listing_price = f"${int(price_val):,}"
                    except (ValueError, TypeError):
                        listing_price = str(price_val)
            except (json.JSONDecodeError, KeyError, TypeError, AttributeError):
                pass

        return AgentInfo(
            agent_name=clean_name(agent_name),
            brokerage=brokerage.strip() if brokerage else "",
            phone=clean_phone(phone) if phone else "",
            email=clean_email(email) if email else "",
            source="zillow",
            listing_url=listing_url,
            list_date=list_date,
            days_on_market=days_on_market,
            listing_price=listing_price,
        )

    @staticmethod
    def _deep_find(obj, key: str, max_depth: int = 10):
        """Recursively search a nested dict/list for a key."""
        if max_depth <= 0:
            return None
        if isinstance(obj, dict):
            if key in obj and obj[key]:
                return obj[key]
            for v in obj.values():
                result = ZillowScraper._deep_find(v, key, max_depth - 1)
                if result:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = ZillowScraper._deep_find(item, key, max_depth - 1)
                if result:
                    return result
        return None
