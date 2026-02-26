# Ninja Profile Revamp — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current NinjaProfile page (SVG avatar, 7 sections) with a premium baseball card hero + redesigned page sections, using pre-made AI images per rank.

**Architecture:** New `NinjaCard` component replaces `NinjaAvatar` everywhere. Card uses CSS-only effects (conic-gradient holographic border, perspective 3D tilt, backface-visibility flip). Page is single-column, max-width 720px, with consistent dark glass section cards. 8 rank images stored as static assets in `frontend/public/avatars/`.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, Lucide icons, CSS 3D transforms. No new dependencies.

---

## Migration Map

Files that currently import `NinjaAvatar`:

| File | Import | Usages |
|------|--------|--------|
| `frontend/src/pages/NinjaProfile.jsx` | `NinjaAvatar`, `RANK_BADGE_COLOR` | 3+ renders + color constant |
| `frontend/src/components/Sidebar.jsx:357` | `NinjaAvatar` | 1 render (32px) |
| `frontend/src/components/QuickSettingsPanel.jsx` | `NinjaAvatar` | 3 renders (36, 56, 96px) |
| `frontend/src/components/RankBadge.jsx:1` | `RANK_BADGE_COLOR` | 1 color lookup |

All four files must be updated when `NinjaCard` replaces `NinjaAvatar`.

---

## Task 1: Create placeholder avatar assets and rank image map

**Files:**
- Create: `frontend/public/avatars/` directory
- Create: `frontend/public/avatars/placeholder.svg` (generic ninja silhouette)
- Create: `frontend/src/lib/rankImages.js` (image path map + RANK_BADGE_COLOR re-export)

**Step 1: Create the avatars directory and a placeholder SVG**

