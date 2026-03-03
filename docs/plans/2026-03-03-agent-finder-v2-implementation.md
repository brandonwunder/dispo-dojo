# Agent Contact Finder v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the agent finder backend from scratch to take agent name + brokerage from CSV and find phone/email via free Google search scraping, Realtor.com profiles, and email pattern guessing.

**Architecture:** FastAPI backend with 3-pass search pipeline (Google snippets → Realtor.com agent profile → email pattern guessing). Simplified frontend with upload, progress bar, results table, and CSV download.

**Tech Stack:** Python 3, FastAPI, httpx, BeautifulSoup4, openpyxl, uvicorn. React frontend (existing Vite + Tailwind setup).

---

## Task 1: Delete old backend, scaffold new structure

**Files:**
- Delete: all files in `agent_finder/` (keep the directory)
- Create: `agent_finder/__init__.py`
- Create: `agent_finder/__main__.py`
- Create: `agent_finder/requirements.txt`

**Step 1: Delete old agent_finder contents**

```bash
# Remove all old files (keep data/ for uploaded files)
rm -rf agent_finder/__pycache__ agent_finder/scrapers agent_finder/templates agent_finder/static
rm -f agent_finder/app.py agent_finder/cache.py agent_finder/config.py agent_finder/enrichment.py
rm -f agent_finder/input_handler.py agent_finder/main.py agent_finder/models.py
rm -f agent_finder/output_handler.py agent_finder/pipeline.py agent_finder/utils.py
rm -f agent_finder/__init__.py agent_finder/__main__.py
```

**Step 2: Create new scaffold files**

`agent_finder/__init__.py`:
```python
"""Agent Contact Finder v2 — find phone/email for real estate agents."""
```

`agent_finder/__main__.py`:
```python
"""Run the web server: python -m agent_finder"""
from .app import main
main()
```

`agent_finder/requirements.txt`:
```
httpx[http2]>=0.27.0
beautifulsoup4>=4.12.0
lxml>=5.0.0
openpyxl>=3.1.0
fake-useragent>=2.0.0
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
python-multipart>=0.0.18
```

**Step 3: Create searchers directory**

```bash
mkdir agent_finder/searchers
touch agent_finder/searchers/__init__.py
```

**Step 4: Commit**

```bash
git add -A agent_finder/
git commit -m "feat: delete old agent finder, scaffold v2 structure"
```

---

## Task 2: Build models and input handler

**Files:**
- Create: `agent_finder/models.py`
- Create: `agent_finder/input_handler.py`

**Step 1: Write models.py**

```python
"""Data models for Agent Contact Finder v2."""

from dataclasses import dataclass, field
from enum import Enum


class ContactStatus(str, Enum):
    FOUND = "found"          # phone or email found
    PARTIAL = "partial"      # name confirmed but no contact info
    NOT_FOUND = "not_found"  # couldn't find anything
    ERROR = "error"          # search failed


@dataclass
class AgentRow:
    """One row from the uploaded CSV — an agent to find contact info for."""
    name: str
    brokerage: str
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    list_price: str = ""
    row_index: int = 0
    extra_columns: dict = field(default_factory=dict)


@dataclass
class ContactResult:
    """Search result for one agent."""
    agent: AgentRow
    phone: str = ""
    email: str = ""
    source: str = ""        # "google", "realtor", "email_guess"
    status: ContactStatus = ContactStatus.NOT_FOUND
    error_message: str = ""

    @property
    def has_contact(self) -> bool:
        return bool(self.phone or self.email)
```

**Step 2: Write input_handler.py**

