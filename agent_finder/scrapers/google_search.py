"""Google Custom Search API fallback - Last resort for finding listing agents."""

import re
from typing import Optional

import httpx

from ..config import GOOGLE_SEARCH, GOOGLE_CSE_URL
from ..models import AgentInfo, Property
from ..utils import get_api_headers, clean_name, clean_phone, clean_email
from .base import BaseScraper


class GoogleSearchScraper(BaseScraper):
    """
    Uses Google Custom Search API to find listing agent info.

    Requires a Google API key and Custom Search Engine ID.
    Free tier: 100 queries/day.
    """

    def __init__(self, client: httpx.AsyncClient,
                 api_key: str = "", cse_id: str = ""):
        super().__init__(GOOGLE_SEARCH, client)
        self.api_key = api_key
        self.cse_id = cse_id

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.cse_id)

    async def search(self, prop: Property) -> Optional[AgentInfo]:
        """Search Google for listing agent information."""
        if not self.is_configured:
            return None

        try:
            query = f'"{prop.search_query}" listing agent real estate'
            results = await self._google_search(query)

            if not results:
                return None

            agent_info = self._parse_results(results)
            if agent_info:
                self._success_count += 1
            return agent_info

        except (httpx.HTTPStatusError, httpx.TimeoutException):
            return None

    async def _google_search(self, query: str) -> Optional[list[dict]]:
        """Execute a Google Custom Search API query."""
        params = {
            "key": self.api_key,
            "cx": self.cse_id,
            "q": query,
            "num": 5,
        }

        headers = get_api_headers()
        response = await self._get(GOOGLE_CSE_URL, headers=headers, params=params)

        if response.status_code != 200:
            return None

        data = response.json()
        return data.get("items", [])

    def _parse_results(self, items: list[dict]) -> Optional[AgentInfo]:
        """Extract agent info from Google search result snippets."""
        agent_name = ""
        brokerage = ""
        phone = ""
        email = ""
        listing_url = ""

        for item in items:
            snippet = item.get("snippet", "")
            title = item.get("title", "")
            link = item.get("link", "")

            # Look for agent names in titles/snippets from real estate sites
            if any(site in link for site in ["redfin.com", "realtor.com", "zillow.com"]):
                listing_url = link

            # Try to extract phone numbers from snippets
            if not phone:
                phone_match = re.search(
                    r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", snippet
                )
                if phone_match:
                    phone = phone_match.group()

            # Try to extract email from snippets
            if not email:
                email_match = re.search(
                    r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", snippet
                )
                if email_match:
                    email = email_match.group()

            # Extract agent name patterns:
            # "Listed by John Smith" or "Listing Agent: John Smith"
            if not agent_name:
                name_patterns = [
                    r"[Ll]isted?\s+by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)",
                    r"[Ll]isting\s+[Aa]gent:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)",
                    r"[Aa]gent:?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)",
                ]
                for pattern in name_patterns:
                    match = re.search(pattern, snippet)
                    if match:
                        agent_name = match.group(1)
                        break

            # Extract brokerage
            if not brokerage:
                broker_patterns = [
                    r"(?:courtesy of|brokered by|offered by)\s+(.+?)(?:\.|,|$)",
                    r"([A-Z][a-zA-Z\s]+(?:Realty|Real Estate|Properties|Group|Associates|Brokers))",
                ]
                for pattern in broker_patterns:
                    match = re.search(pattern, snippet, re.IGNORECASE)
                    if match:
                        brokerage = match.group(1).strip()
                        break

        if not agent_name:
            return None

        return AgentInfo(
            agent_name=clean_name(agent_name),
            brokerage=brokerage.strip(),
            phone=clean_phone(phone),
            email=clean_email(email),
            source="google_search",
            listing_url=listing_url,
        )
