"""Keller Williams agent directory scraper.

KW has a searchable directory at kw.com. We search by agent name
and parse the results for phone/email.
"""

from bs4 import BeautifulSoup

from .base import BaseBrokerageScraper
from ..models import AgentRow, ContactResult
from ..searchers.helpers import get_headers, extract_phones, extract_emails


class KWBrokerageScraper(BaseBrokerageScraper):
    name = "kw"
    base_url = "https://www.kw.com"
    rate_limit = 2.0
    max_concurrent = 2
    timeout = 15.0

    async def search(self, agent: AgentRow) -> ContactResult:
        # Try the agent search page
        headers = get_headers()
        headers["Referer"] = self.base_url

        # Search URL pattern
        name_parts = agent.name.lower().split()
        if len(name_parts) < 2:
            return self._make_result(agent)

        # Try direct search
        search_url = f"{self.base_url}/agent/search"
        params = {"q": agent.name}

        try:
            resp = await self.client.get(
                search_url, params=params, headers=headers, timeout=self.timeout
            )
            if resp.status_code == 200:
                phone, email = self._parse_page(resp.text, agent.name)
                if phone or email:
                    return self._make_result(agent, phone, email)
        except Exception:
            pass

        # Try slug-based profile URL
        slug = "-".join(name_parts)
        profile_url = f"{self.base_url}/agent/{slug}"
        try:
            resp = await self.client.get(
                profile_url, headers=headers, timeout=self.timeout
            )
            if resp.status_code == 200:
                phone, email = self._parse_page(resp.text, agent.name)
                if phone or email:
                    return self._make_result(agent, phone, email)
        except Exception:
            pass

        return self._make_result(agent)

    def _parse_page(self, html: str, agent_name: str) -> tuple[str, str]:
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(separator=" ")

        phones = extract_phones(text)
        emails = extract_emails(text)

        # Filter emails — skip generic ones
        agent_parts = agent_name.lower().split()
        best_email = ""
        for em in emails:
            local = em.split("@")[0]
            if any(p in local for p in agent_parts):
                best_email = em
                break
        if not best_email and emails:
            skip = {"info", "contact", "admin", "support", "noreply", "help"}
            for em in emails:
                local = em.split("@")[0]
                if not any(s in local for s in skip):
                    best_email = em
                    break

        phone = phones[0] if phones else ""
        return phone, best_email
