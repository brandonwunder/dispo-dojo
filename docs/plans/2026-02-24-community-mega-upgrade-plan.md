# Community Mega Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Community page into a premium message board with reputation/XP, rich profiles, DMs, notifications, search, message formatting, and design polish.

**Architecture:** Extends the existing custom-hooks + component architecture. New Firestore collections for DMs, notifications, and unread tracking. Community XP system added alongside the existing underwriting-based rank system in `userProfile.js`. All new features are gated on `firebaseReady` from AuthContext.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Firebase Firestore, Firebase Storage, Framer Motion, Lucide React icons

---

## Task 1: Add Community XP Fields to User Profile System

**Context:** `frontend/src/lib/userProfile.js` already has rank/badge infrastructure based on underwrites. We need to add community XP fields, community-specific ranks, and community badges alongside the existing system.

**Files:**
- Modify: `frontend/src/lib/userProfile.js`

**Step 1:** Add these constants after the existing `BADGE_DEFS` array (~line 33):

```js
// ── Community XP System ──────────────────────────────
export const COMMUNITY_XP_ACTIONS = {
  REACTION_RECEIVED: 5,
  MESSAGE_PINNED: 50,
  THREAD_REPLY_RECEIVED: 3,
  REPLY_REACTION_RECEIVED: 3,
  BADGE_EARNED: 25,
}

export const COMMUNITY_RANKS = [
  { level: 1, xpRequired: 0,    name: 'Academy Student', color: '#9CA3AF' },
  { level: 2, xpRequired: 50,   name: 'Genin',           color: '#22C55E' },
  { level: 3, xpRequired: 200,  name: 'Chunin',          color: '#00C6FF' },
  { level: 4, xpRequired: 500,  name: 'Jonin',           color: '#7F00FF' },
  { level: 5, xpRequired: 1000, name: 'ANBU',            color: '#E53935' },
  { level: 6, xpRequired: 2500, name: 'Kage',            color: '#F6C445' },
]

export const COMMUNITY_BADGES = [
  { id: 'first-blood',       label: 'First Blood',       icon: '🩸', check: (s) => s.totalMessages >= 1 },
  { id: 'crowd-favorite',    label: 'Crowd Favorite',    icon: '⭐', check: (s) => s.maxReactionsOnMessage >= 10 },
  { id: 'sensei',            label: 'Sensei',            icon: '🎓', check: (s) => s.totalThreadRepliesReceived >= 50 },
  { id: 'on-fire',           label: 'On Fire',           icon: '🔥', check: (s) => s.postingStreak >= 7 },
  { id: 'community-pillar',  label: 'Community Pillar',  icon: '🏛️', check: (s) => computeCommunityRank(s.communityXp).level >= 4 },
  { id: 'legendary',         label: 'Legendary',         icon: '👑', check: (s) => computeCommunityRank(s.communityXp).level >= 6 },
]
```

**Step 2:** Add these helper functions after the constants:

```js
export function computeCommunityRank(xp = 0) {
  let current = COMMUNITY_RANKS[0]
  for (const rank of COMMUNITY_RANKS) {
    if (xp >= rank.xpRequired) current = rank
  }
  const nextIdx = COMMUNITY_RANKS.indexOf(current) + 1
  const next = nextIdx < COMMUNITY_RANKS.length ? COMMUNITY_RANKS[nextIdx] : null
  return { ...current, next, progress: next ? (xp - current.xpRequired) / (next.xpRequired - current.xpRequired) : 1 }
}

export function computeCommunityBadges(stats) {
  return COMMUNITY_BADGES.filter((b) => b.check(stats || {})).map((b) => b.id)
}
```

**Step 3:** Update `getOrCreateProfile` to include community XP fields in the `newProfile.stats` object. Add these fields to the existing stats spread:

```js
communityXp: 0,
totalMessages: 0,
totalReactionsReceived: 0,
totalThreadRepliesReceived: 0,
maxReactionsOnMessage: 0,
postingStreak: 0,
lastPostDate: null,
```

