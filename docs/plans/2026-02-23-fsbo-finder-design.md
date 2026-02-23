# FSBO Finder — Design Document
**Date:** 2026-02-23
**Status:** Approved

---

## Overview

Build a real backend for the FSBO Finder page. The tool accepts a location (zip code(s) or city/state) plus filters, scrapes 5 sources concurrently for for-sale-by-owner listings, merges and enriches contact info (owner name, phone, email), streams real-time progress via SSE, and exports results as CSV/XLSX.

The frontend shell (`FSBOFinder.jsx`) already exists with mock data — this design wires it up to a real pipeline.

---

## Architecture

### New Backend Files

```
agent_finder/
├── fsbo_pipeline.py              ← orchestrates all FSBO scrapers
├── fsbo_models.py                ← FSBOListing + FSBOSearchCriteria dataclasses
└── scrapers/
    ├── fsbo_com.py               ← FSBO.com (best contact quality)
    ├── forsalebyowner_com.py     ← ForSaleByOwner.com (strong contact)
    ├── zillow_fsbo.py            ← Zillow FSBO search (high volume)
    ├── realtor_fsbo.py           ← Realtor.com FSBO via HomeHarvest
    └── craigslist_fsbo.py        ← Craigslist by-owner (volume + phone from body)
```

### New API Endpoints (added to `app.py`)

```
POST   /api/fsbo/search              start a search job → returns search_id
GET    /api/fsbo/progress/{id}       SSE stream of real-time progress
GET    /api/fsbo/results/{id}        paginated JSON results (20/page)
GET    /api/fsbo/download/{id}       CSV or XLSX export
DELETE /api/fsbo/jobs/{id}           clear a past search job
```

### Reused from Agent Finder
- `BaseScraper` — rate limiting, retry, circuit breaker, rotating user agents
- `Cache` — SQLite, 24hr TTL for FSBO results
- SSE progress event format
- CSV/XLSX export pattern
- `jobs.json` persistence for restart resilience

---

## Data Models (`fsbo_models.py`)

```python
@dataclass
class FSBOSearchCriteria:
    location: str                        # "85001" or "Phoenix, AZ"
    location_type: str                   # "zip" | "city_state"
    radius_miles: int = 25
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_beds: Optional[int] = None
    min_baths: Optional[float] = None
    property_type: Optional[str] = None  # "single_family" | "condo" | "multi_family" | "land"
    max_days_on_market: Optional[int] = None

@dataclass
class FSBOListing:
    address: str
    city: str
    state: str
    zip_code: str
    price: Optional[int]
    beds: Optional[int]
    baths: Optional[float]
    sqft: Optional[int]
    property_type: Optional[str]
    days_on_market: Optional[int]
    owner_name: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    listing_url: str
    source: str          # "fsbo.com" | "forsalebyowner.com" | "zillow" | "realtor" | "craigslist"
    contact_status: str  # "complete" | "partial" | "phone_only" | "anonymous"
    scraped_at: datetime
```

`contact_status` values:
- `complete` — name + phone + email all present
- `partial` — name + at least one of phone/email
- `phone_only` — phone found (common for Craigslist), no email
- `anonymous` — Craigslist relay-masked email, no phone found in body

---

## Scrapers

### Source Comparison

| Source | Volume | Owner Name | Phone | Email | Method |
|--------|--------|-----------|-------|-------|--------|
| FSBO.com | Medium | ✅ Always | ✅ Usually | ✅ Sometimes | BeautifulSoup, paginated |
| ForSaleByOwner.com | Medium | ✅ Always | ✅ Usually | ✅ Sometimes | BeautifulSoup, paginated |
| Zillow FSBO | High | ⚠️ Sometimes | ✅ Often | ❌ Rarely | Stingray API, `isForSaleByOwner=true` |
| Realtor.com FSBO | High | ⚠️ Sometimes | ⚠️ Sometimes | ❌ Rarely | HomeHarvest library |
| Craigslist | High | ❌ Anonymous | ✅ Regex body | ⚠️ Relay-masked | BeautifulSoup, area map |

