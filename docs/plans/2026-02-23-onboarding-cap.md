# Onboarding Cap System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enforce a weekly 25-slot signup cap via Firestore, send waitlisted users to a Step 3 confirmation screen with their position number, and give the admin a live Waitlist control panel with batch activation.

**Architecture:** A single Firestore document (`onboarding_cap/config`) tracks the weekly count, cap, and paused state. A `waitlist` collection stores overflow signups. `signup()` in AuthContext becomes async and routes through a Firestore transaction. The SignUpModal gains a third step for waitlisted users. AdminDashboard gains a Waitlist tab with a live control panel and batch activation.

**Tech Stack:** React 19, Firestore (firebase/firestore), Framer Motion, Lucide React, Tailwind CSS v4, Vite

**Design doc:** `docs/plans/2026-02-23-onboarding-cap-design.md`

---

## Task 1: Create `onboardingCap.js` — all Firestore logic

**Files:**
- Create: `frontend/src/lib/onboardingCap.js`

This is the engine. All Firestore reads/writes live here. No UI.

**Step 1: Create the file with all exports**

```js
// frontend/src/lib/onboardingCap.js
import { db } from './firebase'
import {
  doc, getDoc, setDoc, updateDoc, runTransaction,
  collection, addDoc, query, where, orderBy, getDocs, writeBatch,
} from 'firebase/firestore'

const CAP_DOC_PATH = 'onboarding_cap'
const CAP_DOC_ID = 'config'
const WAITLIST_COL = 'waitlist'

function getCapRef() {
  return doc(db, CAP_DOC_PATH, CAP_DOC_ID)
}

// Returns today as "YYYY-MM-DD"
function today() {
  return new Date().toISOString().split('T')[0]
}

// Returns milliseconds since weekStart string
function msSinceDate(dateStr) {
  return Date.now() - new Date(dateStr).getTime()
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Attempt a signup through the cap check.
 * Returns one of:
 *   { success: true }                     — slot available, user gets in
 *   { waitlisted: true, position: N }     — cap hit, user added to waitlist
 *   { success: true, failOpen: true }     — Firestore error, fail open
 */
export async function attemptSignup(userData) {
  const capRef = getCapRef()

  try {
    // Transaction: atomically check cap and reserve a slot or waitlist position
    const txResult = await runTransaction(db, async (tx) => {
      const snap = await tx.get(capRef)

      // First ever call — initialize doc and let first user in
      if (!snap.exists()) {
        tx.set(capRef, {
          weekStart: today(),
          activeCount: 1,
          cap: 25,
          paused: false,
          launchedAt: today(),
          waitlistCount: 0,
        })
        return { success: true }
      }

      const data = snap.data()
      const cap = data.cap ?? 25
      const paused = data.paused ?? false
      let activeCount = data.activeCount ?? 0
      const waitlistCount = data.waitlistCount ?? 0
      let weekUpdates = {}

      // Auto-reset if week has rolled over
      if (msSinceDate(data.weekStart) >= WEEK_MS) {
        activeCount = 0
        weekUpdates = { activeCount: 0, weekStart: today() }
      }

      if (!paused && activeCount < cap) {
        // Slot available — increment and allow
        tx.update(capRef, { ...weekUpdates, activeCount: activeCount + 1 })
        return { success: true }
      } else {
        // Cap hit or paused — reserve next waitlist position
        const newWaitlistCount = waitlistCount + 1
        tx.update(capRef, { ...weekUpdates, waitlistCount: newWaitlistCount })
        const position = cap + newWaitlistCount
        const batchSize = cap
        const batchNumber = Math.ceil(newWaitlistCount / batchSize)
        return { needsWaitlist: true, position, batchNumber }
      }
    })

    if (txResult.success) return { success: true }

    if (txResult.needsWaitlist) {
      // Write to waitlist collection outside transaction (position already reserved)
      const waitlistRef = collection(db, WAITLIST_COL)
      await addDoc(waitlistRef, {
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        username: userData.username,
        password: userData.password,
        position: txResult.position,
        batchNumber: txResult.batchNumber,
        status: 'waiting',
        signedUpAt: new Date().toISOString(),
        activatedAt: null,
      })
      return { waitlisted: true, position: txResult.position }
    }

    return { success: true }
  } catch (err) {
    console.error('[onboardingCap] Transaction failed, failing open:', err)
    return { success: true, failOpen: true }
  }
}

/**
 * Read the current cap config for admin display.
 * Returns the doc data object or null.
 */
export async function getCapStatus() {
  try {
    const snap = await getDoc(getCapRef())
    if (!snap.exists()) return null
    return snap.data()
  } catch (err) {
    console.error('[onboardingCap] getCapStatus failed:', err)
    return null
  }
}

/**
 * Update cap config fields (cap, paused, weekStart, activeCount).
 * Pass only the fields you want to change.
 */
export async function updateCapSettings(updates) {
  try {
    await updateDoc(getCapRef(), updates)
  } catch (err) {
    console.error('[onboardingCap] updateCapSettings failed:', err)
    throw err
  }
}

/**
 * Reset the current week: set activeCount to 0 and weekStart to today.
 */
export async function resetWeek() {
  return updateCapSettings({ activeCount: 0, weekStart: today() })
}

/**
 * Get all waitlist entries grouped by batchNumber.
 * Returns: { batches: [{ batchNumber, entries: [...], allActivated: bool }], total: N }
 */
export async function getWaitlistBatches() {
  try {
    const q = query(
      collection(db, WAITLIST_COL),
      orderBy('position', 'asc')
    )
    const snap = await getDocs(q)
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

    // Group by batchNumber
    const batchMap = {}
    for (const entry of all) {
      const bn = entry.batchNumber ?? 1
      if (!batchMap[bn]) batchMap[bn] = []
      batchMap[bn].push(entry)
    }

    const batches = Object.keys(batchMap)
      .map(Number)
      .sort((a, b) => a - b)
      .map((bn) => ({
        batchNumber: bn,
        entries: batchMap[bn],
        allActivated: batchMap[bn].every((e) => e.status === 'active'),
      }))

    const total = all.filter((e) => e.status === 'waiting').length
    return { batches, total }
  } catch (err) {
    console.error('[onboardingCap] getWaitlistBatches failed:', err)
    return { batches: [], total: 0 }
  }
}

/**
 * Activate all waiting entries in a batch.
 * Returns array of activated user objects (for localStorage write).
 */
export async function activateBatch(batchNumber) {
  try {
    const q = query(
      collection(db, WAITLIST_COL),
      where('batchNumber', '==', batchNumber),
      where('status', '==', 'waiting')
    )
    const snap = await getDocs(q)
    if (snap.empty) return []

    const batch = writeBatch(db)
    const activatedAt = new Date().toISOString()
    const users = []

    snap.docs.forEach((d) => {
      batch.update(d.ref, { status: 'active', activatedAt })
      users.push({ id: d.id, ...d.data() })
    })

    await batch.commit()

    // GHL STUB — wire real API here when GHL is set up
    users.forEach((u) => {
      console.log('[GHL STUB] Send email + SMS to:', u.email, u.phone, '| Name:', u.name)
    })

    return users
  } catch (err) {
    console.error('[onboardingCap] activateBatch failed:', err)
    throw err
  }
}
```

