"""eXp Realty agent directory scraper.

Searches exprealty.com for agent contact info.
"""

from bs4 import BeautifulSoup

from .base import BaseBrokerageScraper
from ..models import AgentRow, ContactResult
from ..searchers.helpers import get_headers, extract_phones, extract_emails


class ExpRealtyBrokerageScraper(BaseBrokerageScraper):
    name = "exp_realty"
    base_url = "https://www.exprealty.com"
    rate_limit = 2.5
    max_concurrent = 2
    timeout = 15.0

    async def search(self, agent: AgentRow) -> ContactResult:
        headers = get_headers()

        name_parts = agent.name.lower().split()
        if len(name_parts) < 2:
            return self._make_result(agent)

        # eXp agent search
        search_url = f"{self.base_url}/agents/"
        params = {"search": agent.name}

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

        return self._make_result(agent)

    def _parse_page(self, html: str, agent_name: str) -> tuple[str, str]:
        soup = BeautifulSoup(html, "html.parser")

        phone = ""
        email = ""

        # tel: links
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
                    email = raw.lower()

        if not phone or not email:
            text = soup.get_text(separator=" ")
            if not phone:
                phones = extract_phones(text)
                if phones:
                    phone = phones[0]
            if not email:
                emails = extract_emails(text)
                for em in emails:
                    if "exprealty.com" not in em:
                        email = em
                        break

        return phone, email
