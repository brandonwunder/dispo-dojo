# Dashboard High-Fidelity Dojo Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the dashboard, sidebar, and header from flat CSS approximations into a premium, high-fidelity traditional Japanese dojo aesthetic — hanging scroll stat cards, shoji door tool panels, CSS ink-painting hero, lacquered sidebar, centered header.

**Architecture:** Pure CSS/React redesign — no image assets. Uses layered CSS gradients, multi-layer box-shadows, inset highlights, and Framer Motion for all effects. Replaces Three.js 3D scene with a CSS-painted landscape. New components: `HangingScroll`, `ShojiPanel`. Modified components: `Sidebar`, `Header`, `Layout`, `EmberField`, `TorchLight`, `MistLayer`.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, CSS gradients/shadows/pseudo-elements

**Design doc:** `docs/plans/2026-02-22-dashboard-high-fidelity-dojo-design.md`

---

## Task 1: Add New CSS Utilities and Animations

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Add hanging scroll CSS classes**

Add these new utility classes to `index.css` after the existing `.scroll-card` styles (after line 380):

```css
/* ═══════════════════════════════════════════
   Hanging Scroll (Kakejiku) Styles
   ═══════════════════════════════════════════ */

/* Wooden dowel — realistic cylindrical bar */
.scroll-dowel {
  height: 14px;
  border-radius: 7px;
  background: linear-gradient(
    180deg,
    #3d2e1a 0%,
    #5a4530 15%,
    #6b5540 35%,
    #4a3828 55%,
    #3d2e1a 75%,
    #2a1f12 100%
  );
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.5),
    inset 0 2px 3px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.3);
  position: relative;
}

/* Dowel finials (lacquered ends) */
.scroll-dowel::before,
.scroll-dowel::after {
  content: '';
  position: absolute;
  top: -2px;
  width: 12px;
  height: 18px;
  border-radius: 6px;
  background: linear-gradient(
    180deg,
    #1a1510 0%,
    #2a2118 40%,
    #1a1510 100%
  );
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 2px rgba(166, 124, 46, 0.15);
}

.scroll-dowel::before { left: -4px; }
.scroll-dowel::after { right: -4px; }

/* Rope ties hanging from dowel */
.scroll-rope {
  width: 3px;
  height: 18px;
  background: repeating-linear-gradient(
    180deg,
    #8b6914 0px,
    #a67c2e 2px,
    #6b4e0a 4px,
    #8b6914 6px
  );
  border-radius: 1.5px;
  opacity: 0.6;
}

/* Parchment body */
.scroll-parchment {
  background: linear-gradient(
    180deg,
    #e8dcc8 0%,
    #f5f0e6 8%,
    #f2edd9 50%,
    #ebe4d0 85%,
    #e0d6c0 100%
  );
  position: relative;
}

.scroll-parchment::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' seed='33' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.05'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)' opacity='0.06'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  mix-blend-mode: multiply;
  border-radius: inherit;
}

/* ═══════════════════════════════════════════
   Shoji Panel Styles
   ═══════════════════════════════════════════ */

/* Shoji wooden frame */
.shoji-frame {
  background: linear-gradient(
    135deg,
    #2a2118 0%,
    #3d2e1a 20%,
    #4a3828 50%,
    #3d2e1a 80%,
    #2a2118 100%
  );
  box-shadow:
    inset 0 1px 3px rgba(255, 255, 255, 0.06),
    inset 0 -1px 3px rgba(0, 0, 0, 0.3),
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 1px 4px rgba(0, 0, 0, 0.3);
}

/* Shoji paper interior */
.shoji-paper {
  background: rgba(245, 240, 230, 0.06);
  position: relative;
}

/* Shoji lattice grid */
.shoji-lattice {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(245, 240, 230, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 240, 230, 0.04) 1px, transparent 1px);
  background-size: 33.33% 33.33%;
  pointer-events: none;
}

/* Shoji backlight glow */
.shoji-backlight {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at center,
    rgba(255, 154, 60, 0.06) 0%,
    rgba(212, 168, 83, 0.03) 40%,
    transparent 70%
  );
  pointer-events: none;
}

/* ═══════════════════════════════════════════
   Sumi-e Landscape Styles
   ═══════════════════════════════════════════ */

@keyframes mistScroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* ═══════════════════════════════════════════
   Deep Lacquer Surface
   ═══════════════════════════════════════════ */

.lacquer-deep {
  background: linear-gradient(
    180deg,
    #0c0a07 0%,
    #12100c 30%,
    #0a0806 70%,
    #0c0a07 100%
  );
  position: relative;
}

.lacquer-deep::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.02 0.004' numOctaves='5' seed='19' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.08'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)' opacity='0.08'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  mix-blend-mode: overlay;
}

/* Lacquer highlight stripe — polished surface reflection */
.lacquer-shine::after {
  content: '';
  position: absolute;
  top: 45%;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(166, 124, 46, 0.06) 20%,
    rgba(166, 124, 46, 0.1) 50%,
    rgba(166, 124, 46, 0.06) 80%,
    transparent 100%
  );
  pointer-events: none;
}

/* ═══════════════════════════════════════════
   Background Texture
   ═══════════════════════════════════════════ */

.wall-texture {
  position: relative;
}

.wall-texture::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='wall'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='5' seed='77' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.02'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wall)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
  pointer-events: none;
  z-index: 0;
  mix-blend-mode: overlay;
}
```

