"""Contact enrichment - finds phone/email when only agent name + brokerage are known."""

import re
from typing import Optional

import httpx
from bs4 import BeautifulSoup

from .models import AgentInfo
from .utils import get_rotating_headers, clean_phone, clean_email


async def enrich_contact_info(agent_info: AgentInfo,
                               client: httpx.AsyncClient) -> AgentInfo:
    """
    Attempt to fill in missing phone/email for an agent.

    Strategies:
    1. Search for agent on their brokerage website
    2. Try common email patterns
    """
    if agent_info.is_complete:
        return agent_info

    enriched = AgentInfo(
        agent_name=agent_info.agent_name,
        brokerage=agent_info.brokerage,
        phone=agent_info.phone,
        email=agent_info.email,
        source=agent_info.source,
        listing_url=agent_info.listing_url,
    )

    # Strategy 1: Search brokerage website for agent profile
    if agent_info.brokerage and (not agent_info.phone or not agent_info.email):
        profile_info = await _search_brokerage_site(
            agent_info.agent_name, agent_info.brokerage, client
        )
        if profile_info:
            if not enriched.phone and profile_info.get("phone"):
                enriched.phone = clean_phone(profile_info["phone"])
            if not enriched.email and profile_info.get("email"):
                enriched.email = clean_email(profile_info["email"])

    # Strategy 2: Guess email from common patterns
    if not enriched.email and agent_info.brokerage:
        guessed = _guess_email(agent_info.agent_name, agent_info.brokerage)
        if guessed:
            enriched.email = guessed

    if enriched.phone or enriched.email:
        enriched.source = f"{agent_info.source}+enriched"

    return enriched


async def _search_brokerage_site(agent_name: str, brokerage: str,
                                  client: httpx.AsyncClient) -> Optional[dict]:
    """
    Search for an agent's profile on a brokerage website.

    Uses a simple heuristic: Google search for agent + brokerage,
    then try to parse the first result page for contact info.
    """
    try:
        # Build a search-friendly brokerage domain guess
        brokerage_clean = re.sub(r"[^a-zA-Z0-9\s]", "", brokerage).strip()
        query = f"{agent_name} {brokerage_clean} real estate agent phone email"

        # We can't use Google CSE here without a key, so we try to scrape
        # common brokerage site patterns directly

        # Try common national brokerage agent search URLs
        national_brokerages = {
            "keller williams": "https://www.kw.com/agent/search?q=",
            "coldwell banker": "https://www.coldwellbanker.com/agent/search?q=",
            "re/max": "https://www.remax.com/real-estate-agents/search?q=",
            "century 21": "https://www.century21.com/real-estate-agents/search?q=",
            "compass": "https://www.compass.com/agents/?q=",
            "sotheby": "https://www.sothebysrealty.com/eng/associates?q=",
            "exp realty": "https://www.exprealty.com/agents.html?search=",
            "berkshire hathaway": "https://www.bhhs.com/agent-search?q=",
        }

        brokerage_lower = brokerage.lower()
        for broker_key, search_url in national_brokerages.items():
            if broker_key in brokerage_lower:
                agent_query = agent_name.replace(" ", "+")
                url = f"{search_url}{agent_query}"
                try:
                    headers = get_rotating_headers()
                    response = await client.get(
                        url, headers=headers, timeout=15.0, follow_redirects=True
                    )
                    if response.status_code == 200:
                        return _extract_contact_from_html(response.text)
                except Exception:
                    pass
                break

        return None

    except Exception:
        return None


def _extract_contact_from_html(html: str) -> Optional[dict]:
    """Extract phone and email from an HTML page using common patterns."""
    result = {}

    # Find phone numbers
    phone_pattern = r"\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
    phones = re.findall(phone_pattern, html)
    if phones:
        result["phone"] = phones[0]

    # Find emails
    email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
    emails = re.findall(email_pattern, html)
    # Filter out common non-agent emails
    skip_emails = {"info@", "support@", "admin@", "webmaster@", "noreply@", "contact@"}
    for email in emails:
        if not any(email.lower().startswith(skip) for skip in skip_emails):
            result["email"] = email
            break

    return result if result else None


def _guess_email(agent_name: str, brokerage: str) -> str:
    """
    Guess an agent's email based on common brokerage email patterns.

    This is a best-effort heuristic. The email should be verified
    before being used for outreach.
    """
    if not agent_name or not brokerage:
        return ""

    parts = agent_name.lower().split()
    if len(parts) < 2:
        return ""

    first = re.sub(r"[^a-z]", "", parts[0])
    last = re.sub(r"[^a-z]", "", parts[-1])

    if not first or not last:
        return ""

    # Map known brokerages to their email domains
    brokerage_domains = {
        "keller williams": "kw.com",
        "coldwell banker": "cbexchange.com",
        "re/max": "remax.net",
        "century 21": "century21.com",
        "compass": "compass.com",
        "sotheby": "sothebysrealty.com",
        "exp realty": "exprealty.com",
        "berkshire hathaway": "bhhsmail.com",
        "douglas elliman": "elliman.com",
    }

    brokerage_lower = brokerage.lower()
    domain = None
    for broker_key, broker_domain in brokerage_domains.items():
        if broker_key in brokerage_lower:
            domain = broker_domain
            break

    if not domain:
        return ""

    # Most common pattern: first.last@domain
    return f"{first}.{last}@{domain}"