### Rate Limits

| Source | Rate | Concurrency |
|--------|------|-------------|
| FSBO.com | 0.5 req/sec | 2 |
| ForSaleByOwner.com | 0.5 req/sec | 2 |
| Zillow FSBO | 1 req/sec | 3 |
| Realtor.com | 0.5 req/sec | 2 (thread executor) |
| Craigslist | 1 req/sec | 3 |

### Craigslist Area Code Map
Map zip codes and city/state inputs to Craigslist subdomain (e.g., `phoenix.craigslist.org`). Use a bundled JSON lookup table of ~300 major metro areas. Fallback: skip Craigslist if area not found.

---

## Pipeline Flow (`fsbo_pipeline.py`)

```
1. Receive FSBOSearchCriteria
2. Check cache (SHA256 of all criteria fields) — return immediately if <24hr old
3. Fire all 5 scrapers concurrently via asyncio.gather()
4. As each scraper yields batches of listings, call progress_callback
5. After all done: deduplicate by normalized address
6. Merge: group duplicates, take best owner_name, combine phone/email
7. Enrichment pass: for partial-contact listings, attempt web search for missing fields
8. Write merged results to cache + export file
9. Mark job complete
```

### SSE Progress Event Shape

```json
{
  "scrapers_done": 3,
  "scrapers_total": 5,
  "listings_found": 47,
  "current_source": "craigslist",
  "status": "running"
}
```

Final event: `{ "status": "complete", "total_listings": 63 }`

### Cache Key
SHA256 of: `location + location_type + radius + min_price + max_price + min_beds + min_baths + property_type + max_dom`

### Job Storage
Same `jobs.json` pattern as Agent Finder — persists across server restarts.

### Export Columns
`address, city, state, zip, price, beds, baths, sqft, property_type, days_on_market, owner_name, phone, email, source, contact_status, listing_url`

---

## Frontend Changes (`FSBOFinder.jsx`)

### Search Form (replace mock trigger)
- Location input: accepts zip(s) comma-separated OR "City, ST" — auto-detects type
- Radius dropdown: 10 / 25 / 50 miles (shown only for city_state input)
- Filters: min price, max price, min beds, min baths, property type, max DOM
- "Search FSBO Listings" CTA → `POST /api/fsbo/search`

### Progress State (new)
- Progress bar showing scrapers completing
- Source badges light up green as each finishes: FSBO.com ✓ ForSaleByOwner ✓ Zillow... Realtor... Craigslist...
- Live counter: "47 listings found so far..."

### Results Table (wire up real data)
Columns: Address | Owner Name | Phone | Email | Price | Beds/Baths | DOM | Source | Contact Badge

Contact badge colors:
- Green = `complete`
- Gold = `partial` / `phone_only`
- Red = `anonymous`

Clickable listing URL on address cell. Sortable columns (price, DOM, contact_status).

### Export
CSV or XLSX download picker (same pattern as Agent Finder).

### Recent Searches Sidebar
Past search jobs list: location, result count, timestamp. Click to reload results.

### Visual Style
No redesign — preserve existing Dispo Dojo glassmorphism. Wire data only.

---

## Error Handling

- If a scraper hits 10 consecutive failures → circuit breaker opens, that source skipped for this job
- If all scrapers fail → job marked `error`, user sees error state in UI
- If location not recognized by Craigslist map → Craigslist skipped silently, other 4 sources still run
- Partial results always saved — if job is cancelled mid-run, whatever was found is kept

---

## Out of Scope (V1)

- Facebook Marketplace (requires authentication)
- ByOwner.com (low volume, redundant with FSBO.com)
- Scheduled/recurring searches
- Email outreach integration
- Phone skip-tracing beyond what's on listing pages
