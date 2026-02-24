# Community Mega Upgrade — Design Document

**Date:** 2026-02-24
**Status:** Approved

---

## Overview

Upgrade the Community page from a functional chat into a premium, engagement-driven message board. The Community is a hangout for members to talk, share wins, and ask questions — not a deal-flow or ops tool.

**Approach:** Big Bang — all features ship together in one build.

---

## 1. Reputation & XP System (Quality-Based)

### XP Earning

| Action | XP |
|--------|-----|
| Someone reacts to your message | +5 per reaction |
| Your message gets pinned by admin | +50 |
| Someone replies to your thread | +3 per reply |
| Reactions on your replies | +3 per reaction |
| Earn a badge | +25 bonus |

No XP for just posting. All XP comes from community recognition.

### Ninja Rank System

| Level | XP Required | Rank | Color |
|-------|-------------|------|-------|
| 1 | 0 | Academy Student | Gray |
| 2 | 50 | Genin | Green |
| 3 | 200 | Chunin | Blue (#00C6FF) |
| 4 | 500 | Jonin | Purple (#7F00FF) |
| 5 | 1,000 | ANBU | Red (#E53935) |
| 6 | 2,500 | Kage | Gold (#F6C445) |

### Badges (Auto-Earned)

- **First Blood** — First message posted
- **Crowd Favorite** — 10 reactions received on a single message
- **Sensei** — 50 replies to your threads
- **On Fire** — 7-day posting streak
- **Community Pillar** — Reached Jonin rank
- **Legendary** — Reached Kage rank

### Leaderboard

Collapsible panel in sidebar. Top 10 users by XP. Tabs: This Week / This Month / All Time.

---

## 2. Rich User Profiles

### Firestore Data (`users/{uid}`)

- Display name, bio (140 char max), avatar (initials-based, uploadable later)
- Role: Member, VIP, Moderator, Admin
- Stats: total messages, reactions received, threads started, current XP, rank, badges
- Join date, last active

### Profile Card (Click Username in Chat)

Expanded popover replacing current basic card:
- Avatar + rank badge, display name, role tag, bio
- Ninja rank with progress bar to next level
- Stats row: messages | reactions received | badges
- Badge showcase (up to 6, "see all" link)
- "Send Message" button (opens DM)

### Profile Page (`/community/profile/{uid}`)

- Full profile with activity feed (recent messages across channels)
- Complete badge collection
- XP history sparkline
- All stats expanded

### Role Badges in Chat

- Admin: red badge
- Moderator: purple badge
- VIP: gold badge
- Member: no badge (clean)
- Rank icon as small colored shield next to name

---

## 3. Direct Messages

### DM List (Sidebar)

- New section below channels: "Direct Messages" with "+" button
- Recent DM conversations sorted by last message time
- Each entry: avatar, name, last message preview (truncated), timestamp, unread dot

### DM Conversation View

- Clicking a DM replaces main feed area (channels stay in sidebar)
- Reuses existing message components (MessageBubble, MessageInput, GIFs, emoji, file uploads)
- Header: other user's name, rank badge, online status dot

### Starting a DM

- Click "+" next to Direct Messages header → searchable dropdown of community members
- Or click "Send Message" on any user profile card

### Firestore Data Model

```
conversations/{conversationId}
  - participants: [uid1, uid2]
  - lastMessage: { body, authorId, createdAt }
  - unreadCount: { uid1: 0, uid2: 3 }

directMessages/{messageId}
  - conversationId, authorId, authorName, body, gifUrl, attachments, createdAt
```

1-on-1 only. No group DMs.

---

## 4. Notifications

### Unread Indicators — Channels

- Blue dot + unread count badge on channel buttons in sidebar
- Tracked per-user: `userChannelState/{uid}/channels/{channelId}` with `lastReadAt` timestamp
- Switching to a channel updates `lastReadAt`, clears badge

### Unread Indicators — DMs

- Blue dot + count badge on each DM conversation
- Stored in `conversations` doc's `unreadCount` map

### "New Messages" Divider

- Horizontal line in feed: "── 3 new messages ──" at the point where user last read
- Auto-clears after 5 seconds of being visible

### Notification Bell

- Bell icon in top-right of Community page
- Shows total unread count across channels + DMs
- Click for dropdown: recent activity ("@you was mentioned in #general", "New DM from Jake", "Your post got 5 reactions")
- Clicking an item navigates to that channel/DM/message

No push/browser notifications — in-app only.

---

## 5. Search + Message Formatting

### Full-Text Search

- Search bar at top of main feed (magnifying glass, expands on click)
- Searches message body text in current channel by default
- Toggle to search "All Channels"
- Results: list of message cards with channel name, author, highlighted snippet, timestamp
- Click result → navigates to channel and scrolls to message with highlight
- Implementation: client-side filtering (`includes()` on message body)

### Message Formatting (Markdown-Lite)

- `**bold**` → **bold**
- `*italic*` → *italic*
- `` `inline code` `` → inline code
- ```` ```code block``` ```` → code block with dark background
- URLs auto-link (clickable, new tab)
- Rendered via `formatMessage()` utility in MessageBubble
- No link previews

---

## 6. Design Polish & Micro-interactions

### Message Hover Effects

- Subtle background tint on hover (`bg-white/[0.02]`)
- Action bar slides in from right with spring animation
- Reaction pills pulse briefly when toggled

### Sidebar Upgrades

- Channel unread count: glowing cyan pill badge
- Active channel: left border accent (2px cyan bar)
- DM section: subtle separator with label
- Leaderboard: collapsible, top 5 with rank icons + XP

### Rank Flair in Chat

- Small colored shield next to username matching ninja rank color
- Kage: subtle gold glow on name text
- ANBU: red tint
- Understated, not garish

### Smooth Transitions

- Channel switching: messages fade out/in
- New message: slides in from bottom with opacity fade
- Notification dropdown: scale + fade entrance

### Empty States

- Each channel gets themed text: e.g., #wins: "No wins shared yet. Be the first to celebrate!"
- #questions: "No questions yet. The dojo is quiet... for now."

### Loading States

- Skeleton shimmer placeholders (3 ghost message rows)
- Pulsing dots for "loading more" at top when scrolling up

---

## Files Affected

### New Files (Hooks)
- `useReputation.js` — XP calculation, rank determination, badge checks
- `useUserProfile.js` — Profile data CRUD
- `useDirectMessages.js` — DM conversations + messages
- `useNotifications.js` — Unread tracking, notification feed
- `useSearch.js` — Client-side message search

### New Files (Components)
- `ProfileCard.jsx` — Expanded user profile popover (replaces current basic card)
- `ProfilePage.jsx` — Dedicated profile route page
- `Leaderboard.jsx` — Sidebar leaderboard panel
- `BadgeShowcase.jsx` — Badge grid display
- `RankBadge.jsx` — Inline rank shield/icon
- `DMList.jsx` — DM conversation list in sidebar
- `DMConversation.jsx` — DM chat view
- `NewDMModal.jsx` — User search to start a DM
- `NotificationBell.jsx` — Header notification icon + dropdown
- `SearchBar.jsx` — Expandable search input + results
- `MessageSkeleton.jsx` — Loading placeholder rows
- `NewMessageDivider.jsx` — Unread messages divider line

### Modified Files
- `Community.jsx` — Integrate DM view, search, notification bell, leaderboard, new transitions
- `MessageBubble.jsx` — Add rank flair, message formatting, updated hover effects
- `MessageInput.jsx` — Formatting toolbar hints
- `OnlineUsersList.jsx` — Add rank icons
- `AuthContext.jsx` — Ensure user profile doc created/updated on login
- `App.jsx` — Add `/community/profile/:uid` route

### Firestore Collections (New)
- `users/{uid}` — Profile, stats, XP, badges, role
- `conversations/{id}` — DM participant pairs + last message
- `directMessages/{id}` — DM message docs
- `userChannelState/{uid}/channels/{channelId}` — Per-user read state
- `notifications/{uid}/items/{id}` — Notification feed items

### Firestore Security Rules (Update)
- Add rules for all new collections (auth required for all reads/writes)
- DM rules: only participants can read/write their conversations