Create `frontend/public/avatars/placeholder.svg` — a dark ninja silhouette (simple SVG, ~20 lines) used until real AI images are dropped in. Use the brand dark bg (#0B0F14) with a subtle cyan glow outline.

**Step 2: Create the rank image map module**

Create `frontend/src/lib/rankImages.js`:

```javascript
// Maps each rank to its avatar image path and card border color.
// Replace placeholder paths with real AI-generated images as they're created.

export const RANK_IMAGES = {
  initiate:       '/avatars/rank-1-initiate.webp',
  scout:          '/avatars/rank-2-scout.webp',
  shinobi:        '/avatars/rank-3-shinobi.webp',
  shadow:         '/avatars/rank-4-shadow.webp',
  blade:          '/avatars/rank-5-blade.webp',
  jonin:          '/avatars/rank-6-jonin.webp',
  'shadow-master':'/avatars/rank-7-shadow-master.webp',
  kage:           '/avatars/rank-8-kage.webp',
}

export const RANK_BADGE_COLOR = {
  initiate:       '#9ca3af',
  scout:          '#00C6FF',
  shinobi:        '#7F00FF',
  shadow:         '#6b7280',
  blade:          '#3b82f6',
  jonin:          '#E53935',
  'shadow-master':'#374151',
  kage:           '#F6C445',
}

export const RANK_LABELS = {
  initiate: 'Initiate', scout: 'Scout', shinobi: 'Shinobi',
  shadow: 'Shadow', blade: 'Blade', jonin: 'Jonin',
  'shadow-master': 'Shadow Master', kage: 'Kage',
}

const PLACEHOLDER = '/avatars/placeholder.svg'

/** Returns the avatar image URL for a rank, with placeholder fallback. */
export function getRankImage(rank) {
  const path = RANK_IMAGES[rank] || RANK_IMAGES.initiate
  // Check if the real image exists by trying to load it; fall back to placeholder.
  // In production, all 8 images should exist. This is a dev convenience.
  return path // Swap to PLACEHOLDER if images aren't created yet
}
```

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add frontend/public/avatars/ frontend/src/lib/rankImages.js
git commit -m "feat: add rank image map and placeholder avatar assets"
```

---

## Task 2: Build the NinjaCard component (front face)

**Files:**
- Create: `frontend/src/components/NinjaCard.jsx`

**Step 1: Create the NinjaCard component**

Create `frontend/src/components/NinjaCard.jsx` with these features:

**Props:**
```javascript
{
  rank = 'initiate',     // determines image + border color
  name = 'Ninja',        // display name
  username = '',         // @username
  market = '',           // location (e.g. "Dallas, TX")
  stats = {},            // { underwrites, lois, dealsClosed }
  size = 'full',         // 'full' (320px hero) | 'md' (64px) | 'sm' (48px) | 'xs' (36px)
  interactive = true,    // enable 3D tilt + hover effects
  className = '',
}
```

**Structure for `size="full"` (hero card):**
- Outer wrapper: 2.5:3.5 aspect ratio, `position: relative`, `perspective: 1000px`
- Holographic border: 4px animated `conic-gradient` using a `::before` pseudo-element (or a wrapping div). Colors: `#00C6FF, #F6C445, #7F00FF, #E53935, #00C6FF`. Animate `--holo-angle` on mousemove via `onMouseMove` handler that calculates angle from cursor position relative to card center.
- Inner card: `overflow: hidden`, `border-radius: 12px`, dark background
- Image: `<img>` tag using `getRankImage(rank)`, `object-fit: cover`, fills the card
- Bottom gradient overlay: `position: absolute`, bottom 0, `background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)`
- Rank badge: top-left, uses `RANK_BADGE_COLOR[rank]` for metallic gradient text
- Name plate: bottom, over gradient — name (Rajdhani Bold 20px), username + market (DM Sans 12px, text-dim)
- Stat bar: very bottom, thin divider line, 3 stats in a row (UW | LOI | Deals), Rajdhani Semibold 14px

**3D tilt handler:**
```javascript
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width - 0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5
  setTilt({ x: y * -15, y: x * 15 })
  setHoloAngle(Math.atan2(y, x) * (180 / Math.PI) + 180)
}
const handleMouseLeave = () => setTilt({ x: 0, y: 0 })
```

Apply tilt via inline style: `transform: rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` with `transition: transform 0.4s cubic-bezier(0.03, 0.98, 0.52, 0.99)` on mouse leave.

**Shine sweep:** A `::after` pseudo-element (or absolutely positioned div) with `background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.06) 50%, transparent 55%)`. Moves with mouse X position via `translateX`.

**Small sizes (`md`, `sm`, `xs`):**
- Just render the rank image in a circular or rounded frame
- Border color from `RANK_BADGE_COLOR[rank]`
- No tilt, no stats, no name plate
- Used for sidebar, message threads, leaderboards

**Step 2: Verify it renders**

Import into NinjaProfile temporarily alongside the old avatar. Verify it renders at all sizes.

Run: dev server, navigate to `/ninja-profile`, visual check.

**Step 3: Commit**

```bash
git add frontend/src/components/NinjaCard.jsx
git commit -m "feat: add NinjaCard component with holographic border and 3D tilt"
```

---

## Task 3: Add card flip (back face)

**Files:**
- Modify: `frontend/src/components/NinjaCard.jsx`

**Step 1: Add flip state and back face**

Add `const [flipped, setFlipped] = useState(false)` to the full-size card.

Structure:
```
<div className="card-container" style={{ perspective: '1000px' }}>
  <div className="card-inner" style={{
    transform: flipped ? 'rotateY(180deg)' : 'rotateY(0)',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
  }}>
    {/* Front face */}
    <div style={{ backfaceVisibility: 'hidden' }}>
      ...existing front...
    </div>
    {/* Back face */}
    <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}>
      ...back content...
    </div>
  </div>
</div>
```

**Back face content:**
- Same holographic border as front
- Dark background with subtle pattern/noise texture
- Bio text (if provided) — DM Sans, 14px, text-dim, line-height 1.7
- Extended stats grid: 2×4 layout of all stat values
- Earned badges row (small icons)
- Community rank badge
- "Flip" button (small, bottom-right) to return to front

**Step 2: Add flip trigger**

- Click anywhere on front face flips to back (on full-size only)
- Click "Flip" button on back returns to front
- Disable 3D tilt while flipped (set tilt to {0,0})

**Step 3: Verify flip animation**

Visual check: flip should be smooth 0.6s with correct backface hiding.

**Step 4: Commit**

```bash
git add frontend/src/components/NinjaCard.jsx
git commit -m "feat: add card flip animation with extended stats back face"
```

---

## Task 4: Rewrite NinjaProfile page — hero section

**Files:**
- Modify: `frontend/src/pages/NinjaProfile.jsx`

**Step 1: Strip the old hero and armory**

Remove from NinjaProfile.jsx:
- The `NinjaAvatar` import (line 17)
- All `MASK_COLORS`, `HEADBAND_COLORS`, `EYE_COLORS` constants (lines 43-63)
- `ALL_ACCESSORIES` constant (lines 65-72)
- The entire Armory section render (the "The Armory" heading and all color swatch / gear toggle UI)
- The `FAQ` constant and FAQ section render (lines 35-41)
- `ColorSwatches` sub-component (lines 87+)
- `patchAvatar` and `toggleAccessory` functions
- Any state related to avatar customization (`draft.avatarConfig`, etc.)

Add new import:
```javascript
import NinjaCard from '../components/NinjaCard'
import { RANK_BADGE_COLOR } from '../lib/rankImages'
```

**Step 2: Build the new hero section**

Replace the old hero banner with:

```jsx
{/* Hero — Ninja Card */}
<div className="flex flex-col items-center pt-8 pb-12">
  {/* Ambient glow behind card */}
  <div className="relative">
    <div
      className="absolute inset-0 blur-3xl opacity-30 rounded-full scale-150"
      style={{ background: RANK_BADGE_COLOR[rank] || '#00C6FF' }}
    />
    <NinjaCard
      rank={rank}
      name={profile?.displayName || 'Ninja'}
      username={profile?.username}
      market={profile?.market}
      stats={profile?.stats}
      size="full"
    />
  </div>

  {/* Edit identity button (own profile only) */}
  {isOwnProfile && (
    <button onClick={() => setEditing('identity')} className="mt-4 ...">
      <Pencil size={14} /> Edit Profile
    </button>
  )}
</div>
```

**Step 3: Keep identity edit modal/inline**

The name/username/bio/market editing should still work — keep the edit form but trigger it via a button below the card rather than an inline pencil on the hero. Use a slide-down panel (AnimatePresence) below the card.

**Step 4: Verify hero renders**

Run dev server, navigate to `/ninja-profile`. Card should render centered with ambient glow.

**Step 5: Commit**

```bash
git add frontend/src/pages/NinjaProfile.jsx
git commit -m "feat: replace NinjaProfile hero with NinjaCard component"
```

---

## Task 5: Rewrite NinjaProfile — The Path (rank timeline)

**Files:**
- Modify: `frontend/src/pages/NinjaProfile.jsx`

**Step 1: Build the rank timeline section**

Replace the old rank progress bar with a horizontal timeline:

```jsx
<section style={sectionCardStyle}>
  <SectionHeader label="The Path" />
  <div className="flex items-center gap-0 overflow-x-auto py-4 scrollbar-hide">
    {RANK_THRESHOLDS.map((tier, i) => {
      const isCurrent = tier.rank === rank
      const isPast = rankIndex > i
      const isFuture = rankIndex < i
      const color = RANK_BADGE_COLOR[tier.rank]

      return (
        <React.Fragment key={tier.rank}>
          {/* Connector line (not before first) */}
          {i > 0 && (
            <div className="h-0.5 flex-1 min-w-[24px]"
              style={{ background: isPast || isCurrent ? `linear-gradient(to right, #00C6FF, ${color})` : 'rgba(255,255,255,0.08)' }}
            />
          )}
          {/* Node */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`rounded-full flex items-center justify-center
                ${isCurrent ? 'w-12 h-12 ring-2' : 'w-8 h-8'}
                ${isFuture ? 'opacity-40' : ''}`}
              style={{
                background: isPast || isCurrent ? `${color}20` : 'rgba(255,255,255,0.05)',
                ringColor: isCurrent ? color : 'transparent',
                border: `1px solid ${isPast || isCurrent ? color + '60' : 'rgba(255,255,255,0.08)'}`,
              }}
            >
              {isPast ? <CheckCircle size={14} style={{ color }} /> :
               isCurrent ? <Star size={18} style={{ color }} /> :
               <Lock size={12} className="text-white/20" />}
            </div>
            <span className={`text-[10px] mt-1.5 font-heading tracking-wide
              ${isCurrent ? 'text-white font-bold' : 'text-text-dim/50'}`}>
              {tier.name}
            </span>
          </div>
        </React.Fragment>
      )
    })}
  </div>
