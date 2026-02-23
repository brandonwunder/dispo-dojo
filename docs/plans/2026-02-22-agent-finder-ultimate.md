# Agent Finder — Ultimate Edition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade AgentFinder.jsx with 12 self-contained UX features that make this the best listing-agent lookup tool available — CSV preview, live ticker, sortable/filterable table, one-click copy, agent grouping, filtered export, bulk copy, column visibility, browser notifications, and enhanced job history.

**Architecture:** All changes are confined to `frontend/src/pages/AgentFinder.jsx`. No new component files. All new state variables are added at the top of the component body. All new computed values (filtered rows, grouped rows) use `useMemo`. Backend is untouched except for one new endpoint needed in Task 11 (inline job preview).

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Framer Motion, Lucide React (already installed), `navigator.clipboard` API, `Notification` API, `localStorage`, `FileReader` API (built-in browser)

---

## Context for Every Task

**File:** `frontend/src/pages/AgentFinder.jsx` (1,064 lines)
**Dev server:** `cd frontend && npm run dev` → http://localhost:5173 (or next available port)
**Key line anchors:**
- Imports: line 1
- State declarations: lines 162–183
- `loadJobs`: line 213
- `handleUpload`: line 225
- `connectSSE`: line 258
- `handleReset`: line 338
- Computed values block: lines 387–397
- Return / JSX begins: line 401
- Background layers: lines 411–445
- Processing phase JSX: ~line 623
- Complete phase JSX: ~line 748
- Job history JSX: ~line 956

**Design doc:** `docs/plans/2026-02-22-agent-finder-ultimate-design.md`

---

## Task 1: CSV Preview Panel

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** After a .csv file is selected (before clicking "Find Agents"), a panel slides in below the drop zone showing the detected row count, detected address column name (or a dropdown to pick one), and a large-file advisory.

---

**Step 1: Add `useMemo` to the React import**

Current line 1:
```javascript
import { useState, useEffect, useRef, useCallback } from 'react'
```
Change to:
```javascript
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
```

---

**Step 2: Add the `parseCSVPreview` helper function**

Add this after the `isValidFile` function (around line 384), before the `// ── Computed values ──` comment:

```javascript
async function parseCSVPreview(file) {
  return new Promise((resolve) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      // For .xlsx/.xls we can't parse client-side without a library — skip
      resolve({ rowCount: null, detectedColumn: null, allColumns: [] })
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length === 0) { resolve(null); return }
        const rawHeaders = lines[0].split(',')
        const headers = rawHeaders.map(h =>
          h.trim().replace(/^["']|["']$/g, '').toLowerCase()
        )
        const rowCount = lines.length - 1
        const addressKeywords = ['address', 'property_address', 'prop_address', 'street', 'location', 'addr']
        const detectedColumn = headers.find(h =>
          addressKeywords.some(kw => h === kw || h.includes(kw))
        ) || null
        resolve({ rowCount, detectedColumn, allColumns: headers })
      } catch {
        resolve(null)
      }
    }
    reader.onerror = () => resolve(null)
    reader.readAsText(file)
  })
}
```

---

**Step 3: Add new state variables**

In the state block (after line 183, before `const fileInputRef`), add:

```javascript
const [csvPreview, setCsvPreview] = useState(null) // { rowCount, detectedColumn, allColumns }
const [columnMap, setColumnMap] = useState(null)   // user-selected column override
```

---

**Step 4: Add useEffect to parse CSV when file changes**

After the existing ETA `useEffect` (after line 209), add:

```javascript
// ── Parse CSV preview when file is selected ──
useEffect(() => {
  if (!file) {
    setCsvPreview(null)
    setColumnMap(null)
    return
  }
  parseCSVPreview(file).then(preview => {
    setCsvPreview(preview)
    setColumnMap(null) // reset any prior manual selection
  })
}, [file])
```

---

**Step 5: Include columnMap in the upload FormData**

In `handleUpload` (line 230–231), after `formData.append('file', file)`, add:

```javascript
if (columnMap) {
  formData.append('address_column', columnMap)
}
```

---

**Step 6: Reset csvPreview and columnMap in handleReset**

In `handleReset` (line 338), after `setEta(null)`, add:

```javascript
setCsvPreview(null)
setColumnMap(null)
```

---

**Step 7: Add the CSV Preview Panel JSX**

In the upload phase JSX, find the file selected display area (the area that shows the file name and size after a file is picked — look for `file && ` rendering logic around line 560). Add this block BELOW the file name/size display and ABOVE the "Find Agents" button:

```jsx
{/* CSV Preview Panel */}
{file && csvPreview && (
  <div style={{
    marginTop: '12px',
    padding: '12px 16px',
    background: 'rgba(0,198,255,0.05)',
    border: '1px solid rgba(0,198,255,0.15)',
    borderRadius: '10px',
  }}>
    {/* Row count */}
    {csvPreview.rowCount != null && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {csvPreview.rowCount.toLocaleString()} addresses detected
        </span>
        {csvPreview.rowCount > 1000 && (
          <span style={{ color: '#F6C445', fontSize: '11px', fontFamily: 'DM Sans, sans-serif' }}>
            · est. {Math.round(csvPreview.rowCount / 100)} min
          </span>
        )}
      </div>
    )}
    {/* Column detection */}
    {csvPreview.detectedColumn ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4a7c59', fontFamily: 'DM Sans, sans-serif' }}>
        <span>✓</span>
        <span>Address column: <strong>{csvPreview.detectedColumn}</strong></span>
      </div>
    ) : csvPreview.allColumns.length > 0 ? (
      <div style={{ fontSize: '12px', color: '#F6C445', fontFamily: 'DM Sans, sans-serif' }}>
        <span>⚠ No address column detected — pick one:</span>
        <select
          value={columnMap || ''}
          onChange={e => setColumnMap(e.target.value || null)}
          style={{
            marginLeft: '8px',
            background: 'rgba(11,15,20,0.8)',
            border: '1px solid rgba(0,198,255,0.3)',
            borderRadius: '6px',
            color: '#F4F7FA',
            fontSize: '12px',
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          <option value="">Select column...</option>
          {csvPreview.allColumns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>
    ) : null}
  </div>
)}
```

---

**Step 8: Verify in browser**

1. Run `npm run dev` from `frontend/`
2. Navigate to `/agent-finder` (log in first)
3. Drag in a .csv file → confirm preview panel appears showing row count + column name
4. Try a .csv with a non-standard column like "prop_addr" → confirm warning + dropdown appear
5. Try a .xlsx file → confirm no preview panel (graceful skip)

---

