# Agent Contact Finder v2 — Design Document

**Date:** 2026-03-03
**Status:** Approved
**Goal:** Rebuild agent finder from scratch. Given a CSV with agent names + brokerages, find their phone numbers and emails for free.

## Problem

The old system scraped Redfin/Zillow/Realtor to re-discover the agent name from a property address — but the CSV already contains the agent name and brokerage. The real need is just: **given agent name + brokerage, find phone + email**.

The old system was also over-engineered (15 endpoints, SQLite cache, circuit breakers, multi-source confidence scoring, 5 scrapers) and broke because the property-listing sites blocked us.

## Input Format

CSV/Excel with columns like:
- `Street Address`, `City`, `State`, `Postal Code`, `List Price`, `Name` (agent), `Broker`
- Tool auto-detects which columns contain agent name and brokerage
- Typical batch size: 500+ rows

## Approach: Hybrid (3-pass search)

### Pass 1 — Google Search Snippets (primary, ~60-70% hit rate)
- Query: `"Agent Name" "Brokerage" real estate agent phone email`
- Parse HTML snippets for phone (regex) and email (regex)
- Also collect any profile URLs (Realtor.com, Zillow, brokerage sites) for Pass 2
- Rate limit: 3-7 sec random delay between requests (Google is strict)
- Process one at a time (no concurrency for Google)

### Pass 2 — Realtor.com Agent Profile (fallback, for agents not found in Pass 1)
- Visit `realtor.com/realestateagents/{agent-name-slug}` or URL from Google results
- Parse agent profile page for phone number
- Rate limit: 1-3 sec delay

### Pass 3 — Email Pattern Guessing (for agents with phone but no email)
- Google the brokerage to find its domain
- Generate common patterns: `first.last@domain`, `flast@domain`, `first@domain`
- Optional MX record check to verify domain accepts email

### Anti-blocking (all free)
- Rotating User-Agent pool (20+ real browser UAs)
- Random delay jitter
- HTTP/2 via httpx
- Realistic headers (Accept-Language, etc.)

## Architecture

```
agent_finder/
├── app.py                 — FastAPI, 5 endpoints
├── models.py              — AgentRow, ContactResult, Job
├── pipeline.py            — Async orchestrator with batching + rate limiting
├── input_handler.py       — CSV/Excel parsing, column auto-detection
├── output_handler.py      — CSV export (original columns + phone/email appended)
└── searchers/
    ├── google_search.py   — Google search HTML scraping + regex extraction
    ├── realtor_profile.py — Realtor.com agent directory scraping
    └── email_guesser.py   — Email pattern generation + MX verification
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/upload` | Upload CSV → returns job_id, starts processing |
| GET | `/api/progress/{job_id}` | SSE stream: current/total/found/agent_name |
| GET | `/api/download/{job_id}` | Download enriched CSV |
| GET | `/api/jobs` | List past jobs |
| DELETE | `/api/jobs/{job_id}` | Delete a job |

## Frontend (AgentFinder.jsx — simplified)

- File upload with drag-and-drop (keep existing UX)
- Simple progress bar: "Processing 142 of 500 agents... 87 contacts found"
- Ticker showing last few agents processed
- Results table: Name, Brokerage, Phone (found), Email (found), Status
- Download button for enriched CSV
- Job history panel

**Removed:** confidence scores, verified badges, donut chart, multi-source breakdown, column visibility toggles, group-by-agent mode.

## Data Models

```python
@dataclass
class AgentRow:
    name: str           # From CSV "Name" column
    brokerage: str      # From CSV "Broker" column
    address: str        # For reference (Street Address)
    city: str
    state: str
    zip_code: str
    row_index: int      # To merge results back to original row
    extra_columns: dict # All other CSV columns preserved

@dataclass
class ContactResult:
    phone: str          # (XXX) XXX-XXXX or empty
    email: str          # or empty
    source: str         # "google", "realtor", "email_guess"
    status: str         # "found", "partial", "not_found"

@dataclass
class Job:
    job_id: str
    filename: str
    total_rows: int
    processed: int
    found: int
    status: str         # "processing", "complete", "error", "cancelled"
    results: list[ContactResult]
    created_at: datetime
```

## Performance Estimates (500 agents)

- Pass 1 (Google): ~500 * 5sec avg = ~42 min
- Pass 2 (Realtor, ~30% of agents): ~150 * 2sec = ~5 min
- Pass 3 (Email guess, ~20% of agents): ~100 * 1sec = ~2 min
- **Total: ~45-50 min for 500 agents**
- Expected overall hit rate: 70-85%

## Constraints

- 100% free — no paid APIs or scrapers
- Must run on Render free tier (512MB RAM)
- No ScraperAPI dependency
- Simple, maintainable codebase