**Step 2: Verify the file has no syntax errors**

```bash
cd frontend && npx tsc --noEmit --allowJs --checkJs false src/lib/onboardingCap.js 2>&1 || echo "check done"
```

Expected: no errors (or "check done" with zero TS errors on the JS file)

**Step 3: Commit**

```bash
git add frontend/src/lib/onboardingCap.js
git commit -m "feat: add onboardingCap Firestore engine"
```

---

## Task 2: Expose `activateWaitlistUsers` in AuthContext

The admin panel needs to write activated users into `dispo_users` localStorage. `setUsers` is private, so we expose a dedicated method.

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

**Step 1: Add `activateWaitlistUsers` function inside `AuthProvider`**

Find the `quickLogin` function and add the new function after `signup`:

```js
// Add after the signup function, before quickLogin
const activateWaitlistUsers = (waitlistUsers) => {
  setUsers((prev) => {
    const existingEmails = new Set(prev.map((u) => u.email))
    const newUsers = waitlistUsers
      .filter((u) => !existingEmails.has(u.email))
      .map((u) => ({
        name: u.name,
        email: u.email,
        phone: u.phone,
        username: u.username,
        password: u.password,
        createdAt: u.activatedAt || new Date().toISOString(),
      }))
    return [...prev, ...newUsers]
  })
}
```

