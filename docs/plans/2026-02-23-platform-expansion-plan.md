# Dispo Dojo Platform Expansion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Bird Dog, Boots on the Ground, Ninja Avatar Progression System, Quick Settings Panel, Leaderboard, and rebuilt Underwriting Calculator — all unified by a Firestore-backed user identity system.

**Architecture:** Additive on top of existing localStorage auth — on login, anonymous Firebase UID is used as the Firestore user doc key, storing avatar config, stats, rank, and badges. No breaking changes to existing auth flow. Each new page is a self-contained route added to App.jsx and Sidebar.jsx.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, Firebase Firestore, Framer Motion, Lucide React, SVG (hand-crafted layered avatar)

**Design doc:** `docs/plans/2026-02-23-platform-expansion-design.md`

---

## Task 1: Firestore User Profile Foundation

**Files:**
- Modify: `frontend/src/lib/firebase.js`
- Modify: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/lib/userProfile.js`

### Step 1: Add Firestore user profile helpers

Create `frontend/src/lib/userProfile.js`:

```js
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from './firebase'

export const DEFAULT_AVATAR = {
  base: 'male',
  maskColor: '#1a1a2e',
  headbandColor: '#ffffff',
  beltColor: '#ffffff',
  eyeColor: '#00C6FF',
  gear: [],
  effects: [],
}

export const RANK_THRESHOLDS = [
  { rank: 'initiate', name: 'Initiate',      minUnderwrites: 0,  minDeals: 0  },
  { rank: 'scout',    name: 'Scout',         minUnderwrites: 1,  minDeals: 0  },
  { rank: 'shinobi',  name: 'Shinobi',       minUnderwrites: 3,  minDeals: 0  },
  { rank: 'shadow',   name: 'Shadow',        minUnderwrites: 5,  minDeals: 0  },
  { rank: 'blade',    name: 'Blade',         minUnderwrites: 10, minDeals: 0  },
  { rank: 'jonin',    name: 'Jonin',         minUnderwrites: 15, minDeals: 0  },
  { rank: 'shadow-master', name: 'Shadow Master', minUnderwrites: 20, minDeals: 0 },
  { rank: 'kage',     name: 'Kage',          minUnderwrites: 20, minDeals: 5  },
]

export const BADGE_DEFS = [
  { id: 'active-voice',      label: 'Active Voice',      check: (s) => s.messages >= 100  },
  { id: 'community-pillar',  label: 'Community Pillar',  check: (s) => s.messages >= 500  },
  { id: 'deal-hunter',       label: 'Deal Hunter',       check: (s) => s.underwrites >= 10 },
  { id: 'ink-slinger',       label: 'Ink Slinger',       check: (s) => s.lois >= 5        },
  { id: 'first-blood',       label: 'First Blood',       check: (s) => s.dealsSubmitted >= 1 },
  { id: 'closer',            label: 'Closer',            check: (s) => s.dealsClosed >= 3  },
  { id: 'top-closer',        label: 'Top Closer',        check: (s) => s.dealsClosed >= 10 },
]

export function computeRank(stats) {
  const s = stats || {}
  const underwrites = s.underwrites || 0
  const dealsClosed = s.dealsClosed || 0
  let current = RANK_THRESHOLDS[0]
  for (const tier of RANK_THRESHOLDS) {
    if (underwrites >= tier.minUnderwrites && dealsClosed >= tier.minDeals) {
      current = tier
    }
  }
  return current.rank
}

export function computeBadges(stats) {
  return BADGE_DEFS.filter((b) => b.check(stats || {})).map((b) => b.id)
}

// Unlocked gear based on rank
export function unlockedGear(rank) {
  const order = ['initiate','scout','shinobi','shadow','blade','jonin','shadow-master','kage']
  const idx = order.indexOf(rank)
  const gear = []
  if (idx >= 2) gear.push('mask-colors')   // shinobi: color choices
  if (idx >= 3) gear.push('smoke-wisps')   // shadow
  if (idx >= 4) gear.push('katana')        // blade
  if (idx >= 5) gear.push('red-headband')  // jonin
  if (idx >= 6) gear.push('glow-eyes', 'black-gi') // shadow-master
  if (idx >= 7) gear.push('full-aura', 'golden-trim') // kage
  return gear
}

export async function getOrCreateProfile(uid, localUser) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()

  const newProfile = {
    displayName: localUser.name || 'Ninja',
    username: localUser.username || uid.slice(0, 8),
    email: localUser.email || '',
    phone: localUser.phone || '',
    bio: '',
    market: '',
    role: localUser.isAdmin ? 'admin' : 'member',
    avatarConfig: DEFAULT_AVATAR,
    stats: {
      underwrites: 0, lois: 0, contracts: 0, messages: 0,
      dealsSubmitted: 0, dealsClosed: 0, birdDogLeads: 0, bootsTasksCompleted: 0,
    },
    rank: 'initiate',
    badges: [],
    createdAt: new Date().toISOString(),
    notificationPrefs: { communityReplies: true, dealUpdates: true, taskAssignments: true },
  }
  await setDoc(ref, newProfile)
  return newProfile
}

export async function updateProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function incrementStat(uid, field) {
  if (!uid) return
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { [`stats.${field}`]: increment(1) })
  // Recompute rank + badges after increment
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const profile = snap.data()
  const stats = profile.stats || {}
  stats[field] = (stats[field] || 0) + 1
  const rank = computeRank(stats)
  const badges = computeBadges(stats)
  await updateDoc(ref, { rank, badges })
}
```

### Step 2: Update AuthContext to load Firestore profile

Replace `frontend/src/context/AuthContext.jsx` with:

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateProfile, updateProfile as fsUpdateProfile } from '../lib/userProfile'

const AuthContext = createContext(null)
const ADMIN_EMAIL = 'admin@dispodojo.com'
const ADMIN_PASSWORD = 'GodFirst2026!'

function loadUsers() {
  try { return JSON.parse(localStorage.getItem('dispo_users') || '[]') } catch { return [] }
}
function saveUsers(users) { localStorage.setItem('dispo_users', JSON.stringify(users)) }
function loadUser() {
  try { const s = localStorage.getItem('dispo_user'); return s ? JSON.parse(s) : null } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [users, setUsers] = useState(loadUsers)
  const [profile, setProfile] = useState(null)
  const [firebaseUid, setFirebaseUid] = useState(null)

  useEffect(() => {
    if (user) localStorage.setItem('dispo_user', JSON.stringify(user))
    else localStorage.removeItem('dispo_user')
  }, [user])

  useEffect(() => { saveUsers(users) }, [users])

  // Load Firebase UID + Firestore profile whenever user changes
  useEffect(() => {
    if (!user) { setProfile(null); setFirebaseUid(null); return }
    signInAnonymously(auth).then(async (cred) => {
      const uid = cred.user.uid
      setFirebaseUid(uid)
      const p = await getOrCreateProfile(uid, user)
      setProfile(p)
    }).catch(console.error)
  }, [user?.email])

  const updateProfile = useCallback(async (data) => {
    if (!firebaseUid) return
    await fsUpdateProfile(firebaseUid, data)
    setProfile((prev) => ({ ...prev, ...data }))
  }, [firebaseUid])

  const login = (identifier, password) => {
    if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({ email: ADMIN_EMAIL, name: 'Admin', isAdmin: true })
      return { success: true }
    }
    if (identifier === ADMIN_EMAIL) return { success: false, error: 'Invalid admin credentials' }
    const existing = users.find((u) => u.email === identifier || u.username === identifier)
    if (!existing) return { success: false, error: 'No account found. Please sign up first.' }
    if (existing.password !== password) return { success: false, error: 'Incorrect password' }
    setUser({ email: existing.email, name: existing.name, username: existing.username, isAdmin: false })
    return { success: true }
  }

  const signup = (name, email, phone, username, password) => {
    if (users.find((u) => u.email === email)) return { success: false, error: 'Email already exists' }
    if (users.find((u) => u.username === username)) return { success: false, error: 'Username taken' }
    const newUser = { name, email, phone, username, password, createdAt: new Date().toISOString() }
    setUsers((prev) => [...prev, newUser])
    setUser({ email, name, username, isAdmin: false })
    return { success: true }
  }

  const quickLogin = () => {
    setUser({ email: 'guest@dispodojo.com', name: 'Guest', username: 'guest', isAdmin: false })
    return { success: true }
  }

  const logout = () => {
    setUser(null); setProfile(null); setFirebaseUid(null)
    firebaseSignOut(auth).catch(console.error)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, firebaseUid, isLoggedIn: !!user,
      isAdmin: user?.isAdmin || false,
      login, signup, quickLogin, logout, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
```

