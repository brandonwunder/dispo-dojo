"""DuckDuckGo search module using the duckduckgo_search library.

Replaces the old google_search.py which scraped DDG HTML directly.
The ddgs library provides a proper API with backend rotation and
structured results — much more reliable than raw HTML scraping.
"""

import asyncio
import logging
import random
import re

from ..models import AgentRow, ContactResult, ContactStatus
from .helpers import extract_phones, extract_emails

logger = logging.getLogger("agent_finder.searchers.ddg")

# Rate limiting
QUERY_DELAY = 3.0           # seconds between queries
JITTER_MAX = 2.0             # random extra delay
COOLDOWN_EVERY = 50          # take a longer break every N queries
COOLDOWN_SECONDS = 15.0      # longer break duration
RATE_LIMIT_BACKOFF = 30.0    # backoff on rate limit

# Backends to try in order (fallback if one gets rate-limited)
BACKENDS = ["auto", "html", "lite"]


def _build_query(agent: AgentRow) -> str:
    """Build a search query for an agent."""
    parts = [f'"{agent.name}"']
    if agent.brokerage:
        # Clean up brokerage name
        brokerage = agent.brokerage.strip()
        brokerage = re.sub(r',?\s*(llc|inc|corp|ltd)\.?$', '', brokerage, flags=re.IGNORECASE)
        parts.append(f'"{brokerage}"')
    parts.append("real estate agent phone email")
    if agent.state:
        parts.append(agent.state)
    return " ".join(parts)


def _score_email(email: str, agent_name: str) -> int:
    """Score an email by how likely it belongs to the agent."""
    score = 0
    local = email.split("@")[0].lower()
    name_parts = agent_name.lower().split()

    for part in name_parts:
        part = re.sub(r'[^a-z]', '', part)
        if len(part) >= 2 and part in local:
            score += 2

    # Penalize generic addresses
    generic = {"info", "contact", "admin", "support", "noreply", "no-reply",
               "help", "office", "sales", "team", "hello", "webmaster"}
    if any(g in local for g in generic):
        score -= 5

    # Penalize domains that are clearly not agent emails
    domain = email.split("@")[1].lower() if "@" in email else ""
    bad_domains = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com",
                   "aol.com", "icloud.com", "realtor.com", "move.com"}
    # Gmail/yahoo CAN be agent emails, so only a small penalty
    if domain in bad_domains:
        score -= 1

    return score


async def search_one(agent: AgentRow) -> ContactResult:
    """Search for a single agent's contact info via DuckDuckGo."""
    result = ContactResult(agent=agent, source="ddg_search")
    query = _build_query(agent)

    for backend in BACKENDS:
        try:
            loop = asyncio.get_event_loop()
            search_results = await loop.run_in_executor(
                None,
                lambda b=backend: _run_ddg_search(query, b),
            )

            if not search_results:
                continue

            # Combine all text from results
            combined = ""
            for r in search_results:
                combined += " " + r.get("body", "")
                combined += " " + r.get("title", "")
                combined += " " + r.get("href", "")

            phones = extract_phones(combined)
            emails = extract_emails(combined)

            if phones:
                result.phone = phones[0]

            if emails:
                scored = [(em, _score_email(em, agent.name)) for em in emails]
                scored.sort(key=lambda x: -x[1])
                if scored[0][1] >= 0:
                    result.email = scored[0][0]

            if result.has_contact:
                result.status = ContactStatus.FOUND
                return result

        except Exception as e:
            if "ratelimit" in str(e).lower():
                logger.warning("DDG rate limited on backend '%s', backing off", backend)
                await asyncio.sleep(RATE_LIMIT_BACKOFF)
            else:
                logger.debug("DDG backend '%s' failed for %s: %s", backend, agent.name, e)
            continue

    return result


def _run_ddg_search(query: str, backend: str) -> list[dict]:
    """Run a DDG search synchronously (called from executor)."""
    from ddgs import DDGS

    with DDGS(timeout=20) as ddgs:
        results = list(ddgs.text(
            query,
            backend=backend,
            max_results=8,
            region="us-en",
        ))
    return results


async def search_batch(
    agents: list[AgentRow],
    on_result=None,
) -> list[ContactResult]:
    """Search a batch of agents sequentially with rate limiting."""
    results: list[ContactResult] = []

    for i, agent in enumerate(agents):
        r = await search_one(agent)
        results.append(r)
        if on_result:
            on_result(r)

        # Rate limiting
        delay = QUERY_DELAY + random.uniform(0, JITTER_MAX)
        await asyncio.sleep(delay)

        # Longer cooldown every N queries
        if (i + 1) % COOLDOWN_EVERY == 0 and i + 1 < len(agents):
            logger.info("DDG cooldown after %d queries", i + 1)
            await asyncio.sleep(COOLDOWN_SECONDS)

    return results
