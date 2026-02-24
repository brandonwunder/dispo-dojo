# Community Page Premium Redesign — Design Document
**Date:** 2026-02-24
**Approach:** Component-First Redesign (Approach B)
**Theme:** Premium Social Hub — Electric Ninja Command Center

---

## Overview

Full visual and UX upgrade of the Community messaging board to match the premium quality of the Agent Finder and Underwriting pages. The Firestore real-time data layer (all hooks) is preserved intact — only the presentation layer is rebuilt.

**Goals:**
- Eliminate the generic/plain feel; make every surface feel crafted and premium
- Give the message feed breathing room with better hierarchy
- Add four new features: channel hero headers, rich member profiles, deal cards, photo upload
- Apply the ninja-gathering background with atmospheric fade, consistent with other pages

---

## 1. Layout & Structure

**Three-column layout preserved, dimensions expanded:**

| Zone | Width | Notes |
|------|-------|-------|
| Left Sidebar | 260px (280px on xl) | Branding dock + channel nav + user dock |
| Center Feed | flex-1, max-width ~900px | Hero header + message list + input bar |
| Right Thread Panel | 400px | Slides in on reply; proper panel header |

- Center feed has wider left padding (64px from avatar edge to content)
- Main area has a `position: relative` container for background layering
- Thread panel slides in with spring physics (same as today but wider)

---

## 2. Background

**Source:** `Message Board Background.png` → copied to `frontend/public/community-bg.png`

**Same 4-layer fade system as AgentFinder:**

```jsx
<div className="fixed inset-0 z-0 pointer-events-none">
  {/* Layer 0: Ninja gathering image */}
  <div style={{
    backgroundImage: 'url(/community-bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center 25%',
  }} className="absolute inset-0" />

  {/* Layer 1: Atmospheric fade — center/left heavily darkened for readability */}
  <div style={{
    background: `
      radial-gradient(ellipse 90% 70% at 50% 40%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.75) 55%, rgba(11,15,20,0.92) 100%),
      linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.60) 40%, rgba(11,15,20,0.90) 100%)
    `
  }} className="absolute inset-0" />

  {/* Layer 2: Left sidebar darkening */}
  <div style={{
    background: 'linear-gradient(to right, rgba(11,15,20,0.85) 0%, rgba(11,15,20,0.40) 30%, transparent 60%)'
  }} className="absolute inset-0" />

  {/* Layer 3: Bottom fade to page bg */}
  <div style={{ background: 'linear-gradient(to bottom, transparent, #0B0F14)' }}
    className="absolute inset-x-0 bottom-0 h-48" />
</div>
```

---

## 3. Channel Sidebar (260px)

### Top Branding Dock
- Circle hanko seal: "DD" in Onari font, gradient `#0E5A88 → #00C6FF`, 40px
- "Dispo Dojo" in Rajdhani Bold 16px beside it
- "Community" label in DM Sans 12px with live online count badge: `● 12 online` in green
- Katana divider (cyan gradient line) below

### Channel Nav
- Section header: `CHANNELS` in Rajdhani 10px uppercase tracking-widest, `#8A9AAA`
- Each channel row: `# channel-name` with optional unread count badge (gold pill)
  - Active: left-edge glow strip (cyan, 3px) + `bg-[rgba(0,198,255,0.08)]` + name `#00C6FF`
  - Unread: name `#F4F7FA` + gold pill with count
  - Inactive: name `#8A9AAA`, hover → `#C8D1DA` + `bg-white/[0.03]`
  - Transition: `transition-colors duration-150`

### User Dock (bottom, pinned)
- 36px avatar (photo or styled initials with gradient background)
- Status ring: green glow if online
- Display name in Rajdhani 14px + role badge inline
- Settings gear icon appears on hover (right side)
- Separator katana line above

---

## 4. Channel Hero Header (~180px tall)

Full-width panel at top of the message feed per channel.

### Layout
```
[Left: Channel Identity]              [Right: Quick Actions]
# channel-name (Rajdhani Bold 28px)   [📌 Pinned (3)]
Channel description (DM Sans 14px)    [👥 Members]
● 847 messages  ● 23 members          [🔔 Notifications]
```

### Per-Channel Gradient Identities
| Channel | Gradient |
|---------|----------|
| #general | `rgba(14,90,136,0.25) → transparent` (teal-blue) |
| #wins | `rgba(246,196,69,0.18) → transparent` (gold) |
| #deal-talk | `rgba(127,0,255,0.18) → transparent` (purple) |
| #questions | `rgba(0,198,255,0.15) → transparent` (cyan) |
| #resources | `rgba(34,197,94,0.18) → transparent` (green) |

