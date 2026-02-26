# Message Board Discord-Style Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Community message board into a premium Discord-like experience with collapsible channel categories, Discord-style messages, and a right-panel member list.

**Architecture:** Restructure the 3-column layout — slim sidebar (240px) with collapsible channel categories, center message feed with Discord-style compact messages and hover actions, and a toggleable right panel for member list (grouped by rank) that swaps to a thread panel when replying. All data hooks stay untouched; this is purely a UI/component layer rewrite.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Lucide icons, existing Firebase/Firestore hooks.

---

## Task 1: Create ChannelCategory Component

**Files:**
- Create: `frontend/src/components/community/ChannelCategory.jsx`

**Step 1: Create the collapsible channel category component**

```jsx
// frontend/src/components/community/ChannelCategory.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export default function ChannelCategory({
  label,
  channels,
  activeChannel,
  unreadChannels = {},
  onSelectChannel,
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="mb-1">
      {/* Category header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left group"
      >
        <ChevronDown
          className="h-3 w-3 shrink-0 transition-transform duration-200"
          style={{
            color: '#8A9AAA',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        />
        <span
          className="text-[11px] font-bold uppercase tracking-[0.08em] select-none"
          style={{
            fontFamily: 'var(--font-body, sans-serif)',
            color: '#8A9AAA',
          }}
        >
          {label}
        </span>
      </button>

      {/* Channel list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            {channels.map((ch) => {
              const isActive = activeChannel === ch.id
              const hasUnread = unreadChannels[ch.id] && ch.id !== activeChannel
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectChannel(ch.id)}
                  className="flex w-full items-center justify-between rounded-md mx-1 mb-px group/ch transition-colors duration-150"
                  style={{
                    background: isActive ? 'rgba(0,198,255,0.10)' : 'transparent',
                    padding: '6px 10px 6px 24px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="text-[15px] font-mono shrink-0 leading-none"
                      style={{ color: isActive ? '#F4F7FA' : hasUnread ? '#F4F7FA' : '#8A9AAA' }}
                    >
                      #
                    </span>
                    <span
                      className="text-[14px] truncate"
                      style={{
                        fontFamily: 'var(--font-heading, sans-serif)',
                        fontWeight: isActive ? 600 : hasUnread ? 600 : 500,
                        color: isActive ? '#F4F7FA' : hasUnread ? '#F4F7FA' : '#8A9AAA',
                      }}
                    >
                      {ch.name}
                    </span>
                  </div>
                  {hasUnread && (
                    <span className="shrink-0 h-2 w-2 rounded-full bg-[#F4F7FA]" />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify the component renders**

Run: `cd frontend && npx vite --host` (already running on port 3001)
Import into Community.jsx temporarily to verify rendering.

**Step 3: Commit**

```bash
git add frontend/src/components/community/ChannelCategory.jsx
git commit -m "feat(community): add collapsible ChannelCategory component"
```

---

## Task 2: Create MemberList Right Panel Component

**Files:**
- Create: `frontend/src/components/community/MemberList.jsx`

**Step 1: Create the member list grouped by rank**

```jsx
// frontend/src/components/community/MemberList.jsx
import { Trophy } from 'lucide-react'
import { COMMUNITY_RANKS, computeCommunityRank } from '../../lib/userProfile'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtXp(xp) {
  if (!xp && xp !== 0) return '0'
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return String(xp)
}

const RANK_GROUPS = [
  { name: 'Kage', color: '#F6C445' },
  { name: 'ANBU', color: '#E53935' },
  { name: 'Jonin', color: '#7F00FF' },
  { name: 'Chunin', color: '#00C6FF' },
  { name: 'Genin', color: '#22C55E' },
  { name: 'Academy Student', color: '#9CA3AF' },
]