### Step 3: Commit

```bash
git add frontend/src/lib/userProfile.js frontend/src/context/AuthContext.jsx
git commit -m "feat: add Firestore user profile foundation — rank/badge/stats system"
```

---

## Task 2: NinjaAvatar SVG Component

**Files:**
- Create: `frontend/src/components/NinjaAvatar.jsx`

### Step 1: Create the component

Create `frontend/src/components/NinjaAvatar.jsx`:

```jsx
/**
 * NinjaAvatar — layered SVG character.
 * Props:
 *   config  — avatarConfig object (from userProfile)
 *   size    — number (px), default 64
 *   rank    — rank string (controls belt color, auto-applied effects)
 */

const RANK_BELT = {
  initiate: '#e8e8e8',
  scout: '#00C6FF',
  shinobi: '#7F00FF',
  shadow: '#555577',
  blade: '#00C6FF',
  jonin: '#E53935',
  'shadow-master': '#0B0F14',
  kage: '#F6C445',
}

const RANK_BADGE_COLOR = {
  initiate: '#9ca3af',
  scout: '#00C6FF',
  shinobi: '#7F00FF',
  shadow: '#6b7280',
  blade: '#3b82f6',
  jonin: '#E53935',
  'shadow-master': '#1f2937',
  kage: '#F6C445',
}

export default function NinjaAvatar({ config = {}, size = 64, rank = 'initiate', showAura = false }) {
  const {
    base = 'male',
    maskColor = '#1a1a2e',
    headbandColor = '#ffffff',
    eyeColor = '#00C6FF',
    gear = [],
    effects = [],
  } = config

  const beltColor = RANK_BELT[rank] || '#e8e8e8'
  const hasKatana = gear.includes('katana')
  const hasSmoke = gear.includes('smoke-wisps') || effects.includes('smoke-wisps')
  const hasGlowEyes = gear.includes('glow-eyes') || effects.includes('glow-eyes')
  const hasFullAura = (gear.includes('full-aura') || showAura) && rank === 'kage'
  const hasGoldenTrim = gear.includes('golden-trim')
  const giColor = gear.includes('black-gi') ? '#111' : '#1e2a3a'
  const trimColor = hasGoldenTrim ? '#F6C445' : giColor

  const scale = size / 100

  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 100 120"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {hasGlowEyes && (
          <filter id="eye-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        )}
        {hasFullAura && (
          <filter id="full-aura" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="0 0 0 0 0.96  0 0 0 0 0.77  0 0 0 0 0.27  0 0 0 0.6 0"
              result="golden" />
            <feMerge><feMergeNode in="golden"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        )}
        <radialGradient id="face-grad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#c8a882" />
          <stop offset="100%" stopColor="#a07850" />
        </radialGradient>
      </defs>

      <g filter={hasFullAura ? 'url(#full-aura)' : undefined}>

        {/* ── BODY / GI ── */}
        {/* Torso */}
        <path
          d={`M 32 70 C 28 72, 22 85, 20 112 L 80 112 C 78 85, 72 72, 68 70
              C 64 68, 58 66, 50 66 C 42 66, 36 68, 32 70 Z`}
          fill={giColor}
          stroke={trimColor}
          strokeWidth={hasGoldenTrim ? 1.2 : 0}
        />

        {/* Left arm */}
        <path
          d="M 32 72 C 24 76, 16 90, 12 108"
          stroke={giColor}
          strokeWidth={hasGoldenTrim ? 13 : 14}
          strokeLinecap="round"
          fill="none"
        />
        {hasGoldenTrim && (
          <path d="M 32 72 C 24 76, 16 90, 12 108" stroke="#F6C445" strokeWidth="1" strokeLinecap="round" fill="none"/>
        )}

        {/* Right arm */}
        <path
          d="M 68 72 C 76 76, 84 90, 88 108"
          stroke={giColor}
          strokeWidth={hasGoldenTrim ? 13 : 14}
          strokeLinecap="round"
          fill="none"
        />
        {hasGoldenTrim && (
          <path d="M 68 72 C 76 76, 84 90, 88 108" stroke="#F6C445" strokeWidth="1" strokeLinecap="round" fill="none"/>
        )}

        {/* Gi lapels (V-neck cross detail) */}
        <path d="M 42 70 L 50 82 L 58 70" stroke={trimColor === giColor ? 'rgba(255,255,255,0.12)' : '#F6C445'}
          strokeWidth={hasGoldenTrim ? 1.2 : 0.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />

        {/* BELT */}
        <rect x="28" y="88" width="44" height="7" rx="1" fill={beltColor} opacity="0.95" />
        {/* Belt knot */}
        <rect x="46" y="86" width="8" height="11" rx="1.5" fill={beltColor} />
        <rect x="47.5" y="87.5" width="5" height="8" rx="1" fill="rgba(0,0,0,0.25)" />

        {/* ── HEAD ── */}
        {/* Neck */}
        <rect x="46" y="57" width="8" height="12" rx="2" fill="url(#face-grad)" />

        {/* Head shape */}
        <ellipse cx="50" cy="42" rx="19" ry="21" fill="url(#face-grad)" />

        {/* ── HEADBAND ── */}
        <rect x="31" y="35" width="38" height="8" rx="2" fill={headbandColor} opacity="0.95" />
        {/* Headband knot at back — rendered as side tails */}
        <path d="M 69 36 C 76 33, 80 28, 78 24" stroke={headbandColor} strokeWidth="3"
          strokeLinecap="round" fill="none" opacity="0.9" />
        <path d="M 69 40 C 77 42, 82 48, 79 54" stroke={headbandColor} strokeWidth="2.5"
          strokeLinecap="round" fill="none" opacity="0.8" />
        {/* Headband center crease */}
        <line x1="31" y1="39" x2="69" y2="39" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />

        {/* ── MASK (lower face) ── */}
        <path
          d={`M 31 52 C 30 56, 30 62, 32 65 C 36 68, 44 69, 50 69
              C 56 69, 64 68, 68 65 C 70 62, 70 56, 69 52
              C 64 50, 57 49, 50 49 C 43 49, 36 50, 31 52 Z`}
          fill={maskColor}
          opacity="0.97"
        />
        {/* Mask stitch lines */}
        <line x1="38" y1="58" x2="62" y2="58" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" strokeDasharray="2,2" />
        <line x1="36" y1="62" x2="64" y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="2,3" />
        {/* Nose bridge shadow */}
        <ellipse cx="50" cy="51" rx="4" ry="2" fill="rgba(0,0,0,0.18)" />

        {/* ── EYES ── */}
        {hasGlowEyes && (
          <>
            <ellipse cx="42" cy="46" rx="5" ry="3" fill={eyeColor} opacity="0.25" filter="url(#eye-glow)" />
            <ellipse cx="58" cy="46" rx="5" ry="3" fill={eyeColor} opacity="0.25" filter="url(#eye-glow)" />
          </>
        )}
        {/* Eye whites */}
        <ellipse cx="42" cy="46" rx="5" ry="3.5" fill="rgba(255,255,255,0.92)" />
        <ellipse cx="58" cy="46" rx="5" ry="3.5" fill="rgba(255,255,255,0.92)" />
        {/* Irises */}
        <ellipse cx="42" cy="46" rx="3" ry="3" fill={eyeColor} filter={hasGlowEyes ? 'url(#eye-glow)' : undefined} />
        <ellipse cx="58" cy="46" rx="3" ry="3" fill={eyeColor} filter={hasGlowEyes ? 'url(#eye-glow)' : undefined} />
        {/* Pupils */}
        <ellipse cx="42.5" cy="46" rx="1.4" ry="1.8" fill="#0a0a14" />
        <ellipse cx="58.5" cy="46" rx="1.4" ry="1.8" fill="#0a0a14" />
        {/* Eye shine */}
        <ellipse cx="41" cy="44.5" rx="0.8" ry="0.6" fill="white" opacity="0.8" />
        <ellipse cx="57" cy="44.5" rx="0.8" ry="0.6" fill="white" opacity="0.8" />

        {/* ── ACCESSORIES ── */}

        {/* KATANA — over left shoulder */}
        {hasKatana && (
          <g transform="rotate(-35, 22, 85)">
            {/* Blade */}
            <rect x="18" y="20" width="3" height="52" rx="1" fill="#d0d8e0" />
            {/* Edge glint */}
            <rect x="20" y="22" width="0.8" height="48" rx="0.4" fill="rgba(255,255,255,0.6)" />
            {/* Guard */}
            <ellipse cx="19.5" cy="72" rx="6" ry="2.5" fill="#8B6914" />
            {/* Grip */}
            <rect x="17" y="73" width="5" height="18" rx="2" fill="#3d1f0a" />
            <line x1="17" y1="76" x2="22" y2="76" stroke="#8B6914" strokeWidth="1" />
            <line x1="17" y1="80" x2="22" y2="80" stroke="#8B6914" strokeWidth="1" />
            <line x1="17" y1="84" x2="22" y2="84" stroke="#8B6914" strokeWidth="1" />
          </g>
        )}

        {/* SMOKE WISPS — animated */}
        {hasSmoke && (
          <g opacity="0.6">
            <path d="M 15 110 C 10 95, 18 80, 12 65" stroke="#8899bb" strokeWidth="2"
              strokeLinecap="round" fill="none"
              style={{ animation: 'ninjaSmoke1 3s ease-in-out infinite alternate' }} />
            <path d="M 85 108 C 92 93, 84 75, 90 60" stroke="#6677aa" strokeWidth="1.5"
              strokeLinecap="round" fill="none"
              style={{ animation: 'ninjaSmoke2 4s ease-in-out infinite alternate' }} />
            <path d="M 50 112 C 48 98, 54 85, 50 70" stroke="#9999cc" strokeWidth="1.2"
              strokeLinecap="round" fill="none"
              style={{ animation: 'ninjaSmoke1 2.5s ease-in-out infinite alternate-reverse' }} />
          </g>
        )}

      </g>

      {/* CSS keyframes injected once */}
      {hasSmoke && (
        <style>{`
          @keyframes ninjaSmoke1 {
            from { opacity: 0.3; transform: translateY(0) scaleX(1); }
            to   { opacity: 0.7; transform: translateY(-6px) scaleX(1.15); }
          }
          @keyframes ninjaSmoke2 {
            from { opacity: 0.2; transform: translateY(0) scaleX(1); }
            to   { opacity: 0.6; transform: translateY(-8px) scaleX(0.9); }
          }
        `}</style>
      )}
    </svg>
  )
}

export { RANK_BELT, RANK_BADGE_COLOR }
```