- Noise texture overlay at 12% opacity
- Bottom fade to feed background (seamless blend)
- Quick action buttons: glass pills with icon + label, hover → cyan border + text

### Pinned Bar
- Stays below hero, same collapsible behavior as today
- Slightly elevated styling: `bg-[rgba(246,196,69,0.06)]` border `border-gold/20`

---

## 5. Message Feed & Bubbles

### Message Anatomy
```
[44px Avatar]  Author Name  [Role Badge]  · 2h ago
               Message body text...
               [GIF/Image embed if present]
               [Deal Card if present]
               [👍 3] [🔥 7]             [↩ Reply toolbar]
```

### Avatar
- 44px circle with photo (if uploaded) or styled initials
- Gradient background: `#0E5A88 → #00C6FF`
- Status ring: 2px, green glow if online
- Hover shows subtle scale(1.05) + brighter glow

### Name Line
- Author name: Rajdhani SemiBold 15px, `#F4F7FA`, clickable → opens profile popover
- Role badge: `Admin` = crimson `#E53935` background/10, `Member` = steel blue — inline pill 10px
- Timestamp: DM Sans 12px `#8A9AAA`, relative format; hover tooltip shows absolute time

### Body Text
- DM Sans 15px, `#C8D1DA`, line-height 1.7
- `@mentions`: `bg-[rgba(0,198,255,0.15)]` + `text-[#00C6FF]` + bold — inline pill
- Links: `text-[#00C6FF]` underline, `hover:text-[#FFD97A]`
- `(edited)` badge: `#8A9AAA` 11px italic after body
- Deleted: gray italic "Message deleted" placeholder

### Message Grouping
- Consecutive messages from same author within 5 minutes: collapse avatar + name
- Subsequent messages show only body + hover timestamp (no avatar/name repeat)
- Group separator: if >5 min gap, show date divider (katana line + centered timestamp)

### Reactions
- Chip style: `bg-white/[0.06]` + `border border-white/[0.10]` + `rounded-full` + `px-2 py-0.5`
- Own reaction: `bg-[rgba(0,198,255,0.12)]` + `border-[#00C6FF]/40` + `text-[#00C6FF]`
- Hover: `scale-105` + darker background
- Count: Rajdhani 12px

### Hover Action Toolbar
- Appears on message hover: floating dark card right-aligned
- Items: `[😊 React]  [↩ Reply]  [✏️ Edit]  [📌 Pin]  [🗑️ Delete]`
- Spring animation in from right: `x: 8 → 0, opacity: 0 → 1`
- Owner-only: Edit/Delete; Admin-only: Pin; All: React/Reply

---

## 6. Deal/Property Cards

Inline card rendered inside a message when a member shares a deal.

### Trigger
- `[🏠 Deal]` button in input bar `+` toolbar expands a form: Address, ARV, Ask Price, Description
- Stored as special message type in Firestore: `type: 'deal'`, `dealData: {...}`

### Card Layout (340px wide, inside message)
```
┌─────────────────────────────────────────┐
│  [Property image or gradient thumbnail] │
│  ─ gradient overlay bottom-to-top ─     │
│                                         │
│  123 Oak Street, Phoenix AZ 85001       │
│  3bd · 2ba · 1,450 sqft                │
│                                         │
│  ARV $285K    Ask $190K    Spread $95K  │
│                                         │
│  [View Deal →]      [💾 Save]           │
└─────────────────────────────────────────┘
```

### Styling
- Glass card: `bg-[rgba(11,15,20,0.75)]` + `border border-[rgba(0,198,255,0.2)]` + `rounded-xl`
- Property image: `placehold.co/340x140` gradient thumb if no image; gradient overlay `from-black/70`
- Stat row: Rajdhani SemiBold — ARV in gold, Ask in cyan, Spread in green
- "View Deal" button: red CTA gradient (`#E53935 → #B3261E`)
- "Save" button: ghost with cyan border

### Firestore Schema Addition
```js
// messages document
type: 'deal',  // optional field, undefined = normal message
dealData: {
  address: String,
  arv: Number,
  askPrice: Number,
  sqft: Number,
  beds: Number,
  baths: Number,
  description: String,
}
```

---

## 7. Rich Member Profile Popover

Clicking any author name opens a floating glass popover.

### Layout (320px wide)
```
┌──────────────────────────────────────┐
│  [Avatar 64px]  Brandon Moore         │
│                 Admin · Phoenix, AZ   │
│                 ● Online now          │
├──────────────────────────────────────┤
│  📨 Messages   🤝 Deals   🏆 Rank     │
│    847           23          #4       │
├──────────────────────────────────────┤
│  Recent Posts                         │
│  "Building my buyer's list..."        │
│  "Anyone know buyers in Tampa?"       │
├──────────────────────────────────────┘
│  [Edit Profile]  (own profile only)   │
└──────────────────────────────────────┘
```

