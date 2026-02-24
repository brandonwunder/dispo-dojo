# Find Buyers + Community Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Delete the FSBO scraper and Dispo Process page, build a "Find Buyers" page under Deal Management with a JV agreement signing flow, and build a "Community" page under Dashboard with Firebase-backed real-time channels, threads, and messaging.

**Architecture:** React 19 + React Router 7 frontend. Find Buyers is a static page with a multi-step modal wizard (JV signing + contract upload + Discord webhook). Community is a Firebase Firestore-backed real-time chat system with channels, threads, user profiles, and emoji support. Auth uses the existing localStorage-based AuthContext initially, with Firebase Auth layered in for Community.

**Tech Stack:** React 19, React Router 7, Framer Motion, Tailwind CSS v4, Lucide icons, Firebase (Firestore + Auth), jspdf (PDF generation), existing WoodPanel/design system components.

---

## Phase 1: FSBO & Dispo Deletion + Navigation Cleanup

### Task 1: Delete Backend FSBO Files

**Files:**
- Delete: `agent_finder/scrapers/fsbo_base.py`
- Delete: `agent_finder/scrapers/fsbo_com.py`
- Delete: `agent_finder/scrapers/forsalebyowner_com.py`
- Delete: `agent_finder/scrapers/zillow_fsbo.py`
- Delete: `agent_finder/scrapers/realtor_fsbo.py`
- Delete: `agent_finder/scrapers/craigslist_fsbo.py`
- Delete: `agent_finder/data/craigslist_areas.json`
- Delete: `agent_finder/data/fsbo.db`

**Step 1: Delete all FSBO scraper files**

```bash
rm agent_finder/scrapers/fsbo_base.py
rm agent_finder/scrapers/fsbo_com.py
rm agent_finder/scrapers/forsalebyowner_com.py
rm agent_finder/scrapers/zillow_fsbo.py
rm agent_finder/scrapers/realtor_fsbo.py
rm agent_finder/scrapers/craigslist_fsbo.py
rm agent_finder/data/craigslist_areas.json
rm agent_finder/data/fsbo.db
```

**Step 2: Check for fsbo_models.py and delete if present**

```bash
ls agent_finder/fsbo_models.py 2>/dev/null && rm agent_finder/fsbo_models.py
```

**Step 3: Clean FSBO config entries from `agent_finder/config.py`**

Remove these blocks from config.py:
- `FSBO_COM = SourceConfig(...)` (lines 79-85)
- `FORSALEBYOWNER_COM = SourceConfig(...)` (lines 87-93)
- `ZILLOW_FSBO = SourceConfig(...)` (lines 95-101)
- `REALTOR_FSBO = SourceConfig(...)` (lines 103-109)
- `CRAIGSLIST_FSBO = SourceConfig(...)` (lines 111-117)
- `FSBO_CACHE_TTL_HOURS = 24` (line 120)
- `FSBO_MAX_PAGES = 5` (line 121)

**Step 4: Remove FSBO imports from `agent_finder/scrapers/__init__.py`**