**Step 9: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add CSV preview panel with row count and column detection"
```

---

## Task 2: Live Address Ticker + Speed Metric + Cache Savings

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Replaces the single static "Scanning: [address]" row with a scrolling log of the last 8 SSE-resolved addresses, each showing its result status badge. Adds an `addr/min` speed metric and a "X from cache" display.

---

**Step 1: Add new state and refs**

In the state block (after the `columnMap` state added in Task 1), add:

```javascript
const [tickerLog, setTickerLog] = useState([])     // rolling last-8 resolved addresses
const [processingSpeed, setProcessingSpeed] = useState(null) // addr/min
```

After the existing `sseRef` and `startTimeRef` refs, add:

```javascript
const prevProgressRef = useRef({ found: 0, partial: 0, cached: 0, not_found: 0 })
const prevAddressRef = useRef('')
const tickerRef = useRef(null) // DOM ref for auto-scroll
```

---

**Step 2: Update the SSE progress handler to build the ticker log**

In `connectSSE` (line 270), find the `if (data.type === 'progress')` block. Replace it entirely:

```javascript
if (data.type === 'progress') {
  const prev = prevProgressRef.current
  const prevAddr = prevAddressRef.current

  // Determine the status of the address that just finished
  let finishedStatus = null
  if (prevAddr) {
    if ((data.found || 0) > prev.found) finishedStatus = 'found'
    else if ((data.partial || 0) > prev.partial) finishedStatus = 'partial'
    else if ((data.cached || 0) > prev.cached) finishedStatus = 'cached'
    else if ((data.not_found || 0) > prev.not_found) finishedStatus = 'not_found'
  }

  if (finishedStatus && prevAddr) {
    setTickerLog(current => [
      ...current,
      { address: prevAddr, status: finishedStatus, id: Date.now() }
    ].slice(-8))
  }

  prevProgressRef.current = {
    found: data.found || 0,
    partial: data.partial || 0,
    cached: data.cached || 0,
    not_found: data.not_found || 0,
  }
  prevAddressRef.current = data.current_address || ''

  setProgress({
    completed: data.completed || 0,
    total: data.total || 0,
    found: data.found || 0,
    partial: data.partial || 0,
    cached: data.cached || 0,
    not_found: data.not_found || 0,
    current_address: data.current_address || '',
  })
}
```

---

**Step 3: Add speed calculation to the existing ETA useEffect**

Find the ETA `useEffect` (line 200–209). Add two lines inside the `if (progress.completed > 0)` block:

```javascript
useEffect(() => {
  if (phase !== 'processing' || !startTimeRef.current) return
  const elapsed = (Date.now() - startTimeRef.current) / 1000
  const remaining = progress.total - progress.completed
  if (progress.completed > 0) {
    const perItem = elapsed / progress.completed
    setEta(perItem * remaining)
    // Speed metric — only show after 10+ seconds to avoid wild early estimates
    const elapsedMin = elapsed / 60
    if (elapsed > 10) {
      setProcessingSpeed(Math.round(progress.completed / elapsedMin))
    }
  }
}, [progress.completed, progress.total, phase])
```

---

**Step 4: Reset ticker and speed in handleReset and handleCancel**

In `handleReset`:
```javascript
setTickerLog([])
setProcessingSpeed(null)
prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
prevAddressRef.current = ''
```

In `handleCancel` (line 311), after the `setProgress(...)` reset line:
```javascript
setTickerLog([])
setProcessingSpeed(null)
prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
prevAddressRef.current = ''
```

---

**Step 5: Add auto-scroll useEffect**

After the CSV preview `useEffect` from Task 1, add:

```javascript
// ── Auto-scroll ticker to bottom on new entries ──
useEffect(() => {
  if (tickerRef.current) {
    tickerRef.current.scrollTop = tickerRef.current.scrollHeight
  }
}, [tickerLog])
```

---

**Step 6: Replace the "Scanning:" row in the processing phase JSX with the ticker**

Find the processing phase JSX (around line 700–720) where `progress.current_address` is displayed — it looks like:
```jsx
<div>... ShurikenLoader ... Scanning: {progress.current_address} ...</div>
```

Replace that entire scanning row block with:

```jsx
{/* Live Address Ticker */}
<div style={{ marginBottom: '16px' }}>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
    <span style={{ color: '#00C6FF', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
      Live Feed
    </span>
    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#C8D1DA', fontFamily: 'DM Sans, sans-serif' }}>
      {processingSpeed != null && (
        <span>{processingSpeed} addr/min</span>
      )}
      {eta != null && (
        <span>ETA {formatETA(eta)}</span>
      )}
    </div>
  </div>

  {/* Scrolling log */}
  <div
    ref={tickerRef}
    style={{
      height: '160px',
      overflowY: 'auto',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(0,198,255,0.08)',
      borderRadius: '8px',
      padding: '8px',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(0,198,255,0.2) transparent',
    }}
  >
    {tickerLog.map(entry => (
      <div
        key={entry.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '3px 4px',
          fontSize: '12px',
          fontFamily: 'DM Sans, sans-serif',
          color: '#C8D1DA',
          opacity: 0.85,
        }}
      >
        <StatusBadge status={entry.status} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {entry.address}
        </span>
      </div>
    ))}
    {/* Active address row */}
    {progress.current_address && (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '3px 4px',
        fontSize: '12px',
        fontFamily: 'DM Sans, sans-serif',
        color: '#F4F7FA',
      }}>
        <ShurikenLoader size={14} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {progress.current_address}
        </span>
      </div>
    )}
  </div>

  {/* Cache savings */}
  {progress.cached > 0 && (
    <p style={{ marginTop: '6px', fontSize: '11px', color: '#C8D1DA', textAlign: 'right', fontFamily: 'DM Sans, sans-serif' }}>
      {progress.cached.toLocaleString()} from cache
      {processingSpeed && processingSpeed > 0
        ? ` — saved ~${formatETA(progress.cached / processingSpeed * 60)}`
        : ''}
    </p>
  )}
</div>
```

---

**Step 7: Remove the old ETA badge** that was a separate element (now ETA is in the ticker header). Search for the old ETA display (a `<div>` with "ETA" label near the progress bar area) and delete it — it is now superseded.

---

**Step 8: Verify in browser**

1. Upload a CSV and start processing
2. Confirm the ticker feed shows addresses scrolling with status badges as they resolve
3. Confirm speed metric appears after ~10 seconds
4. Confirm cache savings line appears if any `cached` count > 0

---

**Step 9: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add live address ticker, speed metric, and cache savings display"
```

---

## Task 3: Results Filter Bar + Search

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Adds status filter pills (All / Found / Partial / Cached / Not Found) and a text search input above the results table. Both filter `resultRows` live.

---

**Step 1: Add filter/search state**

In the state block, add:

```javascript
const [activeStatusFilter, setActiveStatusFilter] = useState('all')
const [tableSearch, setTableSearch] = useState('')
```