```python
"""Parse CSV/Excel uploads and extract agent rows."""

import csv
import io
import logging
from pathlib import Path

from .models import AgentRow

logger = logging.getLogger("agent_finder.input")

# Common column name variations (lowercase)
NAME_COLUMNS = {"name", "agent", "agent_name", "agent name", "listing agent", "list agent"}
BROKER_COLUMNS = {"broker", "brokerage", "office", "broker name", "brokerage name", "listing office"}
ADDRESS_COLUMNS = {"street address", "address", "property address", "prop address", "street", "location"}
CITY_COLUMNS = {"city"}
STATE_COLUMNS = {"state", "st"}
ZIP_COLUMNS = {"postal code", "zip", "zip code", "zipcode", "postal"}
PRICE_COLUMNS = {"list price", "price", "listprice", "list_price"}


def _detect_column(headers: list[str], candidates: set[str]) -> str | None:
    """Find which header matches one of the candidate names."""
    lower_headers = {h.lower().strip(): h for h in headers}
    for candidate in candidates:
        if candidate in lower_headers:
            return lower_headers[candidate]
    # Partial match fallback
    for candidate in candidates:
        for lh, original in lower_headers.items():
            if candidate in lh:
                return original
    return None


def read_csv(file_path: str) -> list[AgentRow]:
    """Read a CSV file and return AgentRow list."""
    rows = []
    with open(file_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []

        name_col = _detect_column(headers, NAME_COLUMNS)
        broker_col = _detect_column(headers, BROKER_COLUMNS)
        addr_col = _detect_column(headers, ADDRESS_COLUMNS)
        city_col = _detect_column(headers, CITY_COLUMNS)
        state_col = _detect_column(headers, STATE_COLUMNS)
        zip_col = _detect_column(headers, ZIP_COLUMNS)
        price_col = _detect_column(headers, PRICE_COLUMNS)

        if not name_col:
            raise ValueError(
                f"Could not find agent name column. Headers: {headers}. "
                f"Expected one of: {NAME_COLUMNS}"
            )

        known_cols = {name_col, broker_col, addr_col, city_col, state_col, zip_col, price_col}

        for i, row in enumerate(reader):
            name = (row.get(name_col) or "").strip()
            if not name:
                continue

            extra = {k: v for k, v in row.items() if k not in known_cols and k is not None}

            rows.append(AgentRow(
                name=name,
                brokerage=(row.get(broker_col) or "").strip() if broker_col else "",
                address=(row.get(addr_col) or "").strip() if addr_col else "",
                city=(row.get(city_col) or "").strip() if city_col else "",
                state=(row.get(state_col) or "").strip() if state_col else "",
                zip_code=(row.get(zip_col) or "").strip() if zip_col else "",
                list_price=(row.get(price_col) or "").strip() if price_col else "",
                row_index=i,
                extra_columns=extra,
            ))

    logger.info("Parsed %d agent rows from %s", len(rows), file_path)
    return rows


def read_excel(file_path: str) -> list[AgentRow]:
    """Read an Excel file and return AgentRow list."""
    import openpyxl
    wb = openpyxl.load_workbook(file_path, read_only=True, data_only=True)
    ws = wb.active

    rows_iter = ws.iter_rows(values_only=True)
    header_row = next(rows_iter, None)
    if not header_row:
        raise ValueError("Excel file is empty.")

    headers = [str(h).strip() if h else "" for h in header_row]

    # Convert to CSV-like dict rows and reuse CSV logic
    import tempfile
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, encoding="utf-8") as tmp:
        writer = csv.DictWriter(tmp, fieldnames=headers)
        writer.writeheader()
        for row in rows_iter:
            values = [str(v).strip() if v is not None else "" for v in row]
            writer.writerow(dict(zip(headers, values)))
        tmp_path = tmp.name

    wb.close()
    result = read_csv(tmp_path)
    Path(tmp_path).unlink(missing_ok=True)
    return result


def read_input(file_path: str) -> list[AgentRow]:
    """Read CSV or Excel file, auto-detecting format."""
    ext = Path(file_path).suffix.lower()
    if ext == ".csv":
        return read_csv(file_path)
    elif ext in (".xlsx", ".xls"):
        return read_excel(file_path)
    else:
        raise ValueError(f"Unsupported file type: {ext}")
```

**Step 3: Commit**

```bash
git add agent_finder/models.py agent_finder/input_handler.py
git commit -m "feat: add v2 data models and CSV/Excel input handler"
```

---

## Task 3: Build Google search scraper

**Files:**
- Create: `agent_finder/searchers/google_search.py`
- Create: `agent_finder/searchers/helpers.py`

**Step 1: Write helpers.py (shared utilities)**

```python
"""Shared utilities for searchers — headers, regex, rate limiting."""

import re
import random
import asyncio
import logging

logger = logging.getLogger("agent_finder.searchers")

# Phone regex: matches (XXX) XXX-XXXX, XXX-XXX-XXXX, XXX.XXX.XXXX, etc.
PHONE_RE = re.compile(
    r'(?<!\d)'                         # not preceded by digit
    r'(?:\+?1[-.\s]?)?'               # optional country code
    r'\(?([2-9]\d{2})\)?'             # area code (2-9 start)
    r'[-.\s]?'
    r'(\d{3})'
    r'[-.\s]?'
    r'(\d{4})'
    r'(?!\d)',                          # not followed by digit
)

# Email regex
EMAIL_RE = re.compile(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
)

# Pool of realistic User-Agent strings
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
]


def get_headers() -> dict:
    """Return realistic browser headers with a random User-Agent."""
    ua = random.choice(USER_AGENTS)
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }


def extract_phones(text: str) -> list[str]:
    """Extract all phone numbers from text, formatted as (XXX) XXX-XXXX."""
    phones = []
    for match in PHONE_RE.finditer(text):
        area, mid, last = match.groups()
        formatted = f"({area}) {mid}-{last}"
        phones.append(formatted)
    return phones


def extract_emails(text: str) -> list[str]:
    """Extract all email addresses from text."""
    emails = []
    for match in EMAIL_RE.finditer(text):
        email = match.group().lower()
        # Filter out common false positives
        if not any(email.endswith(x) for x in [".png", ".jpg", ".gif", ".svg", ".css", ".js"]):
            emails.append(email)
    return emails


async def random_delay(min_sec: float = 3.0, max_sec: float = 7.0):
    """Sleep for a random duration to avoid rate limiting."""
    delay = random.uniform(min_sec, max_sec)
    await asyncio.sleep(delay)
```

