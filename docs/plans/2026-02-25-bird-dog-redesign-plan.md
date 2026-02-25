# Bird Dog Page Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the two-sided Bird Dog marketplace with a simple explainer + signup + lead submission dashboard page.

**Architecture:** Single scrollable page with conditional rendering: always show hero/explainer, then signup form (if not registered) OR dashboard with stats + lead submission + pipeline (if registered). Reuses existing `bird_dog_leads` collection and `birdDogProfile` user field. Strips all marketplace components.

**Tech Stack:** React 19, Framer Motion, Firebase Firestore, Tailwind CSS v4, Lucide React icons

---

### Task 1: Delete All Marketplace Components

**Files:**
- Delete: `frontend/src/components/birddog/ProfileSetupModal.jsx`
- Delete: `frontend/src/components/birddog/CreatePostModal.jsx`
- Delete: `frontend/src/components/birddog/BirdDogCard.jsx`
- Delete: `frontend/src/components/birddog/JobCard.jsx`
- Delete: `frontend/src/components/birddog/ApplyModal.jsx`
- Delete: `frontend/src/components/birddog/ApplicantsList.jsx`
- Delete: `frontend/src/components/birddog/FilterBar.jsx`
- Delete: `frontend/src/components/birddog/MessagePanel.jsx`
- Delete: `frontend/src/components/birddog/MessageThread.jsx`
- Delete: `frontend/src/components/birddog/ReviewForm.jsx`
- Delete: `frontend/src/components/birddog/ReviewsList.jsx`
- Delete: `frontend/src/components/birddog/StarRating.jsx`

**Step 1: Delete all files in the birddog components directory**

```bash
rm -rf frontend/src/components/birddog/
```

**Step 2: Commit**

```bash
git add -A frontend/src/components/birddog/
git commit -m "chore: remove all Bird Dog marketplace components"
```

---

### Task 2: Rewrite BirdDog.jsx — Constants & Imports

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx` (complete rewrite)

**Step 1: Replace the entire file with new imports and constants**

Replace the full contents of `BirdDog.jsx` with the foundation. Keep these imports (from the old file):

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle, Send, Clock, ChevronDown, ChevronUp,
  Home, AlertTriangle, DollarSign, TrendingUp, Users, FileText,
} from 'lucide-react'
import {
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'
import GlassPanel from '../components/GlassPanel'
```

New constants:

```jsx
const STATUS_STYLES = {
  submitted:              { label: 'Submitted',              color: '#9CA3AF' },
  under_review:           { label: 'Under Review',           color: '#00C6FF' },
  contacting_seller:      { label: 'Contacting Seller',      color: '#0E5A88' },
  seller_interested:      { label: 'Seller Interested',      color: '#00D9FF' },
  underwriting:           { label: 'Underwriting',           color: '#F6C445' },
  offer_made:             { label: 'Offer Made',             color: '#FF9500' },
  under_contract:         { label: 'Under Contract',         color: '#7F00FF' },
  closed_paid:            { label: 'Closed / Paid',          color: '#10B981' },
  seller_not_interested:  { label: 'Seller Not Interested',  color: '#E53935' },
  seller_declined_offer:  { label: 'Seller Declined Offer',  color: '#E53935' },
}

const CONDITION_OPTIONS = [
  'Distressed',
  'Vacant',
  'Pre-Foreclosure',
  'Probate',
  'Tired Landlord',
  'Other',
]

const EMPTY_LEAD_FORM = {
  propertyAddress: '',
  ownerName: '',
  ownerContact: '',
  propertyCondition: '',
  askingPrice: '',
  dealReason: '',
}

const HOW_IT_WORKS = [
  { num: '01', title: 'Find a Deal', text: 'Spot a distressed, vacant, or motivated seller property in your market.' },
  { num: '02', title: 'Submit the Lead', text: 'Fill out the details and send it to our underwriting team.' },
  { num: '03', title: 'Get Paid', text: 'If the deal closes, you earn a bird dog fee.' },
]

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}
```

**Step 2: Verify the file has no syntax errors**

```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
```

Expected: No import errors (birddog components are gone, new imports are valid)