**Step 2: Expose it in the context value**

Find the `AuthContext.Provider value={{...}}` block and add `activateWaitlistUsers`:

```js
value={{
  user,
  users,
  isLoggedIn: !!user,
  isAdmin: user?.isAdmin || false,
  login,
  signup,
  quickLogin,
  logout,
  activateWaitlistUsers,   // ← add this
}}
```

**Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: expose activateWaitlistUsers in AuthContext"
```

---

## Task 3: Make `signup()` async and wire cap check

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

**Step 1: Add the import at the top of AuthContext.jsx**

After the existing imports, add:

```js
import { attemptSignup } from '../lib/onboardingCap'
```

**Step 2: Replace the `signup` function**

Replace the entire existing `signup` function with this async version:

```js
const signup = async (name, email, phone, username, password) => {
  // Check localStorage for duplicates first (fast, no network)
  const emailExists = users.find((u) => u.email === email)
  if (emailExists) {
    return { success: false, error: 'An account with this email already exists' }
  }

  const usernameExists = users.find((u) => u.username === username)
  if (usernameExists) {
    return { success: false, error: 'This username is already taken' }
  }

  // Run cap check via Firestore
  const result = await attemptSignup({ name, email, phone, username, password })

  if (result.waitlisted) {
    // User is on the waitlist — do NOT create localStorage account yet
    return { waitlisted: true, position: result.position }
  }

  // Slot available (or fail-open) — create account
  const newUser = {
    name,
    email,
    phone,
    username,
    password,
    createdAt: new Date().toISOString(),
  }
  setUsers((prev) => [...prev, newUser])
  setUser({ email, name, username, isAdmin: false })
  signInAnonymously(auth)
    .then((cred) => {
      setUser((prev) => (prev ? { ...prev, firebaseUid: cred.user.uid } : prev))
    })
    .catch(console.error)
  return { success: true }
}
```

**Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat: make signup async and wire Firestore cap check"
```

---

## Task 4: Add loading state and Step 3 (waitlist) to SignUpModal

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

**Step 1: Add `loading` and `waitlistPosition` state to SignUpModal**

Find the existing state declarations at the top of `SignUpModal` and add two more:

```js
const [loading, setLoading] = useState(false)
const [waitlistPosition, setWaitlistPosition] = useState(null)
```

**Step 2: Make `handleStep2` async with loading state and waitlist branch**

Replace the entire `handleStep2` function:

```js
const handleStep2 = async (e) => {
  e.preventDefault()
  setError('')
  if (!username.trim() || !password) {
    setError('Username and password are required')
    return
  }
  if (username.trim().length < 3) {
    setError('Username must be at least 3 characters')
    return
  }
  if (password.length < 6) {
    setError('Password must be at least 6 characters')
    return
  }
  if (password !== confirmPassword) {
    setError('Passwords do not match')
    return
  }

  setLoading(true)
  const result = await signup(name.trim(), email.trim(), phone.trim(), username.trim(), password)
  setLoading(false)

  if (result.success) {
    onSuccess()
  } else if (result.waitlisted) {
    setWaitlistPosition(result.position)
    setStep(3)
  } else {
    setError(result.error)
  }
}
```

**Step 3: Update the step indicator to show three dots**

Find the step indicator `<div className="flex items-center justify-center gap-3 mb-6">` and replace its contents:

```jsx
<div className="flex items-center justify-center gap-3 mb-6">
  <div
    className="w-3 h-3 rounded-full transition-all duration-300"
    style={{
      background: step >= 1 ? '#00C6FF' : 'rgba(200, 209, 218, 0.3)',
      boxShadow: step >= 1 ? '0 0 8px rgba(0,198,255,0.4)' : 'none',
    }}
  />
  <div className="w-8 katana-line" />
  <div
    className="w-3 h-3 rounded-full transition-all duration-300"
    style={{
      background: step >= 2 ? '#00C6FF' : 'rgba(200, 209, 218, 0.3)',
      boxShadow: step >= 2 ? '0 0 8px rgba(0,198,255,0.4)' : 'none',
    }}
  />
  <div className="w-8 katana-line" />
  <div
    className="w-3 h-3 rounded-full transition-all duration-300"
    style={{
      background: step >= 3 ? '#F6C445' : 'rgba(200, 209, 218, 0.3)',
      boxShadow: step >= 3 ? '0 0 8px rgba(246,196,69,0.5)' : 'none',
    }}
  />
</div>
```

