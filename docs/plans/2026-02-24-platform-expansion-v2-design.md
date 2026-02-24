# Platform Expansion v2 — Design Document
**Date:** 2026-02-24
**Status:** Approved

---

## Overview

Six coordinated changes expanding the Dispo Dojo platform:

1. **Finding Leads page overhaul** — 3 categorized training video sections + banner
2. **Sidebar restructure** — new "Sales Tools" section, Live Deals moved to top nav
3. **Offer Comparison page** — full calculator with comp pull, PDF export, history
4. **Call Recordings page** — categorized library (all Coming Soon for now)
5. **Live Deals page** — admin-managed deal board with inquiry flow
6. **Buy Boxes page** — user-submitted criteria saved to Firestore profile

---

## Section 1: Finding Leads Page Overhaul

**File:** `frontend/src/pages/LeadScrubbing.jsx`

### Banner
Below the page header, add an info banner:
> "These training videos focus on finding on-market properties in each category. Once identified, we reach out directly to the listing agent."

Styled as a subtle `WoodPanel` or muted callout with a small info icon.

### Three Video Cards

Replace the single placeholder with three vertical `WoodPanel` cards:

**Card 1 — Finding Subject-To Leads**
- Description: How to identify assumable-mortgage candidates on the MLS — filters, equity signals, days-on-market patterns
- Bullets: MLS filter setup, equity stack indicators, red flags to avoid, how to approach the listing agent

**Card 2 — Finding Stack Method Leads**
- Description: Layering criteria (equity + DOM + price reductions) to surface highly motivated sellers
- Bullets: What "the stack" means, combining filters, reading market signals, building a repeatable search

**Card 3 — Finding Cash Leads (Deal Sauce Walkthrough)**
- Description: How to use the Deal Sauce platform to find cash leads, understand the dashboard, and identify other lead types
- Bullets: Platform navigation, dashboard overview, identifying lead categories, filtering for your market

All three use the same `aspect-video` placeholder with hanko seal + Play icon + "Coming Soon" label.

---

## Section 2: Sidebar Restructure

**File:** `frontend/src/components/Sidebar.jsx`

### New Section Order

```
[top — no title]
  JV Dashboard
  Message Board
  Live Deals         ← NEW

Lead Generation
  Finding Leads
  Find Agent Emails
  LOI Sender

Sales Tools          ← NEW SECTION
  Subject-To Explainer  ← moved from Lead Generation
  Offer Comparison      ← NEW

Deal Management
  Free Underwriting
  Contract Generator
  Find Buyers
  Buy Boxes          ← NEW

Resources
  Scripts & Objections
  DTA Process
  Bird Dog Network
  Boots on Ground
  Rent Comps
  Call Recordings    ← NEW
```

---

## Section 3: Offer Comparison Page

**File:** `frontend/src/pages/OfferComparison.jsx` (new)
**Route:** `/offer-comparison`

### Top Disclaimer Banner
> **"Use this tool when needed."**
> This comparison depends on the seller's goals and deal structure — but it's a strong support tool for agents to show sellers a realistic traditional net vs. a guaranteed, clean close with us.

### Input Form (top or left panel)

| Field | Type |
|---|---|
| Property address | Text input (used for comp lookup) |
| Our purchase price | Currency input |
| Cash to seller | Currency input |
| Close timeline | Number input (days) |
| Skip inspection | Checkbox (pre-checked) |
| Skip appraisal | Checkbox (pre-checked) |
| No mid-process renegotiation | Checkbox (pre-checked) |

### Comp Pull

On submit, fire `GET /api/comps?address=<address>` to the existing Python backend.

Backend logic (new endpoint in `agent_finder/app.py`):
- Extract zip from address
- Call HomeHarvest / Redfin scraper for sold comps in zip
- Try last 3 months → expand to 6 → 9 → 12 until 3+ comps found
- Return array of comps: `{ address, listPrice, soldPrice, pctUnderList, dom }`
- Also return computed: `avgPctUnderList`, `avgDom`

Display comp table below the form:
- Each comp row: address, list price, sold price, % under list, DOM
- Summary row: averages highlighted in gold

### Side-by-Side Comparison Table

| | Our Offer | Traditional Sale |
|---|---|---|
| Gross | Purchase price | List price estimate |
| Agent commissions | $0 | −6% |
| Seller closing costs | $0 | −2% |
| Buyer concessions | $0 | −1–2% |
| Inspection credits | $0 | −0.5–1% |
| Appraisal risk | None | Possible fallthrough |
| **Estimated net** | **= purchase price** | **= calculated range** |
| Timeline | Close timeline input | Avg DOM + 30–45 days |
| Certainty | Guaranteed close | Contingent |

Traditional net calculated as:
```
listPrice × (1 - avgPctUnderList)        ← adjusted for market reality
  - 6% agent commissions
  - 2% closing costs
  - 1.5% concessions estimate
  - 0.75% inspection credits estimate
```

Result shown as a range (low/high based on comp spread).

### PDF Export

Use `jsPDF` (already installed). Generate a branded PDF with:
- Dispo Dojo header
- Property address + run date
- Comp table
- Side-by-side comparison table
- Disclaimer footer

### History (Firestore)

Each run saved to: `users/{uid}/comparisons/{auto-id}`
Fields: `address`, `inputs`, `comps`, `results`, `createdAt`