---

**Step 2: Add filteredRows computed value**

In the `// ── Computed values ──` block (after line 397), add:

```javascript
const filteredRows = useMemo(() => {
  let rows = resultRows

  if (activeStatusFilter !== 'all') {
    rows = rows.filter(r => (r.status || 'not_found') === activeStatusFilter)
  }

  if (tableSearch.trim()) {
    const q = tableSearch.toLowerCase()
    rows = rows.filter(r => {
      const agent = (r.agent || r.agent_name || '').toLowerCase()
      const brokerage = (r.brokerage || r.office || '').toLowerCase()
      return agent.includes(q) || brokerage.includes(q)
    })
  }

  return rows
}, [resultRows, activeStatusFilter, tableSearch])
```

---

**Step 3: Reset filter/search state in handleReset**

```javascript
setActiveStatusFilter('all')
setTableSearch('')
```

---

**Step 4: Add the filter bar JSX above the results table**

Find the results table GlassCard (the one with `maxWidth="1024px"`, around line 830). Inside that card, BEFORE the `<table>` element, add:

```jsx
{/* Filter Bar */}
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
  {/* Status pills */}
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {[
      { key: 'all', label: 'All', count: resultRows.length },
      { key: 'found', label: 'Found', count: resultRows.filter(r => r.status === 'found').length },
      { key: 'partial', label: 'Partial', count: resultRows.filter(r => r.status === 'partial').length },
      { key: 'cached', label: 'Cached', count: resultRows.filter(r => r.status === 'cached').length },
      { key: 'not_found', label: 'Not Found', count: resultRows.filter(r => (r.status || 'not_found') === 'not_found').length },
    ].map(pill => (
      <button
        key={pill.key}
        onClick={() => setActiveStatusFilter(pill.key)}
        style={{
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          border: activeStatusFilter === pill.key
            ? '1px solid rgba(0,198,255,0.6)'
            : '1px solid rgba(255,255,255,0.1)',
          background: activeStatusFilter === pill.key
            ? 'rgba(0,198,255,0.15)'
            : 'transparent',
          color: activeStatusFilter === pill.key ? '#00C6FF' : '#C8D1DA',
          boxShadow: activeStatusFilter === pill.key
            ? '0 0 8px rgba(0,198,255,0.2)'
            : 'none',
        }}
      >
        {pill.label} <span style={{ opacity: 0.7 }}>({pill.count})</span>
      </button>
    ))}
  </div>

  {/* Search input */}
  <input
    type="text"
    placeholder="Search agent or brokerage..."
    value={tableSearch}
    onChange={e => setTableSearch(e.target.value)}
    style={{
      flex: 1,
      minWidth: '200px',
      padding: '6px 12px',
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px',
      color: '#F4F7FA',
      fontSize: '13px',
      fontFamily: 'DM Sans, sans-serif',
      outline: 'none',
    }}
    onFocus={e => { e.target.style.borderColor = 'rgba(0,198,255,0.4)' }}
    onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
  />
</div>
```

---

**Step 5: Replace `resultRows` with `filteredRows` in the table body**

In the results table JSX, find where `.map(` is called on the rows — something like:
```jsx
{resultRows.map((row, i) => (
```
Change it to:
```jsx
{filteredRows.map((row, i) => (
```

---

**Step 6: Add empty-state message when filters produce no results**

After the closing `</tbody>` of the table, add:

```jsx
{filteredRows.length === 0 && resultRows.length > 0 && (
  <div style={{ textAlign: 'center', padding: '32px', color: '#C8D1DA', fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
    No results match the current filter.
    <button
      onClick={() => { setActiveStatusFilter('all'); setTableSearch('') }}
      style={{ marginLeft: '8px', color: '#00C6FF', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
    >
      Clear filters
    </button>
  </div>
)}
```

---

**Step 7: Verify in browser**

1. Complete a job with a real or mock result set
2. Click each status pill — table should update instantly
3. Type in search box — table filters by agent/brokerage name
4. Combine a status pill + search — confirm both apply
5. "Clear filters" link resets to "All" and clears search

---

