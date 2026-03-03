"""Web search scraper — extract agent phone/email from DuckDuckGo search snippets.

Uses DuckDuckGo's HTML-only endpoint (html.duckduckgo.com/html/) which returns
actual readable text without requiring JavaScript execution. Google's main search
now requires JS rendering, making it unusable for simple HTTP scraping.
"""

import logging
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers, extract_phones, extract_emails
from ..models import AgentRow, ContactResult, ContactStatus

logger = logging.getLogger("agent_finder.searchers.search")


async def search_google(
    agent: AgentRow,
    client: httpx.AsyncClient,
) -> ContactResult:
    """Search DuckDuckGo for an agent's phone and email.

    Despite the function name (kept for pipeline compatibility), this uses
    DuckDuckGo's HTML endpoint which returns real text snippets.
    """
    result = ContactResult(agent=agent, source="search")

    # Build search query — include name, brokerage, and contact keywords
    parts = [agent.name]
    if agent.brokerage:
        parts.append(f'"{agent.brokerage}"')
    parts.append("real estate agent phone email")
    query = " ".join(parts)

    url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"

    try:
        headers = get_headers()

        # DuckDuckGo returns 202 when rate-limited — retry with backoff
        import asyncio
        resp = None
        for attempt in range(3):
            resp = await client.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                break
            if resp.status_code == 202:
                backoff = 5 * (attempt + 1)  # 5s, 10s, 15s
                logger.debug("DuckDuckGo 202 for %s — retry %d, waiting %ds", agent.name, attempt + 1, backoff)
                await asyncio.sleep(backoff)
                continue
            break

        if resp.status_code == 429:
            logger.warning("DuckDuckGo rate limited — backing off")
            result.status = ContactStatus.ERROR
            result.error_message = "Rate limited"
            return result

        if resp.status_code != 200:
            logger.warning("DuckDuckGo returned %d for %s", resp.status_code, agent.name)
            result.status = ContactStatus.ERROR
            result.error_message = f"HTTP {resp.status_code}"
            return result

        html = resp.text
        soup = BeautifulSoup(html, "lxml")

        # Extract text from search result snippets specifically
        # DuckDuckGo wraps results in .result__snippet and .result__title
        snippet_text = ""
        for el in soup.select(".result__snippet, .result__title, .result__url"):
            snippet_text += " " + el.get_text(separator=" ")

        # Fallback: if no DDG-specific elements found, use full page text
        if len(snippet_text.strip()) < 50:
            snippet_text = soup.get_text(separator=" ")

        phones = extract_phones(snippet_text)
        emails = extract_emails(snippet_text)

        # Deduplicate
        phones = list(dict.fromkeys(phones))
        emails = list(dict.fromkeys(emails))

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
            # Deprioritize generic emails
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
        logger.warning("Search timed out for %s", agent.name)
        result.status = ContactStatus.ERROR
        result.error_message = "Timeout"
    except Exception as e:
        logger.error("Search error for %s: %s", agent.name, e)
        result.status = ContactStatus.ERROR
        result.error_message = str(e)

    return result
