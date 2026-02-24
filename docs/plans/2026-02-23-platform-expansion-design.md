# Dispo Dojo — Platform Expansion Design
**Date**: 2026-02-23
**Scope**: Bird Dog, Boots on the Ground, Ninja Avatar System, Quick Settings Panel, Leaderboard, Underwriting Calculator, Unified Profile Identity

---

## 1. Architecture Overview

### New Routes
| Path | Component | Sidebar Section |
|---|---|---|
| `/bird-dog` | BirdDog.jsx | Lead Generation |
| `/boots-on-ground` | BootsOnGround.jsx | Lead Generation |
| `/leaderboard` | Leaderboard.jsx | Dashboard |
| `/underwriting` | Underwriting.jsx (rebuilt) | Deal Management |

### New Components
- `NinjaAvatar.jsx` — SVG avatar renderer (accepts avatarConfig prop)
- `AvatarBuilder.jsx` — Interactive builder UI within QuickSettingsPanel
- `QuickSettingsPanel.jsx` — Full slide-over settings modal
- `RankBadge.jsx` — Rank tier badge chip
- `ActivityBadge.jsx` — Stackable achievement badges

### Updated Components
- `AuthContext.jsx` — Expanded user data model; Firestore profile sync
- `Sidebar.jsx` — Clickable avatar at bottom, routes to QuickSettings
- `UserProfileCard.jsx` — Shows ninja avatar, rank, badges
- `Community.jsx` — Avatar next to messages

---

## 2. User Identity Data Model

### Firestore: `users/{uid}`
```json
{
  "displayName": "string",
  "username": "string",
  "email": "string",
  "phone": "string",
  "bio": "string (optional)",
  "market": "string (city, state)",
  "role": "member | bird-dog | boots | jv-partner | admin",
  "avatarConfig": {
    "base": "male | female",
    "maskColor": "#hex",
    "headbandColor": "#hex",
    "beltColor": "#hex",
    "eyeColor": "#hex",
    "gear": ["katana", "shuriken", "smoke", "aura", "golden-trim"],
    "effects": ["glow-eyes", "smoke-wisps", "full-aura"]
  },
  "stats": {
    "underwrites": 0,
    "lois": 0,
    "contracts": 0,
    "messages": 0,
    "dealsSubmitted": 0,
    "dealsClosed": 0,
    "birdDogLeads": 0,
    "bootsTasksCompleted": 0
  },
  "rank": "initiate",
  "badges": ["string"],
  "createdAt": "timestamp",
  "notificationPrefs": {
    "communityReplies": true,
    "dealUpdates": true,
    "taskAssignments": true
  }
}
```

### Auth Flow Change
- Replace `signInAnonymously` with `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`
- On signup: create user doc in Firestore `users/{uid}`
- On login: read user doc from Firestore, merge into AuthContext state
- AuthContext provides: `user`, `userProfile`, `updateProfile(data)`, `isLoggedIn`, `isAdmin`, `login`, `signup`, `logout`

---

## 3. Ninja Avatar System

### Avatar SVG Architecture
Each layer is a standalone SVG `<g>` element rendered in z-order:
1. **Body** — Silhouette with gender variant (M/F), proper proportions, slight muscle definition via curves
2. **Gi (outfit)** — Wrap-front ninja uniform with illustrated fold/wrinkle lines as SVG paths
3. **Belt** — Horizontal band with rank color, centered knot detail
4. **Mask** — Lower-face covering with horizontal stitch line detail, nose bridge curve
5. **Headband** — Folded cloth wrap with two free-flowing tails behind head (SVG path curves)
6. **Eyes** — Visible above mask, almond-shaped with iris color
7. **Accessories (unlockable)**:
   - `katana` — Over left shoulder, grip visible at right, blade angle up-left
   - `shuriken` — Small 4-point star clipped to belt
   - `smoke-wisps` — 3 curling smoke path elements, animated with CSS keyframes (opacity + translateY)
   - `glow-eyes` — Radial gradient behind eyes + CSS glow filter
   - `full-aura` — Outer glow ring around entire figure (SVG feGaussianBlur filter)
   - `golden-trim` — Gold-color outline on gi edges

### Progression Tiers

