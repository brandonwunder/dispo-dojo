# Design: Find Buyers + Community Pages & FSBO Deletion

**Date:** 2026-02-23
**Status:** Approved

---

## 1. Deletion Scope

### FSBO Scraper (full removal)

**Frontend deletions:**
- `frontend/src/pages/FSBOFinder.jsx` — entire page
- `frontend/src/pages/DispoProcess.jsx` — replaced by Find Buyers

**Frontend modifications:**
- `App.jsx` — remove FSBO + Dispo route imports and `<Route>` entries; add Find Buyers + Community routes
- `Sidebar.jsx` — remove FSBO from Lead Generation, remove Dispo Process from Resources; add Find Buyers to Deal Management, add Community under Dashboard
- `Header.jsx` — remove FSBO + Dispo title/kanji/section entries; add new page entries
- `Dashboard.jsx` — remove FSBO Finder tool card; update Dispo card to Find Buyers
- `DirectAgent.jsx` — remove FSBO Finder tool link

**Backend deletions:**
- `agent_finder/scrapers/fsbo_base.py`
- `agent_finder/scrapers/fsbo_com.py`
- `agent_finder/scrapers/forsalebyowner_com.py`
- `agent_finder/scrapers/zillow_fsbo.py`
- `agent_finder/scrapers/realtor_fsbo.py`
- `agent_finder/scrapers/craigslist_fsbo.py`
- `agent_finder/fsbo_models.py` (if exists)
- `agent_finder/data/craigslist_areas.json`
- `agent_finder/data/fsbo.db`
- FSBO config entries in `agent_finder/config.py` (FSBO_COM, FORSALEBYOWNER_COM, ZILLOW_FSBO, REALTOR_FSBO, CRAIGSLIST_FSBO, FSBO_CACHE_TTL_HOURS, FSBO_MAX_PAGES)

**Optional cleanup:**
- `agent_finder/scrapers/__init__.py` — remove FSBO imports if present
- CRM mock data — remove FSBO source references in `src/components/crm/mockData.js`

---

## 2. Find Buyers Page

**Route:** `/find-buyers`
**Sidebar section:** Deal Management
**Replaces:** Dispo Process (deleted from Resources)

### Page Structure (top to bottom)

#### 2.1 Hero Header
- Ninja-themed icon + "Our Buyers Network" title (font-display, gold)
- Subheadline: "You bring the contract. We activate every channel we have."
- Sets the tone: confidence, not desperation

#### 2.2 Platform Engine Cards
4 cards in a 2x2 grid showing HOW we dispo:
1. **InvestorLift** — #1 disposition platform, nationwide verified buyer network
2. **InvestorBase** — Curated investor database with transaction history
3. **CreativeListing.com** — Creative finance marketplace (Sub-To, seller finance, wraps)
4. **Private Buyer Lists & Groups** — Proprietary hand-curated lists + private buyer groups

Each card: icon, name, highlight badge, one-liner description. Uses WoodPanel component.

#### 2.3 Buyer Types Grid
Two sections (carried from existing Dispo Process data):

**Conventional Buyers:** Section 8, STR, MTR, LTR
**Non-Conventional Buyers (gold highlight):** Fix & Flip, Novation, Creative Finance, Land Trust

#### 2.4 Blurred Buyer Data Table
A realistic-looking HTML table with ~15 rows of fake buyer data:
- Columns: Name, State, Buy Box Range, Property Types, Last Active
- Populated with realistic placeholder data (e.g., "J. Martinez", "TX", "$80k-$150k", "SFR, Duplex", "2 days ago")
- CSS `filter: blur(6px)` on entire table
- Centered lock overlay card on top:
  - Lock icon
  - "Buyer list access requires a signed JV agreement."
  - Primary CTA button: "Submit a Deal"

#### 2.5 Dual CTAs (bottom)
- **Primary:** "Submit a Deal" → opens JV modal flow
- **Secondary:** "Contact Dispo Team" → mailto or Discord link

### Submit a Deal Modal Flow

Three-step modal wizard:

**Step 1 — JV Agreement Notice**
- Header: "Joint Venture Agreement Required"
- Body: "To work with our buyers, we require a JV agreement to be signed prior to reaching out to our buyers."
- Button: "I Agree, Continue" → Step 2

**Step 2 — JV Contract Signing**
- Embedded JV contract text (scrollable)
- Signature fields: Full legal name (text input) + Date (auto-filled today)
- Button: "Sign Agreement" → generates PDF, advances to Step 3