**Step 2: Add scroll-to-reveal animation keyframes**

Add after the new CSS above:

```css
/* Section reveal animation */
@keyframes scrollReveal {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Step 3: Verify styles compile**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no CSS errors.

**Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add hanging scroll, shoji panel, lacquer, and wall texture CSS utilities"
```

---

## Task 2: Create the HangingScroll Component

**Files:**
- Create: `frontend/src/components/HangingScroll.jsx`

**Step 1: Build the HangingScroll component**

```jsx
import { motion } from 'framer-motion'
import CountUp from 'react-countup'

export default function HangingScroll({
  kanji,
  label,
  value,
  prefix = '',
  suffix = '',
  delay = 0,
}) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      {/* Rope ties */}
      <div className="flex justify-between w-full px-6 mb-0">
        <div className="scroll-rope" />
        <div className="scroll-rope" />
      </div>

      {/* Top dowel */}
      <div className="scroll-dowel w-full z-10" />

      {/* Parchment body */}
      <div
        className="scroll-parchment w-[calc(100%-16px)] py-8 px-4 text-center relative"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 1px 6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Kanji watermark */}
        {kanji && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-display pointer-events-none select-none"
            style={{ color: 'rgba(166, 124, 46, 0.08)' }}
          >
            {kanji}
          </span>
        )}

        {/* Stat value */}
        <div className="relative z-10">
          <p className="font-display text-4xl font-bold tracking-wide"
            style={{ color: '#1a1510' }}
          >
            {prefix}
            <CountUp end={typeof value === 'number' ? value : 0} duration={2} separator="," />
            {suffix}
          </p>
          <p className="font-heading text-xs tracking-[0.2em] uppercase mt-2"
            style={{ color: '#6b5a42' }}
          >
            {label}
          </p>
        </div>

        {/* Hanko seal */}
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full hanko-seal flex items-center justify-center">
          <span className="text-[8px] font-bold text-parchment font-heading">
            {kanji}
          </span>
        </div>
      </div>

      {/* Bottom dowel */}
      <div className="scroll-dowel w-full z-10" />
    </motion.div>
  )
}
```

**Step 2: Verify it renders**

Open the app in browser, temporarily import and render `<HangingScroll kanji="刀" label="Active Deals" value={12} />` in Dashboard.jsx to verify visual appearance.

**Step 3: Commit**

```bash
git add frontend/src/components/HangingScroll.jsx
git commit -m "feat: add HangingScroll (kakejiku) stat card component"
```

---

## Task 3: Create the ShojiPanel Component

**Files:**
- Create: `frontend/src/components/ShojiPanel.jsx`

**Step 1: Build the ShojiPanel component**