Also add to `newProfile` root:
```js
communityRank: 'Academy Student',
communityBadges: [],
```

**Step 4:** Add a new function `awardCommunityXp`:

```js
export async function awardCommunityXp(uid, action, extraData = {}) {
  if (!uid) return
  const xpAmount = COMMUNITY_XP_ACTIONS[action]
  if (!xpAmount) return
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { 'stats.communityXp': increment(xpAmount) })
  // Re-read to compute rank/badges
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const stats = snap.data().stats || {}
  const rank = computeCommunityRank(stats.communityXp)
  const badges = computeCommunityBadges(stats)
  await updateDoc(ref, { communityRank: rank.name, communityBadges: badges })
}
```

**Step 5:** Verify build compiles:

```bash
cd frontend && npm run build
```

**Step 6:** Commit:

```bash
git add frontend/src/lib/userProfile.js
git commit -m "feat: add community XP, ranks, and badges to user profile system"
```

---

## Task 2: Create useReputation Hook

**Context:** This hook exposes the current user's community XP, rank, badges, and provides functions to award XP when community events happen (reactions, pins, replies).

**Files:**
- Create: `frontend/src/hooks/useReputation.js`

**Step 1:** Create the hook:

```js
import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import {
  awardCommunityXp,
  computeCommunityRank,
  computeCommunityBadges,
  COMMUNITY_BADGES,
} from '../lib/userProfile'

export default function useReputation() {
  const [xp, setXp] = useState(0)
  const [rank, setRank] = useState(null)
  const [badges, setBadges] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const s = data.stats || {}
      setXp(s.communityXp || 0)
      setRank(computeCommunityRank(s.communityXp || 0))
      setBadges(data.communityBadges || [])
      setStats(s)
    }, (err) => console.warn('Reputation listener error:', err))
    return unsub
  }, [])

  const awardXp = useCallback((action) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    awardCommunityXp(uid, action)
  }, [])

  const badgeDetails = COMMUNITY_BADGES.filter((b) => badges.includes(b.id))

  return { xp, rank, badges, badgeDetails, stats, awardXp }
}
```

**Step 2:** Verify build:

```bash
cd frontend && npm run build
```

**Step 3:** Commit:

```bash
git add frontend/src/hooks/useReputation.js
git commit -m "feat: create useReputation hook for community XP tracking"
```

---

## Task 3: Create useUserProfile Hook

**Context:** Fetches any user's profile (not just current user) for profile cards and profile pages. Listens in real-time.

**Files:**
- Create: `frontend/src/hooks/useUserProfile.js`

**Step 1:** Create the hook:

```js
import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useUserProfile(uid) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    setLoading(true)
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, (err) => {
      console.warn('Profile listener error:', err)
      setLoading(false)
    })
    return unsub
  }, [uid])

  return { profile, loading }
}
```

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useUserProfile.js
git commit -m "feat: create useUserProfile hook for real-time profile data"
```

---

## Task 4: Create RankBadge Component

**Context:** Small inline component showing the user's ninja rank as a colored shield/label next to their name in chat.

**Files:**
- Create: `frontend/src/components/community/RankBadge.jsx`

**Step 1:** Create the component:

```jsx
import { COMMUNITY_RANKS } from '../../lib/userProfile'

const RANK_COLORS = {
  'Academy Student': { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
  'Genin':           { bg: 'rgba(34,197,94,0.15)',    text: '#22C55E' },
  'Chunin':          { bg: 'rgba(0,198,255,0.15)',    text: '#00C6FF' },
  'Jonin':           { bg: 'rgba(127,0,255,0.15)',    text: '#7F00FF' },
  'ANBU':            { bg: 'rgba(229,57,53,0.15)',    text: '#E53935' },
  'Kage':            { bg: 'rgba(246,196,69,0.15)',   text: '#F6C445' },
}

export default function RankBadge({ rankName, size = 'sm' }) {
  if (!rankName) return null
  const colors = RANK_COLORS[rankName] || RANK_COLORS['Academy Student']
  const sizeClasses = size === 'sm'
    ? 'text-[8px] px-1 py-[1px]'
    : 'text-[10px] px-1.5 py-0.5'

  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold leading-none ${sizeClasses}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {rankName}
    </span>
  )
}
```

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/RankBadge.jsx
git commit -m "feat: create RankBadge inline component"
```