### Step 2: Commit

```bash
git add frontend/src/components/NinjaAvatar.jsx
git commit -m "feat: add NinjaAvatar SVG component with layered gear and effects"
```

---

## Task 3: RankBadge & ActivityBadge Components

**Files:**
- Create: `frontend/src/components/RankBadge.jsx`
- Create: `frontend/src/components/ActivityBadge.jsx`

### Step 1: Create RankBadge

Create `frontend/src/components/RankBadge.jsx`:

```jsx
import { RANK_BADGE_COLOR } from './NinjaAvatar'

const RANK_LABELS = {
  initiate: 'Initiate', scout: 'Scout', shinobi: 'Shinobi',
  shadow: 'Shadow', blade: 'Blade', jonin: 'Jonin',
  'shadow-master': 'Shadow Master', kage: 'Kage',
}

export default function RankBadge({ rank = 'initiate', size = 'sm' }) {
  const color = RANK_BADGE_COLOR[rank] || '#9ca3af'
  const label = RANK_LABELS[rank] || rank
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold tracking-wider uppercase ${px}`}
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 6px ${color}20`,
      }}
    >
      {label}
    </span>
  )
}
```

### Step 2: Create ActivityBadge

Create `frontend/src/components/ActivityBadge.jsx`:

```jsx
import { Award } from 'lucide-react'

const BADGE_META = {
  'active-voice':     { label: 'Active Voice',     color: '#00C6FF' },
  'community-pillar': { label: 'Community Pillar',  color: '#7F00FF' },
  'deal-hunter':      { label: 'Deal Hunter',       color: '#F6C445' },
  'ink-slinger':      { label: 'Ink Slinger',       color: '#E53935' },
  'first-blood':      { label: 'First Blood',       color: '#E53935' },
  'closer':           { label: 'Closer',            color: '#10b981' },
  'top-closer':       { label: 'Top Closer',        color: '#F6C445' },
  'bird-dog':         { label: 'Bird Dog',          color: '#f97316' },
  'boots':            { label: 'Boots on Ground',   color: '#84cc16' },
}

export default function ActivityBadge({ id, size = 'sm' }) {
  const meta = BADGE_META[id]
  if (!meta) return null
  const iconSize = size === 'sm' ? 10 : 12
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[9px] gap-1' : 'px-2 py-1 text-[11px] gap-1.5'
  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold tracking-wide uppercase ${px}`}
      style={{
        color: meta.color,
        background: `${meta.color}15`,
        border: `1px solid ${meta.color}35`,
      }}
    >
      <Award size={iconSize} />
      {meta.label}
    </span>
  )
}
```

### Step 3: Commit

```bash
git add frontend/src/components/RankBadge.jsx frontend/src/components/ActivityBadge.jsx
git commit -m "feat: add RankBadge and ActivityBadge display components"
```

---

## Task 4: Quick Settings Panel

**Files:**
- Create: `frontend/src/components/QuickSettingsPanel.jsx`

### Step 1: Create panel component

Create `frontend/src/components/QuickSettingsPanel.jsx`:

```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Sword, Phone, Shield, Trophy, HelpCircle, Save, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NinjaAvatar from './NinjaAvatar'
import RankBadge from './RankBadge'
import ActivityBadge from './ActivityBadge'
import { RANK_THRESHOLDS, unlockedGear, computeRank } from '../lib/userProfile'

