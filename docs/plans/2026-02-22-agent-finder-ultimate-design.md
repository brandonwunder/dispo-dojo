# Agent Finder — Ultimate Edition Design
**Date:** 2026-02-22
**Status:** Approved
**Scope:** Frontend-only enhancements to AgentFinder.jsx (all existing SSE/API logic unchanged)

---

## Context

The Agent Finder is a purpose-built tool for scraping the internet to find listing agent contact data for on-market property lists — because MLS bulk-export has been restricted. Users upload a CSV of property addresses; the backend resolves each address to an agent name, brokerage, phone, and email via free web sources. Currently using free data sources; paid sources planned for future.

**Key constraint:** Not-found results are a data-coverage problem, not a UX problem. Re-running them yields no improvement on free sources. No retry-batch feature.

**Goal:** Make this the best listing-agent lookup tool available, with no CRM features — purely a lookup and export tool.

---

## What Does NOT Change

- All SSE logic, API calls, state management
- Phase transitions (upload → processing → complete → error)
- GlassCard visual design + background layers
- DonutRing, StatusBadge, ConfidenceBar components
- Backend endpoints (except one new endpoint for inline job preview)
- Error phase
- All color tokens and typography

---

## Section 1 — Upload Phase

### CSV Preview Panel
Appears after a file is selected, before "Find Agents" is clicked. Slides in below the drop zone.

**Content:**
- Row count badge: `"847 addresses detected"` (cyan, Rajdhani font)
- Column detection line:
  - **Happy path:** `"✓ Address column: property_address"` (green)
  - **Not found:** `"⚠ No address column detected"` (gold warning) + dropdown to manually select which column maps to the address field
- Column mapper dropdown: shows all CSV headers as options; selection stored in state and sent with upload payload

**File size advisory** (warn, never block):
- > 1,000 rows: `"Large file — est. X min at current speed"` (X derived from last known processing rate from localStorage, else default 100 addr/min)
- Never prevents upload, purely informational

**Implementation note:** CSV is parsed client-side (first row for headers, total row count) using a simple line-count for .csv or a library read for .xlsx. No full in-memory parse needed.

---

## Section 2 — Processing Phase

### Live Address Ticker Feed
Replaces the single static `"Scanning: [current_address]"` line.

**Layout:** A scrolling log panel, ~160px tall, showing the last 6–8 SSE `progress` events. Each line shows:
```
[StatusBadge]  123 Main St, Phoenix AZ          cached
[StatusBadge]  456 Oak Ave, Scottsdale AZ        found
[StatusBadge]  789 Pine Rd, Tempe AZ             processing...
```
- Auto-scrolls to bottom on each new event
- Newest entry at bottom with a subtle pulse on the active row
- Older entries dim slightly (opacity 0.5) for visual hierarchy
- "processing..." shows a ShurikenLoader micro-spinner

### Speed Metric
Add `"142 addr/min"` alongside the existing ETA display. Calculated as `completed / elapsedSeconds * 60`, updated every 5 seconds to avoid jitter.

### Cache Savings Display
Below the progress bar, a small line in dim text:
`"127 addresses from cache — saved ~8 min"`
- Shows `progress.cached` count and estimated time saved (`cached * avgSecondsPerLive`)
- Only shown when `progress.cached > 0`
- Reinforces the growing value of the tool's internal cache

---

## Section 3 — Results Table (largest change)

### Filter Bar (above table)
```
[ All ] [ Found ] [ Partial ] [ Cached ] [ Not Found ]    [🔍 Search agent or brokerage...]
```
- Status pills: clicking one filters rows to that status only; "All" resets
- Active pill has cyan border + subtle glow
- Search input: live-filters `agent`, `agent_name`, `brokerage`, `office` fields as user types
- Filter state is local (not persisted); resets on "Process Another File"

### Sortable Columns
Column headers become clickable. Click once = ascending, click again = descending, click again = reset.
- Sort indicator: `▲` / `▼` icon inline with header label
- Sortable columns: Agent (alpha), Brokerage (alpha), Status (fixed order: found→partial→cached→not_found), Confidence (numeric desc default), DOM (numeric), List Date (date)
- Address column is not sortable (too address-format-dependent)

### One-Click Copy (Email & Phone)
On hover of any email or phone cell:
- A clipboard icon appears inline (right side of cell)
- Click → copies value to clipboard → cell briefly flashes cyan + shows `"Copied!"` tooltip for 1.5s
- Implementation: `navigator.clipboard.writeText()` with a local `copiedCell` state tracking `"rowIndex-field"`

### Agent Grouping Toggle
Button in table toolbar (right side):
- Default: `[ View by Property ]` — current behavior, one row per address
- Toggle: `[ View by Agent ]` — rows collapsed to one per unique agent

**View by Agent behavior:**
- Agent row shows: agent name, brokerage, phone, email, `"12 properties"` count badge (cyan pill)
- Confidence column shows average confidence across all their properties
- Clicking the row expands an indented sub-table of all their property addresses with individual statuses
- Agents sorted by property count descending (most listings first = highest priority target)
- Agents with `not_found` status only are shown at the bottom, dimmed

