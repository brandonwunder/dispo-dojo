# FSBO Finder Redesign — Design Document

**Date:** 2026-02-23
**Status:** Approved

---

## Problem

The FSBOFinder page uses a "hunting grounds" forest theme that is visually inconsistent with the Electric Ninja Command Center aesthetic established in AgentFinder. The free-text location input has no structure or validation, leading to ambiguous searches. Search results are ephemeral — lost on page refresh or server restart — making it impossible to track past lead searches. There is no per-source transparency about what each scraper found.

---

## Goal

Deliver a cohesive, professional FSBO lead-finding experience that:
1. Matches the AgentFinder visual design exactly (glassmorphism, cyan accents, FSBO background image)
2. Replaces free-text location with a structured State → City/ZIP hierarchical search
3. Shows per-source result counts during and after scraping
4. Persists search history and results to SQLite so they survive page refresh and server restart
5. Updates all copy: "FSBO Lead Finder", "Search" button, removes CRM pipeline line

---

## Architecture

### Frontend
- `FSBOFinder.jsx` — full redesign; replaces WoodPanel/forest theme with GlassCard + layered background
- `SearchableSelect.jsx` (new) — reusable searchable dropdown component (Radix Popover + filtered list)
- `usLocations.js` (new data file) — static list of 50 US states + ~50–100 major cities per state

### Backend
- `agent_finder/fsbo_db.py` (new) — SQLite persistence module; creates and manages `fsbo.db`
- `agent_finder/app.py` — FSBO endpoints updated to read/write SQLite instead of in-memory dicts

---

## Section 1: Visual Theme

**Background:**
- `FSBO Background Picture.png` copied to `frontend/public/fsbo-bg.png`
- Layered identically to AgentFinder's `agent-finder-bg.png`:
  - Layer 0 (z-0): Fixed background image, `position: 82% 30%`, `size: 120%`
  - Layer 1: Radial gradient darkening over the image center
  - Layer 2: Left-edge linear darkening gradient
  - Layer 3: Bottom fade to `#0B0F14`
- All content at `z-10`

**Components:**
- All WoodPanel, forest scene, tree silhouettes, moon glow → removed
- Replaced with GlassCard pattern (same as AgentFinder):
  - `background: rgba(11, 15, 20, 0.82)`
  - `backdropFilter: blur(20px) saturate(1.2)`
  - `border: 1px solid rgba(0, 198, 255, 0.12)`
  - Cyan top-accent line: `linear-gradient(90deg, transparent, rgba(0,198,255,0.5), transparent)`

**Colors:** `#00C6FF` (cyan), `#F6C445` (gold), `#0B0F14` (bg), `#F4F7FA` (text), `#C8D1DA` (dim)
**Typography:** Rajdhani (headings), DM Sans (body), Onari (display title)

**Text changes:**
- "The Hunting Grounds" → **"FSBO Lead Finder"**
- "Hunt" button → **"Search"**
- CRM pipeline info banner → **removed entirely**
- "Targets" → **"Listings"** throughout
- "No targets found in the hunting grounds" → **"No listings found for this search"**

**Hero header:**
- `Home` icon (lucide-react) with cyan drop-shadow glow (`drop-shadow(0 0 12px rgba(0,198,255,0.7))`)
- Title: "FSBO Lead Finder" in `font-display text-4xl`
- Subtitle: "Search For Sale By Owner listings across the US — powered by multiple free data sources."

---

## Section 2: Search Form

**Structure (GlassCard panel):**

Row 1 — Location:
- **State dropdown** (SearchableSelect): full-width mobile, 50% desktop; all 50 US states + DC; placeholder "Select a state..."
- **City / ZIP dropdown** (SearchableSelect): full-width mobile, 50% desktop; disabled until state selected; shows major cities for selected state; if user types 5 digits, shows "Use ZIP: XXXXX" as top option; placeholder "Select city or enter ZIP..."

Row 2 — Filters (collapsible, same fields as current):
- Price Min / Price Max (number inputs)
- Min Beds / Min Baths (select: Any, 1, 2, 3, 4, 5+)
- Property Type (select: All, Single Family, Multi-Family, Condo, Townhouse, Land)
- Max Days Listed (number input)

Row 3 — Action:
- "Search" button (gold shimmer, full-width on mobile)

**SearchableSelect component spec:**
- Props: `value`, `onChange`, `options: [{value, label}]`, `placeholder`, `disabled`
- Trigger: styled button showing selected label or placeholder; cyan border on focus/open
- Popover: GlassCard style; search input at top with magnifier icon; scrollable filtered list below
- ZIP detection: if `options` array is city list and input matches `/^\d{5}$/`, inject synthetic option `{value: input, label: 'Use ZIP: '+input, isZip: true}`
- Keyboard: ArrowUp/Down navigate, Enter selects, Escape closes