**Step 8: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add results filter pills and agent/brokerage search"
```

---

## Task 4: Sortable Column Headers

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Clicking column headers in the results table sorts rows ascending/descending. Third click resets sort.

---

**Step 1: Add sort state**

```javascript
const [sortConfig, setSortConfig] = useState(null) // { column: string, direction: 'asc'|'desc' }
```

---

**Step 2: Add sort logic to filteredRows useMemo**

In the `filteredRows` useMemo from Task 3, add sorting AFTER the search filter:

```javascript
if (sortConfig) {
  rows = [...rows].sort((a, b) => {
    let aVal, bVal
    switch (sortConfig.column) {
      case 'agent':
        aVal = (a.agent || a.agent_name || '').toLowerCase()
        bVal = (b.agent || b.agent_name || '').toLowerCase()
        break
      case 'brokerage':
        aVal = (a.brokerage || a.office || '').toLowerCase()
        bVal = (b.brokerage || b.office || '').toLowerCase()
        break
      case 'status': {
        const order = { found: 0, partial: 1, cached: 2, not_found: 3 }
        aVal = order[a.status || 'not_found'] ?? 3
        bVal = order[b.status || 'not_found'] ?? 3
        break
      }
      case 'confidence':
        aVal = a.confidence ?? -1
        bVal = b.confidence ?? -1
        break
      case 'dom':
        aVal = parseFloat(a.dom || a.days_on_market || 0) || 0
        bVal = parseFloat(b.dom || b.days_on_market || 0) || 0
        break
      default:
        return 0
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })
}
```

---

**Step 3: Add toggleSort helper**

```javascript
function toggleSort(column) {
  setSortConfig(prev => {
    if (!prev || prev.column !== column) return { column, direction: 'asc' }
    if (prev.direction === 'asc') return { column, direction: 'desc' }
    return null // third click resets
  })
}
```

---

**Step 4: Reset sort in handleReset**

```javascript
setSortConfig(null)
```

---

**Step 5: Update table headers to be clickable**

Find the `<thead>` of the results table. The columns Agent, Brokerage, Status, Confidence, and DOM should become sortable. For each of those `<th>` elements, wrap the text content with a sort button. Example for Agent:

```jsx
<th style={{ /* existing styles */ }}>
  <button
    onClick={() => toggleSort('agent')}
    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
  >
    Agent
    <span style={{ opacity: 0.5, fontSize: '10px' }}>
      {sortConfig?.column === 'agent' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  </button>
</th>
```

Apply the same pattern to: Brokerage, Status, Confidence, DOM.
Address, Phone, Email, List Date are NOT sortable — leave their `<th>` text as plain text.

---

**Step 6: Verify in browser**

1. Click "Agent" header → rows sort A–Z, indicator shows ▲
2. Click again → rows sort Z–A, indicator shows ▼
3. Click again → sort resets to original order, indicator shows ⇅
4. Click "Status" → sorted found→partial→cached→not_found
5. Click "Confidence" → highest confidence first

---

**Step 7: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add sortable column headers to results table"
```

---

## Task 5: One-Click Copy for Email and Phone

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Hovering an email or phone cell in the results table shows a clipboard icon. Clicking copies the value and flashes a "✓ Copied" indicator for 1.5 seconds.

---

**Step 1: Add copy state**

```javascript
const [copiedCell, setCopiedCell] = useState(null) // "rowIndex-field" e.g. "3-email"
const [hoveredCell, setHoveredCell] = useState(null)
```

---

**Step 2: Add copyToClipboard helper**

```javascript
function copyToClipboard(value, key) {
  if (!value || value === '--') return
  navigator.clipboard.writeText(value).then(() => {
    setCopiedCell(key)
    setTimeout(() => setCopiedCell(null), 1500)
  }).catch(() => {
    // Clipboard not available — silently skip
  })
}
```

---

**Step 3: Update the email and phone table cells**

Find the `<td>` elements for phone and email in the results table row map. Replace them:

**Phone cell:**
```jsx
<td
  style={{ padding: '10px 12px', position: 'relative', cursor: (row.phone && row.phone !== '--') ? 'pointer' : 'default', fontFamily: 'monospace', fontSize: '13px', color: '#F4F7FA' }}
  onMouseEnter={() => setHoveredCell(`${i}-phone`)}
  onMouseLeave={() => setHoveredCell(null)}
  onClick={() => copyToClipboard(row.phone, `${i}-phone`)}
>
  <span style={{
    transition: 'color 0.2s',
    color: copiedCell === `${i}-phone` ? '#00C6FF' : 'inherit',
  }}>
    {copiedCell === `${i}-phone` ? '✓ Copied' : (row.phone || '--')}
  </span>
  {hoveredCell === `${i}-phone` && row.phone && row.phone !== '--' && copiedCell !== `${i}-phone` && (
    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>
      ⧉
    </span>
  )}
</td>
```

**Email cell:**
```jsx
<td
  style={{ padding: '10px 12px', position: 'relative', cursor: (row.email && row.email !== '--') ? 'pointer' : 'default', fontSize: '13px', color: '#C8D1DA' }}
  onMouseEnter={() => setHoveredCell(`${i}-email`)}
  onMouseLeave={() => setHoveredCell(null)}
  onClick={() => copyToClipboard(row.email, `${i}-email`)}
>
  <span style={{
    transition: 'color 0.2s',
    color: copiedCell === `${i}-email` ? '#00C6FF' : 'inherit',
  }}>
    {copiedCell === `${i}-email` ? '✓ Copied' : (row.email || '--')}
  </span>
  {hoveredCell === `${i}-email` && row.email && row.email !== '--' && copiedCell !== `${i}-email` && (
    <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>
      ⧉
    </span>
  )}
</td>
```

---

**Step 6: Verify in browser**

1. Hover over a phone cell — confirm copy icon (⧉) appears
2. Click it — confirm the cell briefly shows "✓ Copied" in cyan
3. Open a text editor and paste — confirm the phone number pasted
4. Repeat for email
5. Confirm cells with `--` have no copy behavior (no icon, no click action)

---

**Step 7: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add one-click copy for email and phone cells"
```

---

## Task 6: Agent Grouping Toggle

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** A toggle button in the table toolbar switches between "View by Property" (default) and "View by Agent" — which collapses rows to one per unique agent, sorted by listing count descending. Clicking an agent row expands it to show all their properties.

---

**Step 1: Add grouping state**

```javascript
const [groupByAgent, setGroupByAgent] = useState(false)
const [expandedAgents, setExpandedAgents] = useState(new Set())
```

---

**Step 2: Add groupedRows computed value**

In the computed values block (alongside `filteredRows`), add:

```javascript
const groupedRows = useMemo(() => {
  if (!groupByAgent) return null
  const agentMap = new Map()
  filteredRows.forEach(row => {
    const key = (row.agent || row.agent_name || '').trim() || 'Unknown Agent'
    if (!agentMap.has(key)) {
      agentMap.set(key, {
        agentKey: key,
        brokerage: row.brokerage || row.office || '--',
        phone: row.phone || '--',
        email: row.email || '--',
        confidence: row.confidence,
        properties: [],
      })
    }
    agentMap.get(key).properties.push(row)
  })
  return Array.from(agentMap.values())
    .sort((a, b) => b.properties.length - a.properties.length)
}, [filteredRows, groupByAgent])
```

---

**Step 3: Reset grouping state in handleReset**

```javascript
setGroupByAgent(false)
setExpandedAgents(new Set())
```

---

**Step 4: Add the grouping toggle button to the table toolbar**

In the results table GlassCard, find where the filter bar ends (from Task 3). Add this toolbar row BETWEEN the filter bar and the table element:

```jsx
{/* Table toolbar */}
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '12px' }}>
  <button
    onClick={() => { setGroupByAgent(v => !v); setExpandedAgents(new Set()) }}
    style={{
      padding: '5px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'Rajdhani, sans-serif',
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      border: groupByAgent ? '1px solid rgba(246,196,69,0.6)' : '1px solid rgba(255,255,255,0.15)',
      background: groupByAgent ? 'rgba(246,196,69,0.12)' : 'transparent',
      color: groupByAgent ? '#F6C445' : '#C8D1DA',
      transition: 'all 0.15s ease',
    }}
  >
    {groupByAgent ? '⊞ View by Property' : '⊟ View by Agent'}
  </button>