### Filtered Export Dropdown
Replaces the single "Download ZIP" button with a split button:
- Primary action: `Download All` (existing behavior)
- Dropdown arrow opens:
  - `Download Found Only`
  - `Download Partial Only`
  - `Download Not Found Only`
  - `Download Current View` (respects active filter pill + search)
- Dropdown styled as glass dropdown matching the card aesthetic
- Each option calls `GET /api/download/{jobId}?status=found` (new query param, backend must support)

### Bulk Copy
In the table toolbar, alongside the grouping toggle:
- `Copy All Emails` button — copies newline-separated list of all visible email values (respects active filter) to clipboard
- `Copy All Phones` button — same for phone numbers
- Both show a brief `"X emails copied"` / `"X phones copied"` toast
- Skips blank/`--` values automatically

### Column Visibility Toggle
A `⚙` gear icon in the table toolbar opens a small dropdown with checkboxes:
```
☑ Address     ☑ Agent       ☑ Brokerage
☑ Phone       ☑ Email       ☑ Status
☐ List Date   ☐ DOM         ☑ Confidence
```
- List Date and DOM default to hidden (common case: not needed for outreach)
- Selection saved to `localStorage` key `agentfinder_columns` and restored on next visit
- Hidden columns are excluded from all exports and bulk copy

---

## Section 4 — Complete Phase

### Browser Notification on Job Finish
When SSE fires a `complete` event:
- If `document.visibilityState === 'hidden'` (user is in another tab): fire a browser Notification
  - Title: `"Agent Finder — Run Complete"`
  - Body: `"847 addresses processed · 612 agents found (72%)"`
  - Icon: `/favicon.ico` or the compass icon
- Permission requested on first "Find Agents" click (before upload), not on page load
- If permission denied: silently skip, no error shown

---

## Section 5 — Job History

### Found Rate Badge
Each job history row gains a `"73% found"` badge (cyan pill) alongside the existing filename/date/count info. Calculated as `(found + partial + cached) / total * 100`, rounded to nearest integer.

### Inline Result Preview
Each job row gets a `▶` expand chevron on the right.

Clicking expands an inline panel below the row showing:
- A mini filter bar (status pills only, no search — keeps it compact)
- First 10 result rows in a condensed table (Address, Agent, Phone, Email, Status columns only)
- `"View all X results ↓"` link that scrolls to and populates a full results table below job history
- Data fetched from `GET /api/jobs/{jobId}/results` (new endpoint needed) on first expand, cached in component state thereafter

### Resume Monitoring
If a job in history has `status === 'processing'`:
- Show a pulsing cyan `"Live"` indicator badge instead of a status text
- Show a `"Monitor"` button that reconnects the SSE stream for that job and transitions the page to the processing phase live view
- Handles the "closed tab mid-run" case gracefully

---

## New Backend Endpoints Needed

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/download/{jobId}?status=found` | GET | Filtered ZIP download by status |
| `/api/jobs/{jobId}/results` | GET | Returns result rows for a job (for inline preview) |

All existing endpoints unchanged.

---

## State Changes in AgentFinder.jsx

| New State | Type | Purpose |
|---|---|---|
| `csvPreview` | `{ rowCount, detectedColumn, allColumns }` or null | CSV parse result shown before upload |
| `columnMap` | string or null | User-selected column name override |
| `tickerLog` | array (max 8) | Rolling SSE address log for live ticker |
| `activeStatusFilter` | string | Current results filter pill: 'all'/'found'/'partial'/'cached'/'not_found' |
| `tableSearch` | string | Current search string for agent/brokerage filter |
| `sortConfig` | `{ column, direction }` or null | Current sort state |
| `groupByAgent` | boolean | Whether results are in grouped mode |
| `visibleColumns` | Set of column keys | Loaded from localStorage, controls column display |
| `copiedCell` | string or null | Tracks `"rowIndex-field"` for copy flash animation |
| `expandedJobs` | Set of jobIds | Which history rows are expanded |
| `jobResults` | object (jobId → rows) | Cached inline preview data per job |
| `notifPermission` | string | 'default'/'granted'/'denied' |
| `processingSpeed` | number | Calculated addr/min, updated every 5s |

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/pages/AgentFinder.jsx` | All UX and state changes above |

## Files NOT Changed

- All other component files
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/Login.jsx`
- `frontend/src/components/Layout.jsx`
- Any backend files (except the two new endpoints noted above)

---

## Verification Checklist

1. Upload a CSV — confirm row count + column detection appear before submit
2. Upload a CSV with non-standard column name — confirm mapper dropdown appears and works
3. Run a job — confirm ticker feed scrolls, speed metric shows, cache savings appear when > 0
4. Complete a job — switch to another tab during processing, confirm browser notification fires
5. Results table: confirm filter pills, search, column sort all work independently and together
6. Hover email cell — confirm copy icon appears, click copies to clipboard, flash shows
7. Toggle agent grouping — confirm rows collapse by agent, sorted by count desc
8. Filtered export — confirm each dropdown option downloads correct subset
9. Bulk copy — confirm "Copy All Emails" copies only visible rows, skips blanks
10. Column visibility — hide DOM and List Date, reload page, confirm hidden state persists
11. Job history: confirm found rate badge shows on all completed jobs
12. Expand a job row — confirm inline preview loads first 10 rows with status filter
13. If a job is in `processing` status in history — confirm Monitor button reconnects SSE