Grep for any FSBO imports and remove them.

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: delete FSBO scraper backend (all scrapers, models, data, config)"
```

---

### Task 2: Delete Frontend FSBO + Dispo Pages

**Files:**
- Delete: `frontend/src/pages/FSBOFinder.jsx`
- Delete: `frontend/src/pages/DispoProcess.jsx`

**Step 1: Delete the page files**

```bash
rm frontend/src/pages/FSBOFinder.jsx
rm frontend/src/pages/DispoProcess.jsx
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: delete FSBOFinder and DispoProcess pages"
```

---

### Task 3: Update App.jsx Routing

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Remove FSBO + Dispo imports and routes, add Find Buyers + Community**

Replace the full file content. Remove:
- `import FSBOFinder from './pages/FSBOFinder'` (line 8)
- `import DispoProcess from './pages/DispoProcess'` (line 16)
- `<Route path="fsbo-finder" element={<FSBOFinder />} />` (line 51)
- `<Route path="dispo-process" element={<DispoProcess />} />` (line 59)

Add:
- `import FindBuyers from './pages/FindBuyers'`
- `import Community from './pages/Community'`
- `<Route path="find-buyers" element={<FindBuyers />} />`
- `<Route path="community" element={<Community />} />`

Final App.jsx imports section:
```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import AdminDashboard from './pages/AdminDashboard'
import AgentFinder from './pages/AgentFinder'
import LeadScrubbing from './pages/LeadScrubbing'
import Underwriting from './pages/Underwriting'
import LOIGenerator from './pages/LOIGenerator'
import ContractGenerator from './pages/ContractGenerator'
import DirectAgent from './pages/DirectAgent'
import Scripts from './pages/Scripts'
import WebsiteExplainer from './pages/WebsiteExplainer'
import FindBuyers from './pages/FindBuyers'
import Community from './pages/Community'
```

Final Routes:
```jsx
<Route index element={<Dashboard />} />
<Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="agent-finder" element={<AgentFinder />} />
<Route path="lead-scrubbing" element={<LeadScrubbing />} />
<Route path="underwriting" element={<Underwriting />} />
<Route path="loi-generator" element={<LOIGenerator />} />
<Route path="contract-generator" element={<ContractGenerator />} />
<Route path="direct-agent" element={<DirectAgent />} />
<Route path="scripts" element={<Scripts />} />
<Route path="website-explainer" element={<WebsiteExplainer />} />
<Route path="find-buyers" element={<FindBuyers />} />
<Route path="community" element={<Community />} />
```

**Step 2: Create placeholder FindBuyers.jsx**

```jsx
// frontend/src/pages/FindBuyers.jsx
export default function FindBuyers() {
  return <div className="p-8 text-parchment">Find Buyers — coming soon</div>
}
```

**Step 3: Create placeholder Community.jsx**

```jsx
// frontend/src/pages/Community.jsx
export default function Community() {
  return <div className="p-8 text-parchment">Community — coming soon</div>
}
```

**Step 4: Verify dev server compiles**

```bash
cd frontend && npm run dev
```

Expected: No import errors, app compiles cleanly.

**Step 5: Commit**

```bash
git add -A && git commit -m "chore: update routing — remove FSBO/Dispo, add FindBuyers/Community placeholders"
```

---

### Task 4: Update Sidebar Navigation

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Update navSections array**

Remove:
- FSBO Finder from Lead Generation: `{ to: '/fsbo-finder', icon: MapIcon, label: 'FSBO Finder' }`
- Dispo Process from Resources: `{ to: '/dispo-process', icon: WarFanIcon, label: 'Dispo Process' }`

Add:
- Community under Dashboard: `{ to: '/community', icon: ShurikenIcon, label: 'Community' }`
- Find Buyers to Deal Management: `{ to: '/find-buyers', icon: WarFanIcon, label: 'Find Buyers' }`

Update the imports line to add `ShurikenIcon` and remove `MapIcon`:
```jsx
import {
  LanternIcon,
  CompassIcon,
  ForgeHammerIcon,
  AbacusIcon,
  InkBrushIcon,
  SealStampIcon,
  ScrollIcon,
  HawkIcon,
  WarFanIcon,
  MonomiEyeIcon,
  ToriiIcon,
  ShurikenIcon,
} from '../icons/index'
```

Final navSections:
```jsx
const navSections = [
  {
    title: 'Dashboard',
    items: [
      { to: '/', icon: LanternIcon, label: 'Dashboard' },
      { to: '/community', icon: ShurikenIcon, label: 'Community' },
    ],
  },
  {
    title: 'Lead Generation',
    items: [
      { to: '/agent-finder', icon: CompassIcon, label: 'Listing Agent Finder' },
      { to: '/lead-scrubbing', icon: ForgeHammerIcon, label: 'Lead Scrubbing' },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { to: '/underwriting', icon: AbacusIcon, label: 'Free Underwriting' },
      { to: '/loi-generator', icon: InkBrushIcon, label: 'LOI Generator' },
      { to: '/contract-generator', icon: SealStampIcon, label: 'Contract Generator' },
      { to: '/find-buyers', icon: WarFanIcon, label: 'Find Buyers' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/scripts', icon: ScrollIcon, label: 'Scripts & Objections' },
      { to: '/direct-agent', icon: HawkIcon, label: 'Direct Agent Process' },
      { to: '/website-explainer', icon: ToriiIcon, label: 'Website Explainer' },
    ],
  },
]
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: update sidebar — remove FSBO/Dispo, add Community + Find Buyers"
```

---

### Task 5: Update Header.jsx

**Files:**
- Modify: `frontend/src/components/Header.jsx`

**Step 1: Remove FSBO + Dispo entries, add Find Buyers + Community**

In routeTitles, remove `/fsbo-finder` and `/dispo-process`, add:
```jsx
'/find-buyers': 'Find Buyers',
'/community': 'Community',
```

In routeLogos, remove `/fsbo-finder` (NinjaTracker) and `/dispo-process` (NinjaStrategy), add:
```jsx
'/find-buyers': NinjaStrategy,
'/community': NinjaLantern,
```

Note: Reuse NinjaStrategy for Find Buyers (it was the Dispo logo — buyer network vibe). Reuse NinjaLantern for Community (gathering/light vibe). Import both if not already imported.

In routeKanji, remove `/fsbo-finder` and `/dispo-process`, add:
```jsx
'/find-buyers': '売',   // sell/buyer
'/community': '衆',     // community/people
```

In routeSections, remove `/fsbo-finder` and `/dispo-process`, add:
```jsx
'/find-buyers': 'Deal Management',
'/community': 'Dashboard',
```

**Step 2: Remove unused NinjaTracker import if it was only used for FSBO**

Check if NinjaTracker is used elsewhere. If not, remove from import.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: update Header — remove FSBO/Dispo entries, add Find Buyers/Community"
```

---

### Task 6: Update Dashboard.jsx Tool Cards

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Remove FSBO tool card, add Find Buyers**

In the `tools` array (line 18-61), remove:
```jsx
{
  label: 'FSBO Finder',
  icon: MapPinned,
  description: 'Find For Sale By Owner listings in any city',
  to: '/fsbo-finder',
},
```

Add Find Buyers card:
```jsx
{
  label: 'Find Buyers',
  icon: Users,
  description: 'Access our nationwide buyer network for your deals',
  to: '/find-buyers',
},
```

Add `Users` to the Lucide imports:
```jsx
import { ScanSearch, Sparkles, TrendingUp, Send, FileCheck2, Crosshair, Users } from 'lucide-react'
```

Remove `MapPinned` from imports since it's no longer used.

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: update Dashboard — replace FSBO card with Find Buyers"
```

---

### Task 7: Update DirectAgent.jsx Tool Links

**Files:**
- Modify: `frontend/src/pages/DirectAgent.jsx`

**Step 1: Remove FSBO tool link from tools array**

Remove (around line 77-81):
```jsx
{
  to: '/fsbo-finder',
  icon: Home,
  name: 'FSBO Finder',
  desc: 'Discover For Sale By Owner opportunities',
},
```

Remove `Home` from Lucide imports if not used elsewhere in the file.

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: update DirectAgent — remove FSBO tool link"
```

---

## Phase 2: Find Buyers Page

### Task 8: Build FindBuyers.jsx — Hero + Platform Cards

**Files:**
- Modify: `frontend/src/pages/FindBuyers.jsx` (replace placeholder)

**Step 1: Build the hero header and platform engine cards**

The page structure follows the existing DispoProcess pattern (which we're replacing). Carry over the `platforms` data array from the deleted DispoProcess.jsx. Use WoodPanel, Framer Motion, and the established design system.

```jsx
// frontend/src/pages/FindBuyers.jsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Rocket, Crown, Globe, Users, Lock, Upload, Download, Check,
  ArrowRight, ShieldCheck, Zap, Target, TrendingUp,
  Building2, Home, Hotel, Landmark, FileText, X,
} from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const platforms = [
  {
    name: 'InvestorLift',
    icon: Rocket,
    description: 'The #1 disposition platform for wholesalers. Connects you to a nationwide network of verified cash buyers with proof of funds, instant deal blasting, and built-in buyer scoring.',
    highlight: 'Nationwide verified buyer network',
  },
  {
    name: 'InvestorBase',
    icon: Users,
    description: 'A curated database of active real estate investors. Access buyer profiles, transaction history, and preferences to match your deals with the right buyers instantly.',
    highlight: 'Curated investor database',
  },
  {
    name: 'CreativeListing.com',
    icon: Globe,
    description: 'A marketplace built specifically for creative finance deals — Sub-To, seller finance, wraps, and more. Reach buyers who understand and actively seek creative deal structures.',
    highlight: 'Creative finance marketplace',
  },
  {
    name: 'Private Buyer Lists & Groups',
    icon: Crown,
    description: 'Our proprietary, hand-curated lists of active buyers built from years of deal flow, plus private buyer groups. These are buyers who have closed with us and are ready to move fast.',
    highlight: 'Exclusive proprietary lists',
  },
]

const buyerTypes = [
  { icon: Building2, type: 'Section 8 Investors', description: 'Buyers looking for government-subsidized rental income with guaranteed payments.', conventional: true },
  { icon: Hotel, type: 'Short-Term Rental (STR)', description: 'Airbnb and VRBO operators seeking properties in high-demand tourist or metro areas.', conventional: true },
  { icon: Home, type: 'Mid-Term Rental (MTR)', description: 'Furnished rentals for traveling nurses, corporate housing, and 30-90 day stays.', conventional: true },
  { icon: Landmark, type: 'Long-Term Rental (LTR)', description: 'Traditional buy-and-hold investors looking for steady cash flow with 12+ month leases.', conventional: true },
  { icon: Zap, type: 'Fix & Flip Investors', description: 'Buyers who renovate and resell for profit. Quick closers who want deep discounts.', conventional: false },
  { icon: Target, type: 'Novation Buyers', description: 'Investors who purchase through novation agreements — a non-conventional strategy most wholesalers miss.', conventional: false },
  { icon: TrendingUp, type: 'Creative Finance Buyers', description: 'Buyers specifically looking for Sub-To, seller finance, and wrap deals. They pay MORE because of favorable terms.', conventional: false },
  { icon: ShieldCheck, type: 'Land Trust Investors', description: 'Sophisticated buyers who acquire through land trusts for asset protection and privacy.', conventional: false },
]

// ~15 rows of fake buyer data for the blurred table
const fakeBuyers = [
  { name: 'J. Martinez', state: 'TX', buyBox: '$80k–$150k', types: 'SFR, Duplex', lastActive: '2 days ago' },
  { name: 'R. Thompson', state: 'FL', buyBox: '$120k–$250k', types: 'SFR, Triplex', lastActive: '1 day ago' },
  { name: 'A. Patel', state: 'GA', buyBox: '$60k–$110k', types: 'SFR', lastActive: '5 hours ago' },
  { name: 'M. Williams', state: 'OH', buyBox: '$40k–$90k', types: 'SFR, Multi', lastActive: '3 days ago' },
  { name: 'S. Chen', state: 'CA', buyBox: '$200k–$400k', types: 'Multi, Commercial', lastActive: '1 day ago' },
  { name: 'D. Johnson', state: 'NC', buyBox: '$90k–$180k', types: 'SFR, Land', lastActive: '12 hours ago' },
  { name: 'K. Brown', state: 'TN', buyBox: '$70k–$130k', types: 'SFR, Duplex', lastActive: '4 days ago' },
  { name: 'L. Davis', state: 'AZ', buyBox: '$100k–$200k', types: 'SFR', lastActive: '6 hours ago' },
  { name: 'T. Wilson', state: 'MI', buyBox: '$30k–$75k', types: 'SFR, Multi', lastActive: '2 days ago' },
  { name: 'N. Garcia', state: 'IL', buyBox: '$50k–$120k', types: 'SFR, Duplex', lastActive: '1 day ago' },
  { name: 'P. Anderson', state: 'PA', buyBox: '$80k–$160k', types: 'SFR', lastActive: '8 hours ago' },
  { name: 'C. Taylor', state: 'IN', buyBox: '$45k–$95k', types: 'SFR, Land', lastActive: '3 days ago' },
  { name: 'B. Jackson', state: 'MO', buyBox: '$55k–$110k', types: 'SFR, Multi', lastActive: '2 days ago' },
  { name: 'E. White', state: 'SC', buyBox: '$70k–$140k', types: 'SFR', lastActive: '5 days ago' },
  { name: 'W. Harris', state: 'AL', buyBox: '$40k–$85k', types: 'SFR, Duplex', lastActive: '1 day ago' },
]

export default function FindBuyers() {
  const [showJVModal, setShowJVModal] = useState(false)
  const conventionalBuyers = buyerTypes.filter((b) => b.conventional)
  const nonConventionalBuyers = buyerTypes.filter((b) => !b.conventional)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="max-w-[1000px] mx-auto"
    >
      <div className="relative parchment-texture rounded-sm border border-gold-dim/20 px-6 sm:px-10 py-10">
        {/* Hero Header */}
        <div className="mb-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users size={28} className="text-gold" />
            <h1 className="font-display text-4xl text-gold tracking-[0.06em]">
              Our Buyers Network
            </h1>
          </div>
          <p className="font-heading tracking-wide text-text-dim text-base max-w-2xl mx-auto leading-relaxed">
            You bring the contract. We activate every channel we have.{' '}
            <span className="text-gold font-semibold">
              This is what we do.
            </span>
          </p>
        </div>

        {/* Key advantage banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-10">
          <WoodPanel glow headerBar="Our Edge">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center shrink-0">
                <Crown size={20} className="text-white" />
              </div>
              <div>
                <p className="font-heading text-sm font-semibold tracking-wide text-gold mb-0.5">
                  Dispo Is What We're Known For
                </p>
                <p className="text-sm text-text-dim">
                  We don't post and pray. When you bring us a deal under contract, we activate InvestorLift, InvestorBase, CreativeListing, our private buyer lists, and our private buyer groups — all at once. Your deal gets maximum exposure to qualified, ready-to-close buyers.
                </p>
              </div>
            </div>
          </WoodPanel>
        </motion.div>

        <div className="katana-line mb-10" />

        {/* Platform Engine Cards */}
        <div className="mb-10">
          <h2 className="font-display text-2xl text-gold tracking-[0.06em] mb-1 text-center">
            Our Disposition Engines
          </h2>
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mt-3 mb-5 text-center">
            Every deal gets pushed through all of these channels simultaneously
          </p>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <motion.div key={platform.name} variants={cardVariants}>
                <WoodPanel className="h-full">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center">
                      <platform.icon size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-semibold tracking-wide text-parchment">{platform.name}</h3>
                      <p className="text-[11px] text-gold">{platform.highlight}</p>
                    </div>
                  </div>
                  <p className="text-sm text-text-dim leading-relaxed">{platform.description}</p>
                </WoodPanel>
              </motion.div>
            ))}
          </motion.div>
        </div>

        <div className="katana-line mb-10" />

        {/* Buyer Types */}
        <div className="mb-10">
          <h2 className="font-display text-2xl text-gold tracking-[0.06em] mb-1 text-center">Who We Sell To</h2>
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mt-3 mb-5 text-center">
            Our buyer network spans both conventional and non-conventional investor types
          </p>

          {/* Conventional */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-text-muted" />
              <h3 className="font-heading text-[11px] font-semibold tracking-[0.18em] text-text-muted uppercase">Conventional Buyers</h3>
              <span className="text-[10px] text-text-muted px-2 py-0.5 rounded-full border border-gold-dim/[0.15]">What everyone sells to</span>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conventionalBuyers.map((buyer) => (
                <motion.div key={buyer.type} variants={cardVariants}>
                  <WoodPanel className="border-gold-dim/20">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center shrink-0">
                        <buyer.icon size={16} className="text-text-dim" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium tracking-wide text-parchment">{buyer.type}</p>
                        <p className="text-xs text-text-dim mt-0.5 leading-relaxed">{buyer.description}</p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Non-conventional */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-gold" />
              <h3 className="font-heading text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">Non-Conventional Buyers</h3>
              <span className="text-[10px] text-gold px-2 py-0.5 rounded-full border border-gold/25 bg-gold/[0.06]">Our advantage</span>
            </div>
            <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {nonConventionalBuyers.map((buyer) => (
                <motion.div key={buyer.type} variants={cardVariants}>
                  <WoodPanel glow>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg hanko-seal flex items-center justify-center shrink-0">
                        <buyer.icon size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-heading text-sm font-medium tracking-wide text-parchment">{buyer.type}</p>
                        <p className="text-xs text-text-dim mt-0.5 leading-relaxed">{buyer.description}</p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="katana-line mb-10" />

        {/* Blurred Buyer Data Table */}
        <div className="mb-10 relative">
          <h2 className="font-display text-2xl text-gold tracking-[0.06em] mb-5 text-center">
            Active Buyer Database
          </h2>

          {/* The blurred table */}
          <div className="relative rounded-sm overflow-hidden">
            <div className="blur-[6px] pointer-events-none select-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gold-dim/20">
                    <th className="text-left py-3 px-4 font-heading text-gold text-xs tracking-wider uppercase">Name</th>
                    <th className="text-left py-3 px-4 font-heading text-gold text-xs tracking-wider uppercase">State</th>
                    <th className="text-left py-3 px-4 font-heading text-gold text-xs tracking-wider uppercase">Buy Box</th>
                    <th className="text-left py-3 px-4 font-heading text-gold text-xs tracking-wider uppercase">Property Types</th>
                    <th className="text-left py-3 px-4 font-heading text-gold text-xs tracking-wider uppercase">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {fakeBuyers.map((buyer, i) => (
                    <tr key={i} className={`border-b border-gold-dim/10 ${i % 2 === 0 ? 'bg-black/20' : ''}`}>
                      <td className="py-2.5 px-4 text-parchment">{buyer.name}</td>
                      <td className="py-2.5 px-4 text-text-dim">{buyer.state}</td>
                      <td className="py-2.5 px-4 text-text-dim">{buyer.buyBox}</td>
                      <td className="py-2.5 px-4 text-text-dim">{buyer.types}</td>
                      <td className="py-2.5 px-4 text-gold">{buyer.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="wood-panel rounded-sm border border-gold/30 px-8 py-6 text-center shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                <Lock size={32} className="text-gold mx-auto mb-3" />
                <p className="font-heading text-sm font-semibold tracking-wide text-parchment mb-1">
                  Buyer List Access Requires a Signed JV Agreement
                </p>
                <p className="text-xs text-text-dim mb-4">
                  Submit a deal under contract to unlock our full buyer network
                </p>
                <button
                  onClick={() => setShowJVModal(true)}
                  className="inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm text-white transition-shadow duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #E53935, #B3261E)',
                    boxShadow: '0 0 16px rgba(229,57,53,0.3)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 24px rgba(229,57,53,0.5)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 16px rgba(229,57,53,0.3)' }}
                >
                  Submit a Deal <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <WoodPanel glow className="text-center">
            <h3 className="font-display text-2xl text-gold tracking-[0.06em] mb-2">
              Ready to Move a Deal?
            </h3>
            <p className="text-sm text-text-dim max-w-lg mx-auto mb-5">
              You're looking for buyers? Perfect. This is what we do. Bring the contract and we'll go to work.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => setShowJVModal(true)}
                className="inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm text-white transition-shadow duration-200"
                style={{
                  background: 'linear-gradient(135deg, #E53935, #B3261E)',
                  boxShadow: '0 0 16px rgba(229,57,53,0.3)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 24px rgba(229,57,53,0.5)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 16px rgba(229,57,53,0.3)' }}
              >
                Submit a Deal <ArrowRight size={16} />
              </button>
              <a
                href="mailto:dispo@dispodojo.com"
                className="inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm border border-[rgba(0,198,255,0.3)] text-[#00C6FF] hover:bg-[rgba(0,198,255,0.08)] hover:border-[rgba(0,198,255,0.5)] transition-all duration-200"
              >
                Contact Dispo Team
              </a>
            </div>
          </WoodPanel>
        </motion.div>
      </div>

      {/* JV Modal */}
      {showJVModal && (
        <JVModal onClose={() => setShowJVModal(false)} />
      )}
    </motion.div>
  )
}
```

**Step 2: Verify it renders in the dev server**

Navigate to `http://localhost:5173/find-buyers` and confirm layout renders.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: build Find Buyers page — hero, platforms, buyer types, blurred table, CTAs"
```

---

### Task 9: Build JV Modal Wizard

**Files:**
- Modify: `frontend/src/pages/FindBuyers.jsx` (add JVModal component at bottom of file)

**Step 1: Add JVModal component to FindBuyers.jsx**

Add below the `FindBuyers` component in the same file:

```jsx
function JVModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [sigName, setSigName] = useState('')
  const [sigDate] = useState(new Date().toLocaleDateString('en-US'))
  const [contractFile, setContractFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSign = () => {
    if (!sigName.trim()) return
    // Generate PDF will be handled in Task 10
    setStep(3)
  }

  const handleSubmit = async () => {
    if (!contractFile) return
    setSubmitting(true)

    // Discord webhook — will be wired in Task 11
    try {
      const webhookUrl = import.meta.env.VITE_DISCORD_JV_WEBHOOK
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**New JV Deal Submitted**\nSigned by: ${sigName}\nDate: ${sigDate}\nContract uploaded: ${contractFile.name}`,
          }),
        })
      }
    } catch (err) {
      console.error('Discord webhook failed:', err)
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg wood-panel rounded-sm border border-gold/30 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-text-dim hover:text-parchment z-10">
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-gold' : 'bg-gold-dim/20'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Agreement Notice */}
          {step === 1 && (
            <div className="text-center">
              <FileText size={40} className="text-gold mx-auto mb-4" />
              <h2 className="font-display text-2xl text-gold tracking-[0.06em] mb-3">
                Joint Venture Agreement Required
              </h2>
              <p className="text-sm text-text-dim leading-relaxed mb-6">
                To work with our buyers, we require a JV agreement to be signed prior to reaching out to our buyers. This protects both parties and ensures a smooth transaction process.
              </p>
              <button
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm text-white"
                style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229,57,53,0.3)' }}
              >
                I Agree, Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Sign Agreement */}
          {step === 2 && (
            <div>
              <h2 className="font-display text-xl text-gold tracking-[0.06em] mb-4 text-center">
                Sign JV Agreement
              </h2>

              {/* Contract text (scrollable) */}
              <div className="max-h-[250px] overflow-y-auto mb-6 p-4 bg-black/30 rounded-sm border border-gold-dim/15 text-xs text-text-dim leading-relaxed">
                <p className="font-heading text-gold text-sm mb-2">JOINT VENTURE AGREEMENT</p>
                <p className="mb-2">This Joint Venture Agreement ("Agreement") is entered into as of the date signed below.</p>
                <p className="mb-2">1. <strong className="text-parchment">Purpose.</strong> The parties agree to collaborate on the disposition of real estate properties through Dispo Dojo's buyer network, platforms, and resources.</p>
                <p className="mb-2">2. <strong className="text-parchment">Responsibilities.</strong> The submitting party ("Deal Partner") will provide properties under contract. Dispo Dojo will market the property to its buyer network and facilitate the assignment or closing.</p>
                <p className="mb-2">3. <strong className="text-parchment">Compensation.</strong> Assignment fees, JV splits, and closing costs will be agreed upon per deal prior to marketing.</p>
                <p className="mb-2">4. <strong className="text-parchment">Confidentiality.</strong> Both parties agree to keep all buyer information, deal details, and financial terms strictly confidential.</p>
                <p className="mb-2">5. <strong className="text-parchment">Term.</strong> This agreement remains in effect for the duration of the deal partnership and survives closing.</p>
                <p className="mb-2">6. <strong className="text-parchment">Governing Law.</strong> This agreement is governed by the laws of the state in which the property is located.</p>
              </div>

              {/* Signature fields */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="font-heading text-xs text-gold-dim tracking-wider uppercase block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    placeholder="Enter your full legal name"
                    className="w-full bg-black/30 border border-gold-dim/20 rounded-sm px-4 py-2.5 text-parchment text-sm font-body placeholder:text-text-dim/40 focus:outline-none focus:border-gold/40 focus:shadow-[0_0_10px_rgba(212,168,83,0.1)]"
                  />
                </div>
                <div>
                  <label className="font-heading text-xs text-gold-dim tracking-wider uppercase block mb-1">Date</label>
                  <input
                    type="text"
                    value={sigDate}
                    readOnly
                    className="w-full bg-black/30 border border-gold-dim/20 rounded-sm px-4 py-2.5 text-text-dim text-sm font-body cursor-not-allowed"
                  />
                </div>
              </div>

              <button
                onClick={handleSign}
                disabled={!sigName.trim()}
                className="w-full inline-flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229,57,53,0.3)' }}
              >
                Sign Agreement <Check size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Confirm + Download + Upload */}
          {step === 3 && !submitted && (
            <div>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                  <Check size={24} className="text-green-400" />
                </div>
                <h2 className="font-display text-xl text-gold tracking-[0.06em] mb-1">
                  JV Agreement Signed
                </h2>
                <p className="text-xs text-text-dim">Signed by {sigName} on {sigDate}</p>
              </div>

              {/* Download button */}
              <button
                onClick={() => {/* PDF download handled in Task 10 */}}
                className="w-full flex items-center justify-center gap-2 mb-6 py-2.5 rounded-sm border border-gold/30 text-gold font-heading text-sm tracking-wide hover:bg-gold/[0.06] transition-colors"
              >
                <Download size={16} /> Download Signed JV Agreement (PDF)
              </button>

              {/* Contract upload */}
              <div className="mb-6">
                <label className="font-heading text-xs text-gold-dim tracking-wider uppercase block mb-2">
                  Upload Your Property Contract
                </label>
                <div
                  className="border-2 border-dashed border-gold-dim/20 rounded-sm p-6 text-center cursor-pointer hover:border-gold/30 transition-colors"
                  onClick={() => document.getElementById('contract-upload').click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files[0]) setContractFile(e.dataTransfer.files[0])
                  }}
                >
                  <Upload size={24} className="text-text-dim mx-auto mb-2" />
                  {contractFile ? (
                    <p className="text-sm text-gold">{contractFile.name}</p>
                  ) : (
                    <p className="text-sm text-text-dim">Drag & drop or click to upload (PDF, images)</p>
                  )}
                  <input
                    id="contract-upload"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => { if (e.target.files[0]) setContractFile(e.target.files[0]) }}
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!contractFile || submitting}
                className="w-full inline-flex items-center justify-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229,57,53,0.3)' }}
              >
                {submitting ? 'Submitting...' : 'Submit Deal'} <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 3: Submitted confirmation */}
          {step === 3 && submitted && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={28} className="text-green-400" />
              </div>
              <h2 className="font-display text-2xl text-gold tracking-[0.06em] mb-3">
                Deal Submitted
              </h2>
              <p className="text-sm text-text-dim leading-relaxed mb-2">
                We're reviewing your contract and will reach out with next steps.
              </p>
              <p className="text-sm text-gold font-semibold">
                We're getting this out to all of our buyers and getting this sold for you.
              </p>
              <button
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 font-heading font-bold uppercase tracking-wide text-sm px-6 py-2.5 rounded-sm border border-gold/30 text-gold hover:bg-gold/[0.06] transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
```

Note: The `JVModal` component uses `useState` from the parent file's import. Move the `import { useState }` to the top of FindBuyers.jsx if not already there.

**Step 2: Test the full modal flow**

Navigate to `/find-buyers`, click "Submit a Deal", walk through all 3 steps.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: build JV modal wizard — 3-step agreement signing flow"
```

---

### Task 10: Add PDF Generation for JV Agreement

**Files:**
- Modify: `frontend/package.json` (add jspdf)
- Modify: `frontend/src/pages/FindBuyers.jsx` (wire PDF download)

**Step 1: Install jspdf**

```bash
cd frontend && npm install jspdf
```

**Step 2: Add PDF generation utility to FindBuyers.jsx**

At the top of FindBuyers.jsx, add import:
```jsx
import jsPDF from 'jspdf'
```

Add a helper function before the components:
```jsx
function generateJVPdf(name, date) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('JOINT VENTURE AGREEMENT', 105, 30, { align: 'center' })
  doc.setFontSize(11)
  const lines = [
    `This Joint Venture Agreement ("Agreement") is entered into as of ${date}.`,
    '',
    '1. Purpose. The parties agree to collaborate on the disposition of real estate',
    '   properties through Dispo Dojo\'s buyer network, platforms, and resources.',
    '',
    '2. Responsibilities. The submitting party ("Deal Partner") will provide properties',
    '   under contract. Dispo Dojo will market the property to its buyer network and',
    '   facilitate the assignment or closing.',
    '',
    '3. Compensation. Assignment fees, JV splits, and closing costs will be agreed upon',
    '   per deal prior to marketing.',
    '',
    '4. Confidentiality. Both parties agree to keep all buyer information, deal details,',
    '   and financial terms strictly confidential.',
    '',
    '5. Term. This agreement remains in effect for the duration of the deal partnership',
    '   and survives closing.',
    '',
    '6. Governing Law. This agreement is governed by the laws of the state in which',
    '   the property is located.',
  ]
  let y = 50
  lines.forEach((line) => { doc.text(line, 20, y); y += 7 })
  y += 15
  doc.setFontSize(12)
  doc.text('Signed:', 20, y)
  y += 10
  doc.setFont(undefined, 'italic')
  doc.text(name, 20, y)
  doc.setFont(undefined, 'normal')
  y += 8
  doc.text(`Date: ${date}`, 20, y)
  doc.save(`JV-Agreement-${name.replace(/\s+/g, '-')}.pdf`)
}
```

**Step 3: Wire the download button in Step 3 of JVModal**

Replace the download button's `onClick`:
```jsx
onClick={() => generateJVPdf(sigName, sigDate)}
```

**Step 4: Test PDF download**

Walk through the modal to Step 3, click download, verify PDF opens with correct name and date.

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add jsPDF generation for signed JV agreement"
```

---

### Task 11: Wire Discord Webhook

**Files:**
- Create: `frontend/.env.example`
- Modify: `frontend/.env` (local only, gitignored)

**Step 1: Create .env.example**

```
VITE_DISCORD_JV_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**Step 2: Verify the webhook code in JVModal already references `import.meta.env.VITE_DISCORD_JV_WEBHOOK`**

This was already added in Task 9's `handleSubmit` function. Verify it works by:
1. Creating a test webhook in Discord
2. Setting the env var
3. Submitting a test deal

**Step 3: Commit**

```bash
git add frontend/.env.example && git commit -m "feat: add Discord webhook env var for JV deal submissions"
```

---

## Phase 3: Community Page (MVP)

### Task 12: Install Firebase + Set Up Config

**Files:**
- Modify: `frontend/package.json` (add firebase)
- Create: `frontend/src/lib/firebase.js`

**Step 1: Install Firebase**

```bash
cd frontend && npm install firebase
```

**Step 2: Create Firebase config file**

```jsx
// frontend/src/lib/firebase.js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export default app
```

**Step 3: Add Firebase env vars to .env.example**

Append to `frontend/.env.example`:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Firebase config + Firestore/Auth setup"
```

---

### Task 13: Build Community Page Layout — Channel Sidebar + Message Feed

**Files:**
- Modify: `frontend/src/pages/Community.jsx` (replace placeholder)

**Step 1: Build the full Community layout**

This is a large component. Structure:
- Left panel: channel list (fixed width ~220px)
- Main area: message feed for selected channel
- Messages scroll from bottom, newest at bottom (like Discord/Slack)

```jsx
// frontend/src/pages/Community.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, Send, SmilePlus, MessageSquare, Users, Plus,
  Bold, Italic, Link as LinkIcon, X, ChevronRight,
} from 'lucide-react'
import { db } from '../lib/firebase'
import {
  collection, query, orderBy, limit, onSnapshot,
  addDoc, serverTimestamp, where, doc, updateDoc, increment,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'

const DEFAULT_CHANNELS = [
  { id: 'general', name: 'General', icon: Hash, description: 'General discussion' },
  { id: 'wins', name: 'Wins', icon: Hash, description: 'Share your wins' },
  { id: 'deal-talk', name: 'Deal Talk', icon: Hash, description: 'Deal scenarios and questions' },
  { id: 'questions', name: 'Questions', icon: Hash, description: 'Ask the community' },
  { id: 'resources', name: 'Resources', icon: Hash, description: 'Share helpful resources' },
]

export default function Community() {
  const { user } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeThread, setActiveThread] = useState(null)
  const [threadReplies, setThreadReplies] = useState([])
  const [newReply, setNewReply] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef(null)
  const threadEndRef = useRef(null)
  const channelInfo = DEFAULT_CHANNELS.find((c) => c.id === activeChannel)

  // Subscribe to messages for active channel
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', activeChannel),
      orderBy('createdAt', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [activeChannel])

  // Subscribe to thread replies
  useEffect(() => {
    if (!activeThread) { setThreadReplies([]); return }
    const q = query(
      collection(db, 'replies'),
      where('messageId', '==', activeThread.id),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setThreadReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [activeThread?.id])

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [threadReplies])

  const sendMessage = async () => {
    if (!newMessage.trim()) return
    await addDoc(collection(db, 'messages'), {
      channelId: activeChannel,
      authorName: user?.name || 'Guest',
      authorEmail: user?.email || '',
      body: newMessage.trim(),
      replyCount: 0,
      createdAt: serverTimestamp(),
    })
    setNewMessage('')
  }

  const sendReply = async () => {
    if (!newReply.trim() || !activeThread) return
    await addDoc(collection(db, 'replies'), {
      messageId: activeThread.id,
      authorName: user?.name || 'Guest',
      authorEmail: user?.email || '',
      body: newReply.trim(),
      createdAt: serverTimestamp(),
    })
    // Increment reply count on parent message
    await updateDoc(doc(db, 'messages', activeThread.id), {
      replyCount: increment(1),
    })
    setNewReply('')
  }

  const getInitials = (name) =>
    (name || 'G').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  const formatTime = (ts) => {
    if (!ts?.toDate) return ''
    const d = ts.toDate()
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const formatDate = (ts) => {
    if (!ts?.toDate) return ''
    return ts.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Simple emoji set for MVP
  const emojis = ['👍', '🔥', '💪', '🎯', '💰', '🏠', '📈', '✅', '🤝', '⚡', '🎉', '👊', '💎', '🏆', '❤️', '😂']

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-sm border border-gold-dim/20">
      {/* Channel Sidebar */}
      <div className="w-[220px] shrink-0 lacquer-deep border-r border-gold-dim/15 flex flex-col">
        <div className="px-4 py-4">
          <h2 className="font-display text-lg text-gold tracking-[0.06em]">Community</h2>
          <p className="text-[10px] text-text-dim font-heading tracking-wider uppercase mt-1">Channels</p>
        </div>
        <div className="katana-line mx-3" />
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {DEFAULT_CHANNELS.map((channel) => (
            <button
              key={channel.id}
              onClick={() => { setActiveChannel(channel.id); setActiveThread(null) }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-sm text-left transition-colors mb-0.5 ${
                activeChannel === channel.id
                  ? 'bg-[rgba(0,198,255,0.08)] text-[#00C6FF]'
                  : 'text-text-dim hover:bg-[rgba(0,198,255,0.04)]'
              }`}
            >
              <Hash size={14} />
              <span className="font-heading text-sm tracking-wide">{channel.name}</span>
            </button>
          ))}
        </nav>
        {/* User card at bottom */}
        <div className="px-3 py-3 border-t border-gold-dim/15 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full hanko-seal flex items-center justify-center text-[10px] font-heading font-bold text-parchment">
            {getInitials(user?.name)}
          </div>
          <span className="font-heading text-xs text-text-dim truncate">{user?.name || 'Guest'}</span>
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="px-5 py-3 border-b border-gold-dim/15 flex items-center gap-2 lacquer-bar">
          <Hash size={18} className="text-gold" />
          <h3 className="font-heading text-sm font-semibold text-parchment tracking-wide">{channelInfo?.name}</h3>
          <span className="text-xs text-text-dim ml-2">{channelInfo?.description}</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <MessageSquare size={36} className="text-text-dim/30 mx-auto mb-3" />
              <p className="text-sm text-text-dim">No messages yet. Be the first to post!</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className="group flex gap-3">
              <div className="w-8 h-8 rounded-full hanko-seal flex items-center justify-center text-[10px] font-heading font-bold text-parchment shrink-0 mt-0.5">
                {getInitials(msg.authorName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-sm font-semibold text-parchment">{msg.authorName}</span>
                  <span className="text-[10px] text-text-dim/50">{formatDate(msg.createdAt)} {formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-sm text-text-dim leading-relaxed mt-0.5 break-words">{msg.body}</p>
                <button
                  onClick={() => setActiveThread(msg)}
                  className="mt-1 flex items-center gap-1 text-[11px] text-text-dim/50 hover:text-[#00C6FF] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <MessageSquare size={12} />
                  {msg.replyCount > 0 ? `${msg.replyCount} replies` : 'Reply'}
                </button>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="px-5 py-3 border-t border-gold-dim/15">
          <div className="flex items-center gap-2 bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2 focus-within:border-gold/30">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
              placeholder={`Message #${channelInfo?.name || 'general'}`}
              className="flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none font-body"
            />
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-text-dim/40 hover:text-gold transition-colors"
              >
                <SmilePlus size={18} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 p-2 wood-panel rounded-sm border border-gold-dim/20 grid grid-cols-8 gap-1 z-20">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => { setNewMessage((m) => m + emoji); setShowEmojiPicker(false) }}
                      className="w-8 h-8 flex items-center justify-center rounded hover:bg-gold/10 text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="text-[#00C6FF] disabled:text-text-dim/20 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Thread Panel (slide-out right) */}
      <AnimatePresence>
        {activeThread && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 350, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-l border-gold-dim/15 lacquer-deep flex flex-col overflow-hidden"
          >
            {/* Thread header */}
            <div className="px-4 py-3 border-b border-gold-dim/15 flex items-center justify-between">
              <h4 className="font-heading text-sm font-semibold text-parchment">Thread</h4>
              <button onClick={() => setActiveThread(null)} className="text-text-dim hover:text-parchment">
                <X size={16} />
              </button>
            </div>

            {/* Parent message */}
            <div className="px-4 py-3 border-b border-gold-dim/10">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-heading text-sm font-semibold text-parchment">{activeThread.authorName}</span>
                <span className="text-[10px] text-text-dim/50">{formatTime(activeThread.createdAt)}</span>
              </div>
              <p className="text-sm text-text-dim">{activeThread.body}</p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {threadReplies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full hanko-seal flex items-center justify-center text-[8px] font-heading font-bold text-parchment shrink-0 mt-0.5">
                    {getInitials(reply.authorName)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-heading text-xs font-semibold text-parchment">{reply.authorName}</span>
                      <span className="text-[9px] text-text-dim/50">{formatTime(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-text-dim leading-relaxed">{reply.body}</p>
                  </div>
                </div>
              ))}
              <div ref={threadEndRef} />
            </div>

            {/* Reply input */}
            <div className="px-4 py-3 border-t border-gold-dim/15">
              <div className="flex items-center gap-2 bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2 focus-within:border-gold/30">
                <input
                  type="text"
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                  placeholder="Reply..."
                  className="flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none font-body"
                />
                <button
                  onClick={sendReply}
                  disabled={!newReply.trim()}
                  className="text-[#00C6FF] disabled:text-text-dim/20 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify it renders at `/community`**

Dev server should show the channel sidebar, empty message feed, and input bar.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: build Community page — channels, message feed, threads, emoji picker"
```

---

### Task 14: Initialize Firebase Project + Firestore Rules

This is a manual/CLI step. The developer must:

**Step 1: Create Firebase project**

1. Go to https://console.firebase.google.com/
2. Create new project "dispo-dojo" (or similar)
3. Enable Firestore Database (start in test mode for development)
4. Enable Authentication (Email/Password provider)
5. Copy config values to `frontend/.env`

**Step 2: Set Firestore security rules (basic for MVP)**

In Firebase Console > Firestore > Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    match /replies/{replyId} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Note: For MVP with the existing localStorage auth, we may need to relax auth rules temporarily or wire Firebase Auth. See Task 15.

**Step 3: Commit env.example updates**

```bash
git add -A && git commit -m "docs: add Firebase env vars to .env.example"
```

---

### Task 15: Bridge Existing Auth with Firebase Auth

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

**Step 1: Add Firebase anonymous auth on login**

Since the existing auth is localStorage-based, we bridge it by signing into Firebase anonymously (or with email) whenever a user logs in. This ensures Firestore security rules work.

Add to the AuthContext:

```jsx
import { signInAnonymously } from 'firebase/auth'
import { auth } from '../lib/firebase'
```

In the `login` function, after a successful login:
```jsx
// Sign into Firebase for Firestore access
signInAnonymously(auth).catch(console.error)
```

Same in `signup` and `quickLogin`.

In `logout`, add:
```jsx
import { signOut } from 'firebase/auth'
// ...
signOut(auth).catch(console.error)
```

**Step 2: Verify community messaging works end-to-end**

Log in, go to `/community`, post a message, verify it appears in real-time.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: bridge existing auth with Firebase anonymous auth for Firestore access"
```

---

### Task 16: Add User Profile Popovers

**Files:**
- Create: `frontend/src/components/UserProfileCard.jsx`
- Modify: `frontend/src/pages/Community.jsx` (wrap author names with popover trigger)

**Step 1: Create UserProfileCard component**

```jsx
// frontend/src/components/UserProfileCard.jsx
import { motion } from 'framer-motion'

export default function UserProfileCard({ name, email, joinedAt, onClose }) {
  const initials = (name || 'G')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="absolute z-30 w-56 wood-panel rounded-sm border border-gold-dim/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center text-sm font-heading font-bold text-parchment">
          {initials}
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-parchment">{name}</p>
          <p className="text-[10px] text-text-dim">Member</p>
        </div>
      </div>
      {joinedAt && (
        <p className="text-[10px] text-text-dim/50 mb-2">
          Joined {new Date(joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  )
}
```

**Step 2: Wire into Community.jsx**

Add click handler on author names in the message list that shows the popover. Use a state variable like `[profilePopover, setProfilePopover]` with position and user data.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add user profile popover cards in Community"
```

---

### Task 17: Final Verification + Deploy

**Step 1: Run build to check for errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Test all routes**

- `/` — Dashboard (no FSBO card, has Find Buyers card)
- `/find-buyers` — Full page renders, modal flow works
- `/community` — Channel sidebar, messaging works
- `/direct-agent` — No FSBO link
- Sidebar — correct nav structure
- Header — correct titles/kanji for new pages

**Step 3: Push to GitHub**

```bash
git push origin master
```

**Step 4: Deploy to Vercel**

```bash
cd frontend && npx vercel --prod
```

**Step 5: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: address build/deploy issues"
```

---

## Summary of Phases

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| **Phase 1** | Tasks 1-7 | FSBO + Dispo deleted, nav cleaned up, placeholders in place |
| **Phase 2** | Tasks 8-11 | Full Find Buyers page with JV modal, PDF, Discord webhook |
| **Phase 3** | Tasks 12-17 | Community MVP with Firebase channels, messages, threads, profiles |
| **Future: V1** | — | DMs, GIFs, group chats, presence, notifications |
| **Future: V2** | — | File sharing, pins, reactions, search, roles |