---

## Task 5: Create BadgeShowcase Component

**Context:** Displays a grid of earned badges. Used in profile cards and profile pages.

**Files:**
- Create: `frontend/src/components/community/BadgeShowcase.jsx`

**Step 1:** Create the component:

```jsx
import { COMMUNITY_BADGES } from '../../lib/userProfile'

export default function BadgeShowcase({ earnedBadgeIds = [], maxDisplay = 6, showAll = false }) {
  const allBadges = COMMUNITY_BADGES
  const earned = allBadges.filter((b) => earnedBadgeIds.includes(b.id))
  const unearned = allBadges.filter((b) => !earnedBadgeIds.includes(b.id))
  const display = showAll ? earned : earned.slice(0, maxDisplay)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {display.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1 rounded-sm border border-[rgba(246,196,69,0.15)] bg-white/[0.04] px-2 py-1"
            title={badge.label}
          >
            <span className="text-xs">{badge.icon}</span>
            <span className="text-[10px] font-heading font-semibold text-parchment">{badge.label}</span>
          </div>
        ))}
        {!showAll && earned.length > maxDisplay && (
          <span className="text-[10px] text-text-dim/40 self-center">+{earned.length - maxDisplay} more</span>
        )}
      </div>
      {showAll && unearned.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unearned.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1 rounded-sm border border-white/[0.05] bg-white/[0.02] px-2 py-1 opacity-30"
              title={`${badge.label} (locked)`}
            >
              <span className="text-xs">{badge.icon}</span>
              <span className="text-[10px] font-heading text-text-dim">{badge.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/BadgeShowcase.jsx
git commit -m "feat: create BadgeShowcase grid component"
```

---

## Task 6: Create Expanded ProfileCard Component

**Context:** Replaces the existing basic `UserProfileCard` in chat. Shows rank, XP progress bar, stats, badges, and "Send Message" button.

**Files:**
- Create: `frontend/src/components/community/ProfileCard.jsx`

**Step 1:** Create the component. It receives `uid` and fetches profile data via `useUserProfile`. Shows:
- Avatar (initials) + rank badge
- Display name, role tag, bio
- XP progress bar to next rank
- Stats row: messages | reactions received | badges count
- BadgeShowcase (max 6)
- "Send Message" button (calls `onStartDM(uid)`)
- "View Profile" link (navigates to `/community/profile/{uid}`)

