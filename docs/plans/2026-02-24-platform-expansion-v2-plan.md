# Platform Expansion v2 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 4 new pages (Offer Comparison, Call Recordings, Live Deals, Buy Boxes), overhaul the Finding Leads page with 3 categorized video sections, restructure the sidebar with a new "Sales Tools" section, extend the Admin Dashboard with two new tabs, and add a `/api/comps` backend endpoint.

**Architecture:** All new pages follow the existing WoodPanel + framer-motion pattern. Firestore is used for Live Deals collection and Buy Box criteria on user profiles. The `/api/comps` endpoint is added to the existing FastAPI backend using the HomeHarvest scraper for sold comps. PDF export uses the already-installed `jsPDF` library.

**Tech Stack:** React 19, Framer Motion, Tailwind CSS v4, Firebase Firestore, FastAPI, HomeHarvest scraper, jsPDF, lucide-react

**Design doc:** `docs/plans/2026-02-24-platform-expansion-v2-design.md`

---

## Task 1: Finding Leads Page — 3 Video Sections + Banner

**Files:**
- Modify: `frontend/src/pages/LeadScrubbing.jsx`

### Step 1: Replace the existing page content

Rewrite `LeadScrubbing.jsx` entirely. The page now has:
- Page header (keep existing hanko seal + title)
- Info banner below header
- Three `WoodPanel` video cards

```jsx
import { motion } from 'framer-motion'
import { Play, Info } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import { ForgeHammerIcon } from '../components/icons/index'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const VIDEOS = [
  {
    title: 'Finding Subject-To Leads',
    desc: 'How to identify assumable-mortgage candidates on the MLS — filters, equity signals, and days-on-market patterns that reveal motivated sellers.',
    bullets: [
      'Setting up MLS filters for Sub-To candidates',
      'Reading equity stack indicators',
      'Days-on-market patterns that signal motivation',
      'How to approach the listing agent on these deals',
    ],
  },
  {
    title: 'Finding Stack Method Leads',
    desc: 'Layer equity, DOM, and price reduction criteria to surface highly motivated sellers before the competition finds them.',
    bullets: [
      'What "the stack" means and why it works',
      'Combining filters for high-conviction leads',
      'Reading market signals in your zip code',
      'Building a repeatable daily search routine',
    ],
  },
  {
    title: 'Finding Cash Leads — Deal Sauce Walkthrough',
    desc: 'A full walkthrough of the Deal Sauce platform: dashboard navigation, finding cash leads, and identifying other lead types worth pursuing.',
    bullets: [
      'Platform navigation and account setup',
      'Understanding the Deal Sauce dashboard',
      'Filtering for cash leads in your market',
      'Identifying other lead categories available',
    ],
  },
]

export default function LeadScrubbing() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto relative"
    >
      {/* Forge Fire Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 10% 50%, rgba(232, 101, 46, 0.15) 0%, transparent 50%)' }}
      />

      {/* Page Header */}
      <motion.div variants={itemVariants} className="mb-6 relative">
        <div className="flex items-center gap-4 mb-3">
          <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
            <ForgeHammerIcon size={28} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              Finding Leads
            </h1>
            <p className="text-text-dim text-base mt-1 font-body">
              Refine raw leads into razor-sharp prospects
            </p>
          </div>
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Info Banner */}
      <motion.div variants={itemVariants} className="mb-8">
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-sm border"
          style={{
            background: 'rgba(0, 198, 255, 0.05)',
            borderColor: 'rgba(0, 198, 255, 0.2)',
          }}
        >
          <Info size={18} className="text-cyan shrink-0 mt-0.5" />
          <p className="text-text-dim text-sm leading-relaxed font-body">
            These training videos focus on finding{' '}
            <span className="text-parchment font-heading">on-market properties</span> in each category.
            Once we identify a lead, we reach out directly to the listing agent to present our offer.
          </p>
        </div>
      </motion.div>

      {/* Video Cards */}
      {VIDEOS.map((video) => (
        <motion.div key={video.title} variants={itemVariants} className="mb-6">
          <WoodPanel headerBar={video.title} className="border border-gold-dim/15">
            {/* Video Placeholder */}
            <div className="aspect-video bg-bg-elevated border border-gold-dim/15 rounded-sm flex flex-col items-center justify-center gap-4 mb-6">
              <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center">
                <Play size={32} className="text-white ml-1" />
              </div>
              <p className="text-text-dim text-lg font-heading tracking-wide">Video Coming Soon</p>
            </div>

            {/* Description */}
            <p className="text-text-dim text-sm leading-relaxed font-body mb-4">{video.desc}</p>

            <div className="katana-line my-4" />

            {/* Bullets */}
            <ul className="space-y-3">
              {video.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <ForgeHammerIcon size={18} className="text-gold shrink-0 mt-0.5" />
                  <span className="text-text-dim text-sm leading-relaxed font-body">{bullet}</span>
                </li>
              ))}
            </ul>
          </WoodPanel>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

### Step 2: Verify the page renders correctly

Start the dev server (`npm run dev` in `frontend/`) and navigate to `/lead-scrubbing`. Confirm:
- Info banner appears below header
- Three video cards render with correct titles
- Each card has a placeholder video area, description, and bullets

### Step 3: Commit

```bash
git add frontend/src/pages/LeadScrubbing.jsx
git commit -m "feat: overhaul Finding Leads page with 3 video sections and banner"
```

---

## Task 2: Sidebar Restructure + New Routes

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`
- Modify: `frontend/src/App.jsx`

### Step 1: Update the navSections array in Sidebar.jsx

Replace the existing `navSections` array and add the required imports:

Add to existing lucide imports: `Video, Briefcase, Target`

```jsx
const navSections = [
  {
    title: '',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'JV Dashboard' },
      { to: '/community', icon: MessageSquare, label: 'Message Board' },
      { to: '/live-deals', icon: Briefcase, label: 'Live Deals' },
    ],
  },
  {
    title: 'Lead Generation',
    items: [
      { to: '/lead-scrubbing', icon: Search, label: 'Finding Leads' },
      { to: '/agent-finder', icon: CompassIcon, label: 'Find Agent Emails' },
      { to: '/loi-sender', icon: Send, label: 'LOI Sender' },
    ],
  },
  {
    title: 'Sales Tools',
    items: [
      { to: '/website-explainer', icon: Monitor, label: 'Subject-To Explainer' },
      { to: '/offer-comparison', icon: BarChart3, label: 'Offer Comparison' },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { to: '/underwriting', icon: Calculator, label: 'Free Underwriting' },
      { to: '/contract-generator', icon: FileSignature, label: 'Contract Generator' },
      { to: '/find-buyers', icon: HandCoins, label: 'Find Buyers' },
      { to: '/buy-boxes', icon: Target, label: 'Buy Boxes' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { to: '/scripts', icon: MessageCircle, label: 'Scripts & Objections' },
      { to: '/direct-agent', icon: House, label: 'DTA Process' },
      { to: '/bird-dog', icon: DollarSign, label: 'Bird Dog Network' },
      { to: '/boots-on-ground', icon: Footprints, label: 'Boots on Ground' },
      { to: '/rent-comps', icon: BarChart3, label: 'Rent Comps' },
      { to: '/call-recordings', icon: Video, label: 'Call Recordings' },
    ],
  },
]
```