**Step 2: Write google_search.py**

```python
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
    """Search Google for an agent's phone and email.

    Queries: "Agent Name" "Brokerage" real estate agent phone email
    Parses the HTML search results page for phone/email in snippets.
    """
    result = ContactResult(agent=agent, source="google")

    # Build search query
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

        # Extract text from search result snippets
        # Google wraps results in divs — get all visible text
        snippet_text = soup.get_text(separator=" ")

        # Extract phone numbers and emails
        phones = extract_phones(snippet_text)
        emails = extract_emails(snippet_text)

        # Filter emails — prefer ones that look like agent emails
        agent_first = agent.name.split()[0].lower() if agent.name else ""
        agent_last = agent.name.split()[-1].lower() if agent.name else ""

        # Score emails: prefer ones containing agent name parts
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
        if scored_emails:
            best_email = scored_emails[0][1]
            if scored_emails[0][0] >= 0:  # only use if not a generic/junk email
                result.email = best_email

        if result.has_contact:
            result.status = ContactStatus.FOUND
        else:
            result.status = ContactStatus.NOT_FOUND

        # Collect any Realtor.com profile URLs for fallback pass
        profile_urls = []
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            if "realtor.com/realestateagents/" in href:
                profile_urls.append(href)

        # Store profile URLs in error_message field temporarily (used by pipeline)
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
```

**Step 3: Commit**

```bash
git add agent_finder/searchers/
git commit -m "feat: add Google search scraper and helper utilities"
```

---

## Task 4: Build Realtor.com profile scraper

**Files:**
- Create: `agent_finder/searchers/realtor_profile.py`

**Step 1: Write realtor_profile.py**

```python
"""Realtor.com agent profile scraper — fallback for agents not found via Google."""

import logging
import re
from urllib.parse import quote

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers, extract_phones, extract_emails, random_delay
from ..models import AgentRow, ContactResult, ContactStatus

logger = logging.getLogger("agent_finder.searchers.realtor")


def _slugify_name(name: str) -> str:
    """Convert agent name to URL slug: 'Ken Puckett' → 'Ken-Puckett'."""
    # Remove suffixes like "P.A.", "Jr.", etc.
    cleaned = re.sub(r'\b(p\.?a\.?|jr\.?|sr\.?|iii?|iv)\b', '', name, flags=re.IGNORECASE)
    # Remove non-alpha chars except spaces and hyphens
    cleaned = re.sub(r'[^a-zA-Z\s-]', '', cleaned).strip()
    return cleaned.replace(' ', '-')


async def search_realtor_profile(
    agent: AgentRow,
    client: httpx.AsyncClient,
    profile_url: str = "",
) -> ContactResult:
    """Search Realtor.com for an agent's profile page to extract contact info.

    Either uses a direct profile_url (from Google results) or constructs
    a search URL from the agent name.
    """
    result = ContactResult(agent=agent, source="realtor")

    try:
        headers = get_headers()
        headers["Referer"] = "https://www.realtor.com/"

        # Try direct profile URL first if provided
        if profile_url and "realtor.com" in profile_url:
            url = profile_url
        else:
            # Search the agent directory
            slug = _slugify_name(agent.name)
            url = f"https://www.realtor.com/realestateagents/{slug}"

        resp = await client.get(url, headers=headers, timeout=15, follow_redirects=True)

        if resp.status_code != 200:
            result.status = ContactStatus.NOT_FOUND
            return result

        html = resp.text
        soup = BeautifulSoup(html, "lxml")

        # Try to find phone number — Realtor.com usually shows it prominently
        page_text = soup.get_text(separator=" ")
        phones = extract_phones(page_text)
        emails = extract_emails(page_text)

        # Also check specific elements that Realtor.com uses
        # Phone is often in an <a href="tel:..."> tag
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
            # Filter out realtor.com's own emails
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
```

**Step 2: Commit**

```bash
git add agent_finder/searchers/realtor_profile.py
git commit -m "feat: add Realtor.com agent profile scraper"
```

---

## Task 5: Build email pattern guesser

**Files:**
- Create: `agent_finder/searchers/email_guesser.py`