</div>
```

---

**Step 5: Add the grouped table view**

The results table currently has a single `<tbody>` rendering `filteredRows.map(...)`. Wrap the entire `<table>` in a conditional:

```jsx
{groupByAgent && groupedRows ? (
  /* ── Agent Grouped Table ── */
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(246,196,69,0.2)', background: 'rgba(246,196,69,0.05)' }}>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>Agent</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>Brokerage</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>Phone</th>
          <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>Email</th>
          <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#F6C445' }}>Listings</th>
          <th style={{ padding: '10px 12px', width: '32px' }}></th>
        </tr>
      </thead>
      <tbody>
        {groupedRows.map(group => (
          <>
            {/* Agent summary row */}
            <tr
              key={group.agentKey}
              onClick={() => setExpandedAgents(prev => {
                const next = new Set(prev)
                next.has(group.agentKey) ? next.delete(group.agentKey) : next.add(group.agentKey)
                return next
              })}
              style={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                cursor: 'pointer',
                background: expandedAgents.has(group.agentKey) ? 'rgba(246,196,69,0.05)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!expandedAgents.has(group.agentKey)) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!expandedAgents.has(group.agentKey)) e.currentTarget.style.background = 'transparent' }}
            >
              <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: '#F4F7FA' }}>{group.agentKey}</td>
              <td style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA' }}>{group.brokerage}</td>
              <td
                style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'monospace', color: '#F4F7FA', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); copyToClipboard(group.phone, `group-${group.agentKey}-phone`) }}
              >
                {copiedCell === `group-${group.agentKey}-phone` ? <span style={{ color: '#00C6FF' }}>✓ Copied</span> : group.phone}
              </td>
              <td
                style={{ padding: '10px 12px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA', cursor: 'pointer' }}
                onClick={e => { e.stopPropagation(); copyToClipboard(group.email, `group-${group.agentKey}-email`) }}
              >
                {copiedCell === `group-${group.agentKey}-email` ? <span style={{ color: '#00C6FF' }}>✓ Copied</span> : group.email}
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                <span style={{ padding: '2px 10px', borderRadius: '12px', background: 'rgba(0,198,255,0.12)', border: '1px solid rgba(0,198,255,0.25)', color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
                  {group.properties.length}
                </span>
              </td>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#C8D1DA', fontSize: '12px' }}>
                {expandedAgents.has(group.agentKey) ? '▼' : '▶'}
              </td>
            </tr>
            {/* Expanded property sub-rows */}
            {expandedAgents.has(group.agentKey) && group.properties.map((prop, pi) => (
              <tr
                key={`${group.agentKey}-${pi}`}
                style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}
              >
                <td colSpan={2} style={{ padding: '8px 12px 8px 28px', fontSize: '12px', fontFamily: 'DM Sans, sans-serif', color: '#C8D1DA' }}>
                  ↳ {prop.address || '--'}
                </td>
                <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                  <StatusBadge status={prop.status} />
                </td>
                <td style={{ padding: '8px 12px', fontSize: '12px', color: '#C8D1DA', fontFamily: 'DM Sans, sans-serif' }}>
                  {prop.list_date || '--'}
                </td>
                <td colSpan={2} style={{ padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', color: '#C8D1DA', textAlign: 'right' }}>
                  DOM: {prop.dom || prop.days_on_market || '--'}
                </td>
              </tr>
            ))}
          </>
        ))}
      </tbody>
    </table>
  </div>
) : (
  /* ── Original property-by-property table ── */
  /* ... existing table JSX unchanged ... */
)}
```

**Important:** The original property table JSX should be left exactly as-is inside the `else` branch of this conditional.

---

**Step 6: Verify in browser**

1. Complete a job with results
2. Click "View by Agent" — table collapses to one row per agent, sorted by count
3. Agent with most properties appears first with a cyan "12" badge
4. Click an agent row → expands to show all their properties inline
5. Click again → collapses
6. Click "View by Property" → returns to normal table
7. Filter pills + search still work in both views

---

**Step 7: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add agent grouping toggle to results table"
```

---

## Task 7: Filtered Export + Bulk Copy

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Replaces the single "Download ZIP" button with a dropdown that exports filtered CSV subsets entirely client-side (no new backend endpoint needed). Adds "Copy All Emails" and "Copy All Phones" bulk-copy buttons to the table toolbar.

---

**Step 1: Add export dropdown state**

```javascript
const [exportMenuOpen, setExportMenuOpen] = useState(false)
const [bulkCopyToast, setBulkCopyToast] = useState(null) // "12 emails copied"
```

---

**Step 2: Add client-side CSV download helper**

```javascript
function downloadFilteredCSV(statusFilter) {
  const rows = statusFilter === 'all'
    ? resultRows
    : resultRows.filter(r => (r.status || 'not_found') === statusFilter)

  const COLS = [
    { header: 'Address',    get: r => r.address || '' },
    { header: 'Agent',      get: r => r.agent || r.agent_name || '' },
    { header: 'Brokerage',  get: r => r.brokerage || r.office || '' },
    { header: 'Phone',      get: r => r.phone || '' },
    { header: 'Email',      get: r => r.email || '' },
    { header: 'Status',     get: r => r.status || '' },
    { header: 'List Date',  get: r => r.list_date || '' },
    { header: 'DOM',        get: r => r.dom || r.days_on_market || '' },
    { header: 'Confidence', get: r => r.confidence != null ? (r.confidence > 1 ? r.confidence : Math.round(r.confidence * 100)) + '%' : '' },
  ]

  const escape = v => `"${String(v).replace(/"/g, '""')}"`
  const header = COLS.map(c => c.header).join(',')
  const body = rows.map(r => COLS.map(c => escape(c.get(r))).join(',')).join('\n')
  const csv = header + '\n' + body

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `agent-finder-${statusFilter}-${jobId || 'results'}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  setExportMenuOpen(false)
}
```

---

**Step 3: Add bulk copy helpers**

```javascript
function bulkCopyEmails() {
  const emails = filteredRows
    .map(r => r.email)
    .filter(e => e && e !== '--')
  if (emails.length === 0) return
  navigator.clipboard.writeText(emails.join('\n')).then(() => {
    setBulkCopyToast(`${emails.length} email${emails.length !== 1 ? 's' : ''} copied`)
    setTimeout(() => setBulkCopyToast(null), 2500)
  }).catch(() => {})
}

function bulkCopyPhones() {
  const phones = filteredRows
    .map(r => r.phone)
    .filter(p => p && p !== '--')
  if (phones.length === 0) return
  navigator.clipboard.writeText(phones.join('\n')).then(() => {
    setBulkCopyToast(`${phones.length} phone${phones.length !== 1 ? 's' : ''} copied`)
    setTimeout(() => setBulkCopyToast(null), 2500)
  }).catch(() => {})
}
```

---

**Step 4: Reset state in handleReset**

```javascript
setExportMenuOpen(false)
setBulkCopyToast(null)
```

---

**Step 5: Replace the "Download ZIP" button in the complete phase summary card**

Find the "Download ZIP" / download button in the summary card (around line 790–810). Replace it with the dropdown:

```jsx
{/* Filtered Export Dropdown */}
<div style={{ position: 'relative' }}>
  <div style={{ display: 'flex' }}>
    {/* Primary: Download All (existing behavior) */}
    <a
      href={`${API_BASE}/api/download/${jobId}`}
      download
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '8px',
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #F6C445, #C49A20)',
        color: '#0B0F14',
        borderRadius: '10px 0 0 10px',
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
        fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase',
        textDecoration: 'none', cursor: 'pointer',
        boxShadow: '0 0 16px rgba(246,196,69,0.3)',
      }}
    >
      ↓ Download All
    </a>
    {/* Dropdown arrow */}
    <button
      onClick={() => setExportMenuOpen(v => !v)}
      style={{
        padding: '10px 12px',
        background: 'linear-gradient(135deg, #C49A20, #9A7A10)',
        color: '#0B0F14',
        border: 'none',
        borderLeft: '1px solid rgba(0,0,0,0.2)',
        borderRadius: '0 10px 10px 0',
        cursor: 'pointer',
        fontSize: '12px',
      }}
    >
      ▾
    </button>
  </div>
  {/* Dropdown menu */}
  {exportMenuOpen && (
    <div
      style={{
        position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 50,
        minWidth: '200px',
        background: 'rgba(17,27,36,0.98)',
        border: '1px solid rgba(0,198,255,0.2)',
        borderRadius: '10px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {[
        { label: 'Download Found Only', filter: 'found' },
        { label: 'Download Partial Only', filter: 'partial' },
        { label: 'Download Cached Only', filter: 'cached' },
        { label: 'Download Not Found Only', filter: 'not_found' },
        { label: 'Download Current View', filter: 'view' },
      ].map(opt => (
        <button
          key={opt.filter}
          onClick={() => opt.filter === 'view'
            ? downloadFilteredCSV(activeStatusFilter)
            : downloadFilteredCSV(opt.filter)
          }
          style={{
            display: 'block', width: '100%', padding: '10px 16px',
            background: 'transparent', border: 'none',
            textAlign: 'left', cursor: 'pointer',
            color: '#F4F7FA', fontSize: '13px',
            fontFamily: 'DM Sans, sans-serif',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.08)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )}
</div>
```

Also add a `useEffect` to close the dropdown when clicking outside:

```javascript
useEffect(() => {
  if (!exportMenuOpen) return
  const close = () => setExportMenuOpen(false)
  document.addEventListener('mousedown', close)
  return () => document.removeEventListener('mousedown', close)
}, [exportMenuOpen])
```

---

**Step 6: Add bulk copy buttons to the table toolbar**

In the table toolbar div from Task 6, add these two buttons alongside the grouping toggle:

```jsx
{/* Bulk copy toast */}
{bulkCopyToast && (
  <span style={{ fontSize: '12px', color: '#00C6FF', fontFamily: 'DM Sans, sans-serif', marginRight: 'auto' }}>
    ✓ {bulkCopyToast}
  </span>
)}

<button
  onClick={bulkCopyEmails}
  title="Copy all visible emails to clipboard"
  style={{
    padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent', color: '#C8D1DA',
    transition: 'all 0.15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,198,255,0.4)'; e.currentTarget.style.color = '#00C6FF' }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#C8D1DA' }}
>
  Copy Emails
</button>

<button
  onClick={bulkCopyPhones}
  title="Copy all visible phones to clipboard"
  style={{
    padding: '5px 12px', borderRadius: '8px', fontSize: '12px',
    fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', cursor: 'pointer',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'transparent', color: '#C8D1DA',
    transition: 'all 0.15s',
  }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,198,255,0.4)'; e.currentTarget.style.color = '#00C6FF' }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#C8D1DA' }}
>
  Copy Phones
</button>
```

---

**Step 7: Verify in browser**

1. Complete a job → click the "▾" arrow next to "Download All" → dropdown appears
2. Click "Download Found Only" → CSV downloads containing only found rows
3. Set a status pill filter, then click "Download Current View" → downloads only the filtered rows
4. Click "Copy Emails" → toast shows "X emails copied"; paste into Notepad → one email per line
5. Click "Copy Phones" → same for phones

---

**Step 8: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add filtered export dropdown and bulk copy for emails/phones"
```

---

## Task 8: Column Visibility Toggle

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** A gear icon in the table toolbar opens a dropdown of checkboxes to show/hide columns. List Date and DOM are hidden by default. Selection persists in `localStorage`.

---

**Step 1: Define column metadata and add state**

At the top of the component (after the existing constants), define the column list:

```javascript
const COLUMN_DEFS = [
  { key: 'address',    label: 'Address',    defaultVisible: true },
  { key: 'agent',      label: 'Agent',      defaultVisible: true },
  { key: 'brokerage',  label: 'Brokerage',  defaultVisible: true },
  { key: 'phone',      label: 'Phone',      defaultVisible: true },
  { key: 'email',      label: 'Email',      defaultVisible: true },
  { key: 'status',     label: 'Status',     defaultVisible: true },
  { key: 'list_date',  label: 'List Date',  defaultVisible: false },
  { key: 'dom',        label: 'DOM',        defaultVisible: false },
  { key: 'confidence', label: 'Confidence', defaultVisible: true },
]
const DEFAULT_VISIBLE = new Set(COLUMN_DEFS.filter(c => c.defaultVisible).map(c => c.key))
```

Add state:

```javascript
const [visibleColumns, setVisibleColumns] = useState(() => {
  try {
    const saved = localStorage.getItem('agentfinder_columns')
    return saved ? new Set(JSON.parse(saved)) : new Set(DEFAULT_VISIBLE)
  } catch {
    return new Set(DEFAULT_VISIBLE)
  }
})
const [colMenuOpen, setColMenuOpen] = useState(false)
```

---

**Step 2: Add toggleColumn helper**

```javascript
function toggleColumn(key) {
  setVisibleColumns(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    try { localStorage.setItem('agentfinder_columns', JSON.stringify([...next])) } catch {}
    return next
  })
}
```

---

**Step 3: Gate all table `<th>` and `<td>` elements with visibility checks**

For each of the 9 columns in the results table, wrap the `<th>` and corresponding `<td>` in `{visibleColumns.has('column_key') && (...)}`.

Example for the List Date column:
```jsx
{/* In <thead> */}
{visibleColumns.has('list_date') && (
  <th style={{ /* existing styles */ }}>List Date</th>
)}