**Step 3: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "refactor: rewrite BirdDog.jsx imports and constants for redesign"
```

---

### Task 3: Build the Hero / Explainer Section

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add the HeroExplainer component**

Add this below the constants in BirdDog.jsx:

```jsx
function HeroExplainer({ showCta, onCtaClick }) {
  return (
    <motion.div
      className="mb-10"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Title */}
      <div className="text-center mb-10 max-w-[680px] mx-auto">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
            <MapPin size={36} style={{ color: '#00C6FF' }} />
          </div>
          <h1
            className="font-display text-4xl"
            style={{
              color: '#F4F7FA',
              textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
            }}
          >
            Bird Dog for Dispo Dojo
          </h1>
        </div>
        <p className="text-sm mt-2 font-heading tracking-wide" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
          Find deals. Submit leads. Get paid.
        </p>
      </div>

      {/* What is a Bird Dog + How It Works */}
      <div className="max-w-3xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Explainer */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 mb-6">
              <h2 className="font-heading font-semibold text-base tracking-wider mb-3" style={{ color: '#F6C445' }}>
                What is Bird Dogging?
              </h2>
              <p className="text-sm text-text-dim leading-relaxed font-body">
                A bird dog is someone who scouts properties and brings leads to experienced investors.
                You do the legwork — finding motivated sellers who aren't listed anywhere — and we handle
                the deal. When it closes, you get paid.
              </p>
              <p className="text-sm text-text-dim leading-relaxed font-body mt-2">
                No license needed. No capital required. Just find a good lead and submit it to Dispo Dojo.
                Our team reviews it, underwrites the deal, and if it closes, you earn a bird dog fee.
              </p>
            </GlassPanel>
          </motion.div>

          {/* How It Works — 3 Steps */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 mb-6">
              <h2 className="font-heading font-semibold text-base tracking-wider mb-5" style={{ color: '#F6C445' }}>
                How It Works
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.num} className="flex flex-col items-center text-center">
                    <span
                      className="font-heading font-bold text-2xl tracking-widest mb-2"
                      style={{ color: '#00C6FF', textShadow: '0 0 20px rgba(0,198,255,0.4)' }}
                    >
                      {step.num}
                    </span>
                    <p className="font-heading font-semibold text-sm tracking-wider text-parchment mb-1">
                      {step.title}
                    </p>
                    <p className="text-xs text-text-dim leading-relaxed font-body">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>

          {/* CTA for non-registered users */}
          {showCta && (
            <motion.div variants={itemVariants} className="text-center">
              <button
                onClick={onCtaClick}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60 active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
              >
                Become a Bird Dog
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: add HeroExplainer component for Bird Dog page"
```

---

### Task 4: Build the Signup Form

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add the SignupForm component**

Add below HeroExplainer in BirdDog.jsx:

```jsx
function SignupForm({ onComplete, user }) {
  const [form, setForm] = useState({
    name: user?.displayName || user?.name || '',
    phone: '',
    email: user?.email || '',
    market: '',
    experienceLevel: '',
    pitch: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const formRef = useRef(null)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.phone.trim()) errs.phone = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    if (!form.market.trim()) errs.market = 'Required'
    if (!form.experienceLevel) errs.experienceLevel = 'Select your experience level'
    if (!form.pitch.trim()) errs.pitch = 'Required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await onComplete({
        registered: true,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        market: form.market.trim(),
        experienceLevel: form.experienceLevel,
        pitch: form.pitch.trim(),
        registeredAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Bird dog signup error:', err)
    } finally {
      setLoading(false)
    }
  }

  const expLevels = ['beginner', 'intermediate', 'pro']

  return (
    <motion.div
      ref={formRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-xl mx-auto"
      id="signup-form"
    >
      <GlassPanel className="p-6">
        <h2 className="font-heading font-semibold text-base tracking-wider mb-5" style={{ color: '#F6C445' }}>
          Sign Up as a Bird Dog
        </h2>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Full Name */}
          <div>
            <label className={labelCls}>Full Name *</label>
            <input type="text" className={inputCls} placeholder="Your full name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="mt-1 text-[10px] text-[#E53935]">{errors.name}</p>}
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Phone *</label>
              <input type="tel" className={inputCls} placeholder="(555) 000-0000" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
              {errors.phone && <p className="mt-1 text-[10px] text-[#E53935]">{errors.phone}</p>}
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls} placeholder="you@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
              {errors.email && <p className="mt-1 text-[10px] text-[#E53935]">{errors.email}</p>}
            </div>
          </div>

          {/* Market */}
          <div>
            <label className={labelCls}>Market / Area You Cover *</label>
            <input type="text" className={inputCls} placeholder="e.g. Dallas-Fort Worth, TX" value={form.market} onChange={(e) => set('market', e.target.value)} />
            {errors.market && <p className="mt-1 text-[10px] text-[#E53935]">{errors.market}</p>}
          </div>

          {/* Experience Level — Toggle Pills */}
          <div>
            <label className={labelCls}>Experience Level *</label>
            <div className="flex gap-2 mt-1">
              {expLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => set('experienceLevel', level)}
                  className="px-4 py-2 rounded-sm text-xs font-heading font-semibold tracking-wider uppercase transition-colors"
                  style={{
                    background: form.experienceLevel === level ? 'rgba(0,198,255,0.15)' : 'rgba(0,0,0,0.3)',
                    border: `1px solid ${form.experienceLevel === level ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
                    color: form.experienceLevel === level ? '#00C6FF' : '#C8D1DA',
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
            {errors.experienceLevel && <p className="mt-1 text-[10px] text-[#E53935]">{errors.experienceLevel}</p>}
          </div>

          {/* Brief Pitch */}
          <div>
            <label className={labelCls}>Tell us about yourself *</label>
            <textarea
              className={inputCls + ' h-24 resize-none'}
              placeholder="How do you find deals? What markets are you active in? What's your experience?"
              value={form.pitch}
              onChange={(e) => {
                if (e.target.value.length <= 280) set('pitch', e.target.value)
              }}
              maxLength={280}
            />
            <div className="flex justify-between mt-1">
              {errors.pitch && <p className="text-[10px] text-[#E53935]">{errors.pitch}</p>}
              <p className="text-[10px] text-text-dim/40 font-body ml-auto">{form.pitch.length}/280</p>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
          >
            <Send size={14} />
            {loading ? 'Signing Up...' : 'Sign Up as a Bird Dog'}
          </button>
        </form>
      </GlassPanel>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: add Bird Dog signup form component"
```

---

### Task 5: Build the Stats Bar

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add StatsBar component**

```jsx
function StatsBar({ leads }) {
  const total = leads.length
  const rejectedStatuses = ['seller_not_interested', 'seller_declined_offer']
  const closedStatuses = ['closed_paid']
  const inPipeline = leads.filter((l) => !rejectedStatuses.includes(l.status) && !closedStatuses.includes(l.status)).length
  const closed = leads.filter((l) => l.status === 'closed_paid').length
  const acceptanceRate = total > 0 ? Math.round((closed / total) * 100) : 0

  const stats = [
    { label: 'Total Leads', value: total, color: '#00C6FF' },
    { label: 'In Pipeline', value: inPipeline, color: '#F6C445' },
    { label: 'Closed Deals', value: closed, color: '#10B981' },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, color: '#7F00FF' },
  ]

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stats.map((stat) => (
        <motion.div key={stat.label} variants={itemVariants}>
          <GlassPanel className="p-4 text-center">
            <p className="font-heading font-bold text-2xl" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-[10px] font-heading tracking-widest uppercase text-text-dim mt-1">
              {stat.label}
            </p>
          </GlassPanel>
        </motion.div>
      ))}
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: add Bird Dog stats bar component"
```

---

### Task 6: Build the Lead Submission Form

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add SubmitLeadForm component**

This is adapted from the existing SubmissionForm (lines 158-387 of the old file) with updated field names:

```jsx
function SubmitLeadForm({ firebaseUid, profile, user }) {
  const [form, setForm] = useState(EMPTY_LEAD_FORM)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.propertyAddress.trim()) errs.propertyAddress = 'Required'
    if (!form.ownerName.trim()) errs.ownerName = 'Required'
    if (!form.ownerContact.trim()) errs.ownerContact = 'Required'
    if (!form.propertyCondition) errs.propertyCondition = 'Required'
    if (!form.dealReason.trim()) errs.dealReason = 'Required'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      await addDoc(collection(db, 'bird_dog_leads'), {
        propertyAddress: form.propertyAddress.trim(),
        ownerName: form.ownerName.trim(),
        ownerContact: form.ownerContact.trim(),
        propertyCondition: form.propertyCondition,
        askingPrice: form.askingPrice ? Number(form.askingPrice) : null,
        dealReason: form.dealReason.trim(),
        userId: firebaseUid,
        userName: profile?.displayName || user?.name || 'Unknown',
        status: 'submitted',
        payout: null,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await incrementStat(firebaseUid, 'birdDogLeads')
      setForm(EMPTY_LEAD_FORM)
      setErrors({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('Bird dog lead submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="mb-6"
    >
      <GlassPanel className="p-5">
        <h2 className="font-heading font-semibold text-base tracking-wider mb-4" style={{ color: '#F6C445' }}>
          Submit a Lead
        </h2>

        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-4 px-4 py-3 rounded-sm border border-emerald-500/30 bg-emerald-500/8 text-sm text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle size={14} />
              Lead submitted! Our team will review it shortly.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Property Address */}
          <div>
            <label className={labelCls}>Property Address *</label>
            <input type="text" className={inputCls} placeholder="123 Main St, City, State 00000" value={form.propertyAddress} onChange={(e) => set('propertyAddress', e.target.value)} />
            {errors.propertyAddress && <p className="mt-1 text-[10px] text-[#E53935]">{errors.propertyAddress}</p>}
          </div>

          {/* Owner Name + Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Owner Name *</label>
              <input type="text" className={inputCls} placeholder="John Smith" value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              {errors.ownerName && <p className="mt-1 text-[10px] text-[#E53935]">{errors.ownerName}</p>}
            </div>
            <div>
              <label className={labelCls}>Owner Contact *</label>
              <input type="text" className={inputCls} placeholder="Phone or email" value={form.ownerContact} onChange={(e) => set('ownerContact', e.target.value)} />
              {errors.ownerContact && <p className="mt-1 text-[10px] text-[#E53935]">{errors.ownerContact}</p>}
            </div>
          </div>

          {/* Property Condition + Asking Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Property Condition *</label>
              <select className={inputCls + ' cursor-pointer'} value={form.propertyCondition} onChange={(e) => set('propertyCondition', e.target.value)}>
                <option value="" disabled>Select condition...</option>
                {CONDITION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-[#0B0F14]">{opt}</option>
                ))}
              </select>
              {errors.propertyCondition && <p className="mt-1 text-[10px] text-[#E53935]">{errors.propertyCondition}</p>}
            </div>
            <div>
              <label className={labelCls}>Asking Price / ARV <span className="normal-case text-text-muted">(optional)</span></label>
              <input type="number" className={inputCls} placeholder="$150,000" value={form.askingPrice} onChange={(e) => set('askingPrice', e.target.value)} />
            </div>
          </div>

          {/* Why It's a Deal */}
          <div>
            <label className={labelCls}>Why It's a Deal *</label>
            <textarea className={inputCls + ' h-24 resize-none'} placeholder="Describe the seller's situation, motivation, property condition, and why this is worth pursuing..." value={form.dealReason} onChange={(e) => set('dealReason', e.target.value)} />
            {errors.dealReason && <p className="mt-1 text-[10px] text-[#E53935]">{errors.dealReason}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
          >
            <Send size={14} />
            {loading ? 'Submitting...' : 'Submit Lead'}
          </button>
        </form>
      </GlassPanel>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: add lead submission form for Bird Dog page"
```

---

### Task 7: Build the Leads Pipeline

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add StatusBadge and LeadsPipeline components**

```jsx
function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.submitted
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-widest whitespace-nowrap"
      style={{
        color: s.color,
        backgroundColor: `${s.color}18`,
        border: `1px solid ${s.color}33`,
      }}
    >
      {s.label}
    </span>
  )
}

function LeadsPipeline({ leads, loading }) {
  const [expanded, setExpanded] = useState(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassPanel className="p-5">
        <h2 className="font-heading font-semibold text-base tracking-wider" style={{ color: '#F6C445' }}>
          My Leads
        </h2>
        <div className="my-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.07)] to-transparent" />

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }} />
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Clock size={24} className="text-text-dim/25" />
            <p className="text-xs text-text-dim/40 font-body">No leads submitted yet. Submit your first lead above!</p>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {leads.map((lead, i) => {
              const isExpanded = expanded === lead.id
              const date = lead.submittedAt?.toDate
                ? lead.submittedAt.toDate().toLocaleDateString()
                : lead.submittedAt
                  ? new Date(lead.submittedAt).toLocaleDateString()
                  : '—'

              return (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="rounded-sm bg-black/30 border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                  onClick={() => setExpanded(isExpanded ? null : lead.id)}
                >
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <p className="text-xs font-heading font-semibold text-parchment truncate" title={lead.propertyAddress}>
                          {lead.propertyAddress || '—'}
                        </p>
                        {isExpanded ? <ChevronUp size={12} className="text-text-dim shrink-0" /> : <ChevronDown size={12} className="text-text-dim shrink-0" />}
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <p className="text-[11px] text-text-dim/50 font-body">
                      {lead.ownerName}{lead.propertyCondition ? ` · ${lead.propertyCondition}` : ''} · {date}
                    </p>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-1 border-t border-[rgba(255,255,255,0.05)]">
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-body">
                            <div>
                              <span className="text-text-dim/40">Owner Contact:</span>
                              <p className="text-text-dim">{lead.ownerContact || '—'}</p>
                            </div>
                            <div>
                              <span className="text-text-dim/40">Asking Price / ARV:</span>
                              <p className="text-text-dim">{lead.askingPrice ? `$${Number(lead.askingPrice).toLocaleString()}` : '—'}</p>
                            </div>
                          </div>
                          <div className="mt-2 text-[11px] font-body">
                            <span className="text-text-dim/40">Why It's a Deal:</span>
                            <p className="text-text-dim mt-0.5">{lead.dealReason || '—'}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </GlassPanel>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: add leads pipeline with expandable cards and status badges"
```

---

### Task 8: Build the Main Page Component with Conditional Rendering

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Add the main BirdDog export component**

This replaces the old export at the bottom of the file. It wires everything together with conditional rendering:

```jsx
export default function BirdDog() {
  const { user, profile, firebaseReady, updateProfile } = useAuth()
  const firebaseUid = user?.firebaseUid
  const isRegistered = profile?.birdDogProfile?.registered === true
  const signupRef = useRef(null)

  // ─── Leads listener ─────────────────────────────────────────────────────
  const [leads, setLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUid || !isRegistered) {
      setLeadsLoading(false)
      return
    }
    const q = query(
      collection(db, 'bird_dog_leads'),
      where('userId', '==', firebaseUid),
      orderBy('submittedAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLeadsLoading(false)
      },
      (err) => {
        console.error('Bird dog leads listener error:', err)
        setLeadsLoading(false)
      },
    )
    return () => unsub()
  }, [firebaseUid, isRegistered])

  // ─── Signup handler ──────────────────────────────────────────────────────
  async function handleSignup(profileData) {
    await updateProfile({ birdDogProfile: profileData })
  }

  function scrollToSignup() {
    signupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bird-dog-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 20%',
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.7) 55%, rgba(11,15,20,0.92) 100%),
            linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.6) 40%, rgba(11,15,20,0.9) 100%)
          `,
        }}
      />

      <div className="min-h-screen px-6 py-16 relative z-10">
        {/* Hero / Explainer — Always Visible */}
        <HeroExplainer showCta={!isRegistered} onCtaClick={scrollToSignup} />

        {/* Loading State */}
        {!firebaseReady && (
          <div className="max-w-3xl mx-auto">
            <GlassPanel className="p-5">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-6 h-6 rounded-full border-2 animate-spin mx-auto mb-3" style={{ borderColor: 'rgba(0,198,255,0.3)', borderTopColor: '#00C6FF' }} />
                  <p className="text-xs text-text-dim/40 font-body">Connecting...</p>
                </div>
              </div>
            </GlassPanel>
          </div>
        )}

        {/* Signup Form — Not Registered */}
        {firebaseReady && !isRegistered && (
          <div ref={signupRef}>
            <SignupForm onComplete={handleSignup} user={user} />
          </div>
        )}

        {/* Dashboard — Registered */}
        {firebaseReady && isRegistered && (
          <div className="max-w-3xl mx-auto">
            <StatsBar leads={leads} />
            <SubmitLeadForm firebaseUid={firebaseUid} profile={profile} user={user} />
            <LeadsPipeline leads={leads} loading={leadsLoading} />
          </div>
        )}
      </div>
    </>
  )
}
```

**Step 2: Verify no build errors**

```bash
cd frontend && npx vite build --mode development 2>&1 | head -30
```

Expected: Clean build, no import errors

**Step 3: Commit**

```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: wire up Bird Dog page with conditional rendering (explainer + signup + dashboard)"
```

---

### Task 9: Update Admin Dashboard — Bird Dog Section

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx` (lines 299-363, ~1014)

**Step 1: Rewrite the BirdDogAdmin function**

Replace the existing `BirdDogAdmin` function (starts at line 313) with a new version that manages leads instead of marketplace posts:

- Remove the `birddogs` / `investors` / `posts-jobs` sub-tabs
- Listen to `bird_dog_leads` collection (all leads, ordered by `submittedAt` desc)
- Listen to `users` collection where `birdDogProfile.registered === true` for registered bird dogs count
- Show KPI cards: Total Leads, In Pipeline, Closed Deals, Registered Bird Dogs
- Show a leads table with columns: Address, Bird Dog, Condition, Status (dropdown to update), Date
- Add a prominent alert card: "TODO: Define bird dog payout structure" with high importance styling
- Status dropdown calls `updateDoc(doc(db, 'bird_dog_leads', leadId), { status: newStatus, updatedAt: serverTimestamp() })`

Use the existing admin table patterns from the same file for consistency. The STATUS_STYLES constant should be imported or duplicated in the admin section.

**Step 2: Verify admin page builds**

```bash
cd frontend && npx vite build --mode development 2>&1 | head -30
```

**Step 3: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: update admin Bird Dog section to manage leads instead of marketplace"
```

---

### Task 10: Add Firestore Index for bird_dog_leads Query

**Files:**
- Modify: `firestore.rules` (if needed)
- Note: Firestore composite index for `bird_dog_leads` (userId + submittedAt)

**Step 1: Check if the composite index already exists**

The query `where('userId', '==', ...).orderBy('submittedAt', 'desc')` requires a composite index. The existing code uses `orderBy('createdAt', 'desc')` — since we changed to `submittedAt`, we need to verify.

If running locally, the Firestore emulator will auto-create. For production, the index will be auto-suggested in the browser console on first query failure. Click the link to create it.

**Step 2: Commit any firestore.rules changes**

```bash
git add firestore.rules
git commit -m "chore: update firestore rules for bird dog leads"
```

---

### Task 11: Screenshot, Test, and Final Verification

**Files:**
- Test: `frontend/src/pages/BirdDog.jsx`
- Test: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Start the dev server**

```bash
cd frontend && npm run dev &
```

**Step 2: Screenshot the Bird Dog page (not logged in / not registered state)**

```bash
node screenshot.mjs http://localhost:5173/bird-dog bird-dog-explainer
```

Read the screenshot, verify:
- Hero section with title "Bird Dog for Dispo Dojo"
- Explainer cards (What is Bird Dogging, How It Works)
- "Become a Bird Dog" CTA button
- Background image visible

**Step 3: Test signup flow in browser**

Navigate to `/bird-dog`, fill out signup form, submit. Verify `birdDogProfile` appears on user document in Firestore.

**Step 4: Screenshot the dashboard state**

```bash
node screenshot.mjs http://localhost:5173/bird-dog bird-dog-dashboard
```

Read the screenshot, verify:
- Stats bar (4 cards)
- Submit a Lead form
- My Leads pipeline (empty state or with test data)
- Explainer still visible at top

**Step 5: Test lead submission**

Fill out lead form, submit, verify document appears in `bird_dog_leads` collection with `status: 'submitted'`.

**Step 6: Screenshot admin panel**

```bash
node screenshot.mjs http://localhost:5173/admin bird-dog-admin
```

Read the screenshot, verify:
- Leads table with status dropdowns
- KPI cards
- TODO alert about payout structure

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Bird Dog page redesign — explainer + signup + lead dashboard"
```

---

## Summary of All Tasks

| # | Task | Files | Commit Message |
|---|------|-------|----------------|
| 1 | Delete marketplace components | `components/birddog/*` | `chore: remove all Bird Dog marketplace components` |
| 2 | Rewrite imports & constants | `BirdDog.jsx` | `refactor: rewrite BirdDog.jsx imports and constants` |
| 3 | Build Hero/Explainer | `BirdDog.jsx` | `feat: add HeroExplainer component` |
| 4 | Build Signup Form | `BirdDog.jsx` | `feat: add Bird Dog signup form` |
| 5 | Build Stats Bar | `BirdDog.jsx` | `feat: add Bird Dog stats bar` |
| 6 | Build Lead Submission Form | `BirdDog.jsx` | `feat: add lead submission form` |
| 7 | Build Leads Pipeline | `BirdDog.jsx` | `feat: add leads pipeline with expandable cards` |
| 8 | Wire Main Component | `BirdDog.jsx` | `feat: wire up conditional rendering` |
| 9 | Update Admin Dashboard | `AdminDashboard.jsx` | `feat: update admin Bird Dog section` |
| 10 | Firestore Index | `firestore.rules` | `chore: update firestore rules` |
| 11 | Screenshot & Test | — | `feat: complete Bird Dog page redesign` |
