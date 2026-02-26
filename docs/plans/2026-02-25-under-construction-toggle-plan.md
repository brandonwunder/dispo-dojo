# Under Construction Toggle System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Admin-controlled page toggle system that lets you mark any page as "Under Construction" from the admin panel, with instant real-time propagation to all users via Firestore.

**Architecture:** A Firestore document (`config/pageStatus`) stores page statuses. A React context subscribes via `onSnapshot` for real-time updates. A `PageGate` wrapper on each route checks the status and renders either the real page or a themed Under Construction component. The admin panel gets a new "Page Management" tab with toggle switches.

**Tech Stack:** React 19, Firebase Firestore (real-time `onSnapshot`), Framer Motion, Tailwind CSS v4, Lucide icons

---

### Task 1: Create PageStatusContext

**Files:**
- Create: `frontend/src/context/PageStatusContext.jsx`

**Step 1: Create the context file**

```jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const PageStatusContext = createContext({ pageStatuses: {}, isPageLive: () => true, updatePageStatus: async () => {} })

// All toggleable pages with display names
export const TOGGLEABLE_PAGES = [
  { slug: 'lead-scrubbing', label: 'Finding Leads' },
  { slug: 'agent-finder', label: 'Find Agent Emails' },
  { slug: 'loi-sender', label: 'LOI Sender' },
  { slug: 'bird-dog', label: 'Bird Dogging' },
  { slug: 'website-explainer', label: 'Subject-To Explainer' },
  { slug: 'offer-comparison', label: 'Offer Comparison' },
  { slug: 'underwriting', label: 'Free Underwriting' },
  { slug: 'contract-generator', label: 'Contract Generator' },
  { slug: 'find-buyers', label: 'Find Buyers' },
  { slug: 'buy-boxes', label: 'Buy Boxes' },
  { slug: 'boots-on-ground', label: 'Boots on Ground' },
  { slug: 'live-deals', label: 'Active Deals' },
  { slug: 'scripts', label: 'Scripts & Objections' },
  { slug: 'direct-agent', label: 'DTA Process' },
  { slug: 'call-recordings', label: 'Call Recordings' },
  { slug: 'community', label: 'Message Board' },
]

export function PageStatusProvider({ children }) {
  const [pageStatuses, setPageStatuses] = useState({})

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'pageStatus'), (snap) => {
      if (snap.exists()) {
        setPageStatuses(snap.data().pages || {})
      }
    })
    return unsub
  }, [])

  function isPageLive(slug) {
    // Default to live if not in the map
    return pageStatuses[slug] !== 'construction'
  }

  async function updatePageStatus(slug, status) {
    const updated = { ...pageStatuses, [slug]: status }
    await setDoc(doc(db, 'config', 'pageStatus'), { pages: updated }, { merge: true })
  }

  return (
    <PageStatusContext.Provider value={{ pageStatuses, isPageLive, updatePageStatus }}>
      {children}
    </PageStatusContext.Provider>
  )
}

export function usePageStatus() {
  return useContext(PageStatusContext)
}
```

**Step 2: Commit**

```bash
git add frontend/src/context/PageStatusContext.jsx
git commit -m "feat: add PageStatusContext with Firestore real-time page status"
```

---

### Task 2: Create UnderConstruction Component

**Files:**
- Create: `frontend/src/components/UnderConstruction.jsx`

**Step 1: Create the themed Under Construction page**