Note: Remove `Monitor` from Lead Generation imports since Subject-To Explainer moves. Add `Briefcase`, `Target`, `Video` to the lucide import line. Keep `BarChart3` (already imported) for both Rent Comps and Offer Comparison.

### Step 2: Add new routes in App.jsx

Add 4 imports at the top:
```jsx
import OfferComparison from './pages/OfferComparison'
import CallRecordings from './pages/CallRecordings'
import LiveDeals from './pages/LiveDeals'
import BuyBoxes from './pages/BuyBoxes'
```

Add 4 routes inside the Layout route:
```jsx
<Route path="offer-comparison" element={<OfferComparison />} />
<Route path="call-recordings" element={<CallRecordings />} />
<Route path="live-deals" element={<LiveDeals />} />
<Route path="buy-boxes" element={<BuyBoxes />} />
```

Create stub files for each new page so the app doesn't crash (just a placeholder export):

`frontend/src/pages/OfferComparison.jsx`:
```jsx
export default function OfferComparison() {
  return <div className="text-parchment p-8">Offer Comparison — Coming Soon</div>
}
```

`frontend/src/pages/CallRecordings.jsx`:
```jsx
export default function CallRecordings() {
  return <div className="text-parchment p-8">Call Recordings — Coming Soon</div>
}
```

`frontend/src/pages/LiveDeals.jsx`:
```jsx
export default function LiveDeals() {
  return <div className="text-parchment p-8">Live Deals — Coming Soon</div>
}
```

`frontend/src/pages/BuyBoxes.jsx`:
```jsx
export default function BuyBoxes() {
  return <div className="text-parchment p-8">Buy Boxes — Coming Soon</div>
}
```

### Step 3: Verify sidebar renders

Check all new nav items appear in the correct sections and routes resolve without errors.

### Step 4: Commit

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/App.jsx \
  frontend/src/pages/OfferComparison.jsx frontend/src/pages/CallRecordings.jsx \
  frontend/src/pages/LiveDeals.jsx frontend/src/pages/BuyBoxes.jsx
git commit -m "feat: sidebar restructure — Sales Tools section, Live Deals, Buy Boxes, Call Recordings"
```

---

## Task 3: Call Recordings Page

**Files:**
- Modify: `frontend/src/pages/CallRecordings.jsx`

### Step 1: Write the full page

```jsx
import { motion } from 'framer-motion'
import { Lock, Video } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const CATEGORIES = [
  {
    title: 'Sellers in Arrears',
    desc: 'Navigating late payments and pre-foreclosure sensitivity — urgency framing without applying pressure.',
  },
  {
    title: 'VA Entitlement Questions',
    desc: "Explaining entitlement restoration and how Sub-To preserves the seller's VA eligibility for future use.",
  },
  {
    title: '"What if I want to buy again?"',
    desc: 'Handling the future purchase objection — how Sub-To affects DTI vs. the deed, and realistic refi paths.',
  },
  {
    title: 'Price Objection',
    desc: "Seller expects retail. Bridging to net proceeds reality without being confrontational.",
  },
  {
    title: '"I need to think about it"',
    desc: 'Re-engagement framing and follow-up cadence that keeps deals alive without being pushy.',
  },
  {
    title: 'Agent Pushback',
    desc: 'When listing agents resist creative offers — how to keep them engaged and on your side.',
  },
  {
    title: 'Title Company Concerns',
    desc: 'Addressing the due-on-sale clause and how experienced title companies handle Sub-To transactions.',
  },
  {
    title: 'Spouse / Family Member Involvement',
    desc: 'Navigating second decision-maker dynamics — getting everyone on the same page without losing the deal.',
  },
]

export default function CallRecordings() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
            <Video size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              Call Recordings
            </h1>
            <p className="text-text-dim text-base mt-1 font-body">
              Real calls organized by scenario — study the patterns, not just the scripts
            </p>
          </div>
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CATEGORIES.map((cat) => (
          <motion.div key={cat.title} variants={itemVariants}>
            <WoodPanel className="h-full opacity-70">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white/5 border border-gold-dim/15 flex items-center justify-center shrink-0">
                  <Lock size={15} className="text-text-dim" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-heading text-sm text-parchment tracking-wide">{cat.title}</h3>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase"
                      style={{
                        background: 'rgba(0,198,255,0.08)',
                        border: '1px solid rgba(0,198,255,0.2)',
                        color: '#00C6FF',
                      }}
                    >
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-text-dim text-xs leading-relaxed font-body">{cat.desc}</p>
                </div>
              </div>
            </WoodPanel>
          </motion.div>
        ))}
      </div>

      {/* Footer note */}
      <motion.p variants={itemVariants} className="text-text-muted text-xs text-center mt-8 font-body">
        We'll be adding recordings as we collect strong examples. Check back regularly.
      </motion.p>
    </motion.div>
  )
}
```

### Step 2: Verify the page

Navigate to `/call-recordings`. Confirm 8 category cards render in a 2-column grid, each with a "Coming Soon" badge.

### Step 3: Commit

```bash
git add frontend/src/pages/CallRecordings.jsx
git commit -m "feat: add Call Recordings page with 8 Coming Soon categories"
```

---

## Task 4: Live Deals Page — User-Facing View

**Files:**
- Modify: `frontend/src/pages/LiveDeals.jsx`

### Step 1: Write the full page

This page reads from the `liveDeals` Firestore collection (only `status === 'active'` docs), renders deal cards, and opens an inquiry modal.

```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, X, Send, CheckCircle2, MapPin } from 'lucide-react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const DEAL_TYPE_COLORS = {
  'sub-to': { label: 'Sub-To', bg: 'rgba(127,0,255,0.12)', border: 'rgba(127,0,255,0.35)', color: '#A855F7' },
  'seller-finance': { label: 'Seller Finance', bg: 'rgba(246,196,69,0.1)', border: 'rgba(246,196,69,0.3)', color: '#F6C445' },
  'cash': { label: 'Cash', bg: 'rgba(0,198,255,0.08)', border: 'rgba(0,198,255,0.25)', color: '#00C6FF' },
}

function DealTypeBadge({ type }) {
  const style = DEAL_TYPE_COLORS[type] || DEAL_TYPE_COLORS['cash']
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-heading tracking-wider uppercase"
      style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.color }}
    >
      {style.label}
    </span>
  )
}

function fmt(n) {
  if (!n) return '—'
  return '$' + Number(n).toLocaleString()
}