The component should be a `motion.div` popover with the same styling as the existing dark panels (bg-[#111B24], border-[rgba(246,196,69,0.15)]).

**Key props:** `uid`, `onClose`, `onStartDM`, `onViewProfile`

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/ProfileCard.jsx
git commit -m "feat: create expanded ProfileCard with rank, XP, and badges"
```

---

## Task 7: Create ProfilePage Component

**Context:** Dedicated profile page at `/community/profile/:uid`. Full stats, all badges, activity feed.

**Files:**
- Create: `frontend/src/pages/CommunityProfile.jsx`
- Modify: `frontend/src/App.jsx` — add route

**Step 1:** Create page component that:
- Uses `useParams()` to get `uid`
- Uses `useUserProfile(uid)` to get profile data
- Uses `computeCommunityRank()` for rank info
- Displays: large avatar, name, role, bio, rank with full progress bar, all stats in a grid, full BadgeShowcase with `showAll={true}`, recent messages list (fetch from Firestore: messages where authorId == uid, limit 20, orderBy createdAt desc)
- Back button returns to `/community`
- Styled with the Dispo Dojo dark theme

**Step 2:** Add route in `App.jsx` after the community route:

```jsx
<Route path="community/profile/:uid" element={<CommunityProfile />} />
```

Import `CommunityProfile` at top of file.

**Step 3:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/pages/CommunityProfile.jsx frontend/src/App.jsx
git commit -m "feat: create CommunityProfile page with full stats and badges"
```

---

## Task 8: Create Leaderboard Component

**Context:** Collapsible panel in the Community sidebar showing top users by XP.

**Files:**
- Create: `frontend/src/components/community/Leaderboard.jsx`
- Create: `frontend/src/hooks/useLeaderboard.js`

**Step 1:** Create the hook that queries Firestore for top 10 users ordered by `stats.communityXp` descending:

```js
import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useLeaderboard(count = 10) {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('stats.communityXp', 'desc'),
      limit(count),
    )
    const unsub = onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => console.warn('Leaderboard error:', err))
    return unsub
  }, [count])

  return { leaders }
}
```

**Step 2:** Create the Leaderboard component — collapsible section with trophy icon header, shows top 5 (expandable to 10). Each entry: rank number, initials avatar, name, XP count, rank badge.

**Step 3:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useLeaderboard.js frontend/src/components/community/Leaderboard.jsx
git commit -m "feat: create Leaderboard sidebar panel with top users by XP"
```

---

## Task 9: Create formatMessage Utility

**Context:** Renders markdown-lite formatting in message bodies: bold, italic, inline code, code blocks, auto-linked URLs, and @mentions.

**Files:**
- Create: `frontend/src/lib/formatMessage.jsx`

**Step 1:** Create a React utility that takes a message body string and returns JSX with formatting applied. Process in this order:
1. Split on code blocks (``` ``` ```) first — render as `<pre>` with dark bg
2. Within non-code segments, split on inline code (`` ` ``) — render as `<code>` spans
3. Within remaining text, apply bold (`**text**`), italic (`*text*`), @mentions (`@word`), and URL auto-linking (regex for http/https URLs)
4. Return an array of React elements

Export as `formatMessageBody(body)` returning JSX.

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/lib/formatMessage.jsx
git commit -m "feat: create formatMessage utility for markdown-lite rendering"
```

---

## Task 10: Update MessageBubble with Rank Flair and Formatting

**Context:** Add rank badge next to author name, use `formatMessageBody` instead of `renderBody`, add Kage gold glow and ANBU red tint.

**Files:**
- Modify: `frontend/src/components/community/MessageBubble.jsx`

**Step 1:** Import `RankBadge` and `formatMessageBody`:

```js
import RankBadge from './RankBadge'
import { formatMessageBody } from '../../lib/formatMessage'
```

**Step 2:** Add `communityRank` to the props interface (will be passed by Community.jsx via a profile lookup).

**Step 3:** Replace the `renderBody(msg.body)` call with `formatMessageBody(msg.body)`.

**Step 4:** Add `<RankBadge rankName={communityRank} />` after the author name button in the header row.

**Step 5:** Add conditional name styling: if rank is "Kage", add `text-shadow: 0 0 8px rgba(246,196,69,0.4)` via inline style. If "ANBU", add a subtle red tint.

**Step 6:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/MessageBubble.jsx
git commit -m "feat: add rank flair and message formatting to MessageBubble"
```

---

## Task 11: Create MessageSkeleton Component

**Context:** Loading placeholder with shimmer animation for messages while they're loading.

**Files:**
- Create: `frontend/src/components/community/MessageSkeleton.jsx`

**Step 1:** Create component showing 3 ghost message rows. Each row: circle (avatar), short bar (name), long bar (message body). Uses Tailwind `animate-pulse` with `bg-white/[0.06]` on rounded shapes.

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/MessageSkeleton.jsx
git commit -m "feat: create MessageSkeleton loading placeholder"
```

---

## Task 12: Create useSearch Hook

**Context:** Client-side search across loaded messages. Filters by body text, returns matching messages with highlighted snippets.

**Files:**
- Create: `frontend/src/hooks/useSearch.js`

**Step 1:** Create the hook:

```js
import { useState, useCallback } from 'react'

export default function useSearch(messages) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const search = useCallback((term) => {
    setQuery(term)
    if (!term.trim()) { setResults([]); setSearching(false); return }
    setSearching(true)
    const lower = term.toLowerCase()
    const matched = messages.filter(
      (m) => !m.isDeleted && m.body?.toLowerCase().includes(lower)
    )
    setResults(matched)
    setSearching(false)
  }, [messages])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setSearching(false)
  }, [])

  return { query, results, searching, search, clearSearch }
}
```

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useSearch.js
git commit -m "feat: create useSearch hook for client-side message search"
```

---

## Task 13: Create SearchBar Component

**Context:** Expandable search input at top of message feed. Shows results as clickable message cards.

**Files:**
- Create: `frontend/src/components/community/SearchBar.jsx`

**Step 1:** Create component with:
- Collapsed state: magnifying glass icon button
- Expanded state: input field with X to close
- Results dropdown (positioned absolute below search bar): list of message cards with author, snippet (body truncated to 100 chars with search term highlighted in cyan), timestamp, channel name
- Clicking a result calls `onSelectResult(messageId)` which scrolls to it
- AnimatePresence for expand/collapse

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/SearchBar.jsx
git commit -m "feat: create SearchBar with expandable input and results dropdown"
```

---

## Task 14: Create useDirectMessages Hook

**Context:** Manages DM conversations and messages. Handles creating conversations, sending messages, and real-time listeners.

**Files:**
- Create: `frontend/src/hooks/useDirectMessages.js`

**Step 1:** Create the hook with these capabilities:

- `conversations` — real-time list of conversations where current user is a participant, sorted by `lastMessage.createdAt` desc
- `activeMessages` — real-time messages for the currently selected conversation
- `startConversation(otherUid, otherName)` — creates a new conversation doc (or finds existing one between the two users) and returns its ID
- `sendDirectMessage(conversationId, body, authorName, gifUrl, gifTitle, attachments)` — adds message doc + updates `lastMessage` on conversation + increments `unreadCount` for the other user
- `markConversationRead(conversationId)` — resets current user's unread count to 0

**Firestore queries:**
- Conversations: `where('participants', 'array-contains', currentUid)`, `orderBy` not needed (sort client-side by lastMessage.createdAt)
- Messages: `where('conversationId', '==', id)`, `orderBy('createdAt', 'asc')`, `limit(100)`

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useDirectMessages.js
git commit -m "feat: create useDirectMessages hook for DM conversations"
```

---

## Task 15: Create DMList Component

**Context:** Sidebar section showing DM conversations below channels.

**Files:**
- Create: `frontend/src/components/community/DMList.jsx`

**Step 1:** Create component receiving `conversations`, `currentUid`, `activeDMId`, `onSelectDM`, `onNewDM` as props:

- Header: "Direct Messages" label + "+" button (calls `onNewDM`)
- List of conversations: each shows initials avatar of the OTHER participant, their name, last message preview (truncated to 30 chars), relative timestamp ("2m", "1h", "3d"), and unread count badge (cyan dot + number) if unread > 0
- Active conversation highlighted with cyan bg tint
- Empty state: "No conversations yet"

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/DMList.jsx
git commit -m "feat: create DMList sidebar component for DM conversations"
```

---

## Task 16: Create DMConversation Component

**Context:** The DM chat view that replaces the main feed when a DM is selected.

**Files:**
- Create: `frontend/src/components/community/DMConversation.jsx`

**Step 1:** Create component receiving `conversation`, `messages`, `onSend`, `onBack`, `otherUser` as props:

- Header: back arrow, other user's avatar + name + rank badge + online status dot, close button
- Message list: reuses `MessageBubble` component (same as channel messages but without pin/reply actions)
- Message input: reuses `MessageInput` component
- Auto-scroll on new messages
- Styled identically to the channel feed

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/DMConversation.jsx
git commit -m "feat: create DMConversation chat view component"
```

---

## Task 17: Create NewDMModal Component

**Context:** Modal with searchable user list to start a new DM conversation.

**Files:**
- Create: `frontend/src/components/community/NewDMModal.jsx`

**Step 1:** Create component receiving `users` (all community users), `currentUid`, `onSelect(uid, name)`, `onClose` as props:

- Overlay modal (centered, dark bg)
- Search input at top to filter users by name
- Scrollable list of users: avatar, name, rank badge
- Clicking a user calls `onSelect` which creates/finds the conversation and navigates to it
- X button to close

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/NewDMModal.jsx
git commit -m "feat: create NewDMModal for starting new DM conversations"
```

---

## Task 18: Create useNotifications Hook

**Context:** Manages the notification feed and total unread count. Notifications are created by Firestore when certain events happen (mentions, reactions, DMs).

**Files:**
- Create: `frontend/src/hooks/useNotifications.js`

**Step 1:** Create the hook:

- Listen to `notifications/{currentUid}/items` collection, ordered by `createdAt` desc, limit 20
- Each notification doc: `{ type, message, channelId, messageId, fromUid, fromName, read, createdAt }`
- Types: 'mention', 'reaction', 'reply', 'dm', 'badge_earned', 'pinned'
- Expose: `notifications`, `unreadCount` (count of items where read == false), `markRead(notificationId)`, `markAllRead()`
- `addNotification(targetUid, data)` — helper to create a notification doc for another user

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useNotifications.js
git commit -m "feat: create useNotifications hook with notification feed"
```

---

## Task 19: Create useUnreadTracking Hook

**Context:** Tracks per-channel read state for the current user, enabling unread badges on channel buttons.

**Files:**
- Create: `frontend/src/hooks/useUnreadTracking.js`

**Step 1:** Create the hook:

```js
import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useUnreadTracking(channels, messages, activeChannelId) {
  const [channelReadState, setChannelReadState] = useState({})
  const [unreadCounts, setUnreadCounts] = useState({})

  // Listen to user's channel read state
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unsub = onSnapshot(
      doc(db, 'userChannelState', uid),
      (snap) => setChannelReadState(snap.exists() ? snap.data() : {}),
      () => {},
    )
    return unsub
  }, [])

  // Mark active channel as read
  const markChannelRead = useCallback((channelId) => {
    const uid = auth.currentUser?.uid
    if (!uid || !channelId) return
    setDoc(doc(db, 'userChannelState', uid), {
      [channelId]: { lastReadAt: serverTimestamp() }
    }, { merge: true }).catch(() => {})
  }, [])

  // Auto-mark active channel as read
  useEffect(() => {
    if (activeChannelId) markChannelRead(activeChannelId)
  }, [activeChannelId, markChannelRead])

  return { channelReadState, unreadCounts, markChannelRead }
}
```

**Note:** Unread count calculation will compare `lastReadAt` against the latest message timestamp per channel. This is computed client-side since messages are already loaded.

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useUnreadTracking.js
git commit -m "feat: create useUnreadTracking hook for channel read state"
```

