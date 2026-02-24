# Community Premium Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the Community messaging board into a premium social hub matching the quality of Agent Finder and Underwriting pages — including ninja background, channel heroes, deal cards, rich profile cards, photo upload, and message grouping.

**Architecture:** Component-first upgrade — all existing Firestore hooks and data layer remain untouched. We upgrade the presentation layer: layout, sidebar, MessageBubble, MessageInput, ProfileCard, and add ChannelHero + DealCard + DealForm as new components.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, Firebase Storage, @floating-ui/react (new install), Vite

**Design Doc:** `docs/plans/2026-02-24-community-premium-redesign-design.md`

---

## Task 1: Setup — Install deps + copy background asset

**Files:**
- Modify: `frontend/package.json`
- Copy: `Message Board Background.png` → `frontend/public/community-bg.png`

**Step 1: Install @floating-ui/react**

```bash
cd frontend && npm install @floating-ui/react
```

Expected: `@floating-ui/react` appears in `frontend/package.json` dependencies.

**Step 2: Copy background image**

```bash
cp "c:/Users/brand/OneDrive/Desktop/Agent Finder/Message Board Background.png" \
   "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend/public/community-bg.png"
```

**Step 3: Verify**

```bash
ls frontend/public/community-bg.png
```

Expected: file exists.

**Step 4: Commit**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
git add frontend/package.json frontend/package-lock.json frontend/public/community-bg.png
git commit -m "feat: install @floating-ui/react and add community background asset"
```

---

## Task 2: Background Layer System in Community.jsx

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

The Community page's outermost wrapper needs a fixed 4-layer background identical to AgentFinder's approach.

**Step 1: Read the file header to find the outermost JSX wrapper**

Read `frontend/src/pages/Community.jsx` lines 1–60 to locate the return statement and outermost div.

**Step 2: Add background layers**

Find the outermost `return (` div in Community.jsx. After the opening tag of the outermost wrapper element (which should be a full-height flex container), add these background layers as the FIRST children (before the sidebar):

```jsx
{/* ── Background layers ─────────────────────────────── */}
<div className="fixed inset-0 z-0 pointer-events-none">
  {/* Layer 0: Ninja gathering image */}
  <div
    className="absolute inset-0"
    style={{
      backgroundImage: 'url(/community-bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center 25%',
      backgroundRepeat: 'no-repeat',
    }}
  />
  {/* Layer 1: Atmospheric fade — center heavily darkened for readability */}
  <div
    className="absolute inset-0"
    style={{
      background: `
        radial-gradient(ellipse 90% 70% at 50% 40%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.75) 55%, rgba(11,15,20,0.92) 100%),
        linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.60) 40%, rgba(11,15,20,0.90) 100%)
      `,
    }}
  />
  {/* Layer 2: Left sidebar darkening */}
  <div
    className="absolute inset-0"
    style={{
      background: 'linear-gradient(to right, rgba(11,15,20,0.85) 0%, rgba(11,15,20,0.40) 30%, transparent 60%)',
    }}
  />
  {/* Layer 3: Bottom fade to page bg */}
  <div
    className="absolute inset-x-0 bottom-0 h-48"
    style={{ background: 'linear-gradient(to bottom, transparent, #0B0F14)' }}
  />
</div>
```

**Step 3: Ensure the outermost wrapper has `relative` and proper z-index**

The outermost wrapper div needs `className` that includes `relative` and `z-10` so the content sits above the fixed background:

```jsx
// outermost div — ensure it has at minimum:
className="flex h-screen overflow-hidden bg-[#0B0F14] relative z-10"
```

**Step 4: Start dev server and verify background shows**

```bash
cd frontend && npm run dev
```

Open browser to `http://localhost:5173` and navigate to Community page. The ninja image should show faintly through the dark overlay.

**Step 5: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat: add ninja gathering background to community page with 4-layer atmospheric fade"
```

---

## Task 3: Sidebar Redesign in Community.jsx

**Files:**
- Modify: `frontend/src/pages/Community.jsx`

Upgrade the left sidebar to 260px with branding dock, grouped channel nav with unread badges, and a polished user dock at the bottom.

**Step 1: Read the current sidebar JSX**

Read the sidebar section of Community.jsx (search for `sidebar` or the channel list section).

**Step 2: Replace the sidebar container width and background**

Update the sidebar wrapper to:

```jsx
{/* ── Sidebar ────────────────────────────────────────── */}
<div className="w-[260px] xl:w-[280px] flex-shrink-0 flex flex-col h-full relative z-20"
  style={{
    background: 'linear-gradient(180deg, #0B0F14 0%, #0E1820 30%, #090D12 70%, #0B0F14 100%)',
    borderRight: '1px solid rgba(0, 198, 255, 0.08)',
  }}
>
```

**Step 3: Add branding dock at the top of sidebar**

As the first child inside the sidebar div, add:

```jsx
{/* Branding dock */}
<div className="px-4 pt-5 pb-3">
  <div className="flex items-center gap-3 mb-1">
    {/* Hanko seal */}
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
      style={{
        background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
        fontFamily: 'var(--font-display)',
        color: '#F4F7FA',
        boxShadow: '0 0 12px -4px rgba(0,198,255,0.5)',
      }}
    >
      DD
    </div>
    <div>
      <div className="text-sm font-bold text-[#F4F7FA]" style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
        Dispo Dojo
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body)' }}>Community</span>
        <span className="flex items-center gap-1 text-[10px] text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
          {onlineUsers.length} online
        </span>
      </div>
    </div>
  </div>
  {/* Katana divider */}
  <div className="h-px mt-3" style={{
    background: 'linear-gradient(90deg, transparent, #00C6FF, #0E5A88, #00C6FF, transparent)',
    opacity: 0.4,
    boxShadow: '0 0 8px rgba(0,198,255,0.2)',
  }} />