function InquiryModal({ deal, onClose }) {
  const { user, profile } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const name = profile?.displayName || user?.name || ''
  const email = user?.email || ''

  async function handleSend() {
    setSending(true)
    const webhookUrl = import.meta.env.VITE_DISCORD_DEALS_WEBHOOK
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**Deal Inquiry**\n**Deal:** ${deal.address}, ${deal.city}, ${deal.state}\n**Type:** ${deal.dealType}\n**Assignment Fee:** ${fmt(deal.assignmentFee)}\n**From:** ${name} (${email})\n**Message:** ${message || '(no message)'}`,
          }),
        })
      } catch (err) {
        console.error('Webhook failed:', err)
      }
    }
    setSending(false)
    setSent(true)
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-md wood-panel rounded-sm border border-gold-dim/30 elevation-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
        >
          <div className="lacquer-bar px-5 py-3 flex items-center justify-between">
            <span className="font-heading text-gold text-sm tracking-widest uppercase">Inquire About Deal</span>
            <button onClick={onClose} className="text-text-dim hover:text-parchment transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="px-5 py-6">
            {!sent ? (
              <>
                <p className="text-text-dim text-sm mb-1 font-body">
                  <span className="text-parchment font-heading">{deal.address}</span>
                </p>
                <p className="text-text-dim text-xs mb-5 font-body">{deal.city}, {deal.state} · <DealTypeBadge type={deal.dealType} /></p>

                <div className="space-y-3 mb-5">
                  <div>
                    <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Your Email</label>
                    <input
                      type="text"
                      value={email}
                      readOnly
                      className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Message (optional)</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Any questions or details about your offer..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors resize-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <><Send size={14} /> Send Inquiry</>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-bamboo/20 border border-bamboo/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={28} className="text-bamboo" />
                </div>
                <h3 className="font-heading text-lg text-gold tracking-wide mb-2">Inquiry Sent</h3>
                <p className="text-text-dim text-sm leading-relaxed mb-5">
                  We'll be in touch shortly. Keep an eye on your inbox.
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment border border-gold-dim/30 hover:bg-gold/10 transition-all duration-200"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function LiveDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'liveDeals'), where('status', '==', 'active'))
    const unsub = onSnapshot(q, (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1000px] mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
                Live Deals
              </h1>
              <p className="text-text-dim text-base mt-1 font-body">
                Deals currently under contract — ready to move
              </p>
            </div>
          </div>
        </motion.div>

        <div className="katana-line my-4" />

        {/* Content */}
        {loading ? (
          <div className="text-center py-20 text-text-dim font-heading tracking-wide">Loading deals...</div>
        ) : deals.length === 0 ? (
          <motion.div variants={itemVariants}>
            <WoodPanel>
              <div className="text-center py-12">
                <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-white" />
                </div>
                <h3 className="font-heading text-xl text-gold tracking-wide mb-2">No Active Deals Right Now</h3>
                <p className="text-text-dim text-sm font-body">Check back soon — deals are added as we go under contract.</p>
              </div>
            </WoodPanel>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {deals.map((deal) => (
              <motion.div key={deal.id} variants={itemVariants}>
                <WoodPanel glow className="h-full flex flex-col">
                  {/* Deal type badge + address */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin size={13} className="text-text-dim shrink-0" />
                        <span className="font-heading text-sm text-parchment tracking-wide">{deal.address}</span>
                      </div>
                      <span className="text-text-dim text-xs font-body">{deal.city}, {deal.state}</span>
                    </div>
                    <DealTypeBadge type={deal.dealType} />
                  </div>

                  {/* Assignment fee */}
                  <div className="mb-3">
                    <span className="text-xs font-heading text-text-dim uppercase tracking-wider">Assignment Fee</span>
                    <div className="font-heading text-2xl text-gold">{fmt(deal.assignmentFee)}</div>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 mb-3 text-xs font-heading text-text-dim tracking-wide">
                    {deal.beds && <span>{deal.beds} bd</span>}
                    {deal.baths && <span>{deal.baths} ba</span>}
                    {deal.sqft && <span>{Number(deal.sqft).toLocaleString()} sqft</span>}
                    {deal.arv && <span>ARV {fmt(deal.arv)}</span>}
                  </div>

                  {/* Pitch */}
                  {deal.pitch && (
                    <p className="text-text-dim text-xs leading-relaxed font-body mb-4 flex-1">{deal.pitch}</p>
                  )}

                  <button
                    onClick={() => setSelectedDeal(deal)}
                    className="w-full py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_16px_rgba(229,57,53,0.25)] mt-auto"
                  >
                    Inquire About This Deal
                  </button>
                </WoodPanel>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {selectedDeal && (
        <InquiryModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </>
  )
}
```

### Step 2: Add `VITE_DISCORD_DEALS_WEBHOOK` to `.env.local`

```
VITE_DISCORD_DEALS_WEBHOOK=<your-discord-webhook-url>
```

(Leave blank for now if URL not yet available — webhook call is gated by `if (webhookUrl)`.)

### Step 3: Verify

Navigate to `/live-deals`. Confirm the empty state renders (no deals in Firestore yet). After Task 5 (admin tab), add a test deal and verify it appears.

### Step 4: Commit

```bash
git add frontend/src/pages/LiveDeals.jsx
git commit -m "feat: add Live Deals page with Firestore listener and inquiry modal"
```

---

## Task 5: Admin Dashboard — Live Deals Management Tab

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

### Step 1: Add tabbed layout to AdminDashboard

The current page has no tabs — it's a flat view. Wrap the existing content in a "Members" tab and add a "Live Deals" tab and "Buyer List" tab alongside it.

Read the full current AdminDashboard.jsx first to understand the complete structure (only the first 80 lines were shown above).

The tab pattern to add at the top (below the header):
```jsx
const [activeTab, setActiveTab] = useState('members')
```

Tab bar (placed between the header katana-line and the existing stat cards):
```jsx
<div className="flex gap-1 mb-6 border-b border-[rgba(0,198,255,0.12)] pb-0">
  {['members', 'live-deals', 'buyer-list'].map((tab) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2.5 font-heading text-xs tracking-widest uppercase transition-colors relative ${
        activeTab === tab ? 'text-[#00C6FF]' : 'text-text-dim hover:text-parchment'
      }`}
    >
      {tab === 'members' ? 'Members' : tab === 'live-deals' ? 'Live Deals' : 'Buyer List'}
      {activeTab === tab && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C6FF]" />
      )}
    </button>
  ))}
