# Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the novelty-themed dashboard (hanging scrolls, ink landscape, shoji panels) with a premium modern SaaS layout matching the reference image.

**Architecture:** Full rewrite of Dashboard.jsx + two new leaf components (KpiCard, ToolCard). shadcn/ui Card and Button as base primitives, overridden with dojo theme tokens. All existing pages/components untouched.

**Tech Stack:** React 19, Tailwind CSS v4, shadcn/ui (Card, Button, Badge), Framer Motion, lucide-react, react-countup

---

### Task 1: Remap shadcn CSS variables to dojo palette

**Files:**
- Modify: `frontend/src/index.css` (lines 730-797 — the `:root` and `.dark` blocks)

**Step 1: Replace the `:root` CSS variables**

Replace the `:root { ... }` block (lines 730-763) with dojo-themed values. The app doesn't use light/dark toggle — it's always dark — so set `:root` directly:

```css
:root {
  --radius: 0.75rem;
  --background: #06060f;
  --foreground: #ede9e3;
  --card: #0d0d1a;
  --card-foreground: #ede9e3;
  --popover: #0d0d1a;
  --popover-foreground: #ede9e3;
  --primary: #d4a853;
  --primary-foreground: #06060f;
  --secondary: #1a1a2e;
  --secondary-foreground: #ede9e3;
  --muted: #1a1a2e;
  --muted-foreground: #8a8578;
  --accent: #1a1a2e;
  --accent-foreground: #ede9e3;
  --destructive: #8b0000;
  --border: rgba(212, 168, 83, 0.12);
  --input: rgba(212, 168, 83, 0.15);
  --ring: #d4a853;
  --chart-1: #d4a853;
  --chart-2: #4a7c59;
  --chart-3: #4a6fa5;
  --chart-4: #8b0000;
  --chart-5: #e8652e;
  --sidebar: #0a0a14;
  --sidebar-foreground: #ede9e3;
  --sidebar-primary: #d4a853;
  --sidebar-primary-foreground: #06060f;
  --sidebar-accent: #1a1a2e;
  --sidebar-accent-foreground: #ede9e3;
  --sidebar-border: rgba(212, 168, 83, 0.1);
  --sidebar-ring: #d4a853;
}
```

**Step 2: Remove the `.dark` block**

Delete lines 765-797 (the `.dark { ... }` block). Not needed — the app is always "dark" via `:root`.

**Step 3: Verify build**

Run: `cd frontend && npm run build`
Expected: Build succeeds, no CSS errors.

**Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: remap shadcn CSS variables to dojo palette"
```

---

### Task 2: Create KpiCard component

**Files:**
- Create: `frontend/src/components/KpiCard.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Card, CardContent } from '@/components/ui/card'

