# Phase 1: LOI Sender — Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the existing LOI Generator page with a new flagship feature: **LOI Sender** — a 5-step wizard that lets users upload a CSV/Excel lead list, map columns to LOI fields, build a personalized LOI template with merge fields, preview generated LOIs, and send them via their own Gmail account at a natural, anti-spam pace. Campaigns are stored in Firestore so users can pause and resume across sessions.

This phase:
- Deletes `LOIGenerator.jsx` and its route
- Creates `LOISender.jsx` and all sub-components
- Updates Sidebar + App router
- Integrates Gmail OAuth2 (client-side, no backend)
- Integrates Firestore for campaign persistence

Out of scope for this phase: scheduled/recurring sends, CRM integration, team-shared campaigns.

</domain>

<decisions>
## Implementation Decisions

### Page & Navigation
- Page name: **LOI Sender** (replaces LOI Generator in sidebar)
- Route: `/loi-sender` (old `/loi-generator` route removed)
- Sidebar section: "Deal Management" — replace `{ to: '/loi-generator', label: 'LOI Generator' }` with `{ to: '/loi-sender', label: 'LOI Sender' }`
- Delete `frontend/src/pages/LOIGenerator.jsx`

### Wizard Steps (5 total)
1. **Upload** — CSV or Excel (.xlsx) drag-and-drop + file picker
2. **Map Columns** — Auto-detect fuzzy-match + manual override dropdowns
3. **Build Template** — Rich text editor + click-to-insert merge fields + email subject/body fields
4. **Preview** — Review first 3-5 generated LOIs before sending
5. **Send** — Gmail connect + live send queue with progress bar

### Gmail Authentication
- **Method:** Google OAuth2 via Google Identity Services (GIS) — client-side only, no backend
- **Scope:** `https://www.googleapis.com/auth/gmail.send`
- **Token storage:** In React state / sessionStorage only (not Firestore — security)
- **UI:** "Connect Gmail" button in Step 5; shows connected email once authorized
- **Error:** If token expires mid-send, pause and prompt to re-authenticate

### Sending Engine
- **Location:** Client-side only (no backend, no Cloud Functions)
- **API:** Gmail REST API called directly from browser with OAuth access token
- **PDF:** Generated per lead using jsPDF — one PDF per email
- **Email format:** Short intro body text (merge-field enabled) + PDF attachment (base64)
- **Gmail account detection:** Parse the authorized email — if @gmail.com → 100/day cap; all other domains → 1,000/day cap

### Sending Pace & Rate Limits
- **Send window:** 8:00 AM – 11:00 PM EST (do not send outside this window; if campaign starts during window, queue pauses at 11pm and resumes at 8am next day)
- **Daily cap:** 100 emails/day for @gmail.com accounts; 1,000/day for branded domains
- **Delay between sends:** Random integer between 15–55 seconds (new random value each time)
- **Implementation:** `setTimeout` loop in browser; page must remain open while sending

### Template Builder
- **Editor:** Rich text editor (TipTap or Quill.js) — bold, italic, font size, paragraph breaks
- **Merge fields:** Panel on the right side showing all available fields; click to insert `{{field_name}}` at cursor
- **Template library:** Saved to Firestore per user; users can name, save, load, and delete templates
- **Default starter:** Generic professional real estate LOI pre-loaded with common merge fields
- **Email subject line:** Separate input field, supports merge fields (e.g., `LOI for {{address}}`)
- **Email body intro:** Separate textarea above PDF attachment, supports merge fields

### Column Mapping
- **Auto-detect:** Fuzzy string match column headers to our canonical field names (e.g., "Prop Address" → `address`, "Asking $" → `asking_price`)
- **Manual override:** Dropdown per canonical field; user can correct any mismatch
- **Required fields:** `email` must be mapped before proceeding; all others optional
- **Preview after mapping:** Show first 3 rows with substituted values to confirm correctness

### LOI Field Schema (canonical names)
Sourced from LOI Blaster + user's original field list:

| Canonical Name | Display Label | Source |
|---|---|---|
| `address` | Property Address | LOI Blaster |
| `city` | City | LOI Blaster |
| `state` | State | LOI Blaster |
| `zip` | Zip Code | LOI Blaster |
| `asking_price` | Asking Price | LOI Blaster |
| `loan_type` | Loan Type | LOI Blaster |
| `interest_rate` | Interest Rate | LOI Blaster |
| `loan_balance` | Loan Balance | LOI Blaster |
| `percent_equity` | Percent Equity | LOI Blaster |
| `equity` | Equity | LOI Blaster |
| `cash_to_seller` | Cash to Seller | LOI Blaster |
| `cash_offer` | Cash Offer | LOI Blaster |
| `agent_name` | Agent Name | LOI Blaster (Name col) |
| `agent_email` | Agent Email | User req. |
| `agent_phone` | Agent Phone | LOI Blaster |
| `cash_to_agent` | Cash to Agent | User req. |
| `apn` | APN | User req. |
| `beds` | Beds | User req. |
| `baths` | Baths | User req. |
| `sqft` | Sq Ft | User req. |
| `notes` | Notes | User req. |

### Campaign Persistence (Firestore)
- **Collection:** `campaigns/{userId}/campaigns/{campaignId}`
- **Stores:** campaign name, upload date, lead list (array of row objects), template used, per-lead send status (pending/sent/failed/skipped), error messages, sent count, total count
- **Resume:** Load last active campaign on page load; offer "Resume Campaign" CTA
- **History:** Show past campaigns in a list with status summary

### Live Send Dashboard (Step 5)
- Progress bar: X of Y sent
- Stats row: Sent / Failed / Pending / Skipped counts
- Per-lead log: scrollable table — address, email, status, timestamp, error (if any)
- Controls: Start / Pause / Resume / Cancel buttons
- Filter buttons: All / Sent / Failed / Pending (like the transcript's queue review)

### Error Handling
- Per-email errors: log the Gmail API error message, mark lead as "Failed", continue to next
- Day cap hit: pause campaign, show banner "Daily limit reached. Resuming tomorrow at 8am EST."
- Outside send window: show countdown to next window open
- Gmail token expired: pause, prompt to re-authenticate, then auto-resume

### Campaign Lifecycle
1. User arrives → sees "New Campaign" button + history of past campaigns
2. Clicks "New Campaign" → enters 5-step wizard
3. Completes wizard → campaign saved to Firestore with all leads in "pending" status
4. Starts sending → status updates in real time to Firestore
5. Session closes → campaign stays in Firestore; next visit shows "Resume" option

### Claude's Discretion
- TipTap vs Quill.js selection (pick whichever integrates more cleanly with Vite/React 19)
- Exact fuzzy-match algorithm for column auto-detection
- Exact PDF layout/design for the LOI document
- Toast/notification system for in-session alerts
- Exact Firestore data schema beyond what's listed above

</decisions>

<specifics>
## Specific Ideas

- **Reference tool:** Bulk LOI Sender (Google Sheets add-on) — uses `{{placeholders}}` in template, creates one PDF per lead, sends via Gmail, has a "Sender Q" tab tracking status. We replicate this as a native web app.
- **LOI Blaster field schema** extracted from `LOI BLASTER.xlsx` — 16 columns across Address, City, State, Zip, Loan Type, Interest Rate, Loan Balance, Asking Price, Name, Phone, Email, Percent Equity, Equity, Cash To Seller, Cash Offer, Attachment.
- **Sporadic delays** are intentional anti-spam behavior — NOT a fixed interval. New random value (15-55s) each send.
- **Account type detection** from the OAuth-returned email address — not a manual setting.
- The send loop must handle the browser tab staying open. Show a warning: "Keep this tab open while sending."

</specifics>

<deferred>
## Deferred Ideas

- Scheduled/recurring campaigns (e.g., "send 50/day automatically each morning") — future phase
- CRM integration (auto-update lead status after send) — future phase
- Team-shared campaign templates — future phase
- Reply tracking / open tracking — future phase
- SMS LOI sending — future phase

</deferred>

---

*Phase: 01-loi-sender*
*Context gathered: 2026-02-24*
