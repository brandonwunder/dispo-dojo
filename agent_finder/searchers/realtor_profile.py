"""Realtor.com agent profile scraper.

Searches by agent name + location instead of guessing URL slugs.
Extracts phone/email from profile pages.
"""

import asyncio
import logging
import re

import httpx
from bs4 import BeautifulSoup

from ..models import AgentRow, ContactResult, ContactStatus
from .helpers import get_headers, extract_phones, extract_emails

logger = logging.getLogger("agent_finder.searchers.realtor")

RATE_LIMIT = 2.5
MAX_CONCURRENT = 2
TIMEOUT = 15.0


def _slugify(text: str) -> str:
    """Convert text to URL slug."""
    cleaned = re.sub(r'\b(p\.?a\.?|jr\.?|sr\.?|iii?|iv|ii)\b', '', text, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-zA-Z\s-]', '', cleaned).strip()
    return cleaned.lower().replace(' ', '-')


async def search_realtor(
    agent: AgentRow,
    client: httpx.AsyncClient,
) -> ContactResult:
    """Search Realtor.com for an agent's profile."""
    result = ContactResult(agent=agent, source="realtor")
    headers = get_headers()

    name_slug = _slugify(agent.name)
    if not name_slug:
        return result

    # Strategy 1: Name + city + state URL pattern
    if agent.city and agent.state:
        city_slug = _slugify(agent.city)
        state = agent.state.strip().upper()[:2]
        url = f"https://www.realtor.com/realestateagents/{name_slug}_{city_slug}_{state}"
        phone, email = await _fetch_and_parse(client, url, headers, agent.name)
        if phone or email:
            result.phone = phone
            result.email = email
            result.status = ContactStatus.FOUND
            return result

    # Strategy 2: Name-only URL pattern
    url = f"https://www.realtor.com/realestateagents/{name_slug}"
    phone, email = await _fetch_and_parse(client, url, headers, agent.name)
    if phone or email:
        result.phone = phone
        result.email = email
        result.status = ContactStatus.FOUND
        return result

    return result


async def _fetch_and_parse(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    agent_name: str,
) -> tuple[str, str]:
    """Fetch a URL and parse for phone/email."""
    try:
        resp = await client.get(url, headers=headers, timeout=TIMEOUT)
        if resp.status_code != 200:
            return "", ""
        return _parse_profile(resp.text, agent_name)
    except Exception as e:
        logger.debug("Realtor fetch failed for %s: %s", url, e)
        return "", ""


def _parse_profile(html: str, agent_name: str) -> tuple[str, str]:
    """Parse a realtor.com profile page for phone/email."""
    soup = BeautifulSoup(html, "html.parser")

    phone = ""
    email = ""

    # Priority: tel: and mailto: links
    for link in soup.find_all("a", href=True):
        href = link["href"]
        if href.startswith("tel:") and not phone:
            raw = href.replace("tel:", "").replace("+1", "").strip()
            phones = extract_phones(raw)
            if phones:
                phone = phones[0]
        elif href.startswith("mailto:") and not email:
            raw = href.replace("mailto:", "").strip().split("?")[0].lower()
            if "@" in raw and "realtor.com" not in raw and "move.com" not in raw:
                email = raw

    # Fallback: full page text
    if not phone or not email:
        text = soup.get_text(separator=" ")
        if not phone:
            phones = extract_phones(text)
            if phones:
                phone = phones[0]
        if not email:
            all_emails = extract_emails(text)
            skip_domains = {"realtor.com", "move.com"}
            for em in all_emails:
                domain = em.split("@")[1] if "@" in em else ""
                if domain not in skip_domains:
                    email = em
                    break

    return phone, email


async def search_batch(
    agents: list[AgentRow],
    client: httpx.AsyncClient,
    on_result=None,
) -> list[ContactResult]:
    """Search a batch of agents on Realtor.com."""
    results: list[ContactResult] = []
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    for batch_start in range(0, len(agents), MAX_CONCURRENT):
        batch = agents[batch_start : batch_start + MAX_CONCURRENT]

        async def _search(a: AgentRow) -> ContactResult:
            async with semaphore:
                try:
                    return await asyncio.wait_for(
                        search_realtor(a, client), timeout=30.0
                    )
                except asyncio.TimeoutError:
                    return ContactResult(agent=a, source="realtor")
                except Exception:
                    return ContactResult(agent=a, source="realtor")

        batch_results = await asyncio.gather(*[_search(a) for a in batch])

        for r in batch_results:
            results.append(r)
            if on_result:
                on_result(r)

        if batch_start + MAX_CONCURRENT < len(agents):
            await asyncio.sleep(RATE_LIMIT)

    return results