</div>
```

Wrap the existing member stats + user table in `{activeTab === 'members' && ( ... )}`.

### Step 2: Add the Live Deals tab content

Import at top of AdminDashboard.jsx:
```jsx
import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
```

Live Deals tab content:
```jsx
{activeTab === 'live-deals' && (
  <LiveDealsAdmin />
)}
```

`LiveDealsAdmin` component (add above `export default function AdminDashboard`):

```jsx
function LiveDealsAdmin() {
  const [deals, setDeals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'liveDeals'), (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  async function handleToggleStatus(deal) {
    await updateDoc(doc(db, 'liveDeals', deal.id), {
      status: deal.status === 'active' ? 'closed' : 'active',
    })
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this deal?')) return
    await deleteDoc(doc(db, 'liveDeals', id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-lg text-gold tracking-wide">Live Deals</h2>
        <button
          onClick={() => { setEditingDeal(null); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-heading text-xs tracking-widest uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200"
        >
          <Plus size={14} /> Add Deal
        </button>
      </div>

      {showForm && (
        <DealForm
          initial={editingDeal}
          onClose={() => { setShowForm(false); setEditingDeal(null) }}
        />
      )}

      <div className="space-y-3">
        {deals.map((deal) => (
          <WoodPanel key={deal.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-heading text-sm text-parchment">{deal.address}, {deal.city}, {deal.state}</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase"
                    style={{
                      background: deal.status === 'active' ? 'rgba(0,198,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: deal.status === 'active' ? '1px solid rgba(0,198,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      color: deal.status === 'active' ? '#00C6FF' : '#8a8578',
                    }}
                  >
                    {deal.status}
                  </span>
                </div>
                <p className="text-text-dim text-xs font-body">
                  {deal.dealType} · ${Number(deal.assignmentFee || 0).toLocaleString()} assignment fee
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(deal)}
                  className="text-text-dim hover:text-cyan transition-colors"
                  title={deal.status === 'active' ? 'Mark closed' : 'Mark active'}
                >
                  {deal.status === 'active' ? <ToggleRight size={18} className="text-cyan" /> : <ToggleLeft size={18} />}
                </button>
                <button
                  onClick={() => { setEditingDeal(deal); setShowForm(true) }}
                  className="text-text-dim hover:text-parchment transition-colors"
                  title="Edit"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(deal.id)}
                  className="text-text-dim hover:text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </WoodPanel>
        ))}
        {deals.length === 0 && (
          <p className="text-text-dim text-sm font-body text-center py-8">No deals yet. Add one above.</p>
        )}
      </div>
    </div>
  )
}
```

`DealForm` component (add above `LiveDealsAdmin`):
```jsx
function DealForm({ initial, onClose }) {
  const blank = { address: '', city: '', state: '', dealType: 'sub-to', assignmentFee: '', beds: '', baths: '', sqft: '', arv: '', pitch: '', status: 'active' }
  const [form, setForm] = useState(initial || blank)
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    const data = {
      ...form,
      assignmentFee: Number(form.assignmentFee) || 0,
      beds: Number(form.beds) || 0,
      baths: Number(form.baths) || 0,
      sqft: Number(form.sqft) || 0,
      arv: Number(form.arv) || 0,
      updatedAt: serverTimestamp(),
    }
    if (initial?.id) {
      await updateDoc(doc(db, 'liveDeals', initial.id), data)
    } else {
      await addDoc(collection(db, 'liveDeals'), { ...data, createdAt: serverTimestamp() })
    }
    setSaving(false)
    onClose()
  }

  const inputCls = 'w-full px-3 py-2 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors'
  const labelCls = 'block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase'

  return (
    <WoodPanel className="mb-5 border border-cyan/20">
      <h3 className="font-heading text-sm text-gold mb-4 tracking-wide uppercase">{initial ? 'Edit Deal' : 'New Deal'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div><label className={labelCls}>Address</label><input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St" /></div>
        <div><label className={labelCls}>City</label><input className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Austin" /></div>
        <div><label className={labelCls}>State</label><input className={inputCls} value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="TX" /></div>
        <div>
          <label className={labelCls}>Deal Type</label>
          <select className={inputCls} value={form.dealType} onChange={(e) => set('dealType', e.target.value)}>
            <option value="sub-to">Sub-To</option>
            <option value="seller-finance">Seller Finance</option>
            <option value="cash">Cash</option>
          </select>
        </div>
        <div><label className={labelCls}>Assignment Fee ($)</label><input className={inputCls} type="number" value={form.assignmentFee} onChange={(e) => set('assignmentFee', e.target.value)} placeholder="15000" /></div>
        <div><label className={labelCls}>ARV ($)</label><input className={inputCls} type="number" value={form.arv} onChange={(e) => set('arv', e.target.value)} placeholder="250000" /></div>
        <div><label className={labelCls}>Beds</label><input className={inputCls} type="number" value={form.beds} onChange={(e) => set('beds', e.target.value)} placeholder="3" /></div>
        <div><label className={labelCls}>Baths</label><input className={inputCls} type="number" value={form.baths} onChange={(e) => set('baths', e.target.value)} placeholder="2" /></div>
        <div><label className={labelCls}>Sqft</label><input className={inputCls} type="number" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} placeholder="1400" /></div>
        <div>
          <label className={labelCls}>Status</label>
          <select className={inputCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label className={labelCls}>Pitch (1-2 sentences)</label>
        <textarea className={inputCls + ' resize-none'} rows={2} value={form.pitch} onChange={(e) => set('pitch', e.target.value)} placeholder="Strong cashflow opportunity in a growing market..." />
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-sm font-heading text-xs tracking-widest uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 disabled:opacity-40">
          {saving ? 'Saving...' : 'Save Deal'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-sm font-heading text-xs tracking-widest uppercase text-text-dim border border-gold-dim/20 hover:text-parchment transition-colors">
          Cancel
        </button>
      </div>
    </WoodPanel>
  )
}
```

### Step 3: Verify

Navigate to `/admin` as an admin user. Confirm the tab bar appears, the Live Deals tab shows, and adding a deal via the form causes it to appear on `/live-deals`.

### Step 4: Commit

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: admin dashboard — Live Deals management tab with add/edit/delete/toggle"
```

---

## Task 6: Buy Boxes Page

**Files:**
- Modify: `frontend/src/pages/BuyBoxes.jsx`

### Step 1: Write the full page

```jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2 } from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const PROPERTY_TYPES = ['SFR', 'Duplex', 'Triplex', 'Multi', 'Land', 'Commercial']
const DEAL_TYPES = ['Sub-To', 'Seller Finance', 'Cash', 'Creative', 'Novation']

const inputCls =
  'w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-xs font-heading text-text-dim tracking-widest uppercase mb-1.5'

export default function BuyBoxes() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [markets, setMarkets] = useState('')
  const [propertyTypes, setPropertyTypes] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [dealTypes, setDealTypes] = useState([])
  const [closeTimeline, setCloseTimeline] = useState('')
  const [notes, setNotes] = useState('')

  // Load existing buy box on mount
  useEffect(() => {
    if (!user?.uid) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      if (snap.exists() && snap.data().buyBox) {
        const bb = snap.data().buyBox
        setSaved(bb)
        setMarkets(bb.markets?.join(', ') || '')
        setPropertyTypes(bb.propertyTypes || [])
        setMinPrice(bb.minPrice || '')
        setMaxPrice(bb.maxPrice || '')
        setDealTypes(bb.dealTypes || [])
        setCloseTimeline(bb.closeTimeline || '')
        setNotes(bb.notes || '')
      }
    })
  }, [user?.uid])

  function toggleItem(list, setList, item) {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])
  }

  async function handleSubmit() {
    if (!user?.uid) return
    setSaving(true)
    const buyBox = {
      markets: markets.split(',').map((s) => s.trim()).filter(Boolean),
      propertyTypes,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 0,
      dealTypes,
      closeTimeline,
      notes,
      updatedAt: new Date().toISOString(),
    }
    await updateDoc(doc(db, 'users', user.uid), { buyBox })
    setSaved(buyBox)
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
            <Target size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              Buy Boxes
            </h1>
            <p className="text-text-dim text-base mt-1 font-body">
              Submit your criteria and we'll match you to deals that fit
            </p>
          </div>
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — Form */}
        <motion.div variants={itemVariants}>
          <WoodPanel headerBar="Your Buy Box Criteria">
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Markets / States</label>
                <input
                  className={inputCls}
                  value={markets}
                  onChange={(e) => setMarkets(e.target.value)}
                  placeholder="TX, FL, Phoenix AZ, Nashville TN"
                />
                <p className="text-text-muted text-xs mt-1 font-body">Comma-separated states or metro areas</p>
              </div>

              <div>
                <label className={labelCls}>Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map((pt) => (
                    <button
                      key={pt}
                      onClick={() => toggleItem(propertyTypes, setPropertyTypes, pt)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-heading tracking-wide transition-all duration-150 ${
                        propertyTypes.includes(pt)
                          ? 'bg-gold/15 border border-gold-dim/40 text-gold'
                          : 'bg-white/5 border border-white/10 text-text-dim hover:border-white/20'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Min Price</label>
                  <input className={inputCls} type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="50000" />
                </div>
                <div>
                  <label className={labelCls}>Max Price</label>
                  <input className={inputCls} type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="300000" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Deal Types</label>
                <div className="flex flex-wrap gap-2">
                  {DEAL_TYPES.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => toggleItem(dealTypes, setDealTypes, dt)}
                      className={`px-3 py-1.5 rounded-sm text-xs font-heading tracking-wide transition-all duration-150 ${
                        dealTypes.includes(dt)
                          ? 'bg-cyan/10 border border-cyan/35 text-cyan'
                          : 'bg-white/5 border border-white/10 text-text-dim hover:border-white/20'
                      }`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Preferred Close Timeline</label>
                <input className={inputCls} value={closeTimeline} onChange={(e) => setCloseTimeline(e.target.value)} placeholder="14–30 days" />
              </div>

              <div>
                <label className={labelCls}>Additional Notes</label>
                <textarea
                  className={inputCls + ' resize-none'}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other criteria, deal preferences, or deal-breakers..."
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : justSaved ? (
                  <><CheckCircle2 size={16} /> Saved!</>
                ) : (
                  'Save My Buy Box'
                )}
              </button>
            </div>
          </WoodPanel>
        </motion.div>

        {/* Right — Saved summary */}
        <motion.div variants={itemVariants}>
          {saved ? (
            <WoodPanel headerBar="Your Criteria on File" glow>
              <div className="space-y-3">
                {saved.markets?.length > 0 && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Markets</span>
                    <p className="text-parchment text-sm font-body mt-0.5">{saved.markets.join(', ')}</p>
                  </div>
                )}
                {saved.propertyTypes?.length > 0 && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Property Types</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {saved.propertyTypes.map((pt) => (
                        <span key={pt} className="px-2 py-0.5 rounded-full text-[11px] font-heading bg-gold/10 border border-gold-dim/25 text-gold">{pt}</span>
                      ))}
                    </div>
                  </div>
                )}
                {(saved.minPrice || saved.maxPrice) && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Price Range</span>
                    <p className="text-parchment text-sm font-body mt-0.5">
                      ${Number(saved.minPrice || 0).toLocaleString()} – ${Number(saved.maxPrice || 0).toLocaleString()}
                    </p>
                  </div>
                )}
                {saved.dealTypes?.length > 0 && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Deal Types</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {saved.dealTypes.map((dt) => (
                        <span key={dt} className="px-2 py-0.5 rounded-full text-[11px] font-heading bg-cyan/8 border border-cyan/25 text-cyan">{dt}</span>
                      ))}
                    </div>
                  </div>
                )}
                {saved.closeTimeline && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Close Timeline</span>
                    <p className="text-parchment text-sm font-body mt-0.5">{saved.closeTimeline}</p>
                  </div>
                )}
                {saved.notes && (
                  <div>
                    <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Notes</span>
                    <p className="text-text-dim text-sm leading-relaxed font-body mt-0.5">{saved.notes}</p>
                  </div>
                )}
                {saved.updatedAt && (
                  <p className="text-text-muted text-xs font-body mt-4">
                    Last updated {new Date(saved.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </WoodPanel>
          ) : (
            <WoodPanel>
              <div className="text-center py-10">
                <div className="hanko-seal w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-white" />
                </div>
                <h3 className="font-heading text-base text-gold tracking-wide mb-2">No Buy Box on File</h3>
                <p className="text-text-dim text-xs font-body leading-relaxed">
                  Fill out the form and save your criteria. We'll notify you when a deal matches.
                </p>
              </div>
            </WoodPanel>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
```

### Step 2: Verify

Navigate to `/buy-boxes`. Fill in the form and submit. Confirm the right panel updates to show the saved criteria. Reload the page and confirm criteria persists from Firestore.

### Step 3: Commit

```bash
git add frontend/src/pages/BuyBoxes.jsx
git commit -m "feat: add Buy Boxes page with Firestore profile save and criteria display"
```

---

## Task 7: Admin Dashboard — Buyer List Tab

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

### Step 1: Add Buyer List tab content

In `AdminDashboard`, add a `BuyerListAdmin` component that reads all users from `useAuth().users` and filters to those with a `buyBox` field set.

Note: The `useAuth` hook already provides `users` — check how it's used in the existing admin page. If `users` doesn't include `buyBox`, this may require a separate Firestore query. Use a `useEffect` + `onSnapshot` on `collection(db, 'users')` if needed.

```jsx
function BuyerListAdmin() {
  const [buyers, setBuyers] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const withBuyBox = snap.docs
        .map((d) => ({ uid: d.id, ...d.data() }))
        .filter((u) => u.buyBox)
      setBuyers(withBuyBox)
    })
    return unsub
  }, [])

  return (
    <div>
      <h2 className="font-heading text-lg text-gold tracking-wide mb-5">Buyer List</h2>
      {buyers.length === 0 ? (
        <p className="text-text-dim text-sm font-body text-center py-8">No buyers have submitted criteria yet.</p>
      ) : (
        <div className="space-y-3">
          {buyers.map((buyer) => {
            const bb = buyer.buyBox
            const isExpanded = expanded === buyer.uid
            return (
              <WoodPanel key={buyer.uid}>
                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(isExpanded ? null : buyer.uid)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <span className="font-heading text-sm text-parchment tracking-wide">{buyer.displayName || buyer.email}</span>
                      <span className="text-text-muted text-xs ml-2 font-body">{buyer.email}</span>
                    </div>
                    <div className="text-right text-xs text-text-dim font-body">
                      {bb.markets?.join(', ') || '—'} · ${Number(bb.minPrice || 0).toLocaleString()}–${Number(bb.maxPrice || 0).toLocaleString()}
                    </div>
                  </div>
                </button>
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gold-dim/10 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Deal Types</span><p className="text-parchment mt-0.5">{bb.dealTypes?.join(', ') || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Property Types</span><p className="text-parchment mt-0.5">{bb.propertyTypes?.join(', ') || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Close Timeline</span><p className="text-parchment mt-0.5">{bb.closeTimeline || '—'}</p></div>
                    <div><span className="text-text-dim font-heading uppercase tracking-wider">Last Updated</span><p className="text-parchment mt-0.5">{bb.updatedAt ? new Date(bb.updatedAt).toLocaleDateString() : '—'}</p></div>
                    {bb.notes && <div className="col-span-2"><span className="text-text-dim font-heading uppercase tracking-wider">Notes</span><p className="text-parchment mt-0.5">{bb.notes}</p></div>}
                  </div>
                )}
              </WoodPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

Add to the tab render logic:
```jsx
{activeTab === 'buyer-list' && (
  <BuyerListAdmin />
)}
```

### Step 2: Verify

Navigate to `/admin` → Buyer List tab. After a user submits a buy box in Task 6, confirm their entry appears here with expandable details.

### Step 3: Commit

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: admin dashboard — Buyer List tab showing all users with buy box criteria"
```

---

## Task 8: Backend — `/api/comps` Endpoint

**Files:**
- Modify: `agent_finder/app.py`

### Step 1: Add the comps endpoint

Add after the existing route definitions in `app.py`:

```python
import re as _re

@api.get("/comps")
async def get_comps(address: str):
    """
    Pull sold comps near a given address using HomeHarvest.
    Tries progressively wider date ranges: 3 → 6 → 9 → 12 months.
    Returns at least 3 comps or an empty list.
    """
    try:
        from homeharvest import scrape_property
    except ImportError:
        raise HTTPException(status_code=500, detail="HomeHarvest not installed")

    # Extract zip code or use city/state from address for location
    zip_match = _re.search(r'\b(\d{5})\b', address)
    location = zip_match.group(1) if zip_match else address

    comps = []
    for months in [3, 6, 9, 12]:
        try:
            import asyncio
            loop = asyncio.get_event_loop()

            def _scrape():
                from datetime import date, timedelta
                end = date.today()
                start = end - timedelta(days=months * 30)
                df = scrape_property(
                    location=location,
                    listing_type="sold",
                    date_from=start.strftime("%Y-%m-%d"),
                    date_to=end.strftime("%Y-%m-%d"),
                    limit=10,
                )
                return df

            df = await loop.run_in_executor(None, _scrape)

            if df is None or len(df) == 0:
                continue

            # Normalize columns — HomeHarvest column names may vary
            # Common columns: list_price, sold_price, days_on_market, full_street_line, city
            results = []
            for _, row in df.iterrows():
                list_price = float(row.get('list_price') or row.get('price') or 0)
                sold_price = float(row.get('sold_price') or row.get('close_price') or list_price)
                dom = int(row.get('days_on_market') or row.get('dom') or 0)
                addr = str(row.get('full_street_line') or row.get('street') or '')
                city = str(row.get('city') or '')

                if list_price <= 0:
                    continue

                pct_under = round((list_price - sold_price) / list_price * 100, 1) if list_price > 0 else 0

                results.append({
                    'address': f"{addr}, {city}".strip(', '),
                    'listPrice': list_price,
                    'soldPrice': sold_price,
                    'pctUnderList': pct_under,
                    'dom': dom,
                })

            if len(results) >= 3:
                comps = results[:5]  # cap at 5
                break

            if len(results) > 0:
                comps = results  # keep partial, keep trying

        except Exception as e:
            # Log but continue to next month range
            import logging
            logging.getLogger("agent_finder.comps").warning("Comp scrape failed (%d mo): %s", months, e)
            continue

    if not comps:
        return {"comps": [], "avgPctUnderList": 0, "avgDom": 0, "note": "No comps found"}

    avg_pct = round(sum(c['pctUnderList'] for c in comps) / len(comps), 1)
    avg_dom = round(sum(c['dom'] for c in comps) / len(comps))

    return {
        "comps": comps,
        "avgPctUnderList": avg_pct,
        "avgDom": avg_dom,
    }
```

Register the router if not already done (check the bottom of `app.py` — it likely has `app.include_router(api)`):
```python
app.include_router(api)
```

### Step 2: Test the endpoint manually

With the backend running (`uvicorn agent_finder.app:app --port 9000`), test:

```bash
curl "http://localhost:9000/api/comps?address=Austin+TX+78701"
```

Expected: JSON with `comps` array, `avgPctUnderList`, `avgDom`.

If HomeHarvest returns no results for a zip, you'll get `{"comps": [], ...}` — that's acceptable.

### Step 3: Commit

```bash
git add agent_finder/app.py
git commit -m "feat: add /api/comps endpoint using HomeHarvest for sold comps by address"
```

---

## Task 9: Offer Comparison Page — Full Implementation

**Files:**
- Modify: `frontend/src/pages/OfferComparison.jsx`

### Step 1: Write the full page

This is the most complex page. It has three phases: Input → Comp Pull → Results + History.

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Info, Download, History, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'
import ShurikenLoader from '../components/ShurikenLoader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:9000'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const inputCls =
  'w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-xs font-heading text-text-dim tracking-widest uppercase mb-1.5'

function fmt(n) {
  if (n == null || n === '') return '—'
  return '$' + Number(n).toLocaleString()
}

function pct(n) {
  return n != null ? `${n.toFixed(1)}%` : '—'
}

// ─── Address Autocomplete (reuse pattern from RentComps) ──────────────────────
function useAddressAutocomplete(query_) {
  const [suggestions, setSuggestions] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query_ || query_.length < 4) { setSuggestions([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({ q: query_, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'us' }),
          { headers: { 'Accept-Language': 'en-US' } }
        )
        const data = await resp.json()
        setSuggestions(
          data
            .filter((r) => r.address?.road || r.address?.house_number)
            .map((r) => {
              const a = r.address
              return [
                a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
                a.city || a.town || a.village || a.county,
                a.state,
                a.postcode,
              ].filter(Boolean).join(', ')
            })
        )
      } catch { setSuggestions([]) }
    }, 350)
    return () => clearTimeout(timerRef.current)
  }, [query_])

  return suggestions
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(address, inputs, comps, results) {
  const doc = new jsPDF()
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  doc.setFontSize(18)
  doc.text('OFFER COMPARISON', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Property: ${address}`, 20, 32)
  doc.text(`Generated: ${today}`, 20, 38)
  doc.text('Dispo Dojo — Use this tool when needed.', 20, 44)

  let y = 55
  doc.setFontSize(12)
  doc.text('Side-by-Side Comparison', 20, y); y += 8
  doc.setFontSize(9)

  const rows = [
    ['', 'Our Offer', 'Traditional Sale'],
    ['Gross', fmt(inputs.purchasePrice), fmt(results.listEst)],
    ['Agent Commissions', '$0', `-6% (${fmt(results.agentComm)})`],
    ['Seller Closing Costs', '$0', `-2% (${fmt(results.closingCosts)})`],
    ['Buyer Concessions', '$0', `-1.5% (${fmt(results.concessions)})`],
    ['Inspection Credits', '$0', `-0.75% (${fmt(results.inspectionCredits)})`],
    ['Estimated Net', fmt(inputs.purchasePrice), `${fmt(results.tradNetLow)} – ${fmt(results.tradNetHigh)}`],
    ['Timeline', `${inputs.closeTimeline || 14} days`, `${results.tradTimeline} days`],
    ['Certainty', 'Guaranteed close', 'Contingent'],
  ]

  rows.forEach((row, i) => {
    doc.text(row[0], 20, y)
    doc.text(row[1], 90, y)
    doc.text(row[2], 145, y)
    y += 6
  })

  if (comps.length > 0) {
    y += 6
    doc.setFontSize(12)
    doc.text('Market Comps', 20, y); y += 8
    doc.setFontSize(9)
    doc.text(['Address', 'List', 'Sold', '% Under', 'DOM'].join('   '), 20, y); y += 6
    comps.forEach((c) => {
      doc.text([
        (c.address || '').slice(0, 28),
        fmt(c.listPrice),
        fmt(c.soldPrice),
        pct(c.pctUnderList),
        String(c.dom),
      ].join('   '), 20, y)
      y += 6
    })
    y += 4
    doc.text(`Avg % Under List: ${pct(results.avgPctUnderList)}   Avg DOM: ${results.avgDom} days`, 20, y)
  }

  y += 12
  doc.setFontSize(8)
  doc.text(
    'Disclaimer: This comparison is a support tool. Results vary based on market conditions, deal structure, and seller goals.',
    20, y, { maxWidth: 170 }
  )

  doc.save(`offer-comparison-${address.replace(/[^a-z0-9]/gi, '-').slice(0, 30)}.pdf`)
}

// ─── Comparison Calculator ───────────────────────────────────────────────────
function calcResults(inputs, compData) {
  const purchase = Number(inputs.purchasePrice) || 0
  const avgPct = compData?.avgPctUnderList || 0
  const avgDom = compData?.avgDom || 45

  // Estimate list price based on purchase price + market spread
  // (purchase price is what we pay; list price would be what seller expects)
  const listEst = purchase > 0 ? Math.round(purchase / (1 - avgPct / 100)) : 0

  const agentComm = Math.round(listEst * 0.06)
  const closingCosts = Math.round(listEst * 0.02)
  const concessions = Math.round(listEst * 0.015)
  const inspectionCredits = Math.round(listEst * 0.0075)

  const tradNetBase = listEst - agentComm - closingCosts - concessions - inspectionCredits
  // Show range: low = -2% extra, high = +1% (variance)
  const tradNetLow = Math.round(tradNetBase * 0.98)
  const tradNetHigh = Math.round(tradNetBase * 1.01)

  const tradTimeline = avgDom + 45 // DOM + closing time

  return { listEst, agentComm, closingCosts, concessions, inspectionCredits, tradNetLow, tradNetHigh, tradTimeline, avgPctUnderList: avgPct, avgDom }
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OfferComparison() {
  const { user } = useAuth()

  // Form state
  const [address, setAddress] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const suggestions = useAddressAutocomplete(addressQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [purchasePrice, setPurchasePrice] = useState('')
  const [cashToSeller, setCashToSeller] = useState('')
  const [closeTimeline, setCloseTimeline] = useState('14')
  const [skipInspection, setSkipInspection] = useState(true)
  const [skipAppraisal, setSkipAppraisal] = useState(true)
  const [noRenegotiation, setNoRenegotiation] = useState(true)

  // Comp + results state
  const [comps, setComps] = useState(null)
  const [compError, setCompError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  // History
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load history from Firestore
  useEffect(() => {
    if (!user?.uid) return
    const q = query(
      collection(db, 'users', user.uid, 'comparisons'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [user?.uid])

  async function handleRun() {
    if (!address || !purchasePrice) return
    setLoading(true)
    setComps(null)
    setResults(null)
    setCompError(null)

    let compData = null
    try {
      const resp = await fetch(`${API}/api/comps?address=${encodeURIComponent(address)}`)
      if (resp.ok) {
        compData = await resp.json()
        setComps(compData)
      } else {
        setCompError('Could not fetch comps. Comparison will use market estimates.')
      }
    } catch {
      setCompError('Comp pull failed — running comparison without market data.')
    }

    const inputs = { purchasePrice, cashToSeller, closeTimeline, skipInspection, skipAppraisal, noRenegotiation }
    const res = calcResults(inputs, compData)
    setResults(res)

    // Save to Firestore history
    if (user?.uid) {
      try {
        await addDoc(collection(db, 'users', user.uid, 'comparisons'), {
          address,
          inputs,
          comps: compData?.comps || [],
          results: res,
          createdAt: serverTimestamp(),
        })
      } catch (e) {
        console.warn('Could not save comparison history', e)
      }
    }

    setLoading(false)
  }

  function loadHistoryItem(item) {
    setAddress(item.address)
    setAddressQuery(item.address)
    setPurchasePrice(item.inputs?.purchasePrice || '')
    setCashToSeller(item.inputs?.cashToSeller || '')
    setCloseTimeline(item.inputs?.closeTimeline || '14')
    setSkipInspection(item.inputs?.skipInspection ?? true)
    setSkipAppraisal(item.inputs?.skipAppraisal ?? true)
    setNoRenegotiation(item.inputs?.noRenegotiation ?? true)
    setComps(item.comps?.length ? { comps: item.comps, avgPctUnderList: item.results?.avgPctUnderList, avgDom: item.results?.avgDom } : null)
    setResults(item.results || null)
    setShowHistory(false)
  }

  const inputs = { purchasePrice, cashToSeller, closeTimeline }
  const canRun = address && purchasePrice

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1000px] mx-auto"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
                Offer Comparison
              </h1>
              <p className="text-text-dim text-base mt-1 font-body">
                Our offer vs. the traditional sale — numbers don't lie
              </p>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-heading text-xs tracking-widest uppercase text-text-dim border border-gold-dim/20 hover:text-parchment hover:border-gold-dim/40 transition-colors"
            >
              <History size={14} /> History {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Disclaimer Banner */}
      <motion.div variants={itemVariants} className="mb-6">
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-sm border"
          style={{ background: 'rgba(246,196,69,0.05)', borderColor: 'rgba(246,196,69,0.2)' }}
        >
          <Info size={18} className="text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-parchment text-sm font-heading tracking-wide mb-1">Use this tool when needed.</p>
            <p className="text-text-dim text-xs leading-relaxed font-body">
              This comparison depends on the seller's goals and deal structure. It's a strong support tool for agents to take back to sellers — showing a realistic traditional net vs. a guaranteed, clean close with us.
            </p>
          </div>
        </div>
      </motion.div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <WoodPanel headerBar="Past Comparisons">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left flex items-center justify-between gap-4 px-3 py-2.5 rounded-sm hover:bg-white/5 transition-colors"
                  >
                    <span className="font-body text-sm text-parchment truncate">{item.address}</span>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gold font-heading">{fmt(item.inputs?.purchasePrice)} offer</div>
                      <div className="text-xs text-text-muted font-body">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </WoodPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <motion.div variants={itemVariants} className="mb-6">
        <WoodPanel headerBar="Deal Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Address with autocomplete */}
            <div className="sm:col-span-2 relative">
              <label className={labelCls}>Property Address</label>
              <input
                className={inputCls}
                value={addressQuery}
                onChange={(e) => { setAddressQuery(e.target.value); setAddress(e.target.value); setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="123 Main St, Austin TX 78701"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-sm border border-gold-dim/20 bg-[#111B24] shadow-xl overflow-hidden">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => { setAddress(s); setAddressQuery(s); setShowSuggestions(false) }}
                      className="w-full text-left px-3 py-2.5 text-sm text-parchment hover:bg-white/5 transition-colors font-body border-b border-gold-dim/10 last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Our Purchase Price</label>
              <input className={inputCls} type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="185000" />
            </div>
            <div>
              <label className={labelCls}>Cash to Seller</label>
              <input className={inputCls} type="number" value={cashToSeller} onChange={(e) => setCashToSeller(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className={labelCls}>Close Timeline (days)</label>
              <input className={inputCls} type="number" value={closeTimeline} onChange={(e) => setCloseTimeline(e.target.value)} placeholder="14" />
            </div>

            {/* Checkboxes */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Our Offer Includes</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Skip Inspection', state: skipInspection, set: setSkipInspection },
                  { label: 'Skip Appraisal', state: skipAppraisal, set: setSkipAppraisal },
                  { label: 'No Mid-Process Renegotiation', state: noRenegotiation, set: setNoRenegotiation },
                ].map(({ label, state, set }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => set(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan"
                    />
                    <span className="text-sm font-body text-text-dim">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleRun}
              disabled={!canRun || loading}
              className="w-full sm:w-auto px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <><motion.div className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} /> Running Comparison...</>
              ) : (
                'Run Comparison'
              )}
            </button>
          </div>
        </WoodPanel>
      </motion.div>

      {/* Comp Warning */}
      {compError && (
        <motion.div
          variants={itemVariants}
          className="mb-4 flex items-start gap-2 px-4 py-3 rounded-sm border"
          style={{ background: 'rgba(229,57,53,0.06)', borderColor: 'rgba(229,57,53,0.2)' }}
        >
          <AlertCircle size={15} className="text-crimson shrink-0 mt-0.5" />
          <p className="text-text-dim text-xs font-body">{compError}</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Side-by-side comparison */}
            <WoodPanel headerBar="Side-by-Side Comparison" glow>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gold-dim/15">
                      <th className="text-left py-2 pr-4 font-heading text-xs text-text-dim tracking-widest uppercase w-1/3"></th>
                      <th className="text-center py-2 px-3 font-heading text-xs text-cyan tracking-widest uppercase">Our Offer</th>
                      <th className="text-center py-2 px-3 font-heading text-xs text-text-dim tracking-widest uppercase">Traditional Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold-dim/8">
                    {[
                      { label: 'Gross', our: fmt(purchasePrice), trad: fmt(results.listEst) + ' (est. list)' },
                      { label: 'Agent Commissions', our: '$0', trad: `−6%  (${fmt(results.agentComm)})` },
                      { label: 'Seller Closing Costs', our: '$0', trad: `−2%  (${fmt(results.closingCosts)})` },
                      { label: 'Buyer Concessions', our: '$0', trad: `−1.5%  (${fmt(results.concessions)})` },
                      { label: 'Inspection Credits', our: '$0', trad: `−0.75%  (${fmt(results.inspectionCredits)})` },
                      { label: 'Appraisal Risk', our: 'None', trad: 'Possible deal fallthrough' },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">{row.label}</td>
                        <td className="py-2.5 px-3 text-center text-parchment font-body text-xs">{row.our}</td>
                        <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">{row.trad}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-gold-dim/25">
                      <td className="py-3 pr-4 font-heading text-sm text-parchment tracking-wide">Estimated Net</td>
                      <td className="py-3 px-3 text-center font-heading text-gold text-base">{fmt(purchasePrice)}</td>
                      <td className="py-3 px-3 text-center font-heading text-text-dim text-sm">{fmt(results.tradNetLow)} – {fmt(results.tradNetHigh)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">Timeline</td>
                      <td className="py-2.5 px-3 text-center text-cyan font-body text-xs">{closeTimeline || 14} days</td>
                      <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">{results.tradTimeline}+ days</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">Certainty</td>
                      <td className="py-2.5 px-3 text-center font-body text-xs">
                        <span className="inline-flex items-center gap-1 text-bamboo"><CheckCircle2 size={12} /> Guaranteed close</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">Contingent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </WoodPanel>

            {/* Comps table */}
            {comps?.comps?.length > 0 && (
              <WoodPanel headerBar="Market Comps">
                <p className="text-text-dim text-xs font-body mb-3">
                  Sold comps near <span className="text-parchment">{address}</span> — avg <span className="text-gold font-heading">{pct(results.avgPctUnderList)}</span> under list, <span className="text-gold font-heading">{results.avgDom} days</span> on market
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gold-dim/15">
                        {['Address', 'List Price', 'Sold Price', '% Under List', 'DOM'].map((h) => (
                          <th key={h} className="text-left py-2 pr-4 font-heading text-text-dim tracking-widest uppercase text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gold-dim/8">
                      {comps.comps.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 text-parchment font-body">{c.address || '—'}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{fmt(c.listPrice)}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{fmt(c.soldPrice)}</td>
                          <td className="py-2 pr-4 font-heading" style={{ color: c.pctUnderList > 3 ? '#E53935' : '#F6C445' }}>{pct(c.pctUnderList)}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{c.dom ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WoodPanel>
            )}

            {/* Download button */}
            <div className="flex justify-end">
              <button
                onClick={() => generatePDF(address, inputs, comps?.comps || [], results)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-gold border border-gold-dim/30 hover:bg-gold/10 hover:border-gold-dim/50 transition-all duration-200"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
```

### Step 2: Verify

Navigate to `/offer-comparison`. Enter an address and purchase price, run the comparison. Confirm:
- Side-by-side table renders with calculated values
- Comp table appears if the backend returns data (requires backend running)
- PDF downloads with correct data
- Run shows in history after refresh

### Step 3: Commit

```bash
git add frontend/src/pages/OfferComparison.jsx
git commit -m "feat: add Offer Comparison page with comp pull, calculator, PDF export, and history"
```

---

## Task 10: Firestore Security Rules

**Files:**
- Modify: `firestore.rules`

### Step 1: Add rules for new collections

Read the current `firestore.rules` file first, then add rules for `liveDeals` and the `comparisons` subcollection:

```
// liveDeals: anyone logged in can read; only admins can write
match /liveDeals/{dealId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

// comparisons subcollection: users can only read/write their own
match /users/{uid}/comparisons/{compId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}
```

### Step 2: Deploy rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Commit

```bash
git add firestore.rules
git commit -m "feat: firestore rules — liveDeals (admin write) and comparisons subcollection"
```

---

## Task 11: Final QA + Deploy

### Step 1: Full smoke test checklist

- [ ] `/lead-scrubbing` — banner shows, 3 video cards render
- [ ] Sidebar — Sales Tools section present, Live Deals in top nav, Buy Boxes in Deal Management, Call Recordings in Resources
- [ ] `/call-recordings` — 8 Coming Soon cards render
- [ ] `/live-deals` — empty state or deals from Firestore; inquiry modal works
- [ ] `/admin` → Live Deals tab — add/edit/delete deal; toggling status works; added deal appears on `/live-deals`
- [ ] `/admin` → Buyer List tab — shows users who submitted buy boxes
- [ ] `/buy-boxes` — form submits to Firestore; right panel shows saved criteria; reload persists data
- [ ] `/offer-comparison` — input form → run → results table renders; PDF downloads; history saves and loads

### Step 2: Build and deploy

```bash
cd frontend && npm run build
npx vercel --prod
```

### Step 3: Final commit

```bash
git add -A
git commit -m "feat: platform expansion v2 complete — Finding Leads, Sales Tools, Offer Comparison, Call Recordings, Live Deals, Buy Boxes"
```

---

## Summary of Files Changed

| File | Action |
|---|---|
| `frontend/src/pages/LeadScrubbing.jsx` | Modified |
| `frontend/src/components/Sidebar.jsx` | Modified |
| `frontend/src/App.jsx` | Modified |
| `frontend/src/pages/AdminDashboard.jsx` | Modified |
| `frontend/src/pages/OfferComparison.jsx` | Created |
| `frontend/src/pages/CallRecordings.jsx` | Created |
| `frontend/src/pages/LiveDeals.jsx` | Created |
| `frontend/src/pages/BuyBoxes.jsx` | Created |
| `agent_finder/app.py` | Modified |
| `firestore.rules` | Modified |

## Environment Variables to Add

```
VITE_DISCORD_DEALS_WEBHOOK=<discord-webhook-url-for-deal-inquiries>
```