{/* In <tbody> row */}
{visibleColumns.has('list_date') && (
  <td style={{ /* existing styles */ }}>{row.list_date || '--'}</td>
)}
```

Apply this to all 9 columns: address, agent, brokerage, phone, email, status, list_date, dom, confidence.

---

**Step 4: Add the column visibility gear button to the table toolbar**

In the toolbar div from Task 6 (after the bulk copy buttons), add:

```jsx
<div style={{ position: 'relative' }}>
  <button
    onClick={() => setColMenuOpen(v => !v)}
    title="Show/hide columns"
    style={{
      padding: '5px 10px', borderRadius: '8px', fontSize: '14px',
      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)',
      background: colMenuOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
      color: '#C8D1DA', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,198,255,0.4)' }}
    onMouseLeave={e => { if (!colMenuOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
  >
    ⚙
  </button>
  {colMenuOpen && (
    <div
      style={{
        position: 'absolute', top: '100%', right: 0, marginTop: '4px', zIndex: 50,
        background: 'rgba(17,27,36,0.98)',
        border: '1px solid rgba(0,198,255,0.2)',
        borderRadius: '10px', padding: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        minWidth: '160px',
      }}
    >
      <p style={{ fontSize: '10px', color: '#C8D1DA', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 8px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '6px' }}>
        Columns
      </p>
      {COLUMN_DEFS.map(col => (
        <label
          key={col.key}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <input
            type="checkbox"
            checked={visibleColumns.has(col.key)}
            onChange={() => toggleColumn(col.key)}
            style={{ accentColor: '#00C6FF', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '13px', color: '#F4F7FA', fontFamily: 'DM Sans, sans-serif' }}>
            {col.label}
          </span>
        </label>
      ))}
    </div>
  )}
</div>
```

Also add a close-on-outside-click effect:

```javascript
useEffect(() => {
  if (!colMenuOpen) return
  const close = () => setColMenuOpen(false)
  document.addEventListener('mousedown', close)
  return () => document.removeEventListener('mousedown', close)
}, [colMenuOpen])
```

---

**Step 5: Verify in browser**

1. Open results table → List Date and DOM columns are hidden by default
2. Click ⚙ → dropdown shows all 9 columns with checkboxes
3. Check "List Date" → column appears immediately
4. Reload the page → List Date is still visible (persisted in localStorage)
5. Uncheck a column → it disappears from the table instantly

---

**Step 6: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add column visibility toggle with localStorage persistence"
```

---

## Task 9: Browser Notification on Job Complete

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** When a job finishes and the browser tab is in the background, a browser notification fires: "Agent Finder — Run Complete / 847 addresses processed · 612 agents found (72%)". Permission is requested on the first "Find Agents" click, not on page load.

---

**Step 1: Add notification permission state**

```javascript
const [notifPermission, setNotifPermission] = useState(
  typeof Notification !== 'undefined' ? Notification.permission : 'denied'
)
```

---

**Step 2: Add requestNotificationPermission helper**

```javascript
async function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'default') return
  const result = await Notification.requestPermission()
  setNotifPermission(result)
}
```

---

**Step 3: Call permission request at the START of handleUpload (before the fetch)**

In `handleUpload` (line 225), after `setError(null)` and before `const formData = new FormData()`, add:

```javascript
await requestNotificationPermission()
```

Make sure `handleUpload` is `async` — it already is.

---

**Step 4: Add fireCompletionNotification helper**

```javascript
function fireCompletionNotification(data) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState !== 'hidden') return // only when tab is backgrounded

  const total = data.total || 0
  const found = (data.found || 0) + (data.partial || 0) + (data.cached || 0)
  const pct = total > 0 ? Math.round(found / total * 100) : 0

  try {
    new Notification('Agent Finder — Run Complete', {
      body: `${total.toLocaleString()} addresses processed · ${found.toLocaleString()} agents found (${pct}%)`,
      icon: '/favicon.ico',
    })
  } catch {
    // Notification API may be blocked by browser — silently skip
  }
}
```

---

**Step 5: Call fireCompletionNotification in the SSE complete handler**

In `connectSSE`, in the `else if (data.type === 'complete')` block (line 280), add one line after `setResults(data)`:

```javascript
fireCompletionNotification(data)
```

---

**Step 6: Verify in browser**

1. Click "Find Agents" for the first time → browser shows a permission prompt
2. Allow → start processing, switch to another browser tab while it runs
3. When job finishes → browser notification fires with the result summary
4. Deny permission initially → notifications silently skipped, no error shown
5. If tab stays in foreground → no notification fires (correct, user can see the results directly)

---

**Step 7: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add browser notification on job complete when tab is backgrounded"
```

---

## Task 10: Job History — Found Rate Badge

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Each completed job in the history panel shows a `"73% found"` badge next to the filename.

---

**Step 1: Add getFoundRate helper**

```javascript
function getFoundRate(job) {
  const total = job.total || job.address_count || 0
  if (!total) return null
  const found = (job.found || 0) + (job.partial || 0) + (job.cached || 0)
  return Math.round(found / total * 100)
}
```

---

**Step 2: Add the badge in job history JSX**

Find the job history rendering block (around line 956). For each job row, find where the filename is displayed. Add the badge immediately after the filename:

```jsx
{/* Found rate badge */}
{(() => {
  const rate = getFoundRate(job)
  return rate != null ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: '10px', marginLeft: '8px',
      fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
      background: rate >= 70 ? 'rgba(74,124,89,0.2)' : rate >= 40 ? 'rgba(212,168,83,0.2)' : 'rgba(163,50,50,0.2)',
      border: rate >= 70 ? '1px solid rgba(74,124,89,0.4)' : rate >= 40 ? '1px solid rgba(212,168,83,0.4)' : '1px solid rgba(163,50,50,0.4)',
      color: rate >= 70 ? '#4a7c59' : rate >= 40 ? '#d4a853' : '#a83232',
    }}>
      {rate}% found
    </span>
  ) : null
})()}
```

---

**Step 3: Verify in browser**

1. View job history
2. Each completed job shows a colored badge: green for 70%+, gold for 40–69%, red below 40%
3. Jobs with missing data (no total count) show no badge

---

**Step 4: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add found-rate badge to job history rows"
```

---

## Task 11: Job History — Inline Result Preview

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** Each job history row gets an expand chevron. Clicking fetches the first 10 results from `GET /api/jobs/{jobId}/results` and shows them inline in a compact 5-column mini-table (Address, Agent, Phone, Email, Status). Results are cached in component state so the network call only fires once per job.

**Backend requirement:** This task requires `GET /api/jobs/{jobId}/results` to exist. If the backend doesn't support it yet, the expand simply shows a "Results not available" message gracefully.

---

**Step 1: Add inline preview state**

```javascript
const [expandedJobs, setExpandedJobs] = useState(new Set())
const [jobResults, setJobResults] = useState({}) // jobId -> rows array
const [jobResultsLoading, setJobResultsLoading] = useState(new Set())
```

---

**Step 2: Add expandJob handler**

```javascript
async function expandJob(jobId) {
  setExpandedJobs(prev => {
    const next = new Set(prev)
    next.has(jobId) ? next.delete(jobId) : next.add(jobId)
    return next
  })

  if (jobResults[jobId] !== undefined) return // already loaded

  setJobResultsLoading(prev => new Set([...prev, jobId]))
  try {
    const res = await fetch(`${API_BASE}/api/jobs/${jobId}/results`)
    if (!res.ok) throw new Error('Not available')
    const data = await res.json()
    setJobResults(prev => ({ ...prev, [jobId]: data.results || data.rows || [] }))
  } catch {
    setJobResults(prev => ({ ...prev, [jobId]: null })) // null = error state
  } finally {
    setJobResultsLoading(prev => {
      const next = new Set(prev)
      next.delete(jobId)
      return next
    })
  }
}
```