**Step 1: Write email_guesser.py**

```python
"""Email pattern guesser — generate likely email addresses from agent name + brokerage."""

import logging
import re
import socket
from urllib.parse import quote_plus

import httpx
from bs4 import BeautifulSoup

from .helpers import get_headers, random_delay

logger = logging.getLogger("agent_finder.searchers.email_guesser")

# Map common brokerage names to their known domains
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
    """Try to guess the brokerage's email domain from its name."""
    lower = brokerage.lower()

    # Check known domains first
    for key, domain in KNOWN_DOMAINS.items():
        if key in lower:
            return domain

    # Try to construct from brokerage name:
    # "Galactic Realty Group Llc" → "galacticrealtygroup.com"
    cleaned = re.sub(r'\b(llc|inc|corp|group|realty|real estate|properties|brokerage)\b', '', lower, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-z\s]', '', cleaned).strip()
    words = cleaned.split()
    if words:
        return "".join(words) + ".com"
    return None


def _check_mx_record(domain: str) -> bool:
    """Check if a domain has MX records (can receive email)."""
    try:
        socket.getaddrinfo(domain, 25, socket.AF_INET, socket.SOCK_STREAM)
        return True
    except socket.gaierror:
        pass
    # Try MX lookup via DNS
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
    """Generate common email patterns from a name and domain."""
    parts = name.lower().split()
    if len(parts) < 2:
        first = parts[0] if parts else "agent"
        last = ""
    else:
        first = parts[0]
        last = parts[-1]

    # Remove non-alpha chars
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
    """Try to guess an agent's email from their name and brokerage.

    1. Try to find brokerage domain via Google
    2. Generate email patterns
    3. Verify domain has MX records

    Returns the best guess email or empty string.
    """
    if not name or not brokerage:
        return ""

    # First try known domains
    domain = _guess_domain(brokerage)

    # If we don't have a domain, try to find the brokerage website via Google
    if not domain:
        try:
            query = f'"{brokerage}" real estate official website'
            url = f"https://www.google.com/search?q={quote_plus(query)}&num=5"
            headers = get_headers()
            resp = await client.get(url, headers=headers, timeout=10)

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "lxml")
                # Look for domain in search results
                for a_tag in soup.find_all("a", href=True):
                    href = a_tag["href"]
                    # Extract domain from Google result URLs
                    import urllib.parse
                    parsed = urllib.parse.urlparse(href)
                    if parsed.netloc and "google" not in parsed.netloc:
                        domain = parsed.netloc.replace("www.", "")
                        break
        except Exception as e:
            logger.debug("Domain lookup failed for %s: %s", brokerage, e)

    if not domain:
        return ""

    # Check if domain has MX records (can receive email)
    has_mx = _check_mx_record(domain)
    if not has_mx:
        logger.debug("Domain %s has no MX records", domain)
        return ""

    # Generate and return the most likely pattern
    patterns = generate_email_patterns(name, domain)
    return patterns[0] if patterns else ""
```

**Step 2: Commit**

```bash
git add agent_finder/searchers/email_guesser.py
git commit -m "feat: add email pattern guesser with MX verification"
```

---

## Task 6: Build the pipeline orchestrator

**Files:**
- Create: `agent_finder/pipeline.py`

**Step 1: Write pipeline.py**

