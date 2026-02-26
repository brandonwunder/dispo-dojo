# Message Board Discord-Style Overhaul — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Full Discord-style visual overhaul (Approach A)

---

## Goals

- Transform the Community message board from a basic chat interface into a premium Discord-like experience
- Fix cramped sidebar, flat message rendering, lack of channel organization, and overall polish
- Keep all existing features (channels, DMs, threads, reactions, search, notifications, XP/rank/badges)
- No new backend features — purely UI/UX layer changes
- Voice channels deferred to a future project

---

## 1. Sidebar Redesign (240px width)

### Structure (top to bottom):

1. **Server header** — "Dispo Dojo" with ninja seal icon. Single clean row.

2. **Channel categories** — 3 collapsible groups with chevron toggles:
   - **COMMUNITY** — #general, #wins
   - **DEAL ROOM** — #deal-talk, #resources
   - **HELP & LEARNING** — #questions

   Each channel: `# name` with unread dot indicator. Active = left cyan border + subtle cyan bg.

3. **Direct Messages** — Divider, "DIRECT MESSAGES" header + `+` button. Each DM: avatar + name + last message preview + unread badge.

4. **User dock (pinned to bottom)** — Avatar, name, rank badge, settings gear.

### Removed from sidebar:
- Online users list → moved to right panel member list
- Leaderboard → replaced by "Top Contributors" in member list

### Background:
- `#0E1317` solid with `rgba(0,198,255,0.06)` right border

---

## 2. Message Feed (Center Column)

### Channel Header Bar (~48px):
- Left: `# channel-name` bold + description muted
- Right: icon buttons — pinned (with count), member list toggle, search, notification bell
- Subtle bottom border

### Message Layout:
- **Normal message:** 40px avatar left, `AuthorName  timestamp` first line, body below. Full-width hover bg.
- **Grouped message:** Same user within 5 min — no avatar/name, just body. Hover shows timestamp in left gutter.
- **Hover actions:** Floating toolbar top-right on hover — react, reply, pin, more (edit/delete). Compact pill with icons.
- **Day dividers:** Centered date label on horizontal line.
- **Reactions:** Below body, small rounded pills `emoji count`.
- **Reply-to indicator:** Slim clickable quote above message, clicking jumps to original.

### Empty States:
- Centered themed illustration + channel-specific copy

### Message Input:
- Full-width rounded bar. Left: `+` for attachments. Right: emoji, GIF, send.
- Typing indicator above input bar.
- Reply-to banner above input when active.

### Background:
- `#111B24` with subtle atmospheric ninja bg showing through

---

## 3. Right Panel

### Member List (default, ~240px):
- Toggled via header icon
- Members grouped by rank tier:
  - KAGE (gold header)
  - ANBU (red header)
  - JONIN (purple header)
  - CHUNIN/GENIN/ACADEMY (grouped)
- Each row: avatar (online dot) + name + rank badge
- Click → profile card popover
- Top: "Top Contributors" section (top 3 by XP)

### Thread Panel (replaces member list, ~360px):
- Opens on "Reply" click
- Header: "Thread" + X close
- Parent message as quote card
- Reply messages in compact list
- Input bar at bottom
- Close → returns to member list

### Background:
- `#0E1317` matching sidebar

---

## 4. Visual Theme

### Colors:
| Element | Value |
|---------|-------|
| Sidebar/right panel bg | `#0E1317` |
| Main feed bg | `#111B24` |
| Active channel / hover | `rgba(0,198,255,0.08)` |
| Message hover | `rgba(0,198,255,0.03)` |
| Dividers | `rgba(0,198,255,0.06)` |
| Gold accents | `#F6C445` (rank badges, pins, top contributors) |
| Text primary | `#F4F7FA` |
| Text dim | `#8A9AAA` |
| Text body | `#C8D1DA` |

### Typography:
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Channel names | Rajdhani | 14px | 600 |
| Message author | Rajdhani | 15px | 600 |
| Message body | DM Sans | 14px | 400, lh 1.5 |
| Timestamps | DM Sans | 11px | 400 |
| Category headers | DM Sans | 11px | 700, uppercase, ls 0.08em |

### Interactions:
- Hover transitions: 150ms ease on `background-color`, `opacity`
- Thread panel: spring slide-in animation
- Category collapse: 200ms height animation
- Hover action bar: 100ms fade-in

---

## 5. Files Affected

### Modified:
- `Community.jsx` — Main layout restructure
- `MessageBubble.jsx` — Discord-style message rendering
- `MessageInput.jsx` — Redesigned input bar
- `ChannelHero.jsx` → renamed/refactored to `ChannelHeader.jsx`
- `PinnedMessagesBar.jsx` — Integrated into channel header
- `OnlineUsersList.jsx` → refactored into `MemberList.jsx`
- `Leaderboard.jsx` → condensed into "Top Contributors" in MemberList
- `DMList.jsx` — Better DM row design
- `ProfileCard.jsx` — Minor polish
- `ReactionBar.jsx` — Pill-style reactions
- `TypingIndicator.jsx` — Position above input
- `SearchBar.jsx` — Integrated into channel header
- `NotificationBell.jsx` — Integrated into channel header

### New:
- `ChannelCategory.jsx` — Collapsible category component
- `MessageHoverActions.jsx` — Floating action toolbar
- `MemberList.jsx` — Right panel member list grouped by rank

### Unchanged (logic preserved):
- All hooks (useMessages, useReplies, useReactions, etc.)
- All data models and Firestore structure
- Auth context
- Firebase configuration

---

## 6. Out of Scope

- Voice channels (deferred)
- New channels beyond existing 5
- Backend/database changes
- Authentication changes
- Mobile layout (future consideration)