</div>
```

**Step 4: Update the channel nav section header and channel items**

Replace the channel list rendering with this pattern:

```jsx
{/* Channel list */}
<div className="flex-1 overflow-y-auto px-2 pb-2">
  {/* Section header */}
  <div className="px-2 py-2 text-[10px] font-bold text-[#8A9AAA] tracking-[0.12em] uppercase"
    style={{ fontFamily: 'var(--font-heading)' }}
  >
    Channels
  </div>

  {channels.map(channel => {
    const isActive = channel.id === activeChannel;
    const unreadCount = unreadCounts?.[channel.id] || 0;
    return (
      <button
        key={channel.id}
        onClick={() => setActiveChannel(channel.id)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg mb-0.5 group transition-colors duration-150"
        style={{
          background: isActive ? 'rgba(0,198,255,0.08)' : 'transparent',
          borderLeft: isActive ? '3px solid #00C6FF' : '3px solid transparent',
          paddingLeft: isActive ? '9px' : '12px',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-sm font-mono flex-shrink-0"
            style={{ color: isActive ? '#00C6FF' : unreadCount > 0 ? '#C8D1DA' : '#8A9AAA' }}
          >
            #
          </span>
          <span
            className="text-sm truncate"
            style={{
              fontFamily: 'var(--font-body)',
              color: isActive ? '#00C6FF' : unreadCount > 0 ? '#F4F7FA' : '#8A9AAA',
              fontWeight: unreadCount > 0 ? '600' : '400',
            }}
          >
            {channel.id}
          </span>
        </div>
        {unreadCount > 0 && !isActive && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: 'rgba(246,196,69,0.15)',
              color: '#F6C445',
              border: '1px solid rgba(246,196,69,0.3)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    );
  })}
</div>
```

Note: If `unreadCounts` and `channels` aren't in this exact shape, adapt to the existing data variables. The `useUnreadTracking` hook likely provides unread data.

**Step 5: Update the user dock at the bottom of sidebar**

Replace the existing current-user card at the bottom:

```jsx
{/* User dock */}
<div className="px-3 py-3 border-t" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
  {/* Katana divider */}
  <div className="h-px mb-3" style={{
    background: 'linear-gradient(90deg, transparent, #00C6FF, #0E5A88, #00C6FF, transparent)',
    opacity: 0.3,
  }} />
  <div className="flex items-center gap-3 group">
    {/* Avatar */}
    <div className="relative flex-shrink-0">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
        style={{
          background: currentUser?.photoURL ? 'transparent' : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
          fontFamily: 'var(--font-heading)',
          color: '#F4F7FA',
          boxShadow: '0 0 10px -3px rgba(0,198,255,0.4)',
          border: '2px solid rgba(0,198,255,0.2)',
        }}
      >
        {currentUser?.photoURL
          ? <img src={currentUser.photoURL} alt="" className="w-full h-full object-cover" />
          : (currentUser?.displayName?.charAt(0) || '?')
        }
      </div>
      {/* Online status dot */}
      <span
        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
        style={{
          background: '#22C55E',
          borderColor: '#0B0F14',
          boxShadow: '0 0 6px rgba(34,197,94,0.6)',
        }}
      />
    </div>
    {/* Name + role */}
    <div className="flex-1 min-w-0">
      <div className="text-sm text-[#F4F7FA] truncate" style={{ fontFamily: 'var(--font-heading)', fontWeight: 600 }}>
        {currentUser?.displayName || 'You'}
      </div>
      <div className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body)' }}>Member</div>
    </div>
    {/* Settings icon — appears on group hover */}
    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#8A9AAA] hover:text-[#F6C445] p-1 rounded">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    </button>
  </div>
</div>
```

**Step 6: Verify sidebar looks correct in browser**

Check that the sidebar shows: DD seal, Dispo Dojo branding, online count, channel list with active state, user dock.

**Step 7: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat: premium sidebar redesign — branding dock, grouped channel nav, user dock"
```

---

## Task 4: ChannelHero Component

**Files:**
- Create: `frontend/src/components/community/ChannelHero.jsx`
- Modify: `frontend/src/pages/Community.jsx`

**Step 1: Create ChannelHero.jsx**

```jsx
// frontend/src/components/community/ChannelHero.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHANNEL_CONFIGS = {
  general: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(14,90,136,0.30) 0%, transparent 70%)',
    description: 'The main hub — news, updates, and open conversation',
  },
  wins: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(246,196,69,0.22) 0%, transparent 70%)',
    description: 'Share your closed deals and celebrate victories',
  },
  'deal-talk': {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(127,0,255,0.22) 0%, transparent 70%)',
    description: 'Analyze deals, ask for feedback, and collaborate',
  },
  questions: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(0,198,255,0.18) 0%, transparent 70%)',
    description: 'No question is too basic — the dojo teaches all',
  },
  resources: {
    gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(34,197,94,0.18) 0%, transparent 70%)',
    description: 'Scripts, templates, tools, and educational links',
  },
};

const DEFAULT_CONFIG = {
  gradient: 'radial-gradient(ellipse 80% 100% at 30% 50%, rgba(14,90,136,0.20) 0%, transparent 70%)',
  description: '',
};

export default function ChannelHero({ channelId, messageCount = 0, memberCount = 0, pinnedCount = 0, onPinnedClick, onMembersClick }) {
  const config = CHANNEL_CONFIGS[channelId] || DEFAULT_CONFIG;

  return (
    <div className="relative flex-shrink-0 overflow-hidden" style={{ minHeight: '140px' }}>
      {/* Channel gradient background */}
      <div className="absolute inset-0" style={{ background: config.gradient }} />
      {/* Noise texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, rgba(11,15,20,0.6))' }}
      />

      {/* Content */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-5 pb-4">
        {/* Left: Channel identity */}
        <div>
          <h1
            className="text-[28px] font-bold leading-tight mb-1"
            style={{
              fontFamily: 'var(--font-heading)',
              color: '#F4F7FA',
              letterSpacing: '-0.01em',
              textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}
          >
            <span className="text-[#00C6FF]">#</span>{channelId}
          </h1>
          <p
            className="text-sm text-[#8A9AAA] mb-3"
            style={{ fontFamily: 'var(--font-body)', lineHeight: 1.5 }}
          >
            {config.description}
          </p>
          {/* Stat chips */}
          <div className="flex items-center gap-2">
            <StatChip value={messageCount} label="messages" color="#00C6FF" />
            <StatChip value={memberCount} label="members" color="#F6C445" />
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2 mt-1">
          {pinnedCount > 0 && (
            <HeroActionButton onClick={onPinnedClick} icon="📌" label={`Pinned (${pinnedCount})`} />
          )}
          <HeroActionButton onClick={onMembersClick} icon="👥" label="Members" />
        </div>
      </div>

      {/* Bottom separator line */}
      <div className="absolute inset-x-0 bottom-0 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)',
      }} />
    </div>
  );
}

function StatChip({ value, label, color }) {
  return (
    <span
      className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
      style={{
        background: `rgba(${hexToRgb(color)}, 0.08)`,
        border: `1px solid rgba(${hexToRgb(color)}, 0.2)`,
        color: color,
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
      {value.toLocaleString()} {label}
    </span>
  );
}

function HeroActionButton({ onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#C8D1DA',
        fontFamily: 'var(--font-body)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(0,198,255,0.3)';
        e.currentTarget.style.color = '#00C6FF';
        e.currentTarget.style.background = 'rgba(0,198,255,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        e.currentTarget.style.color = '#C8D1DA';
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '255,255,255';
}
```

**Step 2: Import and place ChannelHero in Community.jsx**

In Community.jsx, import:
```jsx
import ChannelHero from '../components/community/ChannelHero';
```

Find the channel header area at the top of the center feed (the existing `<div>` that shows `# channel-name`), and replace it with:

```jsx
<ChannelHero
  channelId={activeChannel}
  messageCount={messages.length}
  memberCount={onlineUsers.length}
  pinnedCount={pinnedMessages.length}
  onPinnedClick={() => setShowPinned(prev => !prev)}
  onMembersClick={() => setShowOnlineUsers(prev => !prev)}
/>
```

Adapt prop names to whatever state variables exist in Community.jsx.

**Step 3: Verify hero renders with correct gradient per channel**

Click between channels and confirm each channel shows a different gradient color.

**Step 4: Commit**

```bash
git add frontend/src/components/community/ChannelHero.jsx frontend/src/pages/Community.jsx
git commit -m "feat: add ChannelHero component with per-channel gradient identity and stat chips"
```

---

## Task 5: MessageBubble Upgrade — Grouping, Avatars, Role Badges

**Files:**
- Modify: `frontend/src/components/community/MessageBubble.jsx`
- Modify: `frontend/src/pages/Community.jsx` (pass grouping props)

**Step 1: Read MessageBubble.jsx in full**

Read `frontend/src/components/community/MessageBubble.jsx` completely to understand current props and structure.

**Step 2: Add grouping logic to Community.jsx message list render**

In Community.jsx, where messages are mapped, add grouping detection:

```jsx
{messages.map((msg, index) => {
  const prevMsg = messages[index - 1];
  const isGrouped =
    prevMsg &&
    prevMsg.authorId === msg.authorId &&
    msg.createdAt?.seconds - prevMsg.createdAt?.seconds < 300; // 5 min

  return (
    <MessageBubble
      key={msg.id}
      message={msg}
      isGrouped={isGrouped}
      // ... other existing props
    />
  );
})}
```

**Step 3: Update MessageBubble.jsx to use grouping prop**

Add `isGrouped` to props destructuring. When `isGrouped` is true:
- Hide the avatar (replace with a `w-11` spacer div so text alignment holds)
- Hide the author name and timestamp header row
- Show a hover timestamp in the spacer area

```jsx
export default function MessageBubble({ message, isGrouped = false, ...existingProps }) {
  // ...existing code...

  return (
    <div className="flex gap-3 px-4 py-1 group hover:bg-white/[0.02] rounded-lg transition-colors duration-100">
      {/* Avatar or spacer */}
      {isGrouped ? (
        <div className="w-11 flex-shrink-0 flex items-start justify-end pt-0.5">
          {/* Hover timestamp in grouped mode */}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 text-[10px] text-[#8A9AAA] mt-1 pr-0.5 select-none" style={{ fontFamily: 'var(--font-body)' }}>
            {formatTimestamp(message.createdAt, 'time')}
          </span>
        </div>
      ) : (
        <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold"
          style={{
            background: message.authorPhotoURL ? 'transparent' : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
            fontFamily: 'var(--font-heading)',
            color: '#F4F7FA',
            boxShadow: '0 0 10px -3px rgba(0,198,255,0.35)',
            border: '2px solid rgba(0,198,255,0.15)',
            flexShrink: 0,
          }}
        >
          {message.authorPhotoURL
            ? <img src={message.authorPhotoURL} alt="" className="w-full h-full object-cover" />
            : (message.authorName?.charAt(0) || '?')
          }
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header row — hidden when grouped */}
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => onAuthorClick?.(message.authorId)}
              className="text-sm font-semibold text-[#F4F7FA] hover:text-[#F6C445] transition-colors duration-150 truncate"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {message.authorName}
            </button>
            {/* Role badge */}
            {message.authorRole === 'admin' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{
                  background: 'rgba(229,57,53,0.12)',
                  color: '#EF5350',
                  border: '1px solid rgba(229,57,53,0.25)',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.04em',
                }}
              >
                Admin
              </span>
            )}
            {/* Timestamp */}
            <span className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body)' }}>
              {formatTimestamp(message.createdAt, 'relative')}
            </span>
          </div>
        )}

        {/* Body + existing content (GIF, attachments, reactions) */}
        {/* Keep all existing body rendering code below here */}
      </div>
    </div>
  );
}
```

Note: Keep all existing rendering logic for body text, GIFs, attachments, reactions, hover toolbar — just wrap it in the new structure above.

**Step 4: Add date dividers between message groups**

In Community.jsx message list, detect day changes and insert a divider:

```jsx
{messages.map((msg, index) => {
  const prevMsg = messages[index - 1];
  const isNewDay = !prevMsg || !isSameDay(msg.createdAt?.toDate(), prevMsg.createdAt?.toDate());
  const isGrouped = !isNewDay && prevMsg?.authorId === msg.authorId &&
    msg.createdAt?.seconds - prevMsg.createdAt?.seconds < 300;

  return (
    <div key={msg.id}>
      {isNewDay && (
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)'
          }} />
          <span className="text-[11px] text-[#8A9AAA] px-2" style={{ fontFamily: 'var(--font-body)' }}>
            {formatDate(msg.createdAt?.toDate())}
          </span>
          <div className="flex-1 h-px" style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)'
          }} />
        </div>
      )}
      <MessageBubble message={msg} isGrouped={isGrouped} {...otherProps} />
    </div>
  );
})}
```

Helper functions to add:
```js
function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.toDateString() === b.toDateString();
}
function formatDate(date) {
  if (!date) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
```

**Step 5: Verify grouping works**

In the browser, consecutive messages from same author within 5 min should show no repeat avatar/name. Day boundary shows the katana date divider.

**Step 6: Commit**

```bash
git add frontend/src/components/community/MessageBubble.jsx frontend/src/pages/Community.jsx
git commit -m "feat: message grouping, 44px photo avatars, role badges, date dividers"
```

---

## Task 6: ProfileCard Upgrade — Rich Popover + Photo Upload

**Files:**
- Modify: `frontend/src/components/community/ProfileCard.jsx`
- Modify: `frontend/src/hooks/useUserProfile.js`

**Step 1: Read existing ProfileCard.jsx and useUserProfile.js in full**

Read both files completely.

**Step 2: Update useUserProfile.js to expose photoURL and dealsCount**

Add `photoURL`, `location`, and `dealsCount` to the fetched user data. Also add an `updatePhotoURL` function:

```js
// In useUserProfile.js, add to the user data fetch:
// Read from users/{userId} doc — add photoURL, location to fetched fields

// Add updatePhotoURL function:
const updatePhotoURL = async (userId, photoURL) => {
  const { doc, updateDoc } = await import('firebase/firestore');
  const { db } = await import('../lib/firebase');
  await updateDoc(doc(db, 'users', userId), { photoURL });
};
```

**Step 3: Add photo upload to ProfileCard.jsx**

Install flow: click avatar on own profile → hidden file input fires → upload via `useFileUpload` hook → update Firestore.

Add to ProfileCard.jsx:

```jsx
import { useFileUpload } from '../../hooks/useFileUpload';
import { useFloating, autoPlacement, offset, shift } from '@floating-ui/react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Inside component:
const { upload, uploading, progress } = useFileUpload();
const fileInputRef = useRef(null);

const handlePhotoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file || !isOwnProfile) return;
  const result = await upload(file, `avatars/${profileUserId}`);
  if (result?.url) {
    // Update Firestore users doc
    await updatePhotoURL(profileUserId, result.url);
    // Notify parent to refresh
    onPhotoUpdated?.(result.url);
  }
};
```

Avatar section with upload overlay (own profile only):

```jsx
<div className="relative inline-block">
  <div
    className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold cursor-pointer"
    style={{
      background: photoURL ? 'transparent' : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
      fontFamily: 'var(--font-heading)',
      color: '#F4F7FA',
      boxShadow: '0 0 16px -4px rgba(0,198,255,0.5)',
      border: '2.5px solid rgba(0,198,255,0.25)',
    }}
    onClick={() => isOwnProfile && fileInputRef.current?.click()}
  >
    {photoURL
      ? <img src={photoURL} alt="" className="w-full h-full object-cover" />
      : (displayName?.charAt(0) || '?')
    }
    {/* Upload overlay on hover for own profile */}
    {isOwnProfile && (
      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-150">
        {uploading
          ? <span className="text-xs text-white">{Math.round(progress)}%</span>
          : <span className="text-lg">📷</span>
        }
      </div>
    )}
  </div>
  {/* Progress ring when uploading */}
  {uploading && (
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(0,198,255,0.2)" strokeWidth="3" />
      <circle
        cx="32" cy="32" r="28"
        fill="none"
        stroke="#00C6FF"
        strokeWidth="3"
        strokeDasharray={`${2 * Math.PI * 28}`}
        strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
        className="transition-all duration-300"
      />
    </svg>
  )}
  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
</div>
```

**Step 4: Upgrade the stats row in ProfileCard**

Replace the existing stats with:

```jsx
{/* Stats row */}
<div className="grid grid-cols-3 gap-2 py-3 border-y" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
  <StatItem value={messageCount} label="Messages" color="#F6C445" />
  <StatItem value={dealsCount || 0} label="Deals" color="#00C6FF" />
  <StatItem value={rank || '—'} label="Rank" color="#E53935" prefix="#" />
</div>
```

```jsx
function StatItem({ value, label, color, prefix = '' }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </div>
    </div>
  );
}
```

**Step 5: Apply glass morphism styling to the ProfileCard container**

```jsx
// ProfileCard wrapper:
style={{
  background: 'rgba(11,15,20,0.92)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(0,198,255,0.18)',
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,198,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
  width: '320px',
}}
```

**Step 6: Verify profile popover opens, shows stats, photo upload works on own profile**

**Step 7: Commit**

```bash
git add frontend/src/components/community/ProfileCard.jsx frontend/src/hooks/useUserProfile.js
git commit -m "feat: rich profile popover with photo upload, stats row, and glass morphism"
```

---

## Task 7: DealCard + DealForm Components

**Files:**
- Create: `frontend/src/components/community/DealCard.jsx`
- Create: `frontend/src/components/community/DealForm.jsx`
- Modify: `frontend/src/components/community/MessageBubble.jsx` (render DealCard when type === 'deal')
- Modify: `frontend/src/components/community/MessageInput.jsx` (add Deal button to toolbar)

**Step 1: Create DealCard.jsx**

```jsx
// frontend/src/components/community/DealCard.jsx
export default function DealCard({ dealData }) {
  const { address, arv, askPrice, beds, baths, sqft, description } = dealData;
  const spread = arv && askPrice ? arv - askPrice : null;

  return (
    <div
      className="rounded-xl overflow-hidden mt-2"
      style={{
        width: '340px',
        background: 'rgba(11,15,20,0.80)',
        border: '1px solid rgba(0,198,255,0.20)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,198,255,0.06)',
      }}
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0E1820 0%, #111B24 100%)',
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-20">🏠</div>
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20"
          style={{ background: 'linear-gradient(to top, rgba(11,15,20,0.9), transparent)' }}
        />
        {/* Address overlay */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="text-sm font-semibold text-[#F4F7FA] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
            {address}
          </div>
          {(beds || baths || sqft) && (
            <div className="text-[11px] text-[#8A9AAA] mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
              {[beds && `${beds}bd`, baths && `${baths}ba`, sqft && `${sqft.toLocaleString()} sqft`].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-b" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
        <DealStat label="ARV" value={arv} color="#F6C445" />
        <DealStat label="Ask" value={askPrice} color="#00C6FF" borderX />
        <DealStat label="Spread" value={spread} color="#22C55E" />
      </div>

      {/* Description */}
      {description && (
        <div className="px-3 py-2">
          <p className="text-xs text-[#8A9AAA] line-clamp-2" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-3 pb-3 pt-1">
        <button
          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150"
          style={{
            background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.03em',
          }}
        >
          View Deal →
        </button>
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,198,255,0.25)',
            color: '#00C6FF',
            fontFamily: 'var(--font-heading)',
          }}
        >
          💾 Save
        </button>
      </div>
    </div>
  );
}

function DealStat({ label, value, color, borderX }) {
  const formatted = value != null
    ? `$${(value / 1000).toFixed(0)}K`
    : '—';
  return (
    <div
      className="flex flex-col items-center py-2"
      style={borderX ? { borderLeft: '1px solid rgba(0,198,255,0.08)', borderRight: '1px solid rgba(0,198,255,0.08)' } : {}}
    >
      <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-heading)', color }}>
        {formatted}
      </span>
      <span className="text-[10px] text-[#8A9AAA] uppercase tracking-wide" style={{ fontFamily: 'var(--font-heading)' }}>
        {label}
      </span>
    </div>
  );
}
```

**Step 2: Create DealForm.jsx**

```jsx
// frontend/src/components/community/DealForm.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DealForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({
    address: '', arv: '', askPrice: '', beds: '', baths: '', sqft: '', description: ''
  });

  const handleChange = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.address) return;
    onSubmit({
      address: form.address,
      arv: form.arv ? Number(form.arv) : null,
      askPrice: form.askPrice ? Number(form.askPrice) : null,
      beds: form.beds ? Number(form.beds) : null,
      baths: form.baths ? Number(form.baths) : null,
      sqft: form.sqft ? Number(form.sqft) : null,
      description: form.description,
    });
  };

  const inputStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,198,255,0.12)',
    borderRadius: '8px',
    color: '#F4F7FA',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative z-10 rounded-2xl p-6 w-full max-w-md"
        style={{
          background: 'rgba(11,15,20,0.95)',
          border: '1px solid rgba(0,198,255,0.2)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
        }}
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <h2 className="text-lg font-bold text-[#F4F7FA] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          🏠 Share a Deal
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input style={inputStyle} placeholder="Property address *" value={form.address} onChange={handleChange('address')} required />

          <div className="grid grid-cols-3 gap-2">
            <input style={inputStyle} placeholder="ARV $" type="number" value={form.arv} onChange={handleChange('arv')} />
            <input style={inputStyle} placeholder="Ask $" type="number" value={form.askPrice} onChange={handleChange('askPrice')} />
            <input style={inputStyle} placeholder="Sqft" type="number" value={form.sqft} onChange={handleChange('sqft')} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input style={inputStyle} placeholder="Beds" type="number" value={form.beds} onChange={handleChange('beds')} />
            <input style={inputStyle} placeholder="Baths" type="number" value={form.baths} onChange={handleChange('baths')} />
          </div>

          <textarea
            style={{ ...inputStyle, resize: 'none', minHeight: '72px' }}
            placeholder="Notes / description (optional)"
            value={form.description}
            onChange={handleChange('description')}
          />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-xl text-sm text-[#8A9AAA]"
              style={{ border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'var(--font-body)' }}
            >
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Post Deal
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
```

**Step 3: Integrate DealCard into MessageBubble.jsx**

In MessageBubble.jsx, import DealCard:
```jsx
import DealCard from './DealCard';
```

In the message body section, after the text body, add:
```jsx
{message.type === 'deal' && message.dealData && (
  <DealCard dealData={message.dealData} />
)}
```

**Step 4: Integrate DealForm into MessageInput.jsx**

Read MessageInput.jsx fully, then:

1. Add import:
```jsx
import DealForm from './DealForm';
import { AnimatePresence } from 'framer-motion';
```

2. Add state: `const [showDealForm, setShowDealForm] = useState(false);`

3. Add a 🏠 Deal button to the input toolbar (wherever the existing + toolbar / attachment buttons are).

4. Add the DealForm modal:
```jsx
<AnimatePresence>
  {showDealForm && (
    <DealForm
      onClose={() => setShowDealForm(false)}
      onSubmit={(dealData) => {
        // Call the existing sendMessage function with type: 'deal' and dealData
        onSend({ type: 'deal', dealData, body: `🏠 ${dealData.address}` });
        setShowDealForm(false);
      }}
    />
  )}
</AnimatePresence>
```

Note: Adapt `onSend` to whatever the actual send callback is named. The `useMessages` hook's `sendMessage` needs to accept `type` and `dealData` fields — check the hook and add those fields to the Firestore write if not already there.

**Step 5: Update useMessages.js sendMessage to support deal type**

Read `frontend/src/hooks/useMessages.js`. In the `sendMessage` function, if the message object includes `type: 'deal'` and `dealData`, include them in the Firestore `addDoc` call.

**Step 6: Verify deal card posts and renders**

Post a deal via the 🏠 button. Verify the card renders inline in the feed with ARV/Ask/Spread stats.

**Step 7: Commit**

```bash
git add frontend/src/components/community/DealCard.jsx \
        frontend/src/components/community/DealForm.jsx \
        frontend/src/components/community/MessageBubble.jsx \
        frontend/src/components/community/MessageInput.jsx \
        frontend/src/hooks/useMessages.js
git commit -m "feat: deal cards — inline property card in chat with ARV/Ask/Spread stats and deal form modal"
```

---

## Task 8: MessageInput Upgrade — Expandable Toolbar, Channel Placeholders, Send Button

**Files:**
- Modify: `frontend/src/components/community/MessageInput.jsx`

**Step 1: Read MessageInput.jsx in full**

Read the complete file.

**Step 2: Add channel-specific placeholder text**

Add a `channelId` prop. Map it to a placeholder:

```jsx
const CHANNEL_PLACEHOLDERS = {
  general: 'Drop a message in #general...',
  wins: 'Share your win in #wins...',
  'deal-talk': 'Post a deal in #deal-talk...',
  questions: 'Ask your question in #questions...',
  resources: 'Share a resource in #resources...',
};

const placeholder = CHANNEL_PLACEHOLDERS[channelId] || `Message #${channelId}...`;
```

Pass `placeholder` to the textarea's `placeholder` attribute.

**Step 3: Upgrade the send button state**

Find the send button. Apply conditional styling:

```jsx
<button
  type="submit"
  disabled={!canSend}
  className="rounded-lg p-2 transition-all duration-150"
  style={{
    background: canSend
      ? 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)'
      : 'rgba(255,255,255,0.05)',
    color: canSend ? '#fff' : '#8A9AAA',
    boxShadow: canSend ? '0 0 16px -4px rgba(229,57,53,0.5)' : 'none',
    cursor: canSend ? 'pointer' : 'not-allowed',
    transform: canSend ? 'scale(1)' : 'scale(0.95)',
  }}
>
  {/* send icon SVG */}
</button>
```

Where `canSend` = message text is not empty OR there are pending attachments.

**Step 4: Upgrade input bar container styling**

The input bar wrapper should be:

```jsx
<div
  className="flex-shrink-0 px-4 py-3"
  style={{
    background: '#111B24',
    borderTop: '1px solid rgba(0,198,255,0.08)',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
  }}
>
```

**Step 5: Upgrade the textarea itself**

```jsx
style={{
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(0,198,255,0.10)',
  borderRadius: '12px',
  color: '#F4F7FA',
  fontFamily: 'var(--font-body)',
  fontSize: '14px',
  lineHeight: '1.6',
  padding: '10px 14px',
  resize: 'none',
  outline: 'none',
  transition: 'border-color 150ms',
}}
onFocus={e => { e.target.style.borderColor = 'rgba(0,198,255,0.30)'; }}
onBlur={e => { e.target.style.borderColor = 'rgba(0,198,255,0.10)'; }}
```

**Step 6: Pass channelId from Community.jsx to MessageInput**

In Community.jsx, update MessageInput usage:
```jsx
<MessageInput channelId={activeChannel} ... />
```

**Step 7: Verify input bar looks upgraded in browser**

Check: elevated surface, cyan focus ring, glowing red send button when text is typed, channel-specific placeholder.

**Step 8: Commit**

```bash
git add frontend/src/components/community/MessageInput.jsx frontend/src/pages/Community.jsx
git commit -m "feat: upgraded MessageInput — channel placeholders, glowing send button, elevated surface"
```

---

## Task 9: Thread Panel Upgrade

**Files:**
- Modify: `frontend/src/pages/Community.jsx` (thread panel JSX)

**Step 1: Read the thread panel section of Community.jsx**

Search for `threadOpen` or `replies` or `activeThread` in Community.jsx to find the thread panel JSX block.

**Step 2: Upgrade the thread panel container**

```jsx
{/* Thread panel */}
<AnimatePresence>
  {threadOpen && (
    <motion.div
      className="w-[400px] flex-shrink-0 flex flex-col h-full relative z-20"
      style={{
        background: 'linear-gradient(180deg, #0B0F14 0%, #0E1820 30%, #090D12 70%, #0B0F14 100%)',
        borderLeft: '1px solid rgba(0,198,255,0.08)',
      }}
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
    >
```

**Step 3: Upgrade thread panel header**

Replace the existing thread header with:

```jsx
{/* Thread header */}
<div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(0,198,255,0.08)' }}>
  <h3 className="font-bold text-[#F4F7FA]" style={{ fontFamily: 'var(--font-heading)', fontSize: '17px' }}>
    Replies
  </h3>
  <button
    onClick={() => setThreadOpen(false)}
    className="text-[#8A9AAA] hover:text-[#F4F7FA] transition-colors duration-150 p-1 rounded"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
</div>

{/* Parent message quote */}
{activeThreadMsg && (
  <div className="px-4 py-3 border-b mx-3 my-2 rounded-lg" style={{
    background: 'rgba(0,198,255,0.04)',
    borderColor: 'rgba(0,198,255,0.12)',
  }}>
    <div className="text-[11px] text-[#8A9AAA] mb-1" style={{ fontFamily: 'var(--font-body)' }}>
      {activeThreadMsg.authorName}
    </div>
    <p className="text-sm text-[#C8D1DA] line-clamp-3" style={{ fontFamily: 'var(--font-body)', lineHeight: 1.5 }}>
      {activeThreadMsg.body}
    </p>
  </div>
)}

{/* Katana divider */}
<div className="h-px mx-4" style={{
  background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)',
}} />
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat: thread panel upgrade — proper header, parent message quote, spring slide animation"
```

---

## Task 10: ReactionBar Upgrade

**Files:**
- Modify: `frontend/src/components/community/ReactionBar.jsx`

**Step 1: Read ReactionBar.jsx in full**

**Step 2: Upgrade reaction chip styling**

```jsx
// Each reaction chip:
style={{
  background: isActive
    ? 'rgba(0,198,255,0.12)'
    : 'rgba(255,255,255,0.05)',
  border: `1px solid ${isActive ? 'rgba(0,198,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: '999px',
  padding: '2px 8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  transition: 'all 150ms',
  fontFamily: 'var(--font-body)',
  fontSize: '13px',
  color: isActive ? '#00C6FF' : '#C8D1DA',
}}
onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
```

**Step 3: Commit**

```bash
git add frontend/src/components/community/ReactionBar.jsx
git commit -m "feat: upgrade reaction chips — active state cyan, spring scale on hover"
```

---

## Task 11: Final Polish Pass

**Files:**
- Modify: `frontend/src/pages/Community.jsx`
- Modify: `frontend/src/components/community/TypingIndicator.jsx`

**Step 1: Read TypingIndicator.jsx and upgrade it**

```jsx
// Wrap in a positioned container just above the input bar
// Upgrade the text style:
<div className="px-4 py-1 text-[12px] text-[#8A9AAA] flex items-center gap-2" style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic' }}>
  {/* 3-dot pulse */}
  <div className="flex gap-1">
    {[0, 1, 2].map(i => (
      <span key={i} className="w-1 h-1 rounded-full bg-[#8A9AAA] animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </div>
  {typingText}
</div>
```

**Step 2: Upgrade PinnedMessagesBar styling**

Read `PinnedMessagesBar.jsx`. Update the bar background to:
```jsx
style={{
  background: 'rgba(246,196,69,0.06)',
  borderBottom: '1px solid rgba(246,196,69,0.12)',
}}
```

**Step 3: Ensure center feed has proper overflow and padding**

In Community.jsx, the message feed scroll container should have:
```jsx
className="flex-1 overflow-y-auto"
style={{ paddingBottom: '8px' }}
```

**Step 4: Final visual check in browser**

Navigate all 5 channels. Verify:
- Background shows through all zones with proper darkening
- Sidebar: DD seal, online count, active channel state with left glow
- Channel hero: correct gradient per channel, stat chips
- Messages: 44px avatars, grouped consecutive messages, date dividers
- Input bar: channel-specific placeholder, glowing red send button
- Thread panel: slides in with spring, shows parent quote

**Step 5: Deploy**

```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
git push origin master
cd frontend && npx vercel --prod
```

**Step 6: Final commit if any polish tweaks made**

```bash
git add -A
git commit -m "feat: community premium redesign — polish pass, typing indicator, pinned bar upgrade"
```

---

## Summary

| Task | Components Touched | New Files |
|------|-------------------|-----------|
| 1 | package.json, public/ | community-bg.png |
| 2 | Community.jsx | — |
| 3 | Community.jsx | — |
| 4 | Community.jsx | ChannelHero.jsx |
| 5 | MessageBubble.jsx, Community.jsx | — |
| 6 | ProfileCard.jsx, useUserProfile.js | — |
| 7 | MessageBubble.jsx, MessageInput.jsx, useMessages.js | DealCard.jsx, DealForm.jsx |
| 8 | MessageInput.jsx, Community.jsx | — |
| 9 | Community.jsx | — |
| 10 | ReactionBar.jsx | — |
| 11 | TypingIndicator.jsx, PinnedMessagesBar.jsx, Community.jsx | — |