```python
"""Pipeline orchestrator — runs the 3-pass search for each agent."""

import asyncio
import logging
from typing import Callable

import httpx

from .models import AgentRow, ContactResult, ContactStatus
from .searchers.google_search import search_google
from .searchers.realtor_profile import search_realtor_profile
from .searchers.email_guesser import guess_email
from .searchers.helpers import random_delay

logger = logging.getLogger("agent_finder.pipeline")


async def run_pipeline(
    agents: list[AgentRow],
    progress_callback: Callable[[dict], None] | None = None,
) -> list[ContactResult]:
    """Run the 3-pass search pipeline on a list of agents.

    Pass 1: Google search (all agents)
    Pass 2: Realtor.com profile (agents not found in Pass 1)
    Pass 3: Email pattern guessing (agents with no email)

    Progress callback receives:
      {"completed": int, "total": int, "found": int, "not_found": int,
       "current_agent": str, "phase": str}
    """
    total = len(agents)
    results: list[ContactResult] = [ContactResult(agent=a) for a in agents]

    found_count = 0
    completed_count = 0

    def emit_progress(current_agent: str, phase: str):
        if progress_callback:
            progress_callback({
                "completed": completed_count,
                "total": total,
                "found": found_count,
                "not_found": completed_count - found_count,
                "current_agent": current_agent,
                "phase": phase,
            })

    # ── Pass 1: Google Search ──
    logger.info("Pass 1: Google search for %d agents", total)

    async with httpx.AsyncClient(
        http2=True,
        follow_redirects=True,
        limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
    ) as client:

        for i, agent in enumerate(agents):
            emit_progress(agent.name, "google")

            try:
                result = await search_google(agent, client)
                results[i] = result

                if result.has_contact:
                    found_count += 1
            except Exception as e:
                logger.error("Pass 1 error for %s: %s", agent.name, e)
                results[i] = ContactResult(
                    agent=agent,
                    status=ContactStatus.ERROR,
                    error_message=str(e),
                )

            completed_count += 1
            emit_progress(agent.name, "google")

            # Rate limit: random delay between Google searches
            if i < total - 1:
                await random_delay(3.0, 7.0)

        # ── Pass 2: Realtor.com profiles (for agents not found) ──
        not_found_indices = [
            i for i, r in enumerate(results)
            if not r.has_contact
        ]

        if not_found_indices:
            logger.info("Pass 2: Realtor.com profiles for %d agents", len(not_found_indices))

            for i in not_found_indices:
                agent = agents[i]
                emit_progress(agent.name, "realtor")

                # Check if Pass 1 found a Realtor.com profile URL
                profile_url = ""
                if results[i].error_message.startswith("realtor_url:"):
                    profile_url = results[i].error_message.replace("realtor_url:", "")

                try:
                    realtor_result = await search_realtor_profile(agent, client, profile_url)

                    if realtor_result.has_contact:
                        # Merge: keep any existing data, add new
                        if realtor_result.phone and not results[i].phone:
                            results[i].phone = realtor_result.phone
                        if realtor_result.email and not results[i].email:
                            results[i].email = realtor_result.email
                        results[i].source = "realtor"
                        results[i].status = ContactStatus.FOUND
                        results[i].error_message = ""
                        found_count += 1
                except Exception as e:
                    logger.error("Pass 2 error for %s: %s", agent.name, e)

                emit_progress(agent.name, "realtor")
                await random_delay(1.5, 3.5)

        # ── Pass 3: Email pattern guessing (for agents with phone but no email) ──
        need_email_indices = [
            i for i, r in enumerate(results)
            if r.phone and not r.email
        ]

        if need_email_indices:
            logger.info("Pass 3: Email guessing for %d agents", len(need_email_indices))

            for i in need_email_indices:
                agent = agents[i]
                emit_progress(agent.name, "email_guess")

                try:
                    guessed = await guess_email(agent.name, agent.brokerage, client)
                    if guessed:
                        results[i].email = guessed
                        if results[i].source:
                            results[i].source += "+email_guess"
                        else:
                            results[i].source = "email_guess"
                except Exception as e:
                    logger.debug("Email guess error for %s: %s", agent.name, e)

                emit_progress(agent.name, "email_guess")
                # Email guessing with Google domain lookup needs delay too
                await random_delay(3.0, 6.0)

    # Final status update for any remaining NOT_FOUND
    for r in results:
        if r.status == ContactStatus.ERROR and r.error_message.startswith("realtor_url:"):
            r.error_message = ""
            r.status = ContactStatus.NOT_FOUND

    logger.info(
        "Pipeline complete: %d/%d found (%d%%)",
        found_count, total,
        round(found_count / total * 100) if total > 0 else 0,
    )

    return results
```

**Step 2: Commit**

```bash
git add agent_finder/pipeline.py
git commit -m "feat: add 3-pass pipeline orchestrator (google → realtor → email guess)"
```

---

## Task 7: Build output handler

**Files:**
- Create: `agent_finder/output_handler.py`

**Step 1: Write output_handler.py**

```python
"""Export pipeline results to CSV."""

import csv
import io
import logging
from pathlib import Path

from .models import ContactResult

logger = logging.getLogger("agent_finder.output")


def export_results_csv(results: list[ContactResult], output_path: str):
    """Export results to a single CSV file with original columns + contact info appended."""
    if not results:
        return

    # Collect all extra column names (preserve order from first row that has them)
    extra_keys = []
    seen = set()
    for r in results:
        for k in r.agent.extra_columns:
            if k not in seen:
                extra_keys.append(k)
                seen.add(k)

    # Standard columns
    fieldnames = [
        "Name", "Brokerage", "Phone", "Email", "Status", "Source",
        "Street Address", "City", "State", "Zip Code", "List Price",
    ] + extra_keys

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for r in results:
            row = {
                "Name": r.agent.name,
                "Brokerage": r.agent.brokerage,
                "Phone": r.phone,
                "Email": r.email,
                "Status": r.status.value,
                "Source": r.source,
                "Street Address": r.agent.address,
                "City": r.agent.city,
                "State": r.agent.state,
                "Zip Code": r.agent.zip_code,
                "List Price": r.agent.list_price,
            }
            # Add extra columns
            for k in extra_keys:
                row[k] = r.agent.extra_columns.get(k, "")

            writer.writerow(row)

    logger.info("Exported %d results to %s", len(results), output_path)


def generate_summary(results: list[ContactResult]) -> dict:
    """Generate a summary dict for the job completion event."""
    total = len(results)
    found = sum(1 for r in results if r.status.value == "found")
    not_found = sum(1 for r in results if r.status.value == "not_found")
    errors = sum(1 for r in results if r.status.value == "error")
    with_phone = sum(1 for r in results if r.phone)
    with_email = sum(1 for r in results if r.email)

    return {
        "total": total,
        "found": found,
        "not_found": not_found,
        "errors": errors,
        "with_phone": with_phone,
        "with_email": with_email,
        "hit_rate": round(found / total * 100) if total > 0 else 0,
    }
```