### Positioning
- Uses smart positioning: appears above/below/left/right based on viewport space
- `@floating-ui/react` for collision-aware placement
- `z-50`, spring fade-in animation

### Styling
- Glass morphism: `backdrop-blur(20px)` + `bg-[rgba(11,15,20,0.85)]`
- Cyan border glow: `border-[rgba(0,198,255,0.2)]`
- Stats row: gold for messages, cyan for deals, crimson for rank (Rajdhani SemiBold 22px)
- Recent posts: last 2 messages from this user, truncated to 60 chars, DM Sans 13px

### Photo Upload Flow
- Own profile: clicking avatar shows upload overlay (`📷 Change Photo`)
- File input → `useFileUpload` hook → uploads to `Firebase Storage: avatars/{userId}`
- Progress ring animates around avatar during upload
- On complete: updates `users/{userId}` doc with `photoURL` field
- All message avatars for that user re-render live (read `photoURL` from user doc or pass via message's `authorPhotoURL`)

---

## 8. Message Input Bar

### Layout
```
[Pending attachments strip — conditionally shown]
[Typing indicator — conditionally shown]
┌────────────────────────────────────────────────────┐
│  [+]  Type a message in #general...                │
│                                    [GIF][😊][➤]   │
└────────────────────────────────────────────────────┘
```

### `[+]` Expander
- Click `+` → springs open a mini toolbar above the input: `[📎 File]  [🏠 Deal]  [@Mention]`
- Clicking outside or pressing Escape closes it
- `[🏠 Deal]` opens a deal form modal

### Text Area
- Auto-grows: 1 line → 6 lines max, then scrolls
- Channel-specific placeholder:
  - `#general` → "Drop a message in #general..."
  - `#wins` → "Share your win in #wins..."
  - `#deal-talk` → "Post a deal in #deal-talk..."
  - `#questions` → "Ask your question in #questions..."
  - `#resources` → "Share a resource in #resources..."

### Send Button States
- Empty: ghost/dim, not clickable
- Has content: glows red-to-crimson (`#E53935 → #B3261E`) with pulse ring

### Input Bar Surface
- `bg-[#111B24]` elevated surface
- `border-t border-[rgba(0,198,255,0.08)]`
- Subtle top shadow: `box-shadow: 0 -4px 24px rgba(0,0,0,0.4)`

### Typing Indicator
- `Brandon and 2 others are typing...` with 3-dot animated pulse
- Spring appear/disappear animation (`height: 0 → 28px`)
- Shows just above input bar, inside its container

---

## 9. Thread Panel (Right, 400px)

### Header
- `Replies` in Rajdhani Bold 18px
- `← Back` close button on right
- Parent message quoted below header (avatar + name + truncated body)
- Katana divider

### Reply Feed
- Same message anatomy as main feed (grouped avatars, reactions, hover toolbar)
- Slightly smaller: 13px body text, 38px avatars

### Reply Input
- Same input bar component, simplified (no `+` toolbar, no deal card)
- Channel-specific replaced with: `"Reply to [Author]..."`

---

## 10. New Component Files

| File | Purpose |
|------|---------|
| `components/community/ChannelHero.jsx` | Per-channel hero header |
| `components/community/MemberProfilePopover.jsx` | Rich profile card with photo upload |
| `components/community/DealCard.jsx` | Inline property deal card |
| `components/community/DealForm.jsx` | Modal form for posting a deal |
| `hooks/useUserProfiles.js` | Fetches/caches user photoURL and stats from Firestore |

---

## 11. Firestore Schema Additions

```js
// users/{userId} — add fields:
photoURL: String,      // Firebase Storage URL for avatar
location: String,      // e.g. "Phoenix, AZ"
dealsCount: Number,    // manually incremented when deal card sent

// messages/{id} — add fields (optional, only for deal messages):
type: 'deal',
dealData: { address, arv, askPrice, sqft, beds, baths, description }
```

---

## 12. Dependencies to Add

| Package | Purpose |
|---------|---------|
| `@floating-ui/react` | Smart popover positioning for profile cards |

(All other needed packages — framer-motion, firebase — already installed)

---

## Success Criteria

- Community page visually matches the premium level of Agent Finder and Underwriting pages
- Ninja gathering background fades in identically to other page backgrounds
- Channel hero renders with correct per-channel gradient identity
- Profile popover opens with photo upload working (own profile only)
- Deal cards render inline and are stored/retrieved from Firestore correctly
- Message grouping collapses consecutive same-author messages
- All existing features (reactions, threads, typing indicator, pinned messages, GIF) continue working
- `@floating-ui/react` installed and popover never clips off viewport