const TABS = [
  { id: 'identity', label: 'Identity',  icon: User     },
  { id: 'ninja',    label: 'Ninja',     icon: Sword    },
  { id: 'contact',  label: 'Contact',   icon: Phone    },
  { id: 'account',  label: 'Account',   icon: Shield   },
  { id: 'rank',     label: 'Rank',      icon: Trophy   },
  { id: 'support',  label: 'Support',   icon: HelpCircle },
]

const MASK_COLORS = [
  { label: 'Midnight', value: '#1a1a2e' },
  { label: 'Navy',     value: '#0E5A88' },
  { label: 'Crimson',  value: '#8B0000' },
  { label: 'Forest',   value: '#1a3d1a' },
  { label: 'Violet',   value: '#3d1a5c' },
]
const HEADBAND_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Red',   value: '#E53935' },
  { label: 'Gold',  value: '#F6C445' },
  { label: 'Black', value: '#111111' },
  { label: 'Cyan',  value: '#00C6FF' },
]
const EYE_COLORS = [
  { label: 'Cyan',   value: '#00C6FF' },
  { label: 'Gold',   value: '#F6C445' },
  { label: 'Red',    value: '#E53935' },
  { label: 'White',  value: '#f0f0f0' },
  { label: 'Purple', value: '#7F00FF' },
]

const FAQ = [
  { q: 'How do I submit a deal?', a: 'Go to Find Buyers from the sidebar and use the JV Deal Wizard.' },
  { q: 'How do I level up my ninja?', a: 'Submit underwrites, generate LOIs, and stay active in the community.' },
  { q: 'What is a Bird Dog?', a: 'Someone who finds motivated sellers and brings them to the team for a fee.' },
  { q: 'How do I become Boots on the Ground?', a: 'Sign up on the Boots on Ground page and set your service area.' },
  { q: 'How are payouts handled?', a: 'Payouts are processed by the admin team after a deal closes. Contact support for details.' },
]