**Step 2: Commit**

```bash
git add agent_finder/output_handler.py
git commit -m "feat: add CSV export and summary generation"
```

---

## Task 8: Build the FastAPI app

**Files:**
- Create: `agent_finder/app.py`

**Step 1: Write app.py**

This is the main FastAPI application with 5 endpoints. It replaces the old 15-endpoint version.

```python
"""FastAPI web app for Agent Contact Finder v2."""

import asyncio
import json
import logging
import uuid
from datetime import datetime
from pathlib import Path

import os

logger = logging.getLogger("agent_finder.app")

from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import StreamingResponse

from .input_handler import read_input
from .output_handler import export_results_csv, generate_summary
from .pipeline import run_pipeline

app = FastAPI(title="Agent Contact Finder v2")

# CORS
_default_origins = "http://localhost:3000,http://localhost:5173,https://dispo-dojo.vercel.app"
_origins = os.environ.get("ALLOWED_ORIGINS", _default_origins).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")

# In-memory job store
jobs: dict[str, dict] = {}
_tasks: dict[str, asyncio.Task] = {}

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
JOBS_FILE = DATA_DIR / "jobs.json"


# ── Job persistence ──

def _save_jobs():
    """Persist job metadata to disk."""
    saveable = {}
    for jid, job in jobs.items():
        saveable[jid] = {
            "status": job["status"],
            "upload_path": job["upload_path"],
            "result_path": job.get("result_path"),
            "total": job["total"],
            "error": job.get("error"),
            "summary": job.get("summary"),
            "filename": job.get("filename", ""),
            "created_at": job.get("created_at", ""),
        }
    JOBS_FILE.write_text(json.dumps(saveable, indent=2), encoding="utf-8")


def _load_jobs():
    """Load saved jobs from disk on startup."""
    global jobs
    if not JOBS_FILE.exists():
        return
    try:
        saved = json.loads(JOBS_FILE.read_text(encoding="utf-8"))
        for jid, data in saved.items():
            restored = {**data, "progress": [], "preview_rows": None}
            if data.get("status") == "running":
                restored["status"] = "error"
                restored["error"] = "Server restarted while this job was running."
            jobs[jid] = restored
    except (json.JSONDecodeError, KeyError):
        pass


@app.on_event("startup")
async def startup():
    _load_jobs()


# ── API Endpoints ──

@api.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a CSV/Excel file and start processing."""
    ext = Path(file.filename).suffix.lower()
    if ext not in (".csv", ".xlsx", ".xls"):
        raise HTTPException(400, "Only .csv, .xlsx, or .xls files are supported.")

    job_id = str(uuid.uuid4())[:8]
    upload_path = DATA_DIR / f"{job_id}{ext}"

    content = await file.read()
    with open(upload_path, "wb") as f:
        f.write(content)

    try:
        agents = read_input(str(upload_path))
    except (ValueError, FileNotFoundError) as e:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, str(e))

    if not agents:
        upload_path.unlink(missing_ok=True)
        raise HTTPException(400, "No valid agent rows found in file.")

    jobs[job_id] = {
        "status": "running",
        "upload_path": str(upload_path),
        "result_path": None,
        "total": len(agents),
        "progress": [],
        "error": None,
        "summary": None,
        "preview_rows": None,
        "filename": file.filename,
        "created_at": datetime.now().isoformat(),
    }
    _save_jobs()

    task = asyncio.create_task(_run_job(job_id, agents))
    _tasks[job_id] = task

    return {"job_id": job_id, "total": len(agents)}


@api.get("/progress/{job_id}")
async def progress_stream(job_id: str):
    """Server-Sent Events stream for job progress."""
    if job_id not in jobs:
        raise HTTPException(404, "Job not found.")

    async def event_generator():
        last_idx = 0
        heartbeat_count = 0
        poll_interval = 0.3
        heartbeat_every = int(5 / poll_interval)  # every 5 seconds

        while True:
            job = jobs.get(job_id)
            if not job:
                break

            progress_list = job["progress"]
            while last_idx < len(progress_list):
                yield f"data: {json.dumps(progress_list[last_idx])}\n\n"
                last_idx += 1
                heartbeat_count = 0

            if job["status"] == "complete":
                yield f"data: {json.dumps({'type': 'complete', 'summary': job['summary'], 'preview_rows': job['preview_rows']})}\n\n"
                break
            elif job["status"] == "error":
                yield f"data: {json.dumps({'type': 'error', 'message': job['error']})}\n\n"
                break
            elif job["status"] == "cancelled":
                yield f"data: {json.dumps({'type': 'cancelled'})}\n\n"
                break

            heartbeat_count += 1
            if heartbeat_count >= heartbeat_every:
                yield f"data: {json.dumps({'type': 'heartbeat'})}\n\n"
                heartbeat_count = 0

            await asyncio.sleep(poll_interval)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@api.get("/download/{job_id}")
async def download_result(job_id: str):
    """Download the result CSV file."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "complete" or not job.get("result_path"):
        raise HTTPException(400, "Results not ready yet.")

    result_path = Path(job["result_path"])
    if not result_path.exists():
        raise HTTPException(404, "Result file not found.")

    return FileResponse(
        str(result_path),
        filename=f"agent_contacts_{job_id}.csv",
        media_type="text/csv",
    )


@api.get("/jobs")
async def list_jobs():
    """Return all jobs for the UI."""
    history = []
    for jid, job in jobs.items():
        last_progress = job["progress"][-1] if job["progress"] else None
        history.append({
            "job_id": jid,
            "filename": job.get("filename", "unknown"),
            "created_at": job.get("created_at", ""),
            "status": job["status"],
            "total": job["total"],
            "summary": job.get("summary"),
            "last_progress": last_progress,
        })
    history.sort(key=lambda x: x["created_at"], reverse=True)
    return history


@api.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its files."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")

    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    for path_key in ("upload_path", "result_path"):
        raw = job.get(path_key) or ""
        if raw:
            p = Path(raw)
            if p.is_file():
                p.unlink(missing_ok=True)

    del jobs[job_id]
    _tasks.pop(job_id, None)
    _save_jobs()
    return {"ok": True}


@api.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running job."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found.")
    if job["status"] != "running":
        raise HTTPException(400, "Job is not running.")

    task = _tasks.get(job_id)
    if task and not task.done():
        task.cancel()

    job["status"] = "cancelled"
    _save_jobs()
    return {"ok": True}


# Keep the /api/comps endpoint — used by Underwriting page (not part of agent finder rewrite)
@api.get("/comps")
async def get_comps(address: str):
    """Pull sold comps near a given address using HomeHarvest."""
    try:
        from homeharvest import scrape_property
    except ImportError:
        raise HTTPException(status_code=500, detail="HomeHarvest not installed")

    import re as _re
    zip_match = _re.search(r'\b(\d{5})\b', address)
    location = zip_match.group(1) if zip_match else address

    comps = []
    for months in [3, 6, 9, 12]:
        try:
            loop = asyncio.get_event_loop()

            def _scrape(months_=months):
                from datetime import date, timedelta
                end = date.today()
                start = end - timedelta(days=months_ * 30)
                df = scrape_property(
                    location=location,
                    listing_type="sold",
                    date_from=start.strftime("%Y-%m-%d"),
                    date_to=end.strftime("%Y-%m-%d"),
                    limit=10,
                )
                return df

            df = await loop.run_in_executor(None, _scrape)

            if df is None or len(df) == 0:
                continue

            results = []
            for _, row in df.iterrows():
                list_price = float(row.get('list_price') or row.get('price') or 0)
                sold_price = float(row.get('sold_price') or row.get('close_price') or list_price)
                dom = int(row.get('days_on_market') or row.get('dom') or 0)
                addr = str(row.get('full_street_line') or row.get('street') or '')
                city = str(row.get('city') or '')
                if list_price <= 0:
                    continue
                pct_under = round((list_price - sold_price) / list_price * 100, 1) if list_price > 0 else 0
                results.append({
                    'address': f"{addr}, {city}".strip(', '),
                    'listPrice': list_price,
                    'soldPrice': sold_price,
                    'pctUnderList': pct_under,
                    'dom': dom,
                })

            if len(results) >= 3:
                comps = results[:5]
                break
            if len(results) > 0:
                comps = results
        except Exception as e:
            logging.getLogger("agent_finder.comps").warning("Comp scrape failed (%d mo): %s", months, e)
            continue

    if not comps:
        return {"comps": [], "avgPctUnderList": 0, "avgDom": 0, "note": "No comps found"}

    avg_pct = round(sum(c['pctUnderList'] for c in comps) / len(comps), 1)
    avg_dom = round(sum(c['dom'] for c in comps) / len(comps))
    return {"comps": comps, "avgPctUnderList": avg_pct, "avgDom": avg_dom}


# ── Background job runner ──

async def _run_job(job_id: str, agents):
    """Background task to run the pipeline."""
    job = jobs[job_id]

    def on_progress(data: dict):
        data["type"] = "progress"
        job["progress"].append(data)

    try:
        results = await run_pipeline(agents, progress_callback=on_progress)

        # Export to CSV
        result_path = str(DATA_DIR / f"{job_id}_results.csv")
        export_results_csv(results, result_path)

        # Build preview rows (first 30)
        preview = []
        for r in results[:30]:
            preview.append({
                "name": r.agent.name,
                "brokerage": r.agent.brokerage,
                "address": r.agent.address,
                "phone": r.phone,
                "email": r.email,
                "status": r.status.value,
                "source": r.source,
            })

        summary = generate_summary(results)

        job["status"] = "complete"
        job["result_path"] = result_path
        job["summary"] = summary
        job["preview_rows"] = preview
        _save_jobs()

    except asyncio.CancelledError:
        if job["status"] != "cancelled":
            job["status"] = "cancelled"
            _save_jobs()

    except Exception as e:
        import traceback
        traceback.print_exc()
        job["status"] = "error"
        job["error"] = str(e)
        _save_jobs()

    finally:
        _tasks.pop(job_id, None)


# ── Register router + serve frontend ──

app.include_router(api)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend" / "dist"
if FRONTEND_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        candidate = FRONTEND_DIR / full_path
        if candidate.is_file():
            return FileResponse(str(candidate))
        index_path = FRONTEND_DIR / "index.html"
        if index_path.exists():
            return HTMLResponse(content=index_path.read_text(encoding="utf-8"))
        raise HTTPException(404, "Frontend not built.")


def main():
    import uvicorn
    port = int(os.environ.get("PORT", 9000))
    print(f"\n  Agent Contact Finder v2")
    print(f"  Open http://localhost:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
```

