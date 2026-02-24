# Onboarding Cap System — Design Doc
**Date:** 2026-02-23
**Status:** Approved, ready for implementation

---

## Overview

Implement a weekly onboarding cap of 25 new partner activations per week. Users who sign up past the cap are placed on a numbered waitlist and see their exact position. The admin approves waitlisted users in batches of 25 from a dedicated admin control panel. GHL (Go High Level) fires email + SMS notifications when a batch is activated (stubbed now, wired at launch).

---

## Firestore Data Structure

### `/onboarding_cap` (single document)

```json
{
  "weekStart": "2026-02-23",     // ISO date string, resets each time admin starts new week
  "activeCount": 0,              // increments 0–cap as users sign up
  "cap": 25,                     // editable from admin panel
  "paused": false,               // when true, all signups go to waitlist regardless of count
  "launchedAt": "2026-02-23"     // written once on first deploy, immutable
}
```

### `/waitlist` (collection)

Each document represents one waitlisted user:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "username": "johndoe123",
  "password": "hashed-or-plain",   // same as current localStorage pattern
  "position": 26,                  // global, sequential, never resets
  "batchNumber": 1,                // Math.ceil((position - cap) / batchSize)
  "status": "waiting",             // "waiting" | "active"
  "signedUpAt": "2026-02-23T...",
  "activatedAt": null              // set when admin activates their batch
}
```

**Batch math:** `batchNumber = Math.ceil((position - cap) / batchSize)` where `cap = 25` and `batchSize = 25`.
Batch 1 = positions 26–50, Batch 2 = 51–75, etc.

---

## Cap Logic (Firestore Transaction)

On "Enter the Dojo" click in the signup modal:

1. Run a Firestore transaction on `/onboarding_cap`
2. Check if `weekStart` is older than 7 days → if yes, reset `activeCount = 0` and update `weekStart`
3. Check `paused` flag → if true, skip to waitlist regardless of count
4. If `activeCount < cap`:
   - Increment `activeCount`
   - Create the user in `dispo_users` localStorage (existing pattern)
   - Log in immediately → ninja transition → dashboard
5. If `activeCount >= cap`:
   - Query waitlist to get current max position (or use a counter)
   - Write new waitlist document with `position = maxPosition + 1`
   - Return `{ waitlisted: true, position: N }`

---

## UX Flow

### Normal signup (slots available)
Steps 1 and 2 unchanged. "Enter the Dojo" shows a brief loading state (~1s for Firestore transaction), then ninja transition → dashboard. No visible sign of the cap system.

### Waitlisted signup (cap hit)
Steps 1 and 2 unchanged. On submit, loading state runs. Instead of ninja transition, the modal transforms to **Step 3 — Waitlist Confirmation**:

- Step indicator gets a third dot lit in **gold** (not cyan — signals different outcome, not failure)
- Heading: "You're on the List" (Onari font, gold shimmer)
- Large cyan glowing number showing their exact position: `#31`
- Subtext: "The dojo is at capacity this week. Your spot is reserved."
- Body: "We'll text and email you the moment your account is activated. Watch for it — it's coming."
- Single "Close" button — modal closes, user returns to login page

### Error handling
- Firestore unavailable → fall back to allowing signup (fail open, don't block users)
- Duplicate email/username → checked against localStorage first (existing behavior), then Firestore waitlist

---

## Admin Panel — Waitlist Tab

A new "Waitlist" tab in `AdminDashboard.jsx`.

### Onboarding Control Panel (top of tab)

Live stats and controls:

| Field | Description |
|---|---|
| Week Started | Date the current week began |
| Resets In | Live countdown (days + hours + minutes) |
| Cap | Editable number input |
| This Week's Activations | Progress bar: `activeCount / cap` |
| Waitlist Total | Total `status: "waiting"` count |
| Next Batch Size | Count of people in the lowest pending batch |

**Controls:**
- **Pause Onboarding** — toggles `paused` field. Button turns red, label changes to "Onboarding Paused." All new signups go to waitlist.
- **Reset Week Now** — confirmation prompt, then sets `activeCount = 0` and `weekStart = today`. Opens fresh 25 slots immediately.
- **Edit Cap** — inline number input. Change 25 to any number. Saved to Firestore immediately.

### Batch List (below control panel)

Pending waitlist grouped by batch:

```
Batch 1  |  Positions 26–50  |  25 people  |  [ Activate Batch ]
Batch 2  |  Positions 51–75  |  18 people  |  (locked until Batch 1 activated)
```

Only the **lowest pending batch** has an active "Activate Batch" button. Later batches are locked until the one before them is activated.

**Activate Batch action:**
1. Sets all users in that batch to `status: "active"` in Firestore
2. Writes each user's credentials into `dispo_users` localStorage on the admin's browser — **NOTE:** this only works on the device where the admin clicks. A future improvement is to store activated users in Firestore so any device can log them in.
3. Stubs GHL notification: `console.log("GHL STUB: send email+SMS to", email, phone)`
4. Button changes to "Activated ✓" and grays out
5. Control panel stats update live

Each batch row is expandable to show the list of people in it (name, email, phone, position, signed-up date).

---

## GHL Integration (Stubbed — See LAUNCH-TODOS.md)

The activate batch function will eventually call Go High Level to:
- Create a contact in GHL (name, email, phone)
- Trigger a GHL automation that sends:
  - **Email:** "Your Dispo Dojo account has been activated — welcome to the dojo."
  - **SMS:** Same message, short form

For now: `console.log("GHL STUB: ...")` placeholder in the activate function.

See [docs/todos/LAUNCH-TODOS.md](../todos/LAUNCH-TODOS.md) for the full GHL checklist.

---

## Files to Modify / Create

| File | Change |
|---|---|
| `frontend/src/lib/firebase.js` | Export Firestore `db` instance |
| `frontend/src/lib/onboardingCap.js` | New — Firestore transaction logic, waitlist writes, batch activation |
| `frontend/src/context/AuthContext.jsx` | Wire `signup()` through `onboardingCap` check before creating localStorage user |
| `frontend/src/pages/Login.jsx` | Add Step 3 waitlist confirmation screen to `SignUpModal` |
| `frontend/src/pages/AdminDashboard.jsx` | Add Waitlist tab with control panel + batch list |

---

## Out of Scope (This Phase)

- Real GHL API calls (stubbed with console.log)
- Email/SMS sent directly from the app (GHL handles this)
- Automatic weekly resets via Cloud Functions (admin resets manually)
- Activated users stored in Firestore (localStorage only for now — admin-device limitation noted)