---

**Step 3: Reset in handleReset**

```javascript
// Note: don't reset expandedJobs/jobResults — job history persists across runs
```

Actually, these don't need resetting — they're about job history which outlives the current run.

---

**Step 4: Update job history row JSX to add expand chevron and inline preview**

Find the job history row rendering. Each row currently shows filename, date, count, download, delete. Add the chevron to the right:

```jsx
{/* Expand chevron button */}
<button
  onClick={() => expandJob(job.job_id || job.id)}
  style={{
    background: 'none', border: 'none', cursor: 'pointer',
    color: expandedJobs.has(job.job_id || job.id) ? '#00C6FF' : '#C8D1DA',
    fontSize: '13px', padding: '4px 8px', transition: 'color 0.15s',
  }}
  title="Preview results"
>
  {expandedJobs.has(job.job_id || job.id) ? '▼' : '▶'}
</button>
```

Then, AFTER each job row (but still inside the job list map), add the expanded preview:

```jsx
{expandedJobs.has(job.job_id || job.id) && (
  <div style={{
    margin: '0 0 8px 0',
    padding: '12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(0,198,255,0.08)',
    borderRadius: '8px',
  }}>
    {jobResultsLoading.has(job.job_id || job.id) ? (
      <div style={{ textAlign: 'center', padding: '16px', color: '#C8D1DA', fontSize: '13px' }}>
        <ShurikenLoader size={16} /> Loading...
      </div>
    ) : jobResults[job.job_id || job.id] === null ? (
      <p style={{ color: '#C8D1DA', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
        Preview not available for this job.
      </p>
    ) : jobResults[job.job_id || job.id]?.length === 0 ? (
      <p style={{ color: '#C8D1DA', fontSize: '13px', textAlign: 'center', padding: '12px' }}>
        No results found.
      </p>
    ) : (
      <>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['Address', 'Agent', 'Phone', 'Email', 'Status'].map(h => (
                <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#C8D1DA', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '10px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(jobResults[job.job_id || job.id] || []).slice(0, 10).map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '6px 10px', color: '#C8D1DA', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.address || '--'}</td>
                <td style={{ padding: '6px 10px', color: '#F4F7FA' }}>{row.agent || row.agent_name || '--'}</td>
                <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#F4F7FA' }}>{row.phone || '--'}</td>
                <td style={{ padding: '6px 10px', color: '#C8D1DA' }}>{row.email || '--'}</td>
                <td style={{ padding: '6px 10px' }}><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {(jobResults[job.job_id || job.id] || []).length > 10 && (
          <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#C8D1DA' }}>
            +{(jobResults[job.job_id || job.id] || []).length - 10} more rows — download to see all
          </p>
        )}
      </>
    )}
  </div>
)}
```

---

**Step 5: Verify in browser**

1. View job history with completed jobs
2. Click the ▶ chevron on a job — confirm it expands and shows a loading indicator
3. First 10 result rows appear with Address, Agent, Phone, Email, Status
4. Click ▼ to collapse — confirm it collapses
5. Click ▶ again — confirm results are served from cache (no loading indicator, instant)
6. Test with a job that has no results endpoint yet — confirm "Preview not available" shown gracefully

---

**Step 6: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add inline result preview to job history rows"
```

---

## Task 12: Job History — Resume Monitoring

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx`

**What it does:** If a job in history has `status === 'processing'` or `status === 'running'`, a pulsing "Live" badge + "Monitor" button appear. Clicking "Monitor" reconnects the SSE stream for that job and transitions the main view to the processing phase live view.

---

**Step 1: Add resumeMonitoring handler**

```javascript
function resumeMonitoring(job) {
  const id = job.job_id || job.id
  const total = job.total || job.address_count || 0

  // Close any existing SSE connection
  if (sseRef.current) {
    sseRef.current.close()
    sseRef.current = null
  }

  // Reset ticker and speed refs
  prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
  prevAddressRef.current = ''
  setTickerLog([])
  setProcessingSpeed(null)

  // Set state to processing phase for this job
  setJobId(id)
  setProgress({
    completed: 0,
    total,
    found: 0,
    partial: 0,
    cached: 0,
    not_found: 0,
    current_address: '',
  })
  startTimeRef.current = Date.now()
  setPhase('processing')
  connectSSE(id)
}
```

---

**Step 2: Add the Live badge and Monitor button in job history JSX**

In the job history row rendering, find where the job status is displayed (the `job.status` text/badge area). Add a conditional:

```jsx
{/* Resume monitoring for in-progress jobs */}
{(job.status === 'processing' || job.status === 'running') && (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    {/* Pulsing live badge */}
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '2px 8px', borderRadius: '10px',
      background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)',
      color: '#00C6FF', fontSize: '11px', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00C6FF', display: 'inline-block', animation: 'pulse 1.5s ease-in-out infinite' }} />
      Live
    </span>
    {/* Monitor button */}
    <button
      onClick={() => resumeMonitoring(job)}
      style={{
        padding: '3px 10px', borderRadius: '6px',
        background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)',
        color: '#00C6FF', fontSize: '12px', fontFamily: 'Rajdhani, sans-serif',
        fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,198,255,0.1)' }}
    >
      Monitor
    </button>
  </div>
)}
```

The `pulse` keyframe is already defined in the app (used by other components). If not, add it to the `<style>` tag already in the component:

```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}
```

---

**Step 3: Verify in browser**

1. Start a job, then navigate away mid-processing (refresh the page or go to dashboard and back)
2. In job history, the still-processing job should show a pulsing "Live" badge and "Monitor" button
3. Click "Monitor" → page transitions to processing phase and SSE reconnects
4. Live ticker resumes with new events
5. On job completion, phase transitions to complete as normal

---

**Step 4: Final cleanup — ensure all new state resets are in handleReset**

`handleReset` should now reset these new state variables. Review and ensure it includes:
```javascript
setCsvPreview(null)
setColumnMap(null)
setTickerLog([])
setProcessingSpeed(null)
setActiveStatusFilter('all')
setTableSearch('')
setSortConfig(null)
setGroupByAgent(false)
setExpandedAgents(new Set())
setExportMenuOpen(false)
setBulkCopyToast(null)
setColMenuOpen(false)
prevProgressRef.current = { found: 0, partial: 0, cached: 0, not_found: 0 }
prevAddressRef.current = ''
```

---

**Step 5: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add resume monitoring for in-progress jobs in history panel"
```

---

## Final Step: Deploy

```bash
# Push to GitHub
git push origin master

# Deploy to Vercel
cd frontend && npx vercel --prod
```

Confirm the live URL at https://dispo-dojo.vercel.app is updated.