History panel below the form: cards showing address + date + net difference. Click to reload that run into the comparison view.

---

## Section 4: Call Recordings Page

**File:** `frontend/src/pages/CallRecordings.jsx` (new)
**Route:** `/call-recordings`

### Layout

Page header + intro:
> "Real call recordings organized by scenario — study the patterns, not just the scripts."

Grid of category cards (2-column on desktop, 1 on mobile). Each card:
- Category name (font-heading, gold)
- Short description
- "Coming Soon" badge (styled pill)
- Locked/dim state (no content yet)

### Categories

1. **Sellers in Arrears** — Late payments, pre-foreclosure sensitivity, urgency without pressure
2. **VA Entitlement Questions** — Entitlement restoration, how Sub-To preserves VA eligibility
3. **"What if I want to buy again?"** — Future purchase objection, Sub-To effect on DTI vs. deed, refi paths
4. **Price Objection** — Seller expects retail; bridging to net proceeds reality
5. **"I need to think about it"** — Re-engagement and follow-up framing
6. **Agent Pushback** — When listing agents resist creative offers
7. **Title Company Concerns** — Due-on-sale clause, how experienced title handles Sub-To
8. **Spouse / Family Member Involvement** — Handling second decision-maker dynamics

---

## Section 5: Live Deals Page

**File:** `frontend/src/pages/LiveDeals.jsx` (new)
**Route:** `/live-deals`

### Data Model (Firestore)

Collection: `liveDeals`
Fields per document:
```
{
  address: string,
  city: string,
  state: string,
  dealType: 'sub-to' | 'seller-finance' | 'cash',
  assignmentFee: number,
  beds: number,
  baths: number,
  sqft: number,
  arv: number,
  pitch: string,       // 1-2 sentence blurb
  status: 'active' | 'closed',
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### User-Facing View

Grid of deal cards (2-column desktop, 1 mobile). Each card:
- City + state + deal type badge
- Assignment fee (prominent, gold)
- Beds / baths / sqft / ARV stats row
- Pitch copy (1-2 sentences)
- "Inquire About This Deal" button → opens modal

**Inquiry modal:**
- Pre-filled name + email from auth profile
- Short message textarea
- Submit → fires Discord webhook (`VITE_DISCORD_DEALS_WEBHOOK`) with deal address + user info + message
- Success state confirmation

Only documents with `status === 'active'` shown to users.

### Admin Panel — Live Deals Tab

New tab in `AdminDashboard.jsx`: "Live Deals"

- Table of all deals (active + closed) with status badge
- "Add Deal" button → inline form or modal with all fields
- Edit / Delete per row
- Toggle status active ↔ closed

---

## Section 6: Buy Boxes Page

**File:** `frontend/src/pages/BuyBoxes.jsx` (new)
**Route:** `/buy-boxes`

### Data Model (Firestore)

Saved on user's profile doc: `users/{uid}` → field `buyBox: { ...criteria, updatedAt }`

```
{
  markets: string[],          // e.g. ['TX', 'FL', 'Phoenix AZ']
  propertyTypes: string[],    // ['SFR', 'Duplex', 'Triplex', 'Multi', 'Land', 'Commercial']
  minPrice: number,
  maxPrice: number,
  dealTypes: string[],        // ['Sub-To', 'Seller Finance', 'Cash', 'Creative', 'Novation']
  closeTimeline: string,      // e.g. '14-30 days'
  notes: string,
  updatedAt: timestamp,
}
```

### Page Layout

Two-panel layout (desktop: side-by-side; mobile: stacked):

**Left — Submission Form**
- Markets / states (tag-style multi-input)
- Property types (checkbox grid)
- Price range (dual number inputs)
- Deal types (checkbox group)
- Close timeline (short text)
- Notes (textarea)
- Submit button ("Save My Buy Box")

On submit: write to `users/{uid}.buyBox` in Firestore. Show success toast. Reload saved buy box in right panel.

**Right — Your Current Buy Box**
- Shows saved criteria in a read-only display card
- "Last updated" timestamp
- "Edit" link scrolls back to the form pre-populated

### Admin Panel — Buyer List Tab

New tab in `AdminDashboard.jsx`: "Buyer List"
Table of all users who have submitted a buy box, showing:
- Name, email, markets, price range, deal types, last updated
- Click to expand full criteria

---

## Technical Summary

### New Files
- `frontend/src/pages/OfferComparison.jsx`
- `frontend/src/pages/CallRecordings.jsx`
- `frontend/src/pages/LiveDeals.jsx`
- `frontend/src/pages/BuyBoxes.jsx`

### Modified Files
- `frontend/src/pages/LeadScrubbing.jsx` — 3 video sections + banner
- `frontend/src/components/Sidebar.jsx` — new sections, reordered items
- `frontend/src/App.jsx` — 4 new routes
- `frontend/src/pages/AdminDashboard.jsx` — Live Deals tab + Buyer List tab
- `agent_finder/app.py` — new `/api/comps` endpoint

### Environment Variables (new)
- `VITE_DISCORD_DEALS_WEBHOOK` — Discord webhook for deal inquiries

### Dependencies (already installed)
- `jsPDF` — PDF generation ✓
- `framer-motion` — animations ✓
- `firebase/firestore` — data storage ✓