| Tier | Rank | Name | Unlock Criteria | Visual Change |
|---|---|---|---|---|
| 0 | Initiate | Initiate | Account created | White headband, black mask, default gi |
| 1 | Scout | Scout | 1 underwrite OR 1 LOI | Mask color choices unlocked (5 colors) |
| 2 | Shinobi | Shinobi | 3 underwrites | Headband color choices unlocked |
| 3 | Shadow | Shadow | 5 underwrites | Smoke wisps effect unlocked |
| 4 | Blade | Blade | 10 underwrites | Katana accessory unlocked |
| 5 | Jonin | Jonin | 15 underwrites | Red headband + gold belt auto-applied |
| 6 | Shadow Master | Shadow Master | 20 underwrites | Glowing eye effect + black gi unlocked |
| 7 | Kage | Kage | 5 deals closed | Full aura effect + golden trim unlocked |

### Activity Badges
Earned independently from rank, displayed as small seal icons:
- **Active Voice** — 100 messages
- **Community Pillar** — 500 messages
- **Deal Hunter** — 10 underwrites submitted
- **Ink Slinger** — 5 LOIs generated
- **First Blood** — 1st deal submitted
- **Closer** — 3 deals closed
- **Top Closer** — 10 deals closed
- **Bird Dog** — role badge (admin-granted)
- **Boots** — role badge (admin-granted)

Badge check is pure client-side logic: compare `stats` values against thresholds, store awarded badges array in Firestore.

---

## 4. Quick Settings Panel

### Trigger
Clicking the user's avatar/initials anywhere (sidebar bottom widget, community message avatar, leaderboard row) opens the panel.

### Layout
- Right-side slide-over, `w-[380px]`, full viewport height
- `AnimatePresence` from right (x: 380 → 0)
- Dark background (`#0B0F14`) with gold border on left edge
- Tab strip at top (6 tabs)

### Tabs
1. **Identity** — Display name, username (unique check), bio textarea, market field (city/state)
2. **Ninja** — Live avatar preview (center), color pickers for unlocked options, locked options shown as dimmed silhouettes with lock icon; base M/F toggle
3. **Contact** — Email (read-only), phone (editable), notification toggle cards
4. **Account** — Password change fields, role/status display chip, quick-links ("My Submissions", "My Tasks", "My Deals")
5. **Rank** — Current rank card with avatar, rank name, progress bar to next rank showing exactly what's needed; earned badges grid
6. **Support** — FAQ accordion (5-6 common questions), "Submit a ticket" button (opens mailto or form)

### Save behavior
Changes to any tab accumulate in local state. "Save Changes" button at panel bottom writes to Firestore `users/{uid}` and updates AuthContext.

---

## 5. Bird Dog Page (`/bird-dog`)

### Layout: 3-column (sidebar aside / form center / submissions right)

**Left column — Explainer**
- "What is a Bird Dog?" heading
- Role definition: someone who finds motivated sellers and brings them to the team
- Valid lead criteria (checklist): Owner is motivated/distressed, Property is not listed on MLS, Owner is open to creative or below-market offer, Contact info confirmed
- Payout structure: Flat fee on close ($500–$2,000 depending on deal size) — admin-configurable
- Timeline: submission → review (24–48h) → status update

**Center column — Submission Form**
Fields: Property address, Owner name, Owner phone, Owner email (optional), How you found it (dropdown: Driving for Dollars / Door-Knocking / Cold Call / Referral / Other), Situation description (textarea), Their contact details (pre-filled from profile), Terms checkbox
Submit → writes to Firestore `bird_dog_leads` collection with `userId`, `status: 'pending'`, timestamp

**Right column — My Submissions**
Real-time Firestore listener on `bird_dog_leads` where `userId == currentUser.uid`
Status badge colors: Pending (gold) / Qualified (cyan) / Working (purple) / Closed (green) / Rejected (red)

---

## 6. Boots on the Ground Page (`/boots-on-ground`)

### Onboarding (first visit, no serviceArea set)
Full-page setup wizard:
1. Coverage area — city/state + radius (10/25/50 miles slider)
2. Task types — multi-select toggle cards: Photos, Walkthrough, Lockbox Access, Sign Placement, Occupant Check, HOA Docs
3. Availability — day-of-week toggle chips (Mon–Sun)
Saves to `users/{uid}.bootsProfile` in Firestore

### Main View (after setup)

**Left column — Open Tasks**
Real-time listener on `boots_tasks` where `market` matches user's market AND `acceptedBy == null`
Each task card: task type badge (icon + label), property address, due date chip, pay amount, "Accept Task" button
Accept → `updateDoc` sets `acceptedBy: uid`, `status: 'accepted'`