export default function KpiCard({ label, value, prefix = '', suffix = '', delta, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card className="group relative overflow-hidden border-[rgba(212,168,83,0.12)] bg-[#0d0d1a] transition-transform transition-shadow duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <CardContent className="p-6">
          <p className="font-body text-[13px] uppercase tracking-wider text-[#8a8578] mb-3">
            {label}
          </p>
          <p className="font-heading text-4xl font-bold text-[#ede9e3] tracking-tight">
            {prefix}
            <CountUp
              end={value}
              duration={2}
              separator=","
              preserveValue
            />
            {suffix}
          </p>
          {delta && (
            <p className={`mt-2 text-xs font-body ${delta.startsWith('+') || delta.startsWith('▲') ? 'text-[#4a7c59]' : 'text-[#a83232]'}`}>
              {delta}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/KpiCard.jsx
git commit -m "feat: add KpiCard component for dashboard"
```

---

### Task 3: Create ToolCard component

**Files:**
- Create: `frontend/src/components/ToolCard.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ToolCard({ icon: Icon, label, description, to, delay = 0 }) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <Card
        onClick={() => navigate(to)}
        className="group relative cursor-pointer overflow-hidden border-[rgba(212,168,83,0.12)] bg-[#0d0d1a] transition-transform transition-shadow duration-200 ease-out hover:-translate-y-0.5 hover:border-[rgba(212,168,83,0.25)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[rgba(212,168,83,0.08)]">
            <Icon className="h-5 w-5 text-[#d4a853]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[15px] font-semibold text-[#ede9e3] tracking-wide">
              {label}
            </p>
            <p className="font-body text-[12px] text-[#8a8578] leading-relaxed line-clamp-1">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-[#d4a853] hover:text-[#f5d078] hover:bg-[rgba(212,168,83,0.08)] font-heading text-[13px] tracking-wide"
            onClick={(e) => {
              e.stopPropagation()
              navigate(to)
            }}
          >
            Open
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/components/ToolCard.jsx
git commit -m "feat: add ToolCard component for dashboard"
```

---

### Task 4: Rewrite Dashboard.jsx

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx` (full rewrite)

**Step 1: Replace Dashboard.jsx entirely**

The new dashboard has 3 sections:
1. Welcome header with name, date, 2 CTA buttons
2. KPI row (3 cards)
3. Tools to Succeed grid (2-col, 8 cards)

```jsx
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  Compass,
  Map,
  Bird,
  Hammer,
  ScrollText,
  PenTool,
  Sword,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import KpiCard from '../components/KpiCard'
import ToolCard from '../components/ToolCard'

/* ── Seed data ─────────────────────────────────── */

const kpis = [
  { label: 'Active Deals', value: 27, delta: '▲ 5 this week' },
  { label: 'Pipeline Value', value: 3250000, prefix: '$', delta: '+$500k this week' },
  { label: 'Deals Closed', value: 9, delta: '▲ 3 this week' },
]

const tools = [
  {
    label: 'Agent Finder',
    icon: Compass,
    description: 'Upload property lists and find listing agents instantly',
    to: '/agent-finder',
  },
  {
    label: 'FSBO Finder',
    icon: Map,
    description: 'Find For Sale By Owner listings in any city',
    to: '/fsbo-finder',
  },
  {
    label: 'Lead Scrubbing',
    icon: Bird,
    description: 'Deal Sauce walkthrough for finding and scrubbing leads',
    to: '/lead-scrubbing',
  },
  {
    label: 'Free Underwriting',
    icon: Hammer,
    description: 'Submit properties for free underwriting on cash or Sub2 deals',
    to: '/underwriting',
  },
  {
    label: 'LOI Generator',
    icon: ScrollText,
    description: 'Generate and send Letters of Intent in bulk',
    to: '/loi-generator',
  },
  {
    label: 'Contact Generator',
    icon: PenTool,
    description: 'Build, sign, and send contracts in minutes',
    to: '/contract-generator',
  },
  {
    label: 'Direct Agent Process',
    icon: Sword,
    description: 'Learn our direct-to-agent outreach process',
    to: '/direct-agent',
  },
  {
    label: 'Join Our Team',
    icon: Users,
    description: 'Cold calling opportunity for experienced closers',
    to: '/join-team',
  },
]

/* ── Component ─────────────────────────────────── */

export default function Dashboard() {
  const { user } = useAuth()

  const firstName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Guest'

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8">

      {/* ── Welcome Header ──────────────────────── */}
      <motion.section
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-4xl gold-shimmer-text mb-1">
          Welcome back, {firstName}-san
        </h1>
        <p className="font-body text-sm text-[#8a8578] mb-6">{today}</p>
        <div className="flex gap-3">
          <Button
            className="font-heading tracking-wide bg-[#d4a853] text-[#06060f] hover:bg-[#f5d078] shadow-[0_0_16px_rgba(212,168,83,0.25)] hover:shadow-[0_0_24px_rgba(212,168,83,0.4)] transition-shadow duration-200"
          >
            Submit a Deal
          </Button>
          <Button
            variant="outline"
            className="font-heading tracking-wide border-[rgba(212,168,83,0.25)] text-[#d4a853] hover:bg-[rgba(212,168,83,0.08)] hover:text-[#f5d078]"
          >
            View Dispo Pipeline
          </Button>
        </div>
      </motion.section>

      {/* ── KPI Row ─────────────────────────────── */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              prefix={kpi.prefix || ''}
              delta={kpi.delta}
              delay={i * 0.1}
            />
          ))}
        </div>
      </section>

      {/* ── Tools to Succeed ────────────────────── */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="katana-line flex-1" />
          <h2 className="font-display text-lg text-[rgba(212,168,83,0.6)] tracking-widest whitespace-nowrap">
            Tools to Succeed
          </h2>
          <div className="katana-line flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool, i) => (
            <ToolCard
              key={tool.to}
              icon={tool.icon}
              label={tool.label}
              description={tool.description}
              to={tool.to}
              delay={i * 0.05}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
```

**Step 2: Verify build**

Run: `cd frontend && npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: redesign dashboard — modern SaaS layout with KPI cards and tool grid"
```

---

### Task 5: Visual QA — screenshot and verify against reference

**Step 1: Start dev server**

Run: `cd frontend && npm run dev` (background)

**Step 2: Screenshot the dashboard**

Open browser to `http://localhost:3000` and take a screenshot.
Compare against `Dashboard Example.png`:

Checklist:
- [ ] Welcome header: heading, date, two buttons visible and readable
- [ ] KPI cards: 3 cards in a row, big numbers, labels, deltas
- [ ] Tools grid: 2-column, 8 cards, icon + title + description + Open button
- [ ] Typography: Onari for headings, DM Sans for body, Rajdhani for numbers
- [ ] Colors: dark navy bg, gold accents, readable text contrast
- [ ] Spacing: consistent 8px-grid alignment
- [ ] Cards: same radius, border style, shadow depth
- [ ] Hover states work (lift + border brighten)

**Step 3: Fix any visual issues found**

Address mismatches from the checklist.

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: visual QA polish for dashboard redesign"
```

---

### Task 6: Responsive QA — verify mobile layout

**Step 1: Test at mobile viewport (375px width)**

Verify:
- [ ] KPIs stack to single column
- [ ] Tools stack to single column
- [ ] Welcome header wraps cleanly
- [ ] Buttons don't overflow
- [ ] Text remains readable at all breakpoints

**Step 2: Test at tablet viewport (768px width)**

Verify:
- [ ] KPIs show 3-col
- [ ] Tools show 2-col

**Step 3: Fix any responsive issues**

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: responsive layout polish for dashboard"
```
