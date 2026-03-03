"""Generic brokerage website scraper.

For franchises that don't have a custom scraper, this tries common
agent directory URL patterns on the brokerage's website.
"""

import re

from bs4 import BeautifulSoup

from .base import BaseBrokerageScraper
from ..models import AgentRow, ContactResult
from ..searchers.helpers import get_headers, extract_phones, extract_emails

# Map franchise keys to their known website domains
FRANCHISE_DOMAINS: dict[str, str] = {
    "homesmart": "homesmart.com",
    "realty_one": "realtyonegroup.com",
    "exit_realty": "exitrealty.com",
    "howard_hanna": "howardhanna.com",
    "weichert": "weichert.com",
    "long_foster": "longandfoster.com",
    "sothebys": "sothebysrealty.com",
    "redfin": "redfin.com",
}

# Common agent directory paths to try on brokerage sites
AGENT_SEARCH_PATHS = [
    "/agents?q={name}",
    "/agents?search={name}",
    "/agents?name={name}",
    "/real-estate-agents?q={name}",
    "/roster/agents?search={name}",
    "/find-agent?q={name}",
    "/agent/search?q={name}",
]


class GenericBrokerageScraper(BaseBrokerageScraper):
    name = "generic"
    rate_limit = 3.0
    max_concurrent = 2
    timeout = 15.0

    def __init__(self, client, franchise_key: str = ""):
        super().__init__(client)
        self.franchise_key = franchise_key
        domain = FRANCHISE_DOMAINS.get(franchise_key, "")
        self.base_url = f"https://www.{domain}" if domain else ""

    async def search(self, agent: AgentRow) -> ContactResult:
        if not self.base_url:
            return self._make_result(agent)

        headers = get_headers()

        # Try common agent search paths
        for path_template in AGENT_SEARCH_PATHS:
            path = path_template.format(name=agent.name.replace(" ", "+"))
            url = self.base_url + path

            try:
                resp = await self.client.get(
                    url, headers=headers, timeout=self.timeout
                )
                if resp.status_code == 200:
                    phone, email = self._parse_page(resp.text, agent.name)
                    if phone or email:
                        return self._make_result(agent, phone, email)
            except Exception:
                continue

        return self._make_result(agent)

    def _parse_page(self, html: str, agent_name: str) -> tuple[str, str]:
        soup = BeautifulSoup(html, "html.parser")

        phone = ""
        email = ""

        # Look for tel: and mailto: links
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if href.startswith("tel:") and not phone:
                raw = href.replace("tel:", "").strip()
                phones = extract_phones(raw)
                if phones:
                    phone = phones[0]
            elif href.startswith("mailto:") and not email:
                raw = href.replace("mailto:", "").strip().split("?")[0]
                if "@" in raw:
                    local = raw.split("@")[0].lower()
                    skip = {"info", "contact", "admin", "support", "noreply", "help"}
                    if not any(s in local for s in skip):
                        email = raw.lower()

        # Fallback: text extraction
        if not phone or not email:
            text = soup.get_text(separator=" ")
            if not phone:
                phones = extract_phones(text)
                if phones:
                    phone = phones[0]
            if not email:
                agent_parts = agent_name.lower().split()
                all_emails = extract_emails(text)
                for em in all_emails:
                    local = em.split("@")[0]
                    if any(p in local for p in agent_parts):
                        email = em
                        break

        return phone, email