---

## Task 20: Create NotificationBell Component

**Context:** Bell icon in the Community header showing total unread count and a dropdown with recent notifications.

**Files:**
- Create: `frontend/src/components/community/NotificationBell.jsx`

**Step 1:** Create component receiving `notifications`, `unreadCount`, `onMarkRead`, `onMarkAllRead`, `onNavigate` as props:

- Bell icon (Lucide `Bell`) with unread count badge (red circle with number)
- Click toggles dropdown
- Dropdown: header "Notifications" + "Mark all read" link, scrollable list of notification items
- Each item: icon by type, message text, relative timestamp, unread dot
- Clicking an item calls `onNavigate(notification)` + `onMarkRead(notification.id)`
- Click-outside closes dropdown
- AnimatePresence for open/close

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/NotificationBell.jsx
git commit -m "feat: create NotificationBell header component with dropdown"
```

---

## Task 21: Create NewMessageDivider Component

**Context:** Shows "── N new messages ──" divider in the message feed at the point where the user last read.

**Files:**
- Create: `frontend/src/components/community/NewMessageDivider.jsx`

**Step 1:** Create a simple component:

```jsx
import { useEffect, useState } from 'react'

export default function NewMessageDivider({ count }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible || count <= 0) return null

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-[#E53935]/30" />
      <span className="text-[10px] font-heading font-semibold text-[#E53935]/60">
        {count} new message{count !== 1 ? 's' : ''}
      </span>
      <div className="flex-1 h-px bg-[#E53935]/30" />
    </div>
  )
}
```

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/components/community/NewMessageDivider.jsx
git commit -m "feat: create NewMessageDivider unread separator component"
```