```jsx
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function ShojiPanel({ icon: Icon, label, description, to, delay = 0 }) {
  return (
    <Link to={to} className="block">
      <motion.div
        className="shoji-frame rounded-sm p-2 relative overflow-hidden group cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ boxShadow: '0 8px 32px rgba(212,168,83,0.15), 0 2px 8px rgba(0,0,0,0.3)' }}
      >
        {/* Inner paper area */}
        <div className="shoji-paper rounded-[2px] relative overflow-hidden h-[160px]">
          {/* Lattice grid overlay */}
          <div className="shoji-lattice" />

          {/* Backlight glow */}
          <div className="shoji-backlight transition-opacity duration-500 opacity-60 group-hover:opacity-100" />

          {/* Default content — icon + label (slides left on hover) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-full z-10">
            {Icon && <Icon size={44} className="text-gold/60" />}
            <span className="font-heading text-sm tracking-widest uppercase text-parchment/80">
              {label}
            </span>
          </div>

          {/* Revealed content — description (slides in from right) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-3 translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 z-10">
            <p className="text-parchment/90 text-sm text-center leading-relaxed font-body">
              {description}
            </p>
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold/70 mt-1">
              Enter
            </span>
          </div>

          {/* Warm light flood on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-amber-400/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </motion.div>
    </Link>
  )
}
```

**Step 2: Verify it renders**

Temporarily import and render a `<ShojiPanel>` in Dashboard.jsx to check the shoji frame, lattice, and sliding hover interaction.

**Step 3: Commit**

```bash
git add frontend/src/components/ShojiPanel.jsx
git commit -m "feat: add ShojiPanel component with sliding door hover reveal"
```

---

## Task 4: Create the InkLandscape Hero Component

**Files:**
- Create: `frontend/src/components/InkLandscape.jsx`

**Step 1: Build the CSS ink-painting landscape component**

```jsx
import { motion } from 'framer-motion'

export default function InkLandscape({ children }) {
  return (
    <div className="relative h-[220px] rounded-sm overflow-hidden mb-8">
      {/* Sky gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1a 40%, #12100c 100%)',
        }}
      />

      {/* Far mountain range */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[55%]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(26,21,16,0.4) 100%)',
          clipPath: 'polygon(0% 60%, 5% 45%, 12% 55%, 20% 30%, 28% 50%, 35% 25%, 42% 40%, 50% 15%, 58% 35%, 65% 20%, 72% 42%, 80% 28%, 88% 45%, 95% 35%, 100% 50%, 100% 100%, 0% 100%)',
          opacity: 0.3,
        }}
      />

      {/* Mid mountain range */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: 'linear-gradient(180deg, rgba(26,21,16,0.5) 0%, rgba(26,21,16,0.8) 100%)',
          clipPath: 'polygon(0% 70%, 8% 50%, 15% 60%, 22% 35%, 30% 55%, 38% 30%, 45% 50%, 52% 25%, 60% 45%, 68% 30%, 75% 50%, 82% 38%, 90% 55%, 100% 40%, 100% 100%, 0% 100%)',
          opacity: 0.5,
        }}
      />

      {/* Torii gate silhouette */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 opacity-20">
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
          <rect x="8" y="0" width="44" height="4" rx="1" fill="#d4a853" />
          <rect x="5" y="4" width="50" height="3" rx="1" fill="#d4a853" opacity="0.8" />
          <rect x="12" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="44" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="12" y="14" width="36" height="2.5" rx="1" fill="#d4a853" opacity="0.5" />
        </svg>
      </div>

      {/* Near ground layer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%]"
        style={{
          background: 'linear-gradient(180deg, rgba(12,10,7,0.6) 0%, #0c0a07 100%)',
          clipPath: 'polygon(0% 50%, 10% 40%, 20% 55%, 35% 30%, 50% 45%, 65% 25%, 80% 45%, 90% 35%, 100% 45%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Drifting mist layer */}
      <div
        className="absolute bottom-[15%] left-0 h-[30%] opacity-[0.07] pointer-events-none"
        style={{
          width: '200%',
          background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.3) 10%, transparent 20%)',
          filter: 'blur(30px)',
          animation: 'mistScroll 60s linear infinite',
        }}
      />

      {/* Gradient fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-bg via-bg/60 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Verify it renders**

Temporarily render `<InkLandscape>` in Dashboard to check the mountain silhouettes, torii gate, and mist scroll animation.

**Step 3: Commit**

```bash
git add frontend/src/components/InkLandscape.jsx
git commit -m "feat: add InkLandscape CSS sumi-e hero component"
```

---

## Task 5: Rewrite Dashboard.jsx

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Replace Dashboard.jsx with the new layout**

Replace the entire contents of `Dashboard.jsx`:

```jsx
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  CompassIcon,
  MapIcon,
  ForgeHammerIcon,
  KatanaIcon,
  ScrollIcon,
  InkBrushIcon,
  HawkIcon,
  BannerIcon,
} from '../components/icons/index'
import InkLandscape from '../components/InkLandscape'
import HangingScroll from '../components/HangingScroll'
import ShojiPanel from '../components/ShojiPanel'

