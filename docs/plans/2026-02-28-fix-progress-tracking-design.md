# Fix Agent Finder Progress Tracking — Design

## Problem

Progress bar shows incorrect numbers when cached results exist:
- 11/9 completed (122%) — exceeds total
- -2 remaining — goes negative
- 762 cached items counted separately from total

Root cause: `pipeline.py` resets `_total` to only pending (uncached) addresses, but the frontend displays cached count alongside a denominator that doesn't include them. Retried addresses also double-count completions.

## Design

### Backend: Accurate Progress Math (`pipeline.py`)

**`_total` = ALL addresses in the upload** (cached + pending). Never reset to pending-only.

Progress callback always emits:
```
completed = cached + found + partial + not_found + errors
total     = all addresses in the file
```

This guarantees: `0 <= completed <= total` at all times.

**Retry guard:** Track processed addresses in a set. If an address is retried, don't increment completion counters again.

### Backend: Two-Phase Events (`pipeline.py` + `app.py`)

**Phase 1 — Cache Load:**
Emit a single progress event after cache resolution:
```json
{
  "type": "progress",
  "completed": 762,
  "total": 771,
  "cached": 762,
  "found": 0, "partial": 0, "not_found": 0,
  "current_address": "",
  "current_status": "cached"
}
```

**Phase 2 — Live Scraping:**
Each address fires a progress event with cumulative totals:
```json
{
  "type": "progress",
  "completed": 764,
  "total": 771,
  "cached": 762,
  "found": 2, "partial": 0, "not_found": 0,
  "current_address": "123 Main St, Phoenix AZ",
  "current_status": "found"
}
```

### Frontend: Progress Display (`AgentFinder.jsx`)

- **Progress %** = `Math.min(100, Math.round(completed / total * 100))`
- **Remaining** = `Math.max(0, total - completed)`
- **Progress bar width** = clamped to 100%
- Show cached count as a separate stat ("762 from cache")

### Files Changed

| File | Change |
|------|--------|
| `agent_finder/pipeline.py` | Keep `_total` as full upload size, add retry dedup set, fix completed math |
| `frontend/src/pages/AgentFinder.jsx` | Clamp progress to 0-100%, remaining to >= 0 |

### What Stays the Same

- Scraping sources (Redfin, Realtor, HomeHarvest)
- Output columns (agent name, phone, email, brokerage, listing price, DOM, etc.)
- Cache system (SQLite, TTL-based)
- SSE streaming protocol
- Export format (ZIP with 3 CSVs)