export default function MemberList({
  allUsers = [],
  onlineUsers = [],
  leaders = [],
  currentUid,
  onUserClick,
}) {
  const onlineUids = new Set(onlineUsers.map((u) => u.odId))

  // Group users by rank
  const grouped = {}
  RANK_GROUPS.forEach((rg) => { grouped[rg.name] = [] })
  allUsers.forEach((user) => {
    const xp = user.stats?.communityXp || 0
    const rank = computeCommunityRank(xp)
    const rankName = rank?.name || 'Academy Student'
    if (!grouped[rankName]) grouped[rankName] = []
    grouped[rankName].push({ ...user, xp, rankName, isOnline: onlineUids.has(user.id) })
  })

  // Sort each group: online first, then by XP desc
  Object.values(grouped).forEach((arr) => {
    arr.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      return b.xp - a.xp
    })
  })

  const top3 = leaders.slice(0, 3)

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0E1317',
        borderLeft: '1px solid rgba(0,198,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,198,255,0.06)' }}
      >
        <span
          className="text-[13px] font-semibold"
          style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
        >
          Members
        </span>
        <span className="text-[11px]" style={{ color: '#8A9AAA' }}>
          — {allUsers.length}
        </span>
      </div>

      {/* Top Contributors */}
      {top3.length > 0 && (
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="h-3 w-3" style={{ color: '#F6C445' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#F6C445' }}
            >
              Top Contributors
            </span>
          </div>
          {top3.map((user, idx) => {
            const medals = ['🥇', '🥈', '🥉']
            return (
              <button
                key={user.id}
                onClick={() => onUserClick?.(user)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <span className="text-[12px] shrink-0">{medals[idx]}</span>
                <div
                  className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                    fontFamily: 'var(--font-heading, sans-serif)',
                    color: '#F4F7FA',
                  }}
                >
                  {initials(user.displayName)}
                </div>
                <span
                  className="text-[12px] truncate"
                  style={{ fontFamily: 'var(--font-heading, sans-serif)', fontWeight: 600, color: '#F4F7FA' }}
                >
                  {user.displayName || 'Ninja'}
                </span>
                <span className="ml-auto text-[10px] shrink-0" style={{ color: '#8A9AAA' }}>
                  {fmtXp(user.stats?.communityXp || 0)} XP
                </span>
              </button>
            )
          })}
          <div className="mt-2 h-px" style={{ background: 'rgba(0,198,255,0.06)' }} />
        </div>
      )}

      {/* Member groups by rank */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {RANK_GROUPS.map((rg) => {
          const members = grouped[rg.name]
          if (!members || members.length === 0) return null
          const onlineCount = members.filter((m) => m.isOnline).length
          return (
            <div key={rg.name} className="mt-3 first:mt-1">
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: rg.color }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-body, sans-serif)', color: rg.color }}
                >
                  {rg.name}
                </span>
                <span className="text-[10px]" style={{ color: '#8A9AAA' }}>
                  — {onlineCount}/{members.length}
                </span>
              </div>
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onUserClick?.(member)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  <div className="relative shrink-0">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        color: '#F4F7FA',
                        opacity: member.isOnline ? 1 : 0.5,
                      }}
                    >
                      {initials(member.displayName)}
                    </div>
                    {member.isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                        style={{ background: '#22C55E', borderColor: '#0E1317' }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[13px] truncate"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: member.isOnline ? '#F4F7FA' : '#8A9AAA',
                    }}
                  >
                    {member.displayName || 'Ninja'}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/MemberList.jsx
git commit -m "feat(community): add MemberList right panel with rank groups"
```

---

## Task 3: Create ChannelHeader Component (replace ChannelHero)

**Files:**
- Create: `frontend/src/components/community/ChannelHeader.jsx`

**Step 1: Create the compact Discord-style channel header bar**

```jsx
// frontend/src/components/community/ChannelHeader.jsx
import { Hash, Pin, Users, Search, Bell } from 'lucide-react'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'

const CHANNEL_DESCRIPTIONS = {
  general: 'The main hub — news, updates, and open conversation',
  wins: 'Share your closed deals and celebrate victories',
  'deal-talk': 'Analyze deals, ask for feedback, and collaborate',
  questions: 'No question is too basic — the dojo teaches all',
  resources: 'Scripts, templates, tools, and educational links',
}

export default function ChannelHeader({
  channelId,
  pinnedCount = 0,
  showMembers,
  onToggleMembers,
  onTogglePinned,
  // Search props
  onSearch,
  onClearSearch,
  searchResults,
  searchQuery,
  onSelectSearchResult,
  // Notification props
  notifications,
  notifUnreadCount,
  onMarkNotifRead,
  onMarkAllNotifsRead,
  onNotifNavigate,
}) {
  const description = CHANNEL_DESCRIPTIONS[channelId] || ''

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 shrink-0"
      style={{
        background: '#111B24',
        borderBottom: '1px solid rgba(0,198,255,0.06)',
        minHeight: '48px',
      }}
    >
      {/* Left: Channel name + description */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Hash className="h-5 w-5 shrink-0" style={{ color: '#8A9AAA' }} />
        <span
          className="text-[15px] font-bold shrink-0"
          style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
        >
          {channelId}
        </span>
        <div
          className="h-4 w-px shrink-0 mx-1"
          style={{ background: 'rgba(0,198,255,0.12)' }}
        />
        <span
          className="text-[12px] truncate"
          style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA' }}
        >
          {description}
        </span>
      </div>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Pinned messages */}
        {pinnedCount > 0 && (
          <button
            onClick={onTogglePinned}
            className="relative flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
            title="Pinned messages"
          >
            <Pin className="h-4 w-4" style={{ color: '#8A9AAA' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#F6C445' }}>
              {pinnedCount}
            </span>
          </button>
        )}

        {/* Members toggle */}
        <button
          onClick={onToggleMembers}
          className="rounded-md p-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
          title="Member list"
          style={{ color: showMembers ? '#F4F7FA' : '#8A9AAA' }}
        >
          <Users className="h-4 w-4" />
        </button>

        {/* Search */}
        <SearchBar
          onSearch={onSearch}
          onClear={onClearSearch}
          results={searchResults}
          query={searchQuery}
          onSelectResult={onSelectSearchResult}
        />

        {/* Notifications */}
        <NotificationBell
          notifications={notifications}
          unreadCount={notifUnreadCount}
          onMarkRead={onMarkNotifRead}
          onMarkAllRead={onMarkAllNotifsRead}
          onNavigate={onNotifNavigate}
        />
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/ChannelHeader.jsx
git commit -m "feat(community): add compact Discord-style ChannelHeader"
```

---

## Task 4: Restructure Community.jsx — Sidebar

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

**Step 1: Update imports and channel constants**

Replace the CHANNELS constant with categorized channels:

```jsx
// Replace existing CHANNELS array with:
const CHANNEL_CATEGORIES = [
  {
    label: 'Community',
    channels: [
      { id: 'general', name: 'General', desc: 'Hang out and chat with the community' },
      { id: 'wins', name: 'Wins', desc: 'Share your wins and celebrate together' },
    ],
  },
  {
    label: 'Deal Room',
    channels: [
      { id: 'deal-talk', name: 'Deal Talk', desc: 'Discuss deals, comps, and strategy' },
      { id: 'resources', name: 'Resources', desc: 'Share useful links and tools' },
    ],
  },
  {
    label: 'Help & Learning',
    channels: [
      { id: 'questions', name: 'Questions', desc: 'Ask anything and get help' },
    ],
  },
]

// Keep flat array for lookup
const CHANNELS = CHANNEL_CATEGORIES.flatMap((cat) => cat.channels)
```

Add new imports:
```jsx
import ChannelCategory from '../components/community/ChannelCategory'
import ChannelHeader from '../components/community/ChannelHeader'
import MemberList from '../components/community/MemberList'
```

**Step 2: Rewrite the sidebar JSX**

Replace the entire `<aside>` block with the new Discord-style sidebar. Key changes:
- Width: `w-[240px]` (down from 260/280)
- Background: `#0E1317`
- Server header simplified (single row)
- Channel list replaced with `ChannelCategory` components
- Remove `OnlineUsersList` and `Leaderboard` from sidebar
- DM list stays but gets a divider above it
- User dock stays at bottom

**Step 3: Add showMembers state for right panel**

The `showMembers` state already exists. Add `showPinned` state:
```jsx
const [showPinned, setShowPinned] = useState(false)
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "refactor(community): restructure sidebar with channel categories"
```

---

## Task 5: Restructure Community.jsx — Center Column

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

**Step 1: Replace ChannelHero + toolbar with ChannelHeader**

Remove the `ChannelHero` import and the search/notification toolbar div. Replace both with:
```jsx
<ChannelHeader
  channelId={activeChannel}
  pinnedCount={pinnedMessages.length}
  showMembers={showMembers}
  onToggleMembers={() => setShowMembers((v) => !v)}
  onTogglePinned={() => setShowPinned((v) => !v)}
  onSearch={search}
  onClearSearch={clearSearch}
  searchResults={searchResults}
  searchQuery={searchQuery}
  onSelectSearchResult={scrollToMessage}
  notifications={notifications}
  notifUnreadCount={notifUnreadCount}
  onMarkNotifRead={markNotifRead}
  onMarkAllNotifsRead={markAllNotifsRead}
  onNotifNavigate={(notif) => {
    if (notif.channelId) switchChannel(notif.channelId)
    if (notif.messageId) setTimeout(() => scrollToMessage(notif.messageId), 300)
  }}
/>
```

**Step 2: Update message feed background**

The center column main element should have:
```jsx
style={{ background: 'rgba(17,27,36,0.85)' }}
```

**Step 3: Move the quick reaction picker into MessageBubble**

Remove the `AnimatePresence` block for `reactionPickerMsgId` from Community.jsx — this will be handled inside MessageBubble (Task 6).

**Step 4: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "refactor(community): replace ChannelHero with compact ChannelHeader"
```

---

## Task 6: Upgrade MessageBubble to Discord Style

**Files:**
- Modify: `frontend/src/components/community/MessageBubble.jsx`

**Step 1: Update message layout**

Key changes:
- Avatar: 40px (down from 44px), consistent border/shadow
- Grouped messages: show timestamp on hover in left gutter (where avatar would be), smaller vertical gap
- Author name: 15px Rajdhani semibold with timestamp inline (Discord style: `AuthorName  Today at 3:42 PM`)
- Message body: 14px DM Sans, `#E8ECF0`, `line-height: 1.5`
- Full-width hover bg: `rgba(0,198,255,0.03)`
- Hover action bar position: unchanged (top-right floating), but update colors to use `#0E1317` background and `rgba(0,198,255,0.06)` border

**Step 2: Integrate the quick reaction picker directly**

Move the `QUICK_REACTIONS` picker (currently in Community.jsx) into MessageBubble so it appears when clicking the react button. This keeps the reaction logic self-contained.

Add `reactionPickerOpen` local state to MessageBubble:
```jsx
const [showReactionPicker, setShowReactionPicker] = useState(false)
```

Render the picker inline when `showReactionPicker` is true, positioned below the hover action bar.

**Step 3: Commit**

```bash
git add frontend/src/components/community/MessageBubble.jsx
git commit -m "refactor(community): upgrade MessageBubble to Discord-style layout"
```

---

## Task 7: Restructure Community.jsx — Right Panel

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

**Step 1: Add MemberList right panel**

After the `</main>` closing tag and before the thread panel `AnimatePresence`, add the MemberList:

```jsx
{/* Right panel: Member list (when no thread is open) */}
{showMembers && !activeThread && (
  <div className="w-[240px] shrink-0 h-full">
    <MemberList
      allUsers={allUsers}
      onlineUsers={onlineUsers}
      leaders={leaders}
      currentUid={currentUid}
      onUserClick={(user) => {
        setProfilePopover({
          id: user.id,
          name: user.displayName,
          email: user.email,
        })
      }}
    />
  </div>
)}
```

**Step 2: Adjust thread panel behavior**

When a thread opens, it replaces the member list. When it closes, the member list returns. Update the thread panel width to `w-[360px]`.

**Step 3: Remove old sidebar components from sidebar**

Remove the `<OnlineUsersList>` and `<Leaderboard>` components from the sidebar JSX (they're now in MemberList).

Remove unused imports:
```jsx
// Remove these imports:
import OnlineUsersList from '../components/community/OnlineUsersList'
import Leaderboard from '../components/community/Leaderboard'
import ChannelHero from '../components/community/ChannelHero'
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat(community): add right-panel MemberList, remove from sidebar"
```

---

## Task 8: Polish Sidebar Styles

**Files:**
- Modify: `frontend/src/pages/Community.jsx`
- Modify: `frontend/src/components/community/DMList.jsx`

**Step 1: Sidebar background and border**

```jsx
<aside
  className="flex w-[240px] shrink-0 flex-col h-full relative"
  style={{
    background: '#0E1317',
    borderRight: '1px solid rgba(0,198,255,0.06)',
  }}
>
```

**Step 2: Server header**

Simplified single row:
```jsx
<div className="px-3 pt-4 pb-3 shrink-0">
  <div className="flex items-center gap-2.5">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
      style={{
        background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
        fontFamily: 'var(--font-display, serif)',
        color: '#F4F7FA',
        boxShadow: '0 0 12px -4px rgba(0,198,255,0.4)',
        borderRadius: '12px',
      }}
    >
      DD
    </div>
    <span
      className="text-[15px] font-bold"
      style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
    >
      Dispo Dojo
    </span>
  </div>
  <div className="mt-3 h-px" style={{ background: 'rgba(0,198,255,0.06)' }} />
</div>
```

**Step 3: DMList styling update**

Update DMList.jsx:
- Add top divider: `border-t: 1px solid rgba(0,198,255,0.06)`
- Header: match category header style (11px bold uppercase)
- Reduce avatar from `h-7 w-7` to `h-6 w-6`
- Tighter padding

**Step 4: User dock polish**

Match Discord's user dock: avatar 32px, smaller text, online dot, settings gear stays.

**Step 5: Commit**

```bash
git add frontend/src/pages/Community.jsx frontend/src/components/community/DMList.jsx
git commit -m "style(community): polish sidebar, DMList, and user dock styling"
```

---

## Task 9: Polish Message Feed Styles

**Files:**
- Modify: `frontend/src/components/community/MessageInput.jsx`
- Modify: `frontend/src/components/community/ReactionBar.jsx`
- Modify: `frontend/src/components/community/PinnedMessagesBar.jsx`
- Modify: `frontend/src/components/community/TypingIndicator.jsx`

**Step 1: MessageInput polish**

- Background: `#0E1317` to match sidebar/right panel
- Input field: rounded-lg, `background: rgba(17,27,36,0.8)`, `border: 1px solid rgba(0,198,255,0.08)`
- Left side: `+` button (Paperclip) for attachments
- Right side: emoji, GIF, send button
- Reply-to banner: stay above input with cyan accent

**Step 2: ReactionBar polish**

- Reaction pills: smaller padding, `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.06)`
- Active reaction (user has reacted): `background: rgba(0,198,255,0.08)`, `border-color: rgba(0,198,255,0.25)`
- Font size: 12px emoji, 10px count

**Step 3: PinnedMessagesBar polish**

- Only show when `showPinned` is true (controlled by ChannelHeader pin button)
- Background: `rgba(0,198,255,0.03)` instead of gold
- Pin icon color: `#F6C445`

**Step 4: TypingIndicator**

- Position: directly above MessageInput, inside the feed area
- Smaller text, more subtle animation

**Step 5: Commit**

```bash
git add frontend/src/components/community/MessageInput.jsx frontend/src/components/community/ReactionBar.jsx frontend/src/components/community/PinnedMessagesBar.jsx frontend/src/components/community/TypingIndicator.jsx
git commit -m "style(community): polish MessageInput, reactions, pinned bar, and typing indicator"
```

---

## Task 10: Polish Background & Overall Layout

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

**Step 1: Update background layers**

- Darken the atmospheric background more heavily (increase opacity on overlay layers)
- Sidebar and right panel should feel solid (not transparent)
- Center feed: subtle background showing through but heavily darkened

**Step 2: Remove old unused components**

Clean up any imports or JSX that reference removed components (ChannelHero, the old search/notification toolbar div).

**Step 3: Verify the full layout works**

Run the dev server, navigate to `/community`, verify:
- Sidebar: 240px, categories collapse, DMs section works, user dock visible
- Center: compact channel header, messages render with Discord-style, hover actions work
- Right: member list shows/hides, thread panel slides in when replying
- All existing features still work: reactions, replies, DMs, search, notifications, pinned messages

**Step 4: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "style(community): finalize layout polish and background treatment"
```

---

## Task 11: Screenshot Comparison & Final Fixes

**Step 1: Take screenshots**

```bash
node screenshot.mjs http://localhost:3001/community message-board-redesign
```

**Step 2: Compare against Discord reference**

Check:
- Sidebar width and spacing
- Channel category headers
- Message layout (avatar, name, timestamp alignment)
- Hover actions appearance
- Member list grouping
- Overall color consistency

**Step 3: Fix any visual issues found**

Iterate on spacing, colors, font sizes until it looks polished.

**Step 4: Final commit**

```bash
git add -A
git commit -m "style(community): final visual polish after screenshot review"
```

---

## Summary of Changes

| Component | Action | Description |
|-----------|--------|-------------|
| `ChannelCategory.jsx` | **NEW** | Collapsible channel category with chevron toggle |
| `MemberList.jsx` | **NEW** | Right panel member list grouped by rank |
| `ChannelHeader.jsx` | **NEW** | Compact Discord-style channel header bar |
| `Community.jsx` | **MODIFY** | Full layout restructure — sidebar categories, right panel, new header |
| `MessageBubble.jsx` | **MODIFY** | Discord-style messages with integrated reaction picker |
| `MessageInput.jsx` | **MODIFY** | Visual polish to match new theme |
| `DMList.jsx` | **MODIFY** | Style updates for new sidebar |
| `ReactionBar.jsx` | **MODIFY** | Smaller, more Discord-like reaction pills |
| `PinnedMessagesBar.jsx` | **MODIFY** | Controlled visibility, updated colors |
| `TypingIndicator.jsx` | **MODIFY** | Repositioned, subtler styling |

**Untouched:** All hooks, Firebase config, auth context, data models, routing.