**Step 2: Commit**

```bash
git add agent_finder/app.py
git commit -m "feat: add FastAPI app with 5 endpoints (upload, progress, download, jobs, delete)"
```

---

## Task 9: Rewrite frontend AgentFinder.jsx

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` (complete rewrite)

**Step 1: Replace AgentFinder.jsx**

Rewrite the component from scratch — simpler, focused on:
- File upload (drag-and-drop, keep existing UX feel)
- Processing view with progress bar + live ticker of agent names
- Results table: Name, Brokerage, Phone, Email, Status
- Download CSV button
- Job history

Key changes from old version:
- Remove: DonutRing, ConfidenceBar, StatusBadge complexity, column visibility toggles, group-by-agent, export menu with multiple formats, XLSX export
- Remove: `confidence`, `verified`, `list_date`, `dom` columns
- Simplify progress: just `completed/total` + `found` count + current agent name
- Results table: 5 columns (Name, Brokerage, Phone, Email, Status)
- Download: single CSV (not ZIP)
- Keep: drag-drop upload, SSE progress, job history, copy-to-clipboard, search/filter, GlassPanel styling

The component should match the existing Dispo Dojo ninja theme (GlassPanel, font-heading, text-gold, etc.).

**Step 2: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: rewrite AgentFinder.jsx — simplified contact finder UI"
```