**Step 4: Add loading state to the Step 2 submit button**

Find the "Enter the Dojo" submit button in Step 2 and update it:

```jsx
<button
  type="submit"
  disabled={loading}
  className="flex-1 py-3 text-white font-heading font-bold tracking-widest uppercase rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
  style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)', boxShadow: '0 0 16px rgba(229, 57, 53, 0.3)' }}
  onMouseEnter={(e) => { if (!loading) e.target.style.boxShadow = '0 4px 20px rgba(229, 57, 53, 0.45)' }}
  onMouseLeave={(e) => { e.target.style.boxShadow = '0 0 16px rgba(229, 57, 53, 0.3)' }}
>
  {loading ? 'Checking...' : 'Enter the Dojo'}
</button>
```

**Step 5: Add Step 3 — Waitlist Confirmation screen**

Inside the `<AnimatePresence>` block, after the `step === 2` block, add:

```jsx
{step === 3 && (
  <motion.div
    key="step3"
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.96 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className="text-center mb-6">
      <h2 className="font-display text-2xl mb-2 tracking-[0.06em] gold-shimmer-text">
        You're on the List
      </h2>
      <p className="text-sm text-[#C8D1DA] font-heading tracking-wide">
        The dojo is at capacity this week. Your spot is reserved.
      </p>
    </div>

    {/* Position badge */}
    <div
      className="flex flex-col items-center justify-center py-8 rounded-xl mb-6"
      style={{
        background: 'rgba(0, 198, 255, 0.05)',
        border: '1px solid rgba(0, 198, 255, 0.15)',
      }}
    >
      <p className="font-heading text-[11px] tracking-[0.12em] uppercase text-[#C8D1DA] mb-2">
        Your position
      </p>
      <p
        className="font-heading text-7xl font-bold tracking-tight"
        style={{
          color: '#00C6FF',
          textShadow: '0 0 24px rgba(0,198,255,0.5), 0 0 48px rgba(0,198,255,0.2)',
        }}
      >
        #{waitlistPosition}
      </p>
      <p className="font-heading text-xs text-[#C8D1DA] mt-3 tracking-wide">
        Next batch opens soon
      </p>
    </div>

    <p className="text-center text-sm text-[#C8D1DA] font-body leading-relaxed mb-7">
      We'll text and email you the moment your account is activated.
      Watch for it — it's coming.
    </p>

    <button
      onClick={onClose}
      className="w-full py-3 font-heading font-bold tracking-widest uppercase rounded-lg text-[#C8D1DA] transition-all duration-200 hover:text-[#F4F7FA]"
      style={{ border: '1px solid rgba(0, 198, 255, 0.2)' }}
      onMouseEnter={(e) => { e.target.style.borderColor = 'rgba(0, 198, 255, 0.5)' }}
      onMouseLeave={(e) => { e.target.style.borderColor = 'rgba(0, 198, 255, 0.2)' }}
    >
      Close
    </button>
  </motion.div>
)}
```

**Step 6: Test manually**

Start the dev server: `cd frontend && npm run dev`

- Open login page → click "Make an Account for FREE"
- Fill in Step 1, continue to Step 2
- Verify the step indicator now shows three dots
- Submit Step 2 — should show brief "Checking..." loading state
- If Firestore has cap space: ninja transition fires as before
- If cap is hit (manually set `activeCount` to 25 in Firestore console): Step 3 appears with position number

**Step 7: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat: add waitlist Step 3 to SignUpModal with position display"
```

---

## Task 5: Add Waitlist tab to AdminDashboard

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Update the imports at the top of AdminDashboard.jsx**

Replace the existing imports with:

```js
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Users, Mail, Phone, Calendar, AtSign, Clock, ListOrdered, Pause, Play, RotateCcw, Pencil, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import CountUp from 'react-countup'
import WoodPanel from '../components/WoodPanel'
import { getCapStatus, getWaitlistBatches, activateBatch, updateCapSettings, resetWeek } from '../lib/onboardingCap'
```

**Step 2: Add tab state and data state inside the `AdminDashboard` component**

Add after `const { users } = useAuth()`:

```js
const [activeTab, setActiveTab] = useState('roster')