</section>
```

**Step 2: Add section card style constant**

```javascript
const sectionCardStyle = {
  background: 'linear-gradient(135deg, rgba(17,27,36,0.85) 0%, rgba(11,15,20,0.92) 100%)',
  border: '1px solid rgba(246,196,69,0.08)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(0,198,255,0.06)',
  padding: '24px',
}
```

**Step 3: Add SectionHeader sub-component**

```jsx
function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[3px] h-4 rounded-full bg-[#00C6FF]" />
      <h3 className="text-[13px] font-heading font-bold tracking-[0.15em] uppercase text-text-dim/50">
        {label}
      </h3>
    </div>
  )
}
```

**Step 4: Verify timeline renders**

Visual check: 8 nodes connected by lines, current rank highlighted, future locked.

**Step 5: Commit**

```bash
git add frontend/src/pages/NinjaProfile.jsx
git commit -m "feat: add rank timeline (The Path) section to NinjaProfile"
```

---

## Task 6: Rewrite NinjaProfile — Mission Log (stats grid)

**Files:**
- Modify: `frontend/src/pages/NinjaProfile.jsx`

**Step 1: Rebuild the stats section**

Keep the existing `STAT_CARDS` array (lines 74-83), but reduce to the 6 key stats:

```javascript
const STAT_CARDS = [
  { key: 'underwrites', label: 'Underwrites', Icon: Calculator },
  { key: 'lois', label: 'LOIs', Icon: Send },
  { key: 'contracts', label: 'Contracts', Icon: FileSignature },
  { key: 'dealsClosed', label: 'Deals Closed', Icon: Trophy },
  { key: 'totalMessages', label: 'Messages', Icon: MessageSquare },
  { key: 'birdDogLeads', label: 'Bird Dog Leads', Icon: DollarSign },
]
```

Render as a 2×3 grid (desktop) / 1-column (mobile):

```jsx
<section style={sectionCardStyle}>
  <SectionHeader label="Mission Log" />
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {STAT_CARDS.map(({ key, label, Icon }) => (
      <div
        key={key}
        className="rounded-lg p-4 text-center transition-transform duration-200 hover:-translate-y-0.5"
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid rgba(0,198,255,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Icon size={18} className="mx-auto mb-2" style={{ color: RANK_BADGE_COLOR[rank], opacity: 0.6 }} />
        <div className="font-heading font-bold text-[28px] text-[#00C6FF] leading-none">
          {stats[key] || 0}
        </div>
        <div className="text-[11px] text-text-dim/60 mt-1 font-body">
          {label}
        </div>
      </div>
    ))}
  </div>
</section>
```

**Step 2: Verify grid renders**

Visual check: 2×3 grid, numbers prominent, icons subtle.

**Step 3: Commit**

```bash
git add frontend/src/pages/NinjaProfile.jsx
git commit -m "feat: redesign Mission Log as stat card grid"
```

---

## Task 7: Rewrite NinjaProfile — Trophy Wall (badges)

**Files:**
- Modify: `frontend/src/pages/NinjaProfile.jsx`

**Step 1: Rebuild the badge section**

Show ALL badges (deal + community), earned ones in full color, locked ones grayed out:

```jsx
<section style={sectionCardStyle}>
  <SectionHeader label="Trophy Wall" />
  <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
    {[...BADGE_DEFS, ...COMMUNITY_BADGES].map((badge) => {
      const earned = earnedBadges.includes(badge.id) || earnedCommunityBadges.includes(badge.id)
      return (
        <div
          key={badge.id}
          className={`relative group rounded-lg p-3 text-center transition-transform duration-200
            ${earned ? 'hover:scale-105' : 'opacity-40 grayscale'}`}
          style={{
            background: earned ? 'rgba(0,198,255,0.06)' : 'rgba(0,0,0,0.2)',
            border: `1px solid ${earned ? 'rgba(0,198,255,0.15)' : 'rgba(255,255,255,0.04)'}`,
          }}
        >
          {/* Badge icon or emoji */}
          <div className="text-2xl mb-1">{badge.icon || '🏆'}</div>
          <div className="text-[10px] font-heading text-text-dim/60 truncate">{badge.label}</div>
          {!earned && <Lock size={10} className="absolute top-1 right-1 text-white/20" />}
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-black/90 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {badge.label}
          </div>
        </div>
      )
    })}
  </div>
</section>
```

Note: `BADGE_DEFS` don't have `icon` properties — add fallback emoji icons for deal badges, or use Lucide icons. Community badges already have emoji icons.

**Step 2: Remove the old BadgeShowcase import and usage**

Remove the import of `BadgeShowcase` from `../components/community/BadgeShowcase` and `ActivityBadge` from `../components/ActivityBadge` since this section replaces both.

**Step 3: Verify badges render**

Visual check: grid of badges, earned in color, locked grayed with lock icon.

**Step 4: Commit**

```bash
git add frontend/src/pages/NinjaProfile.jsx
git commit -m "feat: redesign Trophy Wall with unified badge grid"
```

---

## Task 8: Rewrite NinjaProfile — Hunting Grounds + Intel File

**Files:**
- Modify: `frontend/src/pages/NinjaProfile.jsx`

**Step 1: Rebuild Hunting Grounds**

Simple key-value card, only shown if user has market or buyBox data:

```jsx
{(profile?.market || profile?.buyBox) && (
  <section style={sectionCardStyle}>
    <SectionHeader label="Hunting Grounds" />
    <div className="space-y-3">
      {profile?.market && (
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-heading uppercase tracking-widest text-text-dim/40">Market</span>
          <span className="text-sm text-parchment">{profile.market}</span>
        </div>
      )}
      {/* Add buy box fields similarly if present */}
    </div>
  </section>
)}
```

**Step 2: Rebuild Intel File (own profile only)**

Keep the existing contact info fields and notification toggles, but restyle them to match the new section card style. Keep the edit pencil → inline fields → save/cancel pattern.

```jsx
{isOwnProfile && (
  <section style={sectionCardStyle}>
    <SectionHeader label="Intel File" />
    {/* Email, phone, role badge, notification toggles */}
    {/* Reuse existing edit logic, just restyle the containers */}
  </section>
)}
```

**Step 3: Remove the FAQ section entirely**

Delete the `FAQ` constant (lines 35-41) and its render block.

**Step 4: Verify both sections render correctly**

Visual check on own profile (all sections visible) and another user's profile (Intel File hidden).

**Step 5: Commit**

```bash
git add frontend/src/pages/NinjaProfile.jsx
git commit -m "feat: redesign Hunting Grounds and Intel File, remove FAQ"
```

---

## Task 9: Update Sidebar and RankBadge to use new imports

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx` (line 22, line 357)
- Modify: `frontend/src/components/RankBadge.jsx` (line 1)

**Step 1: Update Sidebar**

Replace:
```javascript
import NinjaAvatar from './NinjaAvatar'
```
With:
```javascript
import NinjaCard from './NinjaCard'
```

Replace the usage at line 357:
```jsx
<NinjaAvatar config={profile?.avatarConfig} size={32} rank={profile?.rank || 'initiate'} />
```
With:
```jsx
<NinjaCard rank={profile?.rank || 'initiate'} size="sm" interactive={false} />
```

**Step 2: Update RankBadge**

Replace line 1:
```javascript
import { RANK_BADGE_COLOR } from './NinjaAvatar'
```
With:
```javascript
import { RANK_BADGE_COLOR } from '../lib/rankImages'
```

**Step 3: Verify sidebar avatar and rank badges render**

Visual check: sidebar shows small round ninja image, rank badges still colored correctly.

**Step 4: Commit**

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/components/RankBadge.jsx
git commit -m "refactor: update Sidebar and RankBadge to use NinjaCard and rankImages"
```

---

## Task 10: Update QuickSettingsPanel

**Files:**
- Modify: `frontend/src/components/QuickSettingsPanel.jsx`

**Step 1: Replace NinjaAvatar import and all 3 usages**

Replace:
```javascript
import NinjaAvatar from './NinjaAvatar'
```
With:
```javascript
import NinjaCard from './NinjaCard'
```

Replace all 3 render instances:
- 96px preview → `<NinjaCard rank={rank} size="full" interactive={false} />`  (or a smaller "md" preview)
- 56px rank card → `<NinjaCard rank={rank} size="md" interactive={false} />`
- 36px header → `<NinjaCard rank={rank} size="xs" interactive={false} />`

**Step 2: Remove avatar customization UI from QuickSettingsPanel**

The old Ninja customization tab (color swatches, gear toggles) is no longer needed since avatars are rank-based images. Either:
- Remove the entire Ninja tab from QuickSettingsPanel, OR
- Simplify it to just show "Your current rank: X" with the card preview

Decide based on what else the panel does — if it only had avatar customization, simplify heavily.

**Step 3: Verify QuickSettingsPanel renders**

Visual check: panel opens, shows card preview, no broken references.

**Step 4: Commit**

```bash
git add frontend/src/components/QuickSettingsPanel.jsx
git commit -m "refactor: update QuickSettingsPanel to use NinjaCard, remove SVG customization"
```

---

## Task 11: Deprecate NinjaAvatar.jsx

**Files:**
- Modify: `frontend/src/components/NinjaAvatar.jsx`

**Step 1: Verify no remaining imports**

Search the entire `frontend/src/` directory for any remaining references to `NinjaAvatar`. There should be zero after Tasks 9 and 10.

Run: `grep -r "NinjaAvatar" frontend/src/`
Expected: No results.

**Step 2: Delete NinjaAvatar.jsx**

Delete `frontend/src/components/NinjaAvatar.jsx` (575 lines).

**Step 3: Verify build succeeds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git rm frontend/src/components/NinjaAvatar.jsx
git commit -m "refactor: remove deprecated NinjaAvatar SVG component (replaced by NinjaCard)"
```

---

## Task 12: Clean up userProfile.js

**Files:**
- Modify: `frontend/src/lib/userProfile.js`

**Step 1: Remove SVG avatar config from DEFAULT_AVATAR**

In `frontend/src/lib/userProfile.js`, change `DEFAULT_AVATAR` to remove SVG-specific fields:

```javascript
export const DEFAULT_AVATAR = {
  base: 'male',  // Keep for backward compat with existing Firestore docs
}
```

The `maskColor`, `headbandColor`, `beltColor`, `eyeColor`, `gear`, `effects` fields are no longer used by NinjaCard — the card image is determined purely by rank.

**Step 2: Keep `unlockedGear()` for now**

Don't delete `unlockedGear()` yet — it may still be referenced. It's harmless dead code. Can be cleaned up in a future pass.

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add frontend/src/lib/userProfile.js
git commit -m "refactor: simplify DEFAULT_AVATAR config (SVG fields no longer used)"
```

---

## Task 13: Full page visual verification

**Files:** None (verification only)

**Step 1: Start dev server**

Run: `cd frontend && npm run dev`

**Step 2: Check own profile**

Navigate to `/ninja-profile`. Verify:
- [ ] Card renders centered with ambient glow
- [ ] Holographic border animates on mouse move
- [ ] 3D tilt works smoothly
- [ ] Card flip shows back with stats/badges
- [ ] The Path timeline shows correct rank highlighted
- [ ] Mission Log shows 2×3 stat grid
- [ ] Trophy Wall shows earned + locked badges
- [ ] Hunting Grounds shows if market data exists
- [ ] Intel File shows for own profile with edit capability
- [ ] No Armory section visible
- [ ] No FAQ section visible

**Step 3: Check another user's profile**

Navigate to `/ninja-profile/:uid`. Verify:
- [ ] Card shows that user's rank and name
- [ ] No edit buttons visible
- [ ] Intel File not visible
- [ ] All other sections render correctly

**Step 4: Check sidebar avatar**

Verify sidebar shows small NinjaCard at bottom.

**Step 5: Check responsive layout**

Resize to mobile width. Verify:
- [ ] Card scales down but maintains aspect ratio
- [ ] Stats stack to 2-column or 1-column
- [ ] Timeline scrolls horizontally
- [ ] All text readable

**Step 6: Screenshot and compare**

Take screenshots at desktop and mobile widths for reference.

**Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix: visual polish and responsive fixes for NinjaProfile revamp"
```

---

## Task 14: Build succeeds, deploy

**Step 1: Final build check**

Run: `cd frontend && npm run build`
Expected: Build succeeds with zero errors, zero warnings about missing NinjaAvatar.

**Step 2: Deploy**

Run: `cd frontend && npx vercel --prod`

**Step 3: Push to GitHub**

```bash
git push origin master
```

---

## Image Handoff

After implementation is complete, the user will generate 8 AI ninja images using free tools (Leonardo.ai, Bing Image Creator, etc.) with the prompts from the design doc. Images should be:

- Dropped into `frontend/public/avatars/` as:
  - `rank-1-initiate.webp`
  - `rank-2-scout.webp`
  - `rank-3-shinobi.webp`
  - `rank-4-shadow.webp`
  - `rank-5-blade.webp`
  - `rank-6-jonin.webp`
  - `rank-7-shadow-master.webp`
  - `rank-8-kage.webp`
- Resolution: 640×896px minimum (2.5:3.5 ratio)
- Format: WebP preferred, PNG fallback
- No code changes needed — `rankImages.js` already maps to these paths
