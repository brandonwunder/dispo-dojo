"""Realtor.com agent profile scraper — fallback for agents not found via Google."""

import logging
import re

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers, extract_phones, extract_emails
from ..models import AgentRow, ContactResult, ContactStatus

logger = logging.getLogger("agent_finder.searchers.realtor")


def _slugify_name(name: str) -> str:
    cleaned = re.sub(r'\b(p\.?a\.?|jr\.?|sr\.?|iii?|iv)\b', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-zA-Z\s-]', '', cleaned).strip()
    return cleaned.replace(' ', '-')


async def search_realtor_profile(
    agent: AgentRow,
    client: httpx.AsyncClient,
    profile_url: str = "",
) -> ContactResult:
    result = ContactResult(agent=agent, source="realtor")

    try:
        headers = get_headers()
        headers["Referer"] = "https://www.realtor.com/"

        if profile_url and "realtor.com" in profile_url:
            url = profile_url
        else:
            slug = _slugify_name(agent.name)
            url = f"https://www.realtor.com/realestateagents/{slug}"

        resp = await client.get(url, headers=headers, timeout=15, follow_redirects=True)

        if resp.status_code != 200:
            result.status = ContactStatus.NOT_FOUND
            return result

        html = resp.text
        soup = BeautifulSoup(html, "lxml")
        page_text = soup.get_text(separator=" ")

        phones = extract_phones(page_text)
        emails = extract_emails(page_text)

        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if href.startswith("tel:"):
                phone_text = href.replace("tel:", "").replace("+1", "").strip()
                extracted = extract_phones(phone_text)
                if extracted:
                    phones = extracted + phones
            elif href.startswith("mailto:"):
                email = href.replace("mailto:", "").strip().lower()
                if email and "@" in email:
                    emails = [email] + emails

        if phones:
            result.phone = phones[0]
        if emails:
            agent_emails = [e for e in emails if "realtor.com" not in e and "move.com" not in e]
            if agent_emails:
                result.email = agent_emails[0]

        if result.has_contact:
            result.status = ContactStatus.FOUND
        else:
            result.status = ContactStatus.NOT_FOUND

    except httpx.TimeoutException:
        result.status = ContactStatus.ERROR
        result.error_message = "Timeout"
    except Exception as e:
        logger.error("Realtor profile error for %s: %s", agent.name, e)
        result.status = ContactStatus.ERROR
        result.error_message = str(e)

    return result