---

## Task 10: Test end-to-end locally

**Step 1: Install backend dependencies**

```bash
cd agent_finder && pip install -r requirements.txt
```

**Step 2: Start the backend**

```bash
python -m agent_finder
```

**Step 3: Start the frontend dev server**

```bash
cd frontend && npm run dev
```

**Step 4: Test with the sample CSV**

Upload `03_02_26 Deal Sauce - lpp-export-7d707c6a-b800-4be6-9a22-89e42c02d2e6 (4).csv` through the UI. Verify:
- File uploads successfully
- SSE progress stream works
- Agents are being searched (check backend logs)
- Results table populates
- CSV download works

**Step 5: Fix any issues found during testing**

**Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during e2e testing"
```

---

## Task 11: Deploy

**Step 1: Push to GitHub**

```bash
git push origin master
```

**Step 2: Build frontend and deploy to Vercel**

```bash
cd frontend && npm run build && npx vercel --prod
```

**Step 3: Trigger Render backend deploy**

```bash
curl -X POST -H "Authorization: Bearer rnd_jkFEB43LeGTtw4Bwgt2v1ClsG04v" "https://api.render.com/v1/services/srv-d6h27m6a2pns7389f9i0/deploys"
```

**Step 4: Verify deployed version works**

Test upload on the live site.