---

## Task 22: Wire XP Awards into Existing Hooks

**Context:** When reactions happen, messages get pinned, or threads get replies, award XP to the relevant user. This modifies existing hooks.

**Files:**
- Modify: `frontend/src/hooks/useReactions.js` — after toggling a reaction ON, call `awardCommunityXp(msg.authorId, 'REACTION_RECEIVED')` and `incrementStat(msg.authorId, 'totalReactionsReceived')`
- Modify: `frontend/src/hooks/usePinnedMessages.js` — after pinning, call `awardCommunityXp(msg.authorId, 'MESSAGE_PINNED')`
- Modify: `frontend/src/hooks/useReplies.js` — after sending a reply, call `awardCommunityXp(parentMsg.authorId, 'THREAD_REPLY_RECEIVED')` and `incrementStat(parentMsg.authorId, 'totalThreadRepliesReceived')`
- Modify: `frontend/src/hooks/useMessages.js` — after sending a message, call `incrementStat(uid, 'totalMessages')`

**Important:** Import `awardCommunityXp` and `incrementStat` from `'../lib/userProfile'`. Only award XP to OTHER users (not yourself). Check `authorId !== currentUid` before awarding.

**Step 1:** Modify each hook file to add the XP award calls.

**Step 2:** Verify build, commit:

```bash
cd frontend && npm run build
git add frontend/src/hooks/useReactions.js frontend/src/hooks/usePinnedMessages.js frontend/src/hooks/useReplies.js frontend/src/hooks/useMessages.js
git commit -m "feat: wire community XP awards into reaction, pin, reply, and message hooks"
```

---

## Task 23: Update Community.jsx — Integrate All New Features

**Context:** This is the big integration task. Wire in DMs, search, notifications, leaderboard, profiles, rank flair, and design polish.

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

**Step 1:** Add new imports:
- `useReputation`, `useLeaderboard`, `useDirectMessages`, `useNotifications`, `useUnreadTracking`, `useSearch`
- `ProfileCard`, `Leaderboard`, `DMList`, `DMConversation`, `NewDMModal`, `NotificationBell`, `SearchBar`, `MessageSkeleton`, `NewMessageDivider`, `RankBadge`

**Step 2:** Add new state:
- `viewMode` — 'channel' | 'dm' (determines what the main area shows)
- `activeDMId` — currently selected DM conversation ID
- `showNewDM` — whether NewDMModal is open
- `userProfiles` — cache of uid → profile for rank display

**Step 3:** Initialize new hooks:
```js
const reputation = useReputation()
const { leaders } = useLeaderboard(10)
const { conversations, activeMessages: dmMessages, startConversation, sendDirectMessage, markConversationRead } = useDirectMessages(activeDMId)
const { notifications, unreadCount: notifUnreadCount, markRead: markNotifRead, markAllRead: markAllNotifsRead } = useNotifications()
const unreadTracking = useUnreadTracking(CHANNELS, messages, activeChannel)
const { query: searchQuery, results: searchResults, search, clearSearch } = useSearch(messages)
```

**Step 4:** Update the sidebar to include:
- Unread count badges on channel buttons (from `unreadTracking`)
- Active channel left border accent (2px cyan bar)
- DMList section below channels
- Leaderboard section below online users (collapsible)

**Step 5:** Update the main feed header to include:
- SearchBar (right side of header)
- NotificationBell (right side of header)

**Step 6:** Add DM view mode:
- When `viewMode === 'dm'`, render `DMConversation` instead of channel feed
- Channel sidebar stays visible in both modes

**Step 7:** Replace loading spinner with `MessageSkeleton`.