const allTools = [
  {
    label: 'Agent Finder',
    icon: CompassIcon,
    description: 'Upload property lists and find listing agents instantly',
    to: '/agent-finder',
  },
  {
    label: 'FSBO Finder',
    icon: MapIcon,
    description: 'Find For Sale By Owner listings in any city',
    to: '/fsbo-finder',
  },
  {
    label: 'Lead Scrubbing',
    icon: HawkIcon,
    description: 'Deal Sauce walkthrough for finding and scrubbing leads',
    to: '/lead-scrubbing',
  },
  {
    label: 'Free Underwriting',
    icon: ForgeHammerIcon,
    description: 'Submit properties for free underwriting on cash or Sub2 deals',
    to: '/underwriting',
  },
  {
    label: 'LOI Generator',
    icon: ScrollIcon,
    description: 'Generate and send Letters of Intent in bulk',
    to: '/loi-generator',
  },
  {
    label: 'Contract Generator',
    icon: InkBrushIcon,
    description: 'Build, sign, and send contracts in minutes',
    to: '/contract-generator',
  },
  {
    label: 'Direct Agent Process',
    icon: KatanaIcon,
    description: 'Learn our direct-to-agent outreach process',
    to: '/direct-agent',
  },
  {
    label: 'Join Our Team',
    icon: BannerIcon,
    description: 'Cold calling opportunity for experienced closers',
    to: '/join-team',
  },
]

const honorStats = [
  { kanji: '刀', label: 'Active Deals', value: 12 },
  { kanji: '金', label: 'Pipeline Value', value: 2450000, prefix: '$' },
  { kanji: '人', label: 'Agents Found', value: 347 },
  { kanji: '勝', label: 'Deals Closed', value: 8 },
]

export default function Dashboard() {
  const { user } = useAuth()

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'there'

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Zone 1: Ink Landscape Hero */}
      <InkLandscape>
        <motion.h1
          className="font-display text-5xl gold-shimmer-text mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Welcome back, {firstName}-san
        </motion.h1>
        <motion.p
          className="font-heading text-text-dim tracking-wide text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </motion.p>
      </InkLandscape>

      {/* Zone 2: Honor Wall — Hanging Scrolls */}
      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="katana-line flex-1" />
          <h2 className="font-display text-lg text-gold/60 tracking-widest">
            Honor Wall
          </h2>
          <div className="katana-line flex-1" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {honorStats.map((stat, i) => (
            <HangingScroll
              key={stat.label}
              kanji={stat.kanji}
              label={stat.label}
              value={stat.value}
              prefix={stat.prefix || ''}
              suffix={stat.suffix || ''}
              delay={i * 0.15}
            />
          ))}
        </div>
      </div>

      {/* Zone 3: Training Grounds — Shoji Panels */}
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div className="katana-line flex-1" />
          <h2 className="font-display text-lg text-gold/60 tracking-widest">
            Training Grounds
          </h2>
          <div className="katana-line flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {allTools.map((tool, i) => (
            <ShojiPanel
              key={tool.to}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              to={tool.to}
              delay={i * 0.08}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Remove DojoHallScene import**

The new Dashboard.jsx no longer imports `DojoHallScene`. Verify the file `frontend/src/components/three/DojoHallScene.jsx` is no longer imported anywhere else. If not imported elsewhere, leave it in place (don't delete — other pages might reference it later).

**Step 3: Verify the dashboard renders**

Run: `cd frontend && npm run dev`
Open browser, navigate to Dashboard. Verify:
- Ink landscape hero with centered welcome text
- 4 hanging scroll stat cards
- 8 shoji panel tool cards with sliding hover

**Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: rewrite Dashboard with InkLandscape hero, HangingScroll stats, ShojiPanel tools"
```

---

## Task 6: Redesign the Sidebar

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Replace Sidebar.jsx with the refined version**

Replace entire contents:

```jsx
import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LanternIcon,
  CompassIcon,
  MapIcon,
  ForgeHammerIcon,
  AbacusIcon,
  InkBrushIcon,
  SealStampIcon,
  ScrollIcon,
  HawkIcon,
  WarFanIcon,
  BannerIcon,
  MonomiEyeIcon,
  ToriiIcon,
} from '../icons/index'
import { useAuth } from '../context/AuthContext'

