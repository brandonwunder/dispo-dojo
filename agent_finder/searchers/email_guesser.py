"""Email pattern guessing + MX validation.

For agents where we have a phone but no email, guess common email
patterns from name + brokerage domain and validate via MX records.

Expanded from 14 to 60+ brokerage domains. Uses dnspython for
proper MX record validation.
"""

import asyncio
import logging
import re

from ..models import AgentRow

logger = logging.getLogger("agent_finder.searchers.email_guesser")

# Expanded brokerage domain database (60+ entries)
KNOWN_DOMAINS: dict[str, list[str]] = {
    # Tier 1: Top franchises by volume
    "keller williams": ["kw.com"],
    "kw ": ["kw.com"],
    "re/max": ["remax.com"],
    "remax": ["remax.com"],
    "re max": ["remax.com"],
    "coldwell banker": ["coldwellbanker.com", "cbexchange.com"],
    "coldwell": ["coldwellbanker.com"],
    "compass": ["compass.com"],
    "exp realty": ["exprealty.com"],
    "exprealty": ["exprealty.com"],
    "century 21": ["century21.com"],
    "century21": ["century21.com"],
    "berkshire hathaway": ["bhhsres.com"],
    "bhhs": ["bhhsres.com"],
    "redfin": ["redfin.com"],

    # Tier 2: Medium franchises
    "sotheby": ["sothebysrealty.com"],
    "howard hanna": ["howardhanna.com"],
    "weichert": ["weichert.com"],
    "long & foster": ["longandfoster.com"],
    "long and foster": ["longandfoster.com"],
    "homesmart": ["hsmove.com"],
    "exit realty": ["exitrealty.com"],
    "exit real estate": ["exitrealty.com"],
    "real broker": ["realbroker.com"],
    "the real brokerage": ["realbroker.com"],
    "realty one group": ["realtyonegroup.com"],
    "realty one": ["realtyonegroup.com"],
    "samson properties": ["samsonproperties.net"],
    "douglas elliman": ["elliman.com"],
    "united real estate": ["unitedrealestate.com"],
    "windermere": ["windermere.com"],
    "better homes": ["bhgre.com"],

    # Tier 3: Regional / other
    "allen tate": ["allentate.com"],
    "crye-leike": ["crye-leike.com"],
    "crye leike": ["crye-leike.com"],
    "john l scott": ["johnlscott.com"],
    "john l. scott": ["johnlscott.com"],
    "baird & warner": ["bairdwarner.com"],
    "baird and warner": ["bairdwarner.com"],
    "watson realty": ["watsonrealtycorp.com"],
    "era ": ["era.com"],
    "lyon real": ["lyonre.com"],
    "dream town": ["dreamtown.com"],
    "reecenichols": ["reecenichols.com"],
    "reece nichols": ["reecenichols.com"],
    "lpt realty": ["lptrealty.com"],
    "fathom realty": ["fathomrealty.com"],
    "nextage": ["nextage.com"],
    "iron valley": ["ironvalleyrealestate.com"],
    "epique realty": ["epiquerealty.com"],
    "nexthome": ["nexthome.com"],
    "engel & volkers": ["evrealestate.com"],
    "engel and volkers": ["evrealestate.com"],
    "movoto": ["movoto.com"],
    "charles rutenberg": ["crrealty.com"],
    "real living": ["realliving.com"],
    "benchmark": ["benchmarkrealty.com"],
    "corcoran": ["corcoran.com"],
    "christie": ["christiesrealestate.com"],
    "harry norman": ["harrynorman.com"],
    "ebby halliday": ["ebby.com"],
    "alain pinel": ["apr.com"],
    "william raveis": ["raveis.com"],
    "nest seekers": ["nestseekers.com"],
    "halstead": ["halstead.com"],
}