**Step 3 — Confirmation + Upload**
- Success message: "JV Agreement Signed"
- Download button: "Download Signed JV Agreement" (PDF)
- File upload zone: "Upload Your Property Contract" (drag-and-drop or browse, accepts PDF/images)
- Submit button → fires Discord webhook with deal details
- Final confirmation toast/banner: "We're reviewing your contract and will reach out with next steps. We're getting this out to all of our buyers and getting this sold for you."

### Discord Webhook Integration
- On contract upload submission, POST to a Discord webhook URL (env variable)
- Payload: user name, email, JV signed date, uploaded contract file reference
- Channel: dedicated #jv-deals-submitted channel in Discord

---

## 3. Community Page

**Route:** `/community`
**Sidebar section:** Dashboard (directly beneath main Dashboard)

### Tech Stack
- **Firebase Spark (free tier):** Firestore for messages/channels/DMs, Firebase Auth for identity, real-time listeners
- Free tier limits: 1GB storage, 50k reads/day, 20k writes/day, unlimited auth users

### Phase Breakdown

#### Phase 1 — MVP (build now)

**Channel Feed:**
- Left sidebar: list of channels with icons
- Main area: scrollable message feed for selected channel
- Default channels: General, Wins, Deal Talk, Questions, Resources
- Each message shows: avatar, display name, timestamp, message body, reply count

**Thread Replies:**
- Click a message → slide-out right panel with thread
- Reply input at bottom of thread panel
- Thread shows parent message + all replies chronologically

**User Profiles:**
- Click username anywhere → popover/card showing: display name, avatar, join date, role badge (Member/Admin)
- "Send Message" button (wired in Phase 2)

**Post Creation:**
- Input bar at bottom of feed
- Basic rich text: bold, italic, links
- Emoji picker (lightweight, no external API needed for MVP)
- Channel selector if posting from a global view

**Data Model (Firestore):**
```
channels/{channelId}
  - name, icon, description, createdAt, order

messages/{messageId}
  - channelId, authorId, authorName, authorAvatar, body, createdAt, replyCount

replies/{replyId}
  - messageId, authorId, authorName, authorAvatar, body, createdAt

users/{userId}
  - displayName, avatar, joinedAt, role
```

#### Phase 2 — V1 (next iteration)

- **Direct Messages:** Side panel with chat list (left) + active conversation (right)
- **GIF support:** Tenor/Giphy API integration in composer
- **Group chats:** Named group conversations (deal-based, project-based)
- **Online presence:** Green dot indicator for active users (Firebase Realtime DB presence system)
- **Notifications:** Unread badges on channels and DMs

#### Phase 3 — V2 (future)

- File sharing (images, PDFs, docs in messages)
- Pinned messages per channel
- Emoji reactions on messages
- Full-text search across channels and DMs
- Roles/permissions (admin, moderator, member)

---

## 4. Navigation Changes

### Sidebar (after changes)

```
Dashboard
  ├── Dashboard (/)
  └── Community (/community)          ← NEW

Lead Generation
  ├── Listing Agent Finder (/agent-finder)
  └── Lead Scrubbing (/lead-scrubbing)
                                       ← FSBO Finder REMOVED

Deal Management
  ├── Free Underwriting (/underwriting)
  ├── LOI Generator (/loi-generator)
  ├── Contract Generator (/contract-generator)
  └── Find Buyers (/find-buyers)       ← NEW (replaces Dispo Process)

Resources
  ├── Scripts & Objections (/scripts)
  ├── Direct Agent Process (/direct-agent)
  └── Website Explainer (/website-explainer)
                                       ← Dispo Process REMOVED
```

---

## 5. Implementation Phases

### Phase 1: Cleanup + Find Buyers (build first)
1. Delete all FSBO scraper files (backend)
2. Delete FSBOFinder.jsx + DispoProcess.jsx
3. Update App.jsx, Sidebar.jsx, Header.jsx, Dashboard.jsx, DirectAgent.jsx
4. Build FindBuyers.jsx page (hero, platforms, buyer types, blurred table, CTAs)
5. Build JV modal flow (3-step wizard)
6. Set up Discord webhook integration
7. PDF generation for signed JV agreement

### Phase 2: Community MVP
1. Set up Firebase project + Firestore rules
2. Integrate Firebase Auth with existing AuthContext
3. Build Community page layout (channel sidebar + message feed)
4. Implement channel switching + message posting
5. Build thread/reply system (slide-out panel)
6. Build user profile cards
7. Add emoji picker + basic rich text formatting
8. Add Community to routing + navigation

### Phase 3: Community V1 (future)
- DMs, GIFs, group chats, presence, notifications

### Phase 4: Community V2 (future)
- File sharing, pins, reactions, search, roles