**Right column — My Active Tasks**
Tasks where `acceptedBy == currentUser.uid`
Status flow: Accepted → In Progress → Submitted → Complete
Photo upload area for evidence (Firebase Storage → URL saved to task doc)

---

## 7. Leaderboard Page (`/leaderboard`)

### Layout

**Top: Podium (3 columns)**
- #2 left (medium height card, silver glow)
- #1 center (tallest, gold glow ring + crown icon, full aura effect visible on avatar)
- #3 right (shorter, bronze glow)
Each card: NinjaAvatar (large, ~100px), username, rank badge, score

**Below: Ranked list (tabbed categories)**
Tabs: Overall | Underwrites | LOIs | Most Active | Bird Dog Leads

Each tab row: Rank number, NinjaAvatar (small, ~32px), username, rank badge, score value
Current user's row: Always pinned at bottom of table with "You" indicator

### Scoring
Points computed from `stats` on user doc:
- 1 underwrite = 10 pts
- 1 LOI = 8 pts
- 1 contract = 8 pts
- 1 deal submitted = 15 pts
- 1 deal closed = 50 pts
- 100 messages = 5 pts
- 1 bird dog lead = 12 pts
- 1 boots task = 8 pts

Leaderboard reads all user docs (paginated, top 50 by score). For initial build, read all users and sort client-side (works until ~500 users).

---

## 8. Underwriting Calculator (`/underwriting` rebuilt)

### Layout: Two-panel (inputs left / results right)

**Left: Inputs (tabbed)**
- Tab 1 "Property" — Address, Bed, Bath, Sqft, Lot, Year Built
- Tab 2 "Financing" — Loan Balance, Interest Rate (%), Loan Type (FHA/Conv/VA/Other), Years Remaining, Escrow Amount, Down Payment Assistance, Solar Balance, Secondary Lien, Arrears
- Tab 3 "Deal" — Asking Price, Entry Fee, Cash to Seller, Cash to Agent, Assignment Fee, Rehab, Furnishing, Holding Costs (3mo), Marketing, Closing Costs, TC, Wholesale Entry Fee
- Tab 4 "Rental Rates" — For each of 4 strategies (LTR / MTR / STR / Section 8): Pro Forma Rent, Warchest %, Property Management %, Insurance, Taxes, utilities toggles (Internet, Electric, Gas, Water, Pest, Landscaping, Snow, Security, PML Interest)
- Tab 5 "PML" — Amount, Interest Rate (%), Term (years)

**Right: Results Panel**
Cards from spreadsheet logic:
- Seller Net card (Asking Price − Closing Costs 8%)
- Monthly Payment breakdown (P&I, Taxes/Insurance, HOA, Solar, PITI, Total)
- Underwriting: Max Entry Fee (10% of ARV), Cash to Seller/Agent (~6%), EMD (user input)
- 4 Strategy cards (LTR/MTR/STR/Section 8): Monthly NCF, Annual NCF, Cash-on-Cash Return, color-coded (green ≥ $300/mo, yellow $100–299, red < $100)
- Wholesale vs Buy section: Wholesale NCF, Wholesale CoC, Buy NCF, Buy CoC

All formulas implemented as pure JS functions matching spreadsheet logic.

---

## 9. Sidebar & Navigation Updates

### Sidebar additions
- Bird Dog entry under Lead Generation
- Boots on Ground entry under Lead Generation
- Leaderboard entry under Dashboard section

### Sidebar user widget (bottom)
Replace initials circle with `NinjaAvatar` component (small, 32px). Click → opens `QuickSettingsPanel`.

---

## 10. Community Integration

### Avatar in messages
Replace `hanko-seal` initials circles with `NinjaAvatar` component (small, 28px). Pull from `authorUid` → profile lookup (cached in memory).

Author name click still shows `UserProfileCard` but now enhanced: shows avatar, rank badge, badge row, bio, market.

---

## Implementation Notes

- Auth migration: Maintain localStorage fallback for existing sessions. On first Firestore-enabled login, create user doc and migrate local data.
- Stats increment: Each page that generates stats (Underwriting submit, LOI generate, message send) calls `updateDoc` on the user's Firestore doc to increment the relevant stat counter.
- Rank computation: Pure JS function `computeRank(stats)` — called on every stats update, stores result back to Firestore.
- Badge computation: Pure JS function `computeBadges(stats)` — same pattern.
- Avatar rendering: `NinjaAvatar` accepts `config` prop and `size` prop. Renders SVG at correct scale using `viewBox` scaling.