// Waitlist state
const [capStatus, setCapStatus] = useState(null)
const [waitlistData, setWaitlistData] = useState({ batches: [], total: 0 })
const [waitlistLoading, setWaitlistLoading] = useState(false)
const [activatingBatch, setActivatingBatch] = useState(null)
const [expandedBatches, setExpandedBatches] = useState(new Set())
const [editingCap, setEditingCap] = useState(false)
const [capInput, setCapInput] = useState('')
const [countdown, setCountdown] = useState('')
const { activateWaitlistUsers } = useAuth()

const loadWaitlistData = useCallback(async () => {
  setWaitlistLoading(true)
  const [status, wl] = await Promise.all([getCapStatus(), getWaitlistBatches()])
  setCapStatus(status)
  setWaitlistData(wl)
  setWaitlistLoading(false)
}, [])

useEffect(() => {
  if (activeTab === 'waitlist') {
    loadWaitlistData()
  }
}, [activeTab, loadWaitlistData])

// Live countdown to week reset
useEffect(() => {
  if (!capStatus?.weekStart) return
  const update = () => {
    const resetAt = new Date(capStatus.weekStart).getTime() + 7 * 24 * 60 * 60 * 1000
    const diff = resetAt - Date.now()
    if (diff <= 0) { setCountdown('Resetting...'); return }
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    setCountdown(`${d}d ${h}h ${m}m`)
  }
  update()
  const id = setInterval(update, 60000)
  return () => clearInterval(id)
}, [capStatus?.weekStart])
```

**Step 3: Add handler functions inside the component**

Add after the countdown `useEffect`:

```js
const handleTogglePause = async () => {
  if (!capStatus) return
  await updateCapSettings({ paused: !capStatus.paused })
  setCapStatus((prev) => ({ ...prev, paused: !prev.paused }))
}

const handleResetWeek = async () => {
  if (!confirm('Reset the week now? This clears the slot count and opens 25 fresh spots immediately.')) return
  await resetWeek()
  setCapStatus((prev) => ({ ...prev, activeCount: 0, weekStart: new Date().toISOString().split('T')[0] }))
}

const handleSaveCap = async () => {
  const n = parseInt(capInput, 10)
  if (isNaN(n) || n < 1) return
  await updateCapSettings({ cap: n })
  setCapStatus((prev) => ({ ...prev, cap: n }))
  setEditingCap(false)
}

const handleActivateBatch = async (batchNumber) => {
  setActivatingBatch(batchNumber)
  try {
    const activated = await activateBatch(batchNumber)
    if (activated.length > 0) {
      activateWaitlistUsers(activated)
    }
    await loadWaitlistData()
  } catch (err) {
    console.error('Activate batch failed:', err)
  }
  setActivatingBatch(null)
}

const toggleBatchExpand = (bn) => {
  setExpandedBatches((prev) => {
    const next = new Set(prev)
    if (next.has(bn)) next.delete(bn)
    else next.add(bn)
    return next
  })
}
```

**Step 4: Add the tab bar JSX**

Find the `<div className="katana-line my-4" />` line and add the tab bar below it:

```jsx
{/* Tab bar */}
<div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'rgba(11,15,20,0.5)', border: '1px solid rgba(246,196,69,0.08)' }}>
  {[
    { id: 'roster', label: 'Student Roster', Icon: Users },
    { id: 'waitlist', label: 'Waitlist', Icon: ListOrdered },
  ].map(({ id, label, Icon }) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className="flex items-center gap-2 flex-1 py-2.5 px-4 rounded-md font-heading text-xs font-semibold tracking-widest uppercase transition-all duration-200"
      style={activeTab === id
        ? { background: 'rgba(246,196,69,0.12)', color: '#F6C445', boxShadow: '0 0 12px rgba(246,196,69,0.1)' }
        : { color: '#C8D1DA' }
      }
    >
      <Icon size={14} />
      {label}
      {id === 'waitlist' && waitlistData.total > 0 && (
        <span
          className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(229,57,53,0.2)', color: '#EF5350' }}
        >
          {waitlistData.total}
        </span>
      )}
    </button>
  ))}
</div>
```

**Step 5: Wrap existing content (stats + table) in the roster tab condition**

Find the existing stats grid opening tag `<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">` and wrap everything from there to the end of the user table `</WoodPanel>` in:

```jsx
<AnimatePresence mode="wait">
  {activeTab === 'roster' && (
    <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {/* ← paste existing stats grid and WoodPanel table here */}
    </motion.div>
  )}

  {activeTab === 'waitlist' && (
    <motion.div key="waitlist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      {/* Control panel + batch list — see Step 6 */}
    </motion.div>
  )}
</AnimatePresence>
```

**Step 6: Add the Waitlist tab content (control panel + batch list)**

The waitlist tab content (goes where `{/* Control panel + batch list — see Step 6 */}` is above):

```jsx
{waitlistLoading ? (
  <div className="py-20 text-center text-text-dim font-heading text-sm tracking-widest">Loading...</div>
) : (
  <>
    {/* ── Onboarding Control Panel ── */}
    <WoodPanel hover={false} className="mb-6">
      <p className="font-heading text-[10px] tracking-[0.14em] uppercase text-text-muted mb-5">Onboarding Control Panel</p>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Week Started', value: capStatus?.weekStart ?? '—' },
          { label: 'Resets In', value: countdown || '—' },
          { label: 'Waitlisted', value: waitlistData.total },
          { label: 'Next Batch', value: waitlistData.batches.find(b => !b.allActivated)?.entries.filter(e => e.status === 'waiting').length ?? 0 },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="font-heading text-[10px] tracking-[0.1em] uppercase text-text-muted mb-1">{label}</p>
            <p className="font-heading text-lg text-gold-bright">{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <p className="font-heading text-[10px] tracking-[0.1em] uppercase text-text-muted">This Week's Activations</p>
          <p className="font-heading text-xs text-gold">
            {capStatus?.activeCount ?? 0} / {' '}
            {editingCap ? (
              <span className="inline-flex items-center gap-1">
                <input
                  type="number"
                  value={capInput}
                  onChange={(e) => setCapInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveCap()}
                  className="w-14 px-1 py-0.5 rounded text-xs text-gold bg-transparent border border-gold/30 focus:outline-none focus:border-gold/60"
                  autoFocus
                />
                <button onClick={handleSaveCap} className="text-gold hover:text-gold-bright transition-colors"><Check size={12} /></button>
              </span>
            ) : (
              <button
                onClick={() => { setEditingCap(true); setCapInput(String(capStatus?.cap ?? 25)) }}
                className="inline-flex items-center gap-1 hover:text-gold-bright transition-colors"
              >
                {capStatus?.cap ?? 25} <Pencil size={10} />
              </button>
            )}
          </p>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(246,196,69,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, ((capStatus?.activeCount ?? 0) / (capStatus?.cap ?? 25)) * 100)}%`,
              background: 'linear-gradient(90deg, #F6C445, #FFD97A)',
              boxShadow: '0 0 8px rgba(246,196,69,0.4)',
            }}
          />
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleTogglePause}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          style={capStatus?.paused
            ? { background: 'rgba(229,57,53,0.2)', border: '1px solid rgba(229,57,53,0.4)', color: '#EF5350' }
            : { background: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.2)', color: '#C8D1DA' }
          }
        >
          {capStatus?.paused ? <><Play size={13} /> Resume Onboarding</> : <><Pause size={13} /> Pause Onboarding</>}
        </button>
        <button
          onClick={handleResetWeek}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-heading text-xs font-semibold tracking-wider uppercase transition-all duration-200"
          style={{ background: 'rgba(246,196,69,0.08)', border: '1px solid rgba(246,196,69,0.2)', color: '#C8D1DA' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#F6C445' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#C8D1DA' }}
        >
          <RotateCcw size={13} /> Reset Week Now
        </button>
      </div>
    </WoodPanel>

    {/* ── Batch List ── */}
    {waitlistData.batches.length === 0 ? (
      <WoodPanel hover={false}>
        <div className="py-12 text-center">
          <ListOrdered size={36} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-dim font-heading text-sm">No one on the waitlist yet.</p>
        </div>
      </WoodPanel>
    ) : (
      <div className="space-y-3">
        {waitlistData.batches.map((batch, idx) => {
          const waiting = batch.entries.filter((e) => e.status === 'waiting')
          const isFirstPending = !waitlistData.batches.slice(0, idx).some((b) => !b.allActivated)
          const isExpanded = expandedBatches.has(batch.batchNumber)
          const posRange = `${batch.entries[0].position}–${batch.entries[batch.entries.length - 1].position}`

          return (
            <WoodPanel key={batch.batchNumber} hover={false} className="!p-0">
              {/* Batch header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <button
                  onClick={() => toggleBatchExpand(batch.batchNumber)}
                  className="text-text-muted hover:text-text-dim transition-colors"
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                <div className="flex-1">
                  <p className="font-heading text-sm font-semibold text-parchment">
                    Batch {batch.batchNumber}
                    <span className="text-text-muted font-normal ml-2 text-xs">positions {posRange}</span>
                  </p>
                  <p className="font-heading text-xs text-text-muted mt-0.5">
                    {waiting.length} waiting · {batch.entries.length - waiting.length} activated
                  </p>
                </div>
                {batch.allActivated ? (
                  <span className="flex items-center gap-1.5 text-xs font-heading font-semibold tracking-wider uppercase px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(0,198,255,0.1)', color: '#00C6FF' }}>
                    <Check size={12} /> Activated
                  </span>
                ) : (
                  <button
                    onClick={() => isFirstPending && handleActivateBatch(batch.batchNumber)}
                    disabled={!isFirstPending || activatingBatch === batch.batchNumber}
                    className="px-4 py-2 rounded-lg font-heading text-xs font-bold tracking-wider uppercase transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={isFirstPending
                      ? { background: 'linear-gradient(135deg, #E53935, #B3261E)', color: '#fff', boxShadow: '0 0 12px rgba(229,57,53,0.3)' }
                      : { background: 'rgba(200,209,218,0.08)', color: '#C8D1DA', border: '1px solid rgba(200,209,218,0.15)' }
                    }
                  >
                    {activatingBatch === batch.batchNumber ? 'Activating...' : isFirstPending ? 'Activate Batch' : 'Locked'}
                  </button>
                )}
              </div>

              {/* Expanded user list */}
              {isExpanded && (
                <div className="border-t border-gold-dim/10">
                  {batch.entries.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-4 px-5 py-3 border-b border-gold-dim/[0.05] last:border-0"
                    >
                      <span className="font-heading text-xs text-text-muted w-8">#{entry.position}</span>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: 'linear-gradient(135deg, #F6C445, #FFD97A)', color: '#0B0F14' }}>
                        {entry.name.split(/\s/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-xs text-parchment truncate">{entry.name}</p>
                        <p className="font-heading text-[10px] text-text-muted truncate">{entry.email}</p>
                      </div>
                      <div className="text-[10px] text-text-muted font-heading hidden sm:block">{entry.phone}</div>
                      <span
                        className="text-[10px] font-heading font-semibold px-2 py-0.5 rounded-full"
                        style={entry.status === 'active'
                          ? { background: 'rgba(0,198,255,0.1)', color: '#00C6FF' }
                          : { background: 'rgba(246,196,69,0.1)', color: '#F6C445' }
                        }
                      >
                        {entry.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </WoodPanel>
          )
        })}
      </div>
    )}
  </>
)}
```

**Step 7: Test manually**

- Log in as admin (`admin@dispodojo.com`)
- Go to Admin Dashboard — verify tab bar shows "Student Roster" and "Waitlist"
- Click "Waitlist" tab — control panel loads with live stats
- Toggle Pause, verify Firestore doc updates (check Firebase console)
- Click "Reset Week Now" — verify confirm prompt, then activeCount resets
- Edit cap number inline — verify it saves and progress bar updates

**Step 8: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: add Waitlist tab with control panel and batch activation to AdminDashboard"
```

---

## Task 6: Deploy

```bash
cd frontend && npx vercel --prod
```

Verify on production:
1. Sign up as a new user → enters normally (slot count increments in Firestore)
2. Set `activeCount` to 25 in Firebase console → sign up again → Step 3 waitlist screen with position number
3. Admin panel Waitlist tab shows the waitlisted user under Batch 1
4. Click "Activate Batch" → user appears in Student Roster tab, console shows GHL stub log

---

## Out of Scope (this phase)

- Real GHL API calls (see `docs/todos/LAUNCH-TODOS.md`)
- Firebase Security Rules hardening for the `waitlist` collection
- Activated users persisting in Firestore (localStorage-only, admin-device limitation)
