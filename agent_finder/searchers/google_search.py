"""Google search scraper — extract agent phone/email from search snippets."""

import logging
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers, extract_phones, extract_emails, random_delay
from ..models import AgentRow, ContactResult, ContactStatus

logger = logging.getLogger("agent_finder.searchers.google")


async def search_google(
    agent: AgentRow,
    client: httpx.AsyncClient,
) -> ContactResult:
    """Search Google for an agent's phone and email."""
    result = ContactResult(agent=agent, source="google")

    name_q = f'"{agent.name}"'
    broker_q = f'"{agent.brokerage}"' if agent.brokerage else ""
    query = f'{name_q} {broker_q} real estate agent phone email'.strip()
    url = f"https://www.google.com/search?q={quote_plus(query)}&num=10"

    try:
        headers = get_headers()
        resp = await client.get(url, headers=headers, timeout=15)

        if resp.status_code == 429:
            logger.warning("Google rate limited — backing off")
            result.status = ContactStatus.ERROR
            result.error_message = "Rate limited by Google"
            return result

        if resp.status_code != 200:
            logger.warning("Google returned %d for %s", resp.status_code, agent.name)
            result.status = ContactStatus.ERROR
            result.error_message = f"HTTP {resp.status_code}"
            return result

        html = resp.text
        soup = BeautifulSoup(html, "lxml")
        snippet_text = soup.get_text(separator=" ")

        phones = extract_phones(snippet_text)
        emails = extract_emails(snippet_text)

        # Score emails — prefer ones containing agent name parts
        agent_first = agent.name.split()[0].lower() if agent.name else ""
        agent_last = agent.name.split()[-1].lower() if agent.name else ""

        scored_emails = []
        for email in emails:
            score = 0
            local = email.split("@")[0].lower()
            if agent_first and agent_first in local:
                score += 2
            if agent_last and agent_last in local:
                score += 2
            if any(x in local for x in ["info", "contact", "admin", "support", "noreply", "no-reply"]):
                score -= 3
            scored_emails.append((score, email))

        scored_emails.sort(key=lambda x: x[0], reverse=True)

        if phones:
            result.phone = phones[0]
        if scored_emails and scored_emails[0][0] >= 0:
            result.email = scored_emails[0][1]

        if result.has_contact:
            result.status = ContactStatus.FOUND
        else:
            result.status = ContactStatus.NOT_FOUND

        # Collect Realtor.com profile URLs for fallback
        profile_urls = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if "realtor.com/realestateagents/" in href:
                profile_urls.append(href)

        if profile_urls and not result.has_contact:
            result.error_message = f"realtor_url:{profile_urls[0]}"

    except httpx.TimeoutException:
        logger.warning("Google search timed out for %s", agent.name)
        result.status = ContactStatus.ERROR
        result.error_message = "Timeout"
    except Exception as e:
        logger.error("Google search error for %s: %s", agent.name, e)
        result.status = ContactStatus.ERROR
        result.error_message = str(e)

    return result