```jsx
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ShurikenIcon } from '../icons/index'
import { ArrowLeft } from 'lucide-react'

export default function UnderConstruction() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      {/* Spinning shuriken */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(246,196,69,0.15) 0%, transparent 70%)',
              transform: 'scale(2)',
            }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <ShurikenIcon size={80} style={{ color: '#F6C445', filter: 'drop-shadow(0 0 20px rgba(246,196,69,0.4))' }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-display text-4xl md:text-5xl mb-4"
        style={{
          color: '#F6C445',
          textShadow: '0 0 30px rgba(246,196,69,0.3), 0 0 60px rgba(246,196,69,0.1)',
        }}
      >
        Dojo Under Preparation
      </motion.h1>

      {/* Subtext */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-lg mb-2 max-w-md"
        style={{ color: '#C8D1DA', lineHeight: 1.7 }}
      >
        The sensei is sharpening this blade.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="text-sm mb-10 max-w-md"
        style={{ color: '#8a9bae', lineHeight: 1.7 }}
      >
        This section is being crafted and will be available soon. Check back shortly.
      </motion.p>

      {/* Back to Dashboard button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        onClick={() => navigate('/')}
        className="flex items-center gap-2 px-6 py-3 rounded-lg font-heading text-sm tracking-wide transition-transform"
        style={{
          background: 'linear-gradient(135deg, rgba(0,198,255,0.15), rgba(14,90,136,0.2))',
          border: '1px solid rgba(0,198,255,0.3)',
          color: '#00C6FF',
          boxShadow: '0 0 20px rgba(0,198,255,0.1)',
        }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </motion.button>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/UnderConstruction.jsx
git commit -m "feat: add themed Under Construction page component"
```

---

### Task 3: Wire PageStatusProvider and PageGate into App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Update App.jsx**

Add the import for the context and the UnderConstruction component at the top:

```jsx
import { PageStatusProvider, usePageStatus } from './context/PageStatusContext'
import UnderConstruction from './components/UnderConstruction'
```

Add a `PageGate` component after the existing `AdminRoute` component (around line 39):

```jsx
function PageGate({ slug, children }) {
  const { isPageLive } = usePageStatus()
  if (!isPageLive(slug)) {
    return <UnderConstruction />
  }
  return children
}
```

Wrap `<AuthProvider>` contents with `<PageStatusProvider>` — it goes INSIDE `AuthProvider` but OUTSIDE `BrowserRouter`:

```jsx
function App() {
  return (
    <AuthProvider>
      <PageStatusProvider>
        <BrowserRouter>
          ...
        </BrowserRouter>
      </PageStatusProvider>
    </AuthProvider>
  )
}
```

Wrap each toggleable route with `<PageGate slug="...">`. The routes that do NOT get gated are: Dashboard (index), Admin, NinjaProfile, Login. Every other content page gets wrapped. Example for each route:

```jsx
<Route path="agent-finder" element={<PageGate slug="agent-finder"><AgentFinder /></PageGate>} />
<Route path="find-buyers" element={<PageGate slug="find-buyers"><FindBuyers /></PageGate>} />
<Route path="lead-scrubbing" element={<PageGate slug="lead-scrubbing"><LeadScrubbing /></PageGate>} />
<Route path="underwriting" element={<PageGate slug="underwriting"><Underwriting /></PageGate>} />
<Route path="loi-sender" element={<PageGate slug="loi-sender"><LOISender /></PageGate>} />
<Route path="contract-generator" element={<PageGate slug="contract-generator"><ContractGenerator /></PageGate>} />
<Route path="direct-agent" element={<PageGate slug="direct-agent"><DirectAgent /></PageGate>} />
<Route path="scripts" element={<PageGate slug="scripts"><Scripts /></PageGate>} />
<Route path="website-explainer" element={<PageGate slug="website-explainer"><WebsiteExplainer /></PageGate>} />
<Route path="community" element={<PageGate slug="community"><Community /></PageGate>} />
<Route path="bird-dog" element={<PageGate slug="bird-dog"><BirdDog /></PageGate>} />
<Route path="boots-on-ground" element={<PageGate slug="boots-on-ground"><BootsOnGround /></PageGate>} />
<Route path="offer-comparison" element={<PageGate slug="offer-comparison"><OfferComparison /></PageGate>} />
<Route path="call-recordings" element={<PageGate slug="call-recordings"><CallRecordings /></PageGate>} />
<Route path="live-deals" element={<PageGate slug="live-deals"><LiveDeals /></PageGate>} />
<Route path="buy-boxes" element={<PageGate slug="buy-boxes"><BuyBoxes /></PageGate>} />
```

**Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: wire PageStatusProvider and PageGate into routing"
```

---

### Task 4: Add "Coming Soon" Badge to Sidebar

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Import usePageStatus at top of file**

Add to imports:
```jsx
import { usePageStatus } from '../context/PageStatusContext'
```

**Step 2: Update Sidebar component to read page statuses**

Inside the `Sidebar` function (around line 131), add:
```jsx
const { isPageLive } = usePageStatus()
```

**Step 3: Update the NavItem component to accept and display a badge**

The `NavItem` component (line 90) needs a `comingSoon` prop. When true, show a gold "Coming Soon" badge next to the label:

```jsx
function NavItem({ item, comingSoon }) {
  return (
    <NavLink to={item.to} end={item.to === '/'}>
      {({ isActive }) => (
        <motion.div
          className={`flex items-center gap-3 px-3 py-2.5 rounded-sm mb-0.5 transition-colors relative ${
            isActive
              ? 'bg-[rgba(0,198,255,0.08)]'
              : 'hover:bg-[rgba(0,198,255,0.05)]'
          }`}
          whileHover={{ x: 6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          style={{ touchAction: 'pan-y' }}
        >
          {isActive && (
            <div
              className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full"
              style={{
                background: 'linear-gradient(180deg, #00C6FF, #0E5A88, #00C6FF)',
                boxShadow: '0 0 14px rgba(0,198,255,0.5), 0 0 28px rgba(0,198,255,0.2)',
              }}
            />
          )}
          <item.icon
            size={20}
            className={isActive ? 'text-[#00C6FF]' : 'text-text-dim'}
          />
          <span
            className={`font-heading text-sm tracking-wide ${
              isActive ? 'text-[#00C6FF]' : 'text-text-dim'
            }`}
          >
            {item.label}
          </span>
          {comingSoon && (
            <span
              className="ml-auto text-[9px] font-heading tracking-wider uppercase px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                color: '#F6C445',
                background: 'rgba(246,196,69,0.1)',
                border: '1px solid rgba(246,196,69,0.25)',
                textShadow: '0 0 6px rgba(246,196,69,0.4)',
              }}
            >
              Soon
            </span>
          )}
        </motion.div>
      )}
    </NavLink>
  )
}
```

**Step 4: Pass comingSoon prop when rendering NavItem**

In the section rendering loop (around line 308-309), update the NavItem usage:

Change:
```jsx
{section.items.map((item) => (
  <NavItem key={item.to} item={item} />
))}
```

To:
```jsx
{section.items.map((item) => {
  const slug = item.to.replace('/', '')
  const comingSoon = slug && !isPageLive(slug)
  return <NavItem key={item.to} item={item} comingSoon={comingSoon} />
})}
```

Note: The gold "Active Deals" button at the top of the sidebar (lines 202-249) is already in place from a prior implementation. It does NOT need to be moved — it's already at the top. It should also get a "Coming Soon" badge if live-deals is under construction. Add this check around the gold button:

After the existing `<NavLink to="/live-deals">` block (line 204), check if live-deals is under construction and add a small "Coming Soon" badge to the gold button's label area. This can be done by adding a conditional badge after the "View Active Deals" span (around line 244):

```jsx
{!isPageLive('live-deals') && (
  <span
    className="text-[9px] font-heading tracking-wider uppercase px-1.5 py-0.5 rounded-full"
    style={{
      color: '#F6C445',
      background: 'rgba(246,196,69,0.15)',
      border: '1px solid rgba(246,196,69,0.3)',
    }}
  >
    Soon
  </span>
)}
```

**Step 5: Commit**

```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: add Coming Soon badge to sidebar for under-construction pages"
```

---

### Task 5: Add Page Management Tab to Admin Dashboard

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Add imports**

At the top of the file, add:
```jsx
import { usePageStatus, TOGGLEABLE_PAGES } from '../context/PageStatusContext'
```

Also add `Settings` to the lucide-react import (for the tab icon/use in the management section).

**Step 2: Add usePageStatus hook inside AdminDashboard**

Inside the `AdminDashboard` component (around line 1001 where `activeTab` state is declared), add:
```jsx
const { pageStatuses, updatePageStatus } = usePageStatus()
```

**Step 3: Add 'pages' tab to the tab bar**

In the tabs array (lines 1076-1081), add a new entry at the beginning:
```jsx
{ id: 'pages', label: 'Page Management' },
```

So the array becomes:
```jsx
[
  { id: 'pages', label: 'Page Management' },
  { id: 'members', label: 'Members' },
  { id: 'live-deals', label: 'Live Deals' },
  { id: 'buyer-list', label: 'Buyer List' },
  { id: 'bird-dogs', label: 'Bird Dogs' },
  { id: 'boots', label: 'Boots on Ground' },
]
```

**Step 4: Add the Page Management tab content**

Add the following right before the `{activeTab === 'members' && (` block (around line 1098):

```jsx
{activeTab === 'pages' && (
  <div>
    <div className="flex items-center gap-3 mb-6">
      <Settings size={20} style={{ color: '#00C6FF' }} />
      <h2 className="font-heading text-lg tracking-wide" style={{ color: '#F4F7FA' }}>
        Page Visibility Control
      </h2>
    </div>
    <p className="text-sm mb-6" style={{ color: '#8a9bae' }}>
      Toggle pages on or off. Pages marked "Under Construction" will show a themed placeholder to users. Changes apply instantly.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {TOGGLEABLE_PAGES.map((page) => {
        const isLive = pageStatuses[page.slug] !== 'construction'
        return (
          <GlassPanel key={page.slug} className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-heading text-sm tracking-wide truncate" style={{ color: '#F4F7FA' }}>
                {page.label}
              </p>
              <p className="text-xs mt-0.5" style={{ color: isLive ? '#4ade80' : '#F6C445' }}>
                {isLive ? 'Live' : 'Under Construction'}
              </p>
            </div>
            <button
              onClick={() => updatePageStatus(page.slug, isLive ? 'construction' : 'live')}
              className="shrink-0 transition-transform"
              style={{ color: isLive ? '#4ade80' : '#F6C445' }}
              title={isLive ? 'Click to set Under Construction' : 'Click to set Live'}
            >
              {isLive ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          </GlassPanel>
        )
      })}
    </div>
  </div>
)}
```

**Step 5: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: add Page Management tab to admin dashboard"
```

---

### Task 6: Initialize Firestore Document

**Files:**
- None (Firestore console or one-time script)

**Step 1: Seed the initial pageStatus document**

The Firestore document will auto-create when the admin first toggles a page. However, to ensure all pages start as "live" on first load, the `PageStatusContext` already defaults to live when a slug is missing from the map — so no explicit seeding is required.

**Step 2: Verify the full flow**

1. Start dev server: `cd frontend && npm run dev`
2. Log in as admin (`admin@dispodojo.com` / `GodFirst2026!`)
3. Go to Admin Panel → "Page Management" tab
4. Toggle a page (e.g., "Contract Generator") to "Under Construction"
5. Verify sidebar shows "Soon" badge on that page
6. Click the page — should show themed Under Construction component
7. Toggle it back to "Live" — page should immediately render normally
8. Log in as regular user — verify they see the same construction/live states

**Step 3: Commit any fixes needed**

```bash
git add -A
git commit -m "fix: address issues from manual testing"
```

---

### Task 7: Final Commit & Deploy

**Step 1: Ensure all changes are committed**

```bash
git status
```

**Step 2: Push and deploy**

```bash
git push origin master
cd frontend && npx vercel --prod
```
