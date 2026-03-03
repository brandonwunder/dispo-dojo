"""Email pattern guesser — generate likely email addresses from agent name + brokerage."""

import logging
import re
import socket
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers

logger = logging.getLogger("agent_finder.searchers.email_guesser")

KNOWN_DOMAINS = {
    "keller williams": "kw.com",
    "re/max": "remax.com",
    "remax": "remax.com",
    "coldwell banker": "coldwellbanker.com",
    "century 21": "century21.com",
    "exp realty": "exprealty.com",
    "compass": "compass.com",
    "sotheby": "sothebysrealty.com",
    "berkshire hathaway": "bhhsres.com",
    "howard hanna": "howardhanna.com",
    "weichert": "weichert.com",
    "long & foster": "longandfoster.com",
    "exit": "exitrealty.com",
}


def _guess_domain(brokerage: str) -> str | None:
    lower = brokerage.lower()
    for key, domain in KNOWN_DOMAINS.items():
        if key in lower:
            return domain
    cleaned = re.sub(r'\b(llc|inc|corp|group|realty|real estate|properties|brokerage)\b', '', lower, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-z\s]', '', cleaned).strip()
    words = cleaned.split()
    if words:
        return "".join(words) + ".com"
    return None


def _check_mx_record(domain: str) -> bool:
    try:
        socket.getaddrinfo(domain, 25, socket.AF_INET, socket.SOCK_STREAM)
        return True
    except socket.gaierror:
        pass
    try:
        import subprocess
        result = subprocess.run(
            ["nslookup", "-type=MX", domain],
            capture_output=True, text=True, timeout=5,
        )
        return "mail exchanger" in result.stdout.lower() or "MX" in result.stdout
    except Exception:
        return False


def generate_email_patterns(name: str, domain: str) -> list[str]:
    parts = name.lower().split()
    if len(parts) < 2:
        first = parts[0] if parts else "agent"
        last = ""
    else:
        first = parts[0]
        last = parts[-1]

    first = re.sub(r'[^a-z]', '', first)
    last = re.sub(r'[^a-z]', '', last)

    patterns = []
    if first and last:
        patterns.extend([
            f"{first}.{last}@{domain}",
            f"{first}{last}@{domain}",
            f"{first[0]}{last}@{domain}",
            f"{first}@{domain}",
            f"{first}{last[0]}@{domain}",
        ])
    elif first:
        patterns.append(f"{first}@{domain}")

    return patterns


async def guess_email(
    name: str,
    brokerage: str,
    client: httpx.AsyncClient,
) -> str:
    if not name or not brokerage:
        return ""

    domain = _guess_domain(brokerage)

    if not domain:
        try:
            query = f'"{brokerage}" real estate official website'
            url = f"https://www.google.com/search?q={quote_plus(query)}&num=5"
            headers = get_headers()
            resp = await client.get(url, headers=headers, timeout=10)

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                for a_tag in soup.find_all("a", href=True):
                    href = a_tag["href"]
                    import urllib.parse
                    parsed = urllib.parse.urlparse(href)
                    if parsed.netloc and "google" not in parsed.netloc:
                        domain = parsed.netloc.replace("www.", "")
                        break
        except Exception as e:
            logger.debug("Domain lookup failed for %s: %s", brokerage, e)

    if not domain:
        return ""

    has_mx = _check_mx_record(domain)
    if not has_mx:
        logger.debug("Domain %s has no MX records", domain)
        return ""

    patterns = generate_email_patterns(name, domain)
    return patterns[0] if patterns else ""