def _find_domains(brokerage: str) -> list[str]:
    """Find known email domains for a brokerage name."""
    if not brokerage:
        return []
    normalized = brokerage.lower().strip()
    for pattern, domains in KNOWN_DOMAINS.items():
        if pattern in normalized:
            return domains
    return []


def _guess_domain_from_name(brokerage: str) -> str | None:
    """Generate a plausible domain from the brokerage name."""
    if not brokerage:
        return None
    cleaned = re.sub(
        r'\b(llc|inc|corp|group|realty|real estate|properties|brokerage|'
        r'associates|company|co|team|advisors|services)\b',
        '', brokerage, flags=re.IGNORECASE
    )
    cleaned = re.sub(r'[^a-zA-Z\s]', '', cleaned).strip()
    parts = cleaned.split()
    if not parts:
        return None
    domain = "".join(parts).lower() + ".com"
    return domain


def _generate_patterns(name: str, domain: str) -> list[str]:
    """Generate common email address patterns."""
    parts = name.lower().split()
    titles = {"mr", "mrs", "ms", "dr", "jr", "sr", "iii", "iv", "ii", "pa"}
    parts = [p.strip(".") for p in parts if p.strip(".").lower() not in titles]
    if not parts:
        return []

    first = re.sub(r'[^a-z]', '', parts[0])
    last = re.sub(r'[^a-z]', '', parts[-1]) if len(parts) > 1 else ""

    if not first:
        return []

    patterns = []
    if last:
        patterns.extend([
            f"{first}.{last}@{domain}",       # john.smith@
            f"{first}{last}@{domain}",         # johnsmith@
            f"{first[0]}{last}@{domain}",      # jsmith@
            f"{first}@{domain}",               # john@
            f"{first}{last[0]}@{domain}",      # johns@
            f"{last}.{first}@{domain}",        # smith.john@
        ])
    else:
        patterns.append(f"{first}@{domain}")

    return patterns


async def _check_mx(domain: str) -> bool:
    """Check if a domain has MX records using dnspython."""
    loop = asyncio.get_event_loop()
    try:
        return await loop.run_in_executor(None, lambda: _resolve_mx(domain))
    except Exception:
        return False


def _resolve_mx(domain: str) -> bool:
    """Synchronous MX record check."""
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, 'MX')
        return len(answers) > 0
    except Exception:
        # Fallback to socket
        try:
            import socket
            socket.getaddrinfo(domain, 25, socket.AF_INET, socket.SOCK_STREAM)
            return True
        except Exception:
            return False


async def guess_email(name: str, brokerage: str) -> str | None:
    """Guess an agent's email from their name and brokerage.

    Returns the best-guess email if the domain has valid MX records,
    or None if we can't determine a valid email.
    """
    if not name or not brokerage:
        return None

    domains = _find_domains(brokerage)

    if not domains:
        guessed = _guess_domain_from_name(brokerage)
        if guessed:
            domains = [guessed]

    if not domains:
        return None

    for domain in domains:
        has_mx = await _check_mx(domain)
        if has_mx:
            patterns = _generate_patterns(name, domain)
            if patterns:
                return patterns[0]

    return None


async def guess_batch(
    agents: list[AgentRow],
    on_result=None,
) -> dict[int, str]:
    """Guess emails for a batch of agents. Returns {row_index: email}."""
    results: dict[int, str] = {}
    mx_cache: dict[str, bool] = {}

    for agent in agents:
        domains = _find_domains(agent.brokerage)
        if not domains:
            guessed = _guess_domain_from_name(agent.brokerage)
            if guessed:
                domains = [guessed]

        email = None
        for domain in domains:
            if domain not in mx_cache:
                mx_cache[domain] = await _check_mx(domain)

            if mx_cache[domain]:
                patterns = _generate_patterns(agent.name, domain)
                if patterns:
                    email = patterns[0]
                    break

        if email:
            results[agent.row_index] = email

        if on_result:
            on_result(agent, email)

    return results