const navSections = [
  {
    title: 'Dashboard',
    items: [
      { to: '/', icon: LanternIcon, label: 'Dashboard' },
    ],
  },
  {
    title: 'Lead Generation',
    items: [
      { to: '/agent-finder', icon: CompassIcon, label: 'Agent Finder' },
      { to: '/fsbo-finder', icon: MapIcon, label: 'FSBO Finder' },
      { to: '/lead-scrubbing', icon: ForgeHammerIcon, label: 'Lead Scrubbing' },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { to: '/underwriting', icon: AbacusIcon, label: 'Free Underwriting' },
      { to: '/loi-generator', icon: InkBrushIcon, label: 'LOI Generator' },
      { to: '/contract-generator', icon: SealStampIcon, label: 'Contract Generator' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/scripts', icon: ScrollIcon, label: 'Scripts & Objections' },
      { to: '/direct-agent', icon: HawkIcon, label: 'Direct Agent Process' },
      { to: '/dispo-process', icon: WarFanIcon, label: 'Dispo Process' },
      { to: '/join-team', icon: BannerIcon, label: 'Join Our Team' },
      { to: '/website-explainer', icon: ToriiIcon, label: 'Website Explainer' },
    ],
  },
]

const adminSection = {
  title: 'Admin',
  items: [
    { to: '/admin', icon: MonomiEyeIcon, label: 'Admin Panel' },
  ],
}

export default function Sidebar() {
  const { isAdmin, user } = useAuth()

  const sections = isAdmin
    ? [navSections[0], adminSection, ...navSections.slice(1)]
    : navSections

  const name = user?.name || 'Guest'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[250px] lacquer-deep lacquer-shine z-40 flex flex-col border-r border-gold-dim/15">
      {/* Wordmark */}
      <div className="px-6 pt-8 pb-6 text-center">
        <h1 className="font-display text-3xl gold-shimmer-text tracking-wider">
          DOJO
        </h1>
        <div className="katana-line mt-3" />
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-3 py-2 text-[10px] font-heading tracking-[0.2em] uppercase text-gold-dim/60">
              {section.title}
            </div>
            <div className="mx-3 katana-line mb-2" />

            {section.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                {({ isActive }) => (
                  <motion.div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 transition-colors relative ${
                      isActive
                        ? 'bg-gold/10'
                        : 'hover:bg-gold/5'
                    }`}
                    whileHover={{ x: 6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    {/* Active glow strip */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
                        style={{
                          background: 'linear-gradient(180deg, #d4a853, #f5d078, #d4a853)',
                          boxShadow: '0 0 8px rgba(212,168,83,0.5), 0 0 16px rgba(212,168,83,0.2)',
                        }}
                      />
                    )}
                    <item.icon
                      size={20}
                      className={isActive ? 'text-gold' : 'text-text-dim'}
                    />
                    <span
                      className={`font-heading text-sm tracking-wide ${
                        isActive ? 'text-gold' : 'text-text-dim'
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info at bottom */}
      <div className="px-4 py-4 border-t border-gold-dim/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full hanko-seal flex items-center justify-center text-xs font-heading font-bold text-parchment">
          {initials}
        </div>
        <span className="font-heading text-sm text-text-dim tracking-wide truncate">
          {name}
        </span>
      </div>
    </aside>
  )
}
```

**Step 2: Verify sidebar renders**

Check browser: logo removed, "DOJO" wordmark at top, katana-line dividers, glowing active strip, user info at bottom.

**Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: redesign Sidebar with DOJO wordmark, lacquer surface, glowing active state"
```

---

## Task 7: Redesign the Header

**Files:**
- Modify: `frontend/src/components/Header.jsx`

**Step 1: Replace Header.jsx with centered title layout**

Replace entire contents:

```jsx
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ChevronDown } from 'lucide-react'
import {
  NinjaLantern,
  NinjaTelescope,
  NinjaTracker,
  NinjaForge,
  NinjaScroll,
  NinjaCalligraphy,
  NinjaSeal,
  NinjaTraining,
  NinjaHawk,
  NinjaStrategy,
  NinjaBanner,
  NinjaGuide,
  NinjaSensei,
} from './icons/NinjaLogos'

const routeTitles = {
  '/': 'Dashboard',
  '/agent-finder': 'Agent Finder',
  '/fsbo-finder': 'FSBO Finder',
  '/lead-scrubbing': 'Lead Scrubbing',
  '/underwriting': 'Underwriting',
  '/loi-generator': 'LOI Generator',
  '/contract-generator': 'Contract Generator',
  '/scripts': 'Scripts & Objections',
  '/direct-agent': 'Direct to Agent',
  '/dispo-process': 'Dispo Process',
  '/join-team': 'Join the Team',
  '/website-explainer': 'Website Explainer',
  '/admin': 'Admin Dashboard',
}

const routeLogos = {
  '/': NinjaLantern,
  '/agent-finder': NinjaTelescope,
  '/fsbo-finder': NinjaTracker,
  '/lead-scrubbing': NinjaForge,
  '/underwriting': NinjaScroll,
  '/loi-generator': NinjaCalligraphy,
  '/contract-generator': NinjaSeal,
  '/scripts': NinjaTraining,
  '/direct-agent': NinjaHawk,
  '/dispo-process': NinjaStrategy,
  '/join-team': NinjaBanner,
  '/website-explainer': NinjaGuide,
  '/admin': NinjaSensei,
}

const routeKanji = {
  '/': '道場',
  '/agent-finder': '探',
  '/fsbo-finder': '狩',
  '/lead-scrubbing': '鍛',
  '/underwriting': '巻',
  '/loi-generator': '筆',
  '/contract-generator': '印',
  '/scripts': '修',
  '/direct-agent': '鷹',
  '/dispo-process': '略',
  '/join-team': '募',
  '/website-explainer': '案',
  '/admin': '師',
}

const routeSections = {
  '/agent-finder': 'Lead Generation',
  '/fsbo-finder': 'Lead Generation',
  '/lead-scrubbing': 'Lead Generation',
  '/underwriting': 'Deal Management',
  '/loi-generator': 'Deal Management',
  '/contract-generator': 'Deal Management',
  '/scripts': 'Resources',
  '/direct-agent': 'Resources',
  '/dispo-process': 'Resources',
  '/join-team': 'Resources',
  '/website-explainer': 'Resources',
  '/admin': 'Admin',
}

export default function Header() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname
  const title = routeTitles[path] || 'Dispo Dojo'
  const NinjaLogo = routeLogos[path]
  const kanji = routeKanji[path]
  const section = routeSections[path]
  const name = user?.name || 'Guest'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="lacquer-bar px-6 py-3 flex items-center justify-between relative overflow-hidden lacquer-shine">
      {/* Kanji watermark behind title */}
      {kanji && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[80px] font-display text-gold/[0.04] pointer-events-none select-none">
          {kanji}
        </span>
      )}

      {/* Left: breadcrumb */}
      <div className="relative z-10 min-w-[120px]">
        {section && (
          <span className="font-heading text-xs text-text-dim/60 tracking-wider">
            {section}
          </span>
        )}
      </div>

      {/* Center: Ninja logo + Page title */}
      <div className="flex items-center gap-3 relative z-10">
        {NinjaLogo && <NinjaLogo size={44} />}
        <h1 className="font-display text-2xl text-parchment brush-underline">
          {title}
        </h1>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-3 relative z-10 min-w-[120px] justify-end">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-heading font-bold text-parchment"
          style={{
            background: 'linear-gradient(135deg, #6b1a1a 0%, #8b0000 40%, #a83232 100%)',
            border: '1.5px solid rgba(196, 58, 79, 0.4)',
            boxShadow: '0 0 10px -3px rgba(139, 34, 50, 0.5)',
            borderRadius: '48% 52% 50% 50% / 50% 48% 52% 50%',
          }}
        >
          {initials}
        </div>
        <span className="font-heading text-sm text-text-dim tracking-wide hidden md:block">
          {name}
        </span>
        <ChevronDown size={14} className="text-text-dim" />
      </div>

      {/* Bottom divider — thinner gold shimmer */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] gold-shimmer opacity-70" />
    </header>
  )
}
```

**Step 2: Verify header renders**

Check browser: title centered, breadcrumb on left, refined hanko seal on right, thinner bottom shimmer line.

**Step 3: Commit**

```bash
git add frontend/src/components/Header.jsx
git commit -m "feat: redesign Header with centered title, breadcrumb, refined hanko seal"
```

---

## Task 8: Update Atmospheric Components

**Files:**
- Modify: `frontend/src/components/Layout.jsx`
- Modify: `frontend/src/components/EmberField.jsx`
- Modify: `frontend/src/components/TorchLight.jsx`

**Step 1: Update Layout.jsx — add wall texture, reposition torches**

In `Layout.jsx`, change the outer div class from `"min-h-screen bg-bg ink-wash"` to `"min-h-screen bg-bg ink-wash wall-texture"`.

Update the `TorchLight` positions to flank the hero area:

```jsx
<TorchLight
  positions={[
    { top: '2%', left: '25%' },
    { top: '2%', right: '5%' },
  ]}
  intensity={0.5}
/>
```

Update `EmberField` density from 25 to 20:

```jsx
<EmberField density={20} />
```

**Step 2: Update EmberField.jsx — increase glow quality**

In `EmberField.jsx`, change the particle creation to use larger glow:
- Line 36: Change `size: Math.random() * 1.5 + 1.5` to `size: Math.random() * 2 + 1.5` (1.5 - 3.5px)
- Line 69: Change `ctx.shadowBlur = 4` to `ctx.shadowBlur = 8`

Also change the default color to a warmer tone:
- Line 12: Change `color = { r: 232, g: 140, b: 46 }` to `color = { r: 235, g: 160, b: 60 }`

**Step 3: Verify atmosphere**

Check browser: wall texture visible on background, torches flanking top area, fewer but more prominent embers.

**Step 4: Commit**

```bash
git add frontend/src/components/Layout.jsx frontend/src/components/EmberField.jsx frontend/src/components/TorchLight.jsx
git commit -m "feat: refine atmosphere — wall texture, repositioned torches, improved ember quality"
```

---

## Task 9: Visual Polish Pass

**Files:**
- Modify: `frontend/src/index.css` (minor tweaks)

**Step 1: Refine the gold shimmer animation speed**

In `index.css`, change the shimmer animation duration. Find `animation: shimmer 3s linear infinite;` (appears twice — in `.gold-shimmer` and `.gold-shimmer-text`) and change both to `animation: shimmer 4s linear infinite;` for a more subtle, refined sweep.

**Step 2: Clean up unused CSS**

The `.metal-bracket` styles (lines ~177-213) are no longer used by the Dashboard. However, `WoodPanel.jsx` still has `withBrackets`. Leave the CSS in place for now — other pages may still use WoodPanel with brackets.

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds, no errors.

**Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: slow gold shimmer animation for more refined sweep"
```

---

## Task 10: Final Integration Test

**Step 1: Run dev server and test full flow**

Run: `cd frontend && npm run dev`

Verify each area:
- [ ] Hero banner: ink landscape with centered welcome text, mountain silhouettes, torii gate, drifting mist
- [ ] Honor Wall: 4 hanging scroll stat cards with wooden dowels, parchment bodies, kanji watermarks, rope ties
- [ ] Training Grounds: 8 shoji panels with wooden frames, lattice pattern, sliding door hover reveal
- [ ] Sidebar: "DOJO" wordmark, no logo image, lacquered dark surface, katana dividers, glowing active state, user info at bottom
- [ ] Header: centered page title with ninja logo, breadcrumb on left, refined hanko seal on right
- [ ] Atmosphere: wall texture on background, repositioned torches, improved embers, warm mist

**Step 2: Test navigation**

Click each shoji panel tool card — verify navigation works and header updates with correct title, kanji, breadcrumb, and ninja logo.

**Step 3: Test responsive**

Resize browser to check:
- Stat scrolls: 4 columns → 2 columns on small screens
- Shoji panels: 3 columns → 2 → 1 on small screens
- Sidebar and header remain functional

**Step 4: Run production build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors or warnings.

**Step 5: Final commit**

If any fixes were needed during testing, commit them:

```bash
git add -A
git commit -m "fix: address visual polish issues from integration testing"
```