export default function QuickSettingsPanel({ isOpen, onClose }) {
  const { profile, updateProfile, user, firebaseUid } = useAuth()
  const [tab, setTab] = useState('identity')
  const [local, setLocal] = useState({})
  const [saving, setSaving] = useState(false)
  const [faqOpen, setFaqOpen] = useState(null)

  // Sync local state from profile
  useEffect(() => {
    if (profile) setLocal({ ...profile })
  }, [profile, isOpen])

  const avatarConfig = local.avatarConfig || {}
  const rank = local.rank || 'initiate'
  const unlocked = unlockedGear(rank)
  const canCustomizeMask = unlocked.includes('mask-colors')
  const canCustomizeHeadband = unlocked.includes('red-headband') || rank === 'kage'

  function setAvatar(key, value) {
    setLocal((p) => ({ ...p, avatarConfig: { ...p.avatarConfig, [key]: value } }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateProfile({
        displayName: local.displayName,
        username: local.username,
        bio: local.bio,
        market: local.market,
        phone: local.phone,
        avatarConfig: local.avatarConfig,
        notificationPrefs: local.notificationPrefs,
      })
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)]'
  const labelCls = 'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'

  // Progress to next rank
  const rankOrder = RANK_THRESHOLDS
  const currentIdx = rankOrder.findIndex((r) => r.rank === rank)
  const nextTier = rankOrder[currentIdx + 1]
  const stats = local.stats || {}
  const underwrites = stats.underwrites || 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-[60]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 w-[380px] z-[70] flex flex-col bg-[#0B0F14] border-l border-[rgba(246,196,69,0.15)] shadow-[-8px_0_40px_rgba(0,0,0,0.6)]"
            initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(246,196,69,0.1)]">
              <div className="flex items-center gap-3">
                <NinjaAvatar config={avatarConfig} size={36} rank={rank} />
                <div>
                  <p className="font-heading text-sm font-semibold text-parchment">{local.displayName || 'Ninja'}</p>
                  <RankBadge rank={rank} size="sm" />
                </div>
              </div>
              <button onClick={onClose} className="text-text-dim/40 hover:text-parchment transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[rgba(246,196,69,0.08)] overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-2.5 text-[10px] font-heading tracking-wide uppercase shrink-0 border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-[#00C6FF] text-[#00C6FF]'
                      : 'border-transparent text-text-dim/40 hover:text-text-dim'
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

              {/* IDENTITY TAB */}
              {tab === 'identity' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input className={inputCls} value={local.displayName || ''} onChange={(e) => setLocal((p) => ({ ...p, displayName: e.target.value }))} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={labelCls}>Username</label>
                    <input className={inputCls} value={local.username || ''} onChange={(e) => setLocal((p) => ({ ...p, username: e.target.value }))} placeholder="@username" />
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea className={`${inputCls} resize-none h-20`} value={local.bio || ''} onChange={(e) => setLocal((p) => ({ ...p, bio: e.target.value }))} placeholder="Tell the community about yourself..." />
                  </div>
                  <div>
                    <label className={labelCls}>Market Focus</label>
                    <input className={inputCls} value={local.market || ''} onChange={(e) => setLocal((p) => ({ ...p, market: e.target.value }))} placeholder="e.g. Phoenix, AZ" />
                  </div>
                </div>
              )}

              {/* NINJA TAB */}
              {tab === 'ninja' && (
                <div className="space-y-5">
                  {/* Live preview */}
                  <div className="flex justify-center py-4">
                    <div className="relative">
                      <div className="w-32 h-36 flex items-center justify-center rounded-sm bg-[#111B24] border border-[rgba(246,196,69,0.1)]">
                        <NinjaAvatar config={avatarConfig} size={96} rank={rank} />
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                        <RankBadge rank={rank} />
                      </div>
                    </div>
                  </div>

                  {/* Base */}
                  <div>
                    <label className={labelCls}>Base</label>
                    <div className="flex gap-2">
                      {['male', 'female'].map((b) => (
                        <button key={b} onClick={() => setAvatar('base', b)}
                          className={`flex-1 py-2 rounded-sm border text-sm font-heading capitalize transition-colors ${avatarConfig.base === b ? 'border-[#00C6FF] text-[#00C6FF] bg-[rgba(0,198,255,0.08)]' : 'border-[rgba(246,196,69,0.15)] text-text-dim hover:border-[rgba(246,196,69,0.3)]'}`}
                        >{b}</button>
                      ))}
                    </div>
                  </div>

                  {/* Mask Color */}
                  <div>
                    <label className={labelCls}>Mask Color {!canCustomizeMask && <span className="text-text-dim/30 normal-case">— unlocks at Scout</span>}</label>
                    <div className="flex gap-2 flex-wrap">
                      {MASK_COLORS.map((c) => (
                        <button key={c.value} onClick={() => canCustomizeMask && setAvatar('maskColor', c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${avatarConfig.maskColor === c.value ? 'border-white scale-110' : 'border-transparent'} ${!canCustomizeMask && c.value !== '#1a1a2e' ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                          style={{ background: c.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Headband Color */}
                  <div>
                    <label className={labelCls}>Headband Color {!canCustomizeHeadband && <span className="text-text-dim/30 normal-case">— unlocks at Shinobi</span>}</label>
                    <div className="flex gap-2 flex-wrap">
                      {HEADBAND_COLORS.map((c) => (
                        <button key={c.value} onClick={() => canCustomizeHeadband && setAvatar('headbandColor', c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${avatarConfig.headbandColor === c.value ? 'border-[#00C6FF] scale-110' : 'border-transparent'} ${!canCustomizeHeadband ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                          style={{ background: c.value, boxShadow: c.value === '#ffffff' ? 'inset 0 0 0 1px rgba(0,0,0,0.2)' : 'none' }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Eye Color */}
                  <div>
                    <label className={labelCls}>Eye Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {EYE_COLORS.map((c) => (
                        <button key={c.value} onClick={() => setAvatar('eyeColor', c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${avatarConfig.eyeColor === c.value ? 'border-white scale-110' : 'border-transparent'} cursor-pointer hover:scale-105`}
                          style={{ background: c.value }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Unlocked Accessories */}
                  {unlocked.length > 0 && (
                    <div>
                      <label className={labelCls}>Unlocked Accessories</label>
                      <div className="space-y-1.5">
                        {['katana','smoke-wisps','glow-eyes','black-gi','golden-trim','full-aura'].filter(g => unlocked.includes(g)).map((g) => {
                          const enabled = (avatarConfig.gear || []).includes(g)
                          return (
                            <button key={g} onClick={() => {
                              const gear = avatarConfig.gear || []
                              setAvatar('gear', enabled ? gear.filter(x => x !== g) : [...gear, g])
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border text-sm font-heading capitalize transition-colors ${enabled ? 'border-[#00C6FF] text-[#00C6FF] bg-[rgba(0,198,255,0.06)]' : 'border-[rgba(246,196,69,0.15)] text-text-dim hover:border-[rgba(246,196,69,0.3)]'}`}
                          >
                            {g.replace(/-/g, ' ')}
                            <span className={`text-xs ${enabled ? 'text-[#00C6FF]' : 'text-text-dim/30'}`}>{enabled ? 'ON' : 'OFF'}</span>
                          </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTACT TAB */}
              {tab === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Email</label>
                    <input className={`${inputCls} opacity-60 cursor-not-allowed`} value={local.email || ''} readOnly />
                    <p className="text-[10px] text-text-dim/30 mt-1">Contact support to change your email</p>
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input className={inputCls} value={local.phone || ''} onChange={(e) => setLocal((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="pt-2">
                    <label className={labelCls}>Notifications</label>
                    <div className="space-y-2">
                      {[
                        ['communityReplies', 'Community replies'],
                        ['dealUpdates', 'Deal status updates'],
                        ['taskAssignments', 'Task assignments (Boots)'],
                      ].map(([key, label]) => (
                        <label key={key} className="flex items-center justify-between py-2 border-b border-[rgba(246,196,69,0.06)] cursor-pointer">
                          <span className="text-sm text-text-dim">{label}</span>
                          <div
                            onClick={() => setLocal((p) => ({ ...p, notificationPrefs: { ...p.notificationPrefs, [key]: !(p.notificationPrefs?.[key] ?? true) } }))}
                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${(local.notificationPrefs?.[key] ?? true) ? 'bg-[#00C6FF]' : 'bg-[rgba(255,255,255,0.1)]'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${(local.notificationPrefs?.[key] ?? true) ? 'left-5' : 'left-0.5'}`} />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT TAB */}
              {tab === 'account' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-sm bg-[#111B24] border border-[rgba(246,196,69,0.08)]">
                    <p className={labelCls}>Role</p>
                    <p className="text-sm text-parchment capitalize font-heading">{local.role || 'Member'}</p>
                  </div>
                  <div className="p-3 rounded-sm bg-[#111B24] border border-[rgba(246,196,69,0.08)]">
                    <p className={labelCls}>Member Since</p>
                    <p className="text-sm text-parchment">{local.createdAt ? new Date(local.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</p>
                  </div>
                  <div>
                    <p className={labelCls}>Quick Links</p>
                    <div className="space-y-1">
                      {[
                        ['My Bird Dog Leads', '/bird-dog'],
                        ['My Boots Tasks', '/boots-on-ground'],
                        ['Find Buyers (My Deals)', '/find-buyers'],
                      ].map(([label, href]) => (
                        <a key={href} href={href} onClick={onClose}
                          className="flex items-center justify-between px-3 py-2 rounded-sm border border-[rgba(246,196,69,0.1)] text-sm text-text-dim hover:text-parchment hover:border-[rgba(246,196,69,0.25)] transition-colors">
                          {label}
                          <ChevronRight size={14} className="text-text-dim/30" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* RANK TAB */}
              {tab === 'rank' && (
                <div className="space-y-4">
                  {/* Current rank card */}
                  <div className="flex items-center gap-4 p-4 rounded-sm bg-[#111B24] border border-[rgba(246,196,69,0.1)]">
                    <NinjaAvatar config={avatarConfig} size={56} rank={rank} />
                    <div>
                      <RankBadge rank={rank} size="md" />
                      <p className="text-xs text-text-dim mt-1">{underwrites} underwrites submitted</p>
                    </div>
                  </div>

                  {/* Progress to next */}
                  {nextTier && (
                    <div>
                      <div className="flex justify-between text-[10px] text-text-dim/50 mb-1 font-heading uppercase tracking-wider">
                        <span>Progress to {nextTier.name}</span>
                        <span>{underwrites}/{nextTier.minUnderwrites} underwrites</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#00C6FF] transition-all duration-700"
                          style={{ width: `${Math.min(100, (underwrites / nextTier.minUnderwrites) * 100)}%`, boxShadow: '0 0 8px rgba(0,198,255,0.6)' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* All tiers */}
                  <div>
                    <p className={labelCls}>All Ranks</p>
                    <div className="space-y-1">
                      {RANK_THRESHOLDS.map((tier) => {
                        const achieved = underwrites >= tier.minUnderwrites
                        return (
                          <div key={tier.rank} className={`flex items-center justify-between px-3 py-2 rounded-sm ${tier.rank === rank ? 'bg-[rgba(0,198,255,0.06)] border border-[rgba(0,198,255,0.2)]' : 'border border-transparent opacity-50'}`}>
                            <RankBadge rank={tier.rank} size="sm" />
                            <span className="text-[10px] text-text-dim/50">{tier.minUnderwrites}+ underwrites</span>
                            {achieved && <span className="text-[#00C6FF] text-xs">✓</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Badges */}
                  {(local.badges || []).length > 0 && (
                    <div>
                      <p className={labelCls}>Earned Badges</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(local.badges || []).map((b) => <ActivityBadge key={b} id={b} size="sm" />)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUPPORT TAB */}
              {tab === 'support' && (
                <div className="space-y-3">
                  <p className={labelCls}>FAQ</p>
                  {FAQ.map((item, i) => (
                    <div key={i} className="border border-[rgba(246,196,69,0.08)] rounded-sm overflow-hidden">
                      <button className="w-full text-left px-4 py-3 text-sm font-heading text-parchment hover:bg-white/[0.03] flex items-center justify-between"
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                        {item.q}
                        <ChevronRight size={14} className={`shrink-0 transition-transform ${faqOpen === i ? 'rotate-90' : ''} text-text-dim/40`} />
                      </button>
                      {faqOpen === i && (
                        <div className="px-4 pb-3 text-sm text-text-dim/70 leading-relaxed border-t border-[rgba(246,196,69,0.06)]">{item.a}</div>
                      )}
                    </div>
                  ))}
                  <div className="pt-2">
                    <a href="mailto:support@dispodojo.com"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-sm border border-[rgba(246,196,69,0.2)] text-sm font-heading text-gold hover:bg-[rgba(246,196,69,0.06)] transition-colors">
                      Contact Support
                    </a>
                  </div>
                </div>
              )}

            </div>

            {/* Footer save */}
            {['identity','ninja','contact'].includes(tab) && (
              <div className="border-t border-[rgba(246,196,69,0.1)] px-5 py-3">
                <button onClick={handleSave} disabled={saving}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm bg-[#0E5A88] hover:bg-[#1470a0] text-parchment font-heading text-sm transition-colors disabled:opacity-50">
                  <Save size={14} />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### Step 2: Commit

```bash
git add frontend/src/components/QuickSettingsPanel.jsx
git commit -m "feat: add QuickSettingsPanel with 6 tabs — identity, ninja builder, contact, account, rank, support"
```

---

## Task 5: Update Sidebar (Avatar + New Nav Items)

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

### Step 1: Update Sidebar

In `frontend/src/components/Sidebar.jsx`:

1. Import `NinjaAvatar`, `QuickSettingsPanel`, `useState` (already imported)
2. Add new nav items to `navSections`
3. Replace initials circle at bottom with clickable `NinjaAvatar`
4. Add `QuickSettingsPanel` mount

Key changes to make:

```jsx
// Add to imports
import NinjaAvatar from './NinjaAvatar'
import QuickSettingsPanel from './QuickSettingsPanel'
import { useAuth } from '../context/AuthContext'

// Add MapPin and other icons as needed from lucide
```

Nav sections additions:
```js
// In Dashboard section items, add:
{ to: '/leaderboard', icon: ToriiIcon, label: 'Leaderboard' },

// In Lead Generation section items, add:
{ to: '/bird-dog', icon: HawkIcon, label: 'Bird Dog' },
{ to: '/boots-on-ground', icon: MapPin, label: 'Boots on Ground' },
```

Bottom user widget change:
```jsx
// Replace the hanko-seal initials div with:
const [settingsOpen, setSettingsOpen] = useState(false)
const { profile } = useAuth()

// In the bottom widget:
<button
  onClick={() => setSettingsOpen(true)}
  className="w-8 h-8 rounded-full overflow-hidden shrink-0 hover:ring-2 hover:ring-[#00C6FF]/40 transition-all"
>
  <NinjaAvatar config={profile?.avatarConfig} size={32} rank={profile?.rank || 'initiate'} />
</button>

// And add at component root level (outside sidebar aside):
<QuickSettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
```

### Step 2: Commit

```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: add NinjaAvatar to sidebar, new nav items, QuickSettingsPanel trigger"
```

---

## Task 6: App.jsx — Register New Routes

**Files:**
- Modify: `frontend/src/App.jsx`

### Step 1: Add route imports and routes

```jsx
import BirdDog from './pages/BirdDog'
import BootsOnGround from './pages/BootsOnGround'
import Leaderboard from './pages/Leaderboard'
```

Inside the `<Routes>` nested under the Layout route:
```jsx
<Route path="bird-dog" element={<BirdDog />} />
<Route path="boots-on-ground" element={<BootsOnGround />} />
<Route path="leaderboard" element={<Leaderboard />} />
```

### Step 2: Commit

```bash
git add frontend/src/App.jsx
git commit -m "feat: register bird-dog, boots-on-ground, leaderboard routes"
```

---

## Task 7: Bird Dog Page

**Files:**
- Create: `frontend/src/pages/BirdDog.jsx`

### Step 1: Create the page

Create `frontend/src/pages/BirdDog.jsx` with these sections:

**Structure:**
- Page header with icon + title "Bird Dog Network"
- 3-column grid (explainer / form / submissions)

**Key logic:**
- Form state: address, ownerName, ownerPhone, ownerEmail, howFound, situation, agreed
- Submit → `addDoc(collection(db, 'bird_dog_leads'), { ...fields, userId: firebaseUid, authorName: profile.displayName, status: 'pending', createdAt: serverTimestamp() })`
- Increment stat: `incrementStat(firebaseUid, 'birdDogLeads')`
- My submissions: `onSnapshot(query(collection(db, 'bird_dog_leads'), where('userId', '==', firebaseUid), orderBy('createdAt', 'desc')))`
- Status badge colors: pending=gold, qualified=cyan, working=purple, closed=green, rejected=red

```jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapPin, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react'
import {
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'

const HOW_FOUND = ['Driving for Dollars', 'Door-Knocking', 'Cold Call', 'Referral', 'Other']

const STATUS_STYLE = {
  pending:  { label: 'Pending Review', color: '#F6C445' },
  qualified:{ label: 'Qualified',      color: '#00C6FF' },
  working:  { label: 'In Progress',    color: '#7F00FF' },
  closed:   { label: 'Closed',         color: '#10b981' },
  rejected: { label: 'Not Qualified',  color: '#E53935' },
}

const inputCls = 'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'
const labelCls = 'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'

const CRITERIA = [
  'Owner is motivated / distressed to sell',
  'Property is NOT currently listed on MLS',
  'Owner is open to below-market or creative offer',
  'Owner contact info has been confirmed',
]

export default function BirdDog() {
  const { firebaseUid, profile } = useAuth()
  const [form, setForm] = useState({ address: '', ownerName: '', ownerPhone: '', ownerEmail: '', howFound: '', situation: '', agreed: false })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [leads, setLeads] = useState([])

  // Real-time listener for my submissions
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'bird_dog_leads'),
      where('userId', '==', firebaseUid),
      orderBy('createdAt', 'desc'),
    )
    return onSnapshot(q, (snap) => setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
  }, [firebaseUid])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.agreed || !form.address || !form.ownerName || !form.ownerPhone || !form.howFound) return
    setSubmitting(true)
    try {
      await addDoc(collection(db, 'bird_dog_leads'), {
        ...form,
        userId: firebaseUid,
        authorName: profile?.displayName || 'Unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      })
      await incrementStat(firebaseUid, 'birdDogLeads')
      setForm({ address: '', ownerName: '', ownerPhone: '', ownerEmail: '', howFound: '', situation: '', agreed: false })
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 4000)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="text-[#F6C445]" size={28} />
          <h1 className="font-display text-3xl neon-shimmer-text tracking-wider">Bird Dog Network</h1>
        </div>
        <p className="text-text-dim text-sm">Find motivated sellers. Earn on every deal that closes.</p>
        <div className="katana-line mt-4 w-48" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT: Explainer */}
        <div className="space-y-4">
          <div className="bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5">
            <h2 className="font-heading text-gold text-sm font-semibold tracking-wider uppercase mb-3">What is a Bird Dog?</h2>
            <p className="text-text-dim text-sm leading-relaxed mb-4">A Bird Dog is someone with boots on the ground — driving neighborhoods, knocking doors, talking to neighbors — who finds motivated sellers before they ever hit the market. You bring us the lead; we handle the deal; you earn a fee at closing.</p>
            <div className="katana-line mb-4" />
            <h3 className="font-heading text-[10px] tracking-widest uppercase text-text-dim/50 mb-2">Valid Lead Criteria</h3>
            <ul className="space-y-2">
              {CRITERIA.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-text-dim">
                  <CheckCircle size={14} className="text-[#00C6FF] shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5">
            <h3 className="font-heading text-gold text-sm font-semibold tracking-wider uppercase mb-3">How Payouts Work</h3>
            <div className="space-y-3 text-sm text-text-dim">
              <div className="flex items-center gap-2"><span className="text-[#F6C445] font-heading font-bold">01</span> Submit your lead below</div>
              <div className="flex items-center gap-2"><span className="text-[#F6C445] font-heading font-bold">02</span> Our team reviews within 24–48 hours</div>
              <div className="flex items-center gap-2"><span className="text-[#F6C445] font-heading font-bold">03</span> If qualified, we work the deal</div>
              <div className="flex items-center gap-2"><span className="text-[#F6C445] font-heading font-bold">04</span> You earn $500–$2,000 on close</div>
            </div>
          </div>
        </div>

        {/* CENTER: Form */}
        <div className="bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5">
          <h2 className="font-heading text-parchment text-sm font-semibold tracking-wider uppercase mb-4">Submit a Lead</h2>
          {submitted && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 p-3 rounded-sm bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-sm text-[#10b981]">
              <CheckCircle size={14} /> Lead submitted successfully!
            </motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Property Address *</label>
              <input className={inputCls} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} placeholder="123 Main St, Phoenix, AZ 85001" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Owner Name *</label>
                <input className={inputCls} value={form.ownerName} onChange={(e) => setForm((p) => ({ ...p, ownerName: e.target.value }))} placeholder="John Smith" required />
              </div>
              <div>
                <label className={labelCls}>Owner Phone *</label>
                <input className={inputCls} value={form.ownerPhone} onChange={(e) => setForm((p) => ({ ...p, ownerPhone: e.target.value }))} placeholder="(555) 000-0000" required />
              </div>
            </div>
            <div>
              <label className={labelCls}>Owner Email</label>
              <input className={inputCls} type="email" value={form.ownerEmail} onChange={(e) => setForm((p) => ({ ...p, ownerEmail: e.target.value }))} placeholder="owner@email.com" />
            </div>
            <div>
              <label className={labelCls}>How did you find it? *</label>
              <div className="relative">
                <select className={`${inputCls} appearance-none pr-8 cursor-pointer`} value={form.howFound} onChange={(e) => setForm((p) => ({ ...p, howFound: e.target.value }))} required>
                  <option value="" disabled>Select method...</option>
                  {HOW_FOUND.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Situation Summary *</label>
              <textarea className={`${inputCls} resize-none h-24`} value={form.situation} onChange={(e) => setForm((p) => ({ ...p, situation: e.target.value }))} placeholder="Describe the seller's situation — why are they motivated? What's the condition of the property?" required />
            </div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={form.agreed} onChange={(e) => setForm((p) => ({ ...p, agreed: e.target.checked }))} className="mt-0.5 accent-[#00C6FF]" required />
              <span className="text-xs text-text-dim/60">I confirm this lead meets the criteria above and the owner has been contacted</span>
            </label>
            <button type="submit" disabled={submitting || !form.agreed}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm bg-[#E53935] hover:bg-[#c62828] text-white font-heading text-sm font-semibold transition-colors disabled:opacity-40">
              <Send size={14} />
              {submitting ? 'Submitting…' : 'Submit Lead'}
            </button>
          </form>
        </div>

        {/* RIGHT: My Submissions */}
        <div className="bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5">
          <h2 className="font-heading text-parchment text-sm font-semibold tracking-wider uppercase mb-4">My Submissions</h2>
          {leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-text-dim/30">
              <Clock size={28} />
              <p className="text-sm">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const s = STATUS_STYLE[lead.status] || STATUS_STYLE.pending
                return (
                  <div key={lead.id} className="p-3 rounded-sm bg-[#0B0F14] border border-[rgba(246,196,69,0.06)]">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-heading text-parchment truncate">{lead.address}</p>
                      <span className="text-[10px] font-heading font-semibold uppercase shrink-0 px-2 py-0.5 rounded-sm"
                        style={{ color: s.color, background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-dim/50">{lead.ownerName} · {lead.howFound}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
```

### Step 2: Commit

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: build Bird Dog page with submission form, explainer, and real-time submissions panel"
```

---

## Task 8: Boots on the Ground Page

**Files:**
- Create: `frontend/src/pages/BootsOnGround.jsx`

### Step 1: Create the page

Key logic:
- Check `profile.bootsProfile` — if null, show onboarding wizard (3 steps)
- Onboarding: coverage area, task types, availability → save to `users/{uid}.bootsProfile`
- Open tasks: `onSnapshot(query(collection(db, 'boots_tasks'), where('status', '==', 'open'), where('market', '==', userMarket)))`
- Accept task: `updateDoc(taskRef, { acceptedBy: uid, status: 'accepted', acceptedAt: serverTimestamp() })`
- My tasks: `onSnapshot(query(collection(db, 'boots_tasks'), where('acceptedBy', '==', uid)))`

Task types with icons: Photos (Camera), Walkthrough (Eye), Lockbox Access (Lock), Sign Placement (MapPin), Occupant Check (User), HOA Docs (FileText)

Status flow colors: open=cyan, accepted=gold, in-progress=purple, submitted=blue, complete=green

After accepting a task: `incrementStat(firebaseUid, 'bootsTasksCompleted')` on complete status.

Structure:
```jsx
// Onboarding wizard (3-step) if !profile.bootsProfile
// Main view: 2-column (open tasks left / my tasks right)
// Both columns use real-time Firestore listeners
```

The implementation follows the same pattern as BirdDog.jsx — form state, Firestore writes, real-time listeners. Build it with:
- Onboarding wizard with step indicators (1/3, 2/3, 3/3)
- City + radius slider for coverage
- Multi-select task type toggle cards with icons
- Day-of-week availability chips
- Save to `updateProfile({ bootsProfile: { market, radius, taskTypes, availability } })`

### Step 2: Commit

```bash
git add frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: build Boots on Ground page with onboarding wizard and task management"
```

---

## Task 9: Leaderboard Page

**Files:**
- Create: `frontend/src/pages/Leaderboard.jsx`

### Step 1: Create the page

Key logic:
- Read all users from Firestore: `getDocs(collection(db, 'users'))`
- Score formula (per user doc `stats`):
  ```js
  function score(stats) {
    return (
      (stats.underwrites || 0) * 10 +
      (stats.lois || 0) * 8 +
      (stats.contracts || 0) * 8 +
      (stats.dealsSubmitted || 0) * 15 +
      (stats.dealsClosed || 0) * 50 +
      Math.floor((stats.messages || 0) / 100) * 5 +
      (stats.birdDogLeads || 0) * 12 +
      (stats.bootsTasksCompleted || 0) * 8
    )
  }
  ```
- Sort descending, take top 50
- Category tabs filter by specific stat fields

Layout:
```
[Podium: #2 | #1 | #3]   ← NinjaAvatar (lg), username, rank badge, score
[Tabs: Overall | Underwrites | LOIs | Most Active | Bird Dog]
[Ranked rows: rank# | NinjaAvatar(sm) | username | RankBadge | score]
[My row pinned at bottom]
```

Podium styling:
- `#1`: `h-40`, gold glow border, crown icon above avatar, full aura shown
- `#2`: `h-32`, silver glow border
- `#3`: `h-28`, bronze glow border

```jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import NinjaAvatar from '../components/NinjaAvatar'
import RankBadge from '../components/RankBadge'

const TABS = [
  { id: 'overall',    label: 'Overall',       scoreKey: null },
  { id: 'underwrites',label: 'Underwrites',   scoreKey: 'underwrites' },
  { id: 'lois',       label: 'LOIs',          scoreKey: 'lois' },
  { id: 'active',     label: 'Most Active',   scoreKey: 'messages' },
  { id: 'birddog',    label: 'Bird Dog',      scoreKey: 'birdDogLeads' },
]

function computeOverallScore(stats) {
  return (
    (stats.underwrites || 0) * 10 +
    (stats.lois || 0) * 8 +
    (stats.contracts || 0) * 8 +
    (stats.dealsSubmitted || 0) * 15 +
    (stats.dealsClosed || 0) * 50 +
    Math.floor((stats.messages || 0) / 100) * 5 +
    (stats.birdDogLeads || 0) * 12 +
    (stats.bootsTasksCompleted || 0) * 8
  )
}

// Build full Leaderboard component with podium + tabs + ranked list
```

### Step 2: Commit

```bash
git add frontend/src/pages/Leaderboard.jsx
git commit -m "feat: build Leaderboard page with podium, ranked list, and category tabs"
```

---

## Task 10: Underwriting Calculator (Rebuilt)

**Files:**
- Modify (replace): `frontend/src/pages/Underwriting.jsx`

### Step 1: Build the calculation engine

The spreadsheet (`Underwriting Sheet.xlsx`, "Creative UW" sheet) has these calculations. Implement as pure JS:

```js
// frontend/src/lib/underwiting.js
export function calcMonthlyPayment(loanBalance, interestRate, yearsRemaining) {
  if (!loanBalance || !interestRate || !yearsRemaining) return 0
  const r = interestRate / 100 / 12
  const n = yearsRemaining * 12
  if (r === 0) return loanBalance / n
  return loanBalance * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

export function calcSellerNet(askingPrice, closingCostPct = 0.08) {
  return askingPrice * (1 - closingCostPct)
}

export function calcMaxEntryFee(arv, pct = 0.10) {
  return arv * pct
}

export function calcCashToSellerAgent(entryFee, pct = 0.06) {
  return entryFee * pct
}

export function calcNetCashFlow(proFormaRent, expenses) {
  // expenses = { warchest, propMgmt, insurance, taxes, piti, extras[] }
  const warchest = proFormaRent * (expenses.warchestPct / 100)
  const propMgmt = proFormaRent * (expenses.propMgmtPct / 100)
  const totalExpenses = warchest + propMgmt + (expenses.insurance || 0) + (expenses.taxes || 0) + (expenses.piti || 0) + (expenses.extras || 0)
  return proFormaRent - totalExpenses
}

export function calcCashOnCash(annualNCF, totalEntry) {
  if (!totalEntry) return 0
  return (annualNCF / totalEntry) * 100
}
```

### Step 2: Build the UI

Replace `frontend/src/pages/Underwriting.jsx` with a clean two-panel layout:

- **Left panel**: 5 tabbed input sections (Property, Financing, Deal, Rental Rates, PML)
- **Right panel**: Results cards — Seller Net, Monthly Payment, Underwriting summary, 4 strategy cards (LTR/MTR/STR/Section 8), Wholesale vs Buy

Each strategy card shows:
- Net Cash Flow (color-coded: green ≥ $300/mo, yellow $100–299, red < $100)
- Annual NCF
- Cash-on-Cash Return %

After user fills inputs and hits "Calculate", increment `stats.underwrites` via `incrementStat(firebaseUid, 'underwrites')`.

### Step 3: Commit

```bash
git add frontend/src/lib/underwriting.js frontend/src/pages/Underwriting.jsx
git commit -m "feat: rebuild Underwriting Calculator with 5-tab inputs and 4-strategy results panel"
```

---

## Task 11: Community — Avatar Integration + Stat Increment

**Files:**
- Modify: `frontend/src/pages/Community.jsx`
- Modify: `frontend/src/components/UserProfileCard.jsx`

### Step 1: Avatar in messages

In `Community.jsx`:
1. Import `NinjaAvatar`
2. Replace every `hanko-seal` initials circle for messages with:
   ```jsx
   <div className="w-8 h-8 shrink-0">
     <NinjaAvatar config={undefined} size={32} rank="initiate" />
   </div>
   ```
   *(For now use default avatar since we don't cache per-author profiles. Future: build author profile cache.)*
3. In `sendMessage`, after successful `addDoc`, call `incrementStat(firebaseUid, 'messages')`

### Step 2: Enhanced UserProfileCard

In `UserProfileCard.jsx`, expand to show rank badge and badges:
```jsx
import NinjaAvatar from './NinjaAvatar'
import RankBadge from './RankBadge'

// Replace initials avatar with NinjaAvatar
// Add RankBadge below name
// Add badge row if badges.length > 0
```

### Step 3: Commit

```bash
git add frontend/src/pages/Community.jsx frontend/src/components/UserProfileCard.jsx
git commit -m "feat: integrate NinjaAvatar into Community messages and enhance UserProfileCard"
```

---

## Task 12: Stats Integration on Existing Pages

**Files:**
- Modify: `frontend/src/pages/LOIGenerator.jsx`

### Step 1: Increment LOI stat

In `LOIGenerator.jsx`, find where the LOI is generated/downloaded. After success:
```js
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'

// In the generate handler:
const { firebaseUid } = useAuth()
await incrementStat(firebaseUid, 'lois')
```

### Step 2: Commit

```bash
git add frontend/src/pages/LOIGenerator.jsx
git commit -m "feat: increment lois stat when LOI is generated"
```

---

## Task 13: Final Deploy

### Step 1: Build and verify

```bash
cd frontend && npm run build
```
Expected: build completes with no errors.

### Step 2: Deploy to Vercel

```bash
cd frontend && npx vercel --prod
```

### Step 3: Final commit and push

```bash
git push origin master
```

---

## Summary of New Files

| File | Purpose |
|---|---|
| `frontend/src/lib/userProfile.js` | Rank/badge/stats logic + Firestore helpers |
| `frontend/src/components/NinjaAvatar.jsx` | Layered SVG avatar renderer |
| `frontend/src/components/RankBadge.jsx` | Rank tier display chip |
| `frontend/src/components/ActivityBadge.jsx` | Achievement badge chip |
| `frontend/src/components/QuickSettingsPanel.jsx` | 6-tab slide-over settings |
| `frontend/src/pages/BirdDog.jsx` | Bird Dog lead submission page |
| `frontend/src/pages/BootsOnGround.jsx` | Boots onboarding + task management |
| `frontend/src/pages/Leaderboard.jsx` | Gamified leaderboard with podium |
| `frontend/src/lib/underwriting.js` | Underwriting calculation engine |

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users/{uid}` | User profiles, avatars, stats, rank, badges |
| `bird_dog_leads` | Bird Dog submissions |
| `boots_tasks` | Admin-created tasks for Boots users |
| `messages` | Community messages (existing) |
| `replies` | Community replies (existing) |