**Location → API mapping:**
- City selected: `location = "Phoenix, AZ"`, `location_type = "city_state"`
- ZIP option selected: `location = "85001"`, `location_type = "zip"`

**Data file (`frontend/src/data/usLocations.js`):**
```js
export const US_STATES = [
  { code: 'AL', name: 'Alabama' }, ...
]
export const CITIES_BY_STATE = {
  AL: ['Birmingham', 'Montgomery', 'Huntsville', ...],
  AZ: ['Phoenix', 'Tucson', 'Scottsdale', ...],
  // ~50–100 cities per state
}
```

---

## Section 3: Progress Display & Results

**Progress panel (GlassCard, shown while searching):**
- Gold shimmer progress bar (same `progressShimmer` keyframe animation as AgentFinder)
- "Searching [City, State] across 5 sources..." label
- 5-chip source grid, one per scraper (Zillow, FSBO.com, ForSaleByOwner, Realtor, Craigslist):
  - Spinning indicator while running
  - On complete: count badge — "4 listings" (green) or "0 listings" (dim gray)
- Live counter: "X listings found so far..." (increments in real-time via SSE)

**Results section (after search completes):**
- Summary bar: "X FSBO Listings — [City, State]" + Export CSV button (cyan link)
- Filter pills: All | Has Phone | Has Email | Has Contact (same pill style as AgentFinder)
- 2-column card grid (GlassCard per card):
  - Address (bold, white) + Price (gold, `font-heading text-xl`)
  - Beds / Baths / DOM row (dim text, icons)
  - Source badge (color-coded) + Contact Status badge
  - Phone / email row (shown if available, "—" if not)
  - "View Listing →" button (cyan, only if `listing_url` present)
- Empty state: "No listings found for this search — try a nearby city or different state."

---

## Section 4: Past Searches (Persistent History)

### Backend — `agent_finder/fsbo_db.py`

SQLite database at `agent_finder/data/fsbo.db`. Schema:

```sql
CREATE TABLE fsbo_searches (
  search_id TEXT PRIMARY KEY,
  state TEXT,
  city_zip TEXT,
  location TEXT,
  location_type TEXT,
  created_at TEXT,
  status TEXT,
  total_listings INTEGER DEFAULT 0,
  criteria_json TEXT
);

CREATE TABLE fsbo_listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  search_id TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  price INTEGER,
  beds INTEGER,
  baths REAL,
  days_on_market INTEGER,
  phone TEXT,
  email TEXT,
  owner_name TEXT,
  listing_url TEXT,
  source TEXT,
  contact_status TEXT
);
```

**API changes (`app.py`):**
- `POST /api/fsbo/search` → writes row to `fsbo_searches` at start
- `_run_fsbo_pipeline()` background task → writes all listings to `fsbo_listings` on completion; updates `fsbo_searches.status` and `total_listings`
- `GET /api/fsbo/searches` → reads from SQLite (ordered by `created_at DESC`)
- `GET /api/fsbo/results/{id}` → reads from SQLite `fsbo_listings`
- `DELETE /api/fsbo/searches/{id}` → deletes from both tables

### Frontend — "Past Searches" section

- Positioned below active results (or below search form when no active search)
- Matches AgentFinder's "Past Runs" section aesthetically:
  - Section header: "Past Searches" with count badge
  - Each row: `[State Flag/code] [City, ST]` · `[date]` · `[N listings]` badge · expand chevron · delete (×)
  - Badge: green (`rgba(74,124,89,0.2)`) if listings > 0, dim gray if 0
  - Expand → shows result cards inline (same card component as live results)
- "Clear All" button (danger style) to wipe all history
- Fetched on page load via `GET /api/fsbo/searches`; refreshes after each new search completes

---

## Verification

1. `npm run build` in `frontend/` — zero TypeScript/lint errors
2. Visit `http://localhost:9000/fsbo-finder`
3. Page loads with FSBO background image + 4-layer gradient fade (matches AgentFinder look)
4. State dropdown: searchable, all 50 states listed
5. Select "Arizona" → City/ZIP dropdown enables, shows AZ cities
6. Type "85001" → ZIP option appears at top of city dropdown
7. Run a search → progress bar animates, 5 source chips update with counts
8. Search completes → results grid shows with filter pills and CSV export
9. Refresh page → Past Searches section shows previous search with result count
10. Expand past search → result cards display correctly
11. Delete a past search → removed from list