**Step 8:** Add message fade-in animation:
```jsx
<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
```

**Step 9:** Pass rank data to MessageBubble. Build a `profilesMap` from the online users + messages to look up `communityRank` per author.

**Step 10:** Wire `ProfileCard` to use `onStartDM` and `onViewProfile` (navigate to `/community/profile/:uid`).

**Step 11:** Verify build:

```bash
cd frontend && npm run build
```

**Step 12:** Commit:

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat: integrate DMs, search, notifications, leaderboard, and design polish into Community page"
```

---

## Task 24: Update Firestore Security Rules

**Context:** Add rules for all new collections (conversations, directMessages, notifications, userChannelState).

**Files:**
- Modify: `firestore.rules`

**Step 1:** Update the rules file:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /replies/{replyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    match /conversations/{conversationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /directMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /notifications/{userId}/items/{itemId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /userChannelState/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Step 2:** Deploy rules to Firebase Console (copy-paste into Rules tab and publish, since Firebase CLI may not be authenticated).

**Step 3:** Update `firestore.indexes.json` to add new composite indexes:
- `conversations`: `participants ARRAY_CONTAINS` (single-field, auto-created)
- `directMessages`: `conversationId ASC, createdAt ASC`
- `notifications/{uid}/items`: `createdAt DESC` (subcollection, may need manual creation)

**Step 4:** Commit:

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat: update Firestore security rules and indexes for DMs and notifications"
```

---

## Task 25: Design Polish Pass

**Context:** Final visual refinements across all components. Smooth transitions, hover effects, empty states.

**Files:**
- Modify: `frontend/src/pages/Community.jsx` — channel switch fade animation, empty state text per channel
- Modify: `frontend/src/components/community/MessageBubble.jsx` — spring animation on action bar slide-in
- Modify: `frontend/src/components/community/ReactionBar.jsx` — pulse animation on toggle
- Modify: `frontend/src/components/community/OnlineUsersList.jsx` — add rank icons next to names

**Step 1:** Add channel-specific empty state messages:

```js
const EMPTY_STATES = {
  'general': "It's quiet in here. Drop the first message!",
  'wins': "No wins shared yet. Be the first to celebrate! 🎉",
  'deal-talk': "No deal talk yet. Start the strategy session.",
  'questions': "No questions yet. The dojo is quiet... for now.",
  'resources': "No resources shared yet. Got a good link? Drop it here.",
}
```

**Step 2:** Update action bar in MessageBubble to use spring transition:

```jsx
transition={{ type: 'spring', damping: 20, stiffness: 300 }}
```

**Step 3:** Add rank icon display in OnlineUsersList next to each user's name — use the user's `communityRank` color as a small dot.

**Step 4:** Verify build, test in browser:

```bash
cd frontend && npm run build
```

**Step 5:** Commit:

```bash
git add -A
git commit -m "feat: design polish — animations, empty states, rank flair in online users"
```

---

## Verification Checklist

After all tasks are complete, verify in browser at `http://localhost:5173/community`:

1. **Messages load** — no permission errors, skeleton loading shows then messages appear
2. **Send a message** — appears in real-time, message formatting works (try `**bold**`, `*italic*`, URLs)
3. **Reactions** — click react, see emoji pill, XP awarded to author
4. **Rank badge** — visible next to usernames in chat
5. **Profile card** — click username, see expanded card with rank, XP bar, badges
6. **Profile page** — navigate to `/community/profile/:uid`, see full stats
7. **Leaderboard** — visible in sidebar, shows users sorted by XP
8. **DMs** — click "+" to start DM, send a message, see conversation in sidebar
9. **Notifications** — bell shows unread count, dropdown shows recent activity
10. **Search** — search bar finds messages, clicking result scrolls to message
11. **Unread badges** — switch channels, come back, see unread count
12. **GIF picker** — search GIFs, select one, sends in message
13. **Emoji picker** — opens, select emoji, appears in input
14. **File upload** — attach file, sends with message
15. **Channel empty states** — channel-specific themed messages
