# Bird Dog Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Bird Dog page into a two-sided marketplace where bird dogs and investors connect, post, apply, message, and review each other.

**Architecture:** Replace the current single-form BirdDog.jsx with a tabbed marketplace layout (Find Bird Dogs / Find Jobs / My Activity). New Firestore collections for posts, reviews, threads, and messages. Bird Dog profile data stored as a `birdDogProfile` field on the existing `users` document. Messaging via a slide-out panel with real-time Firestore listeners. Admin panel extended with a Bird Dog section including KPIs and management tables.

**Tech Stack:** React 19, Firebase/Firestore, Framer Motion, Lucide icons, GlassPanel component, Tailwind CSS v4

**Design Doc:** `docs/plans/2026-02-25-bird-dog-marketplace-design.md`

---

## Task 1: Scaffold Page Layout with Tabs

Restructure BirdDog.jsx from a 3-column layout into a tabbed marketplace page.

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx`

**Step 1: Replace page body with tab structure**

Keep the existing header (lines 486–538) and background (lines 491–509). Replace the 3-column grid (lines 540–576) with:

```jsx
// Tab state at top of BirdDog component
const [activeTab, setActiveTab] = useState('find-birddogs')

// Tab bar constants
const TABS = [
  { id: 'find-birddogs', label: 'Find Bird Dogs' },
  { id: 'find-jobs', label: 'Find Jobs' },
  { id: 'my-activity', label: 'My Activity' },
]
```

Tab bar UI — follows the admin dashboard pattern:
```jsx
<div className="max-w-6xl mx-auto">
  {/* Tab bar + Create Post button */}
  <div className="flex items-center justify-between mb-6">
    <div className="flex gap-1 border-b border-[rgba(0,198,255,0.12)]">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={[
            'relative px-4 py-2.5 font-heading text-xs tracking-widest uppercase transition-colors',
            activeTab === tab.id ? 'text-cyan' : 'text-text-dim hover:text-parchment',
          ].join(' ')}
        >
          {tab.label}
          {activeTab === tab.id && (
            <motion.div
              layoutId="bird-dog-tab"
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00C6FF]"
            />
          )}
        </button>
      ))}
    </div>
    <button
      onClick={handleCreatePost}
      className="flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
    >
      <Plus size={14} />
      Create Post
    </button>
  </div>

  {/* Tab content */}
  {activeTab === 'find-birddogs' && <FindBirdDogsTab />}
  {activeTab === 'find-jobs' && <FindJobsTab />}
  {activeTab === 'my-activity' && <MyActivityTab />}
</div>
```

**Step 2: Create placeholder tab components**

Add stub components at the bottom of BirdDog.jsx (they'll be built out in later tasks):

```jsx
function FindBirdDogsTab() {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Bird dog listings coming soon...</p>
    </GlassPanel>
  )
}

function FindJobsTab() {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Job postings coming soon...</p>
    </GlassPanel>
  )
}

function MyActivityTab({ firebaseUid, profile, user }) {
  return (
    <div className="flex flex-col gap-5">
      <SubmissionForm firebaseUid={firebaseUid} profile={profile} user={user} />
      <MySubmissions firebaseUid={firebaseUid} />
    </div>
  )
}
```

**Step 3: Update tagline**

Change line 534-536 from "Find motivated sellers. Earn on every deal that closes." to "Connect with bird dogs and investors in your market."

**Step 4: Update imports**

Add `Plus` to the lucide-react import.

**Step 5: Add handleCreatePost stub**

```jsx
function handleCreatePost() {
  // Will check for birdDogProfile and show onboarding modal — Task 2
}
```

**Step 6: Commit**
```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: scaffold Bird Dog marketplace with tab layout"
```

---

## Task 2: Bird Dog Profile Onboarding Modal

Build the just-in-time onboarding flow that appears when a user clicks "+ Create Post" without a Bird Dog profile.

**Files:**
- Create: `frontend/src/components/birddog/ProfileSetupModal.jsx`
- Modify: `frontend/src/pages/BirdDog.jsx` (wire up the modal)

**Step 1: Create ProfileSetupModal component**

```jsx
// frontend/src/components/birddog/ProfileSetupModal.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Briefcase, Plus, Check } from 'lucide-react'
import GlassPanel from '../GlassPanel'

const METHODS = [
  'Driving for Dollars', 'Door-Knocking', 'Cold Calling',
  'Skip Tracing', 'Referral Network', 'Other',
]

const DEAL_TYPES = [
  'Wholesale', 'Fix & Flip', 'Buy & Hold', 'Subject-To', 'Creative Finance',
]

const inputCls = 'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

export default function ProfileSetupModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1) // 1 = role select, 2 = profile form
  const [role, setRole] = useState(null) // 'bird_dog' | 'investor'
  const [form, setForm] = useState({
    serviceArea: [],
    methods: [],
    markets: [],
    dealTypes: [],
    bio: '',
    availability: 'available',
    contactPrefs: { showPhone: false, showEmail: false, dmsOnly: true },
  })
  const [areaInput, setAreaInput] = useState('')

  function addArea(e) {
    e.preventDefault()
    const val = areaInput.trim()
    if (val && !form.serviceArea.includes(val)) {
      setForm(prev => ({ ...prev, serviceArea: [...prev.serviceArea, val] }))
      setAreaInput('')
    }
  }

  function removeArea(area) {
    setForm(prev => ({ ...prev, serviceArea: prev.serviceArea.filter(a => a !== area) }))
  }

  function toggleMethod(method) {
    setForm(prev => ({
      ...prev,
      methods: prev.methods.includes(method)
        ? prev.methods.filter(m => m !== method)
        : [...prev.methods, method],
    }))
  }

  function toggleDealType(dt) {
    setForm(prev => ({
      ...prev,
      dealTypes: prev.dealTypes.includes(dt)
        ? prev.dealTypes.filter(d => d !== dt)
        : [...prev.dealTypes, dt],
    }))
  }

  function addMarket(e) {
    e.preventDefault()
    const val = areaInput.trim()
    if (val && !form.markets.includes(val)) {
      setForm(prev => ({ ...prev, markets: [...prev.markets, val] }))
      setAreaInput('')
    }
  }

  function removeMarket(m) {
    setForm(prev => ({ ...prev, markets: prev.markets.filter(x => x !== m) }))
  }

  function handleSubmit() {
    const profileData = {
      role,
      serviceArea: role === 'bird_dog' ? form.serviceArea : [],
      methods: role === 'bird_dog' ? form.methods : [],
      markets: role === 'investor' ? form.markets : [],
      dealTypes: role === 'investor' ? form.dealTypes : [],
      bio: form.bio,
      availability: form.availability,
      contactPrefs: form.contactPrefs,
      createdAt: new Date().toISOString(),
    }
    onComplete(profileData)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          <GlassPanel className="p-6">
            <button onClick={onClose} className="absolute top-4 right-4 text-text-dim hover:text-parchment transition-colors">
              <X size={18} />
            </button>

            {step === 1 && (
              /* Step 1: Role selection — two large clickable cards */
              <div>
                <h2 className="font-heading font-semibold text-lg tracking-wider text-parchment mb-2">
                  Join the Bird Dog Network
                </h2>
                <p className="text-sm text-text-dim font-body mb-6">
                  What best describes you?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bird Dog card */}
                  <button
                    onClick={() => { setRole('bird_dog'); setStep(2) }}
                    className="p-5 rounded-xl border border-[rgba(0,198,255,0.15)] bg-[rgba(0,198,255,0.05)] hover:border-[rgba(0,198,255,0.4)] hover:bg-[rgba(0,198,255,0.1)] transition-colors text-left group"
                  >
                    <MapPin size={28} className="text-cyan mb-3" />
                    <p className="font-heading font-semibold text-sm text-parchment tracking-wider">Bird Dog</p>
                    <p className="text-xs text-text-dim mt-1 font-body leading-relaxed">I scout properties and find leads for investors</p>
                  </button>
                  {/* Investor card */}
                  <button
                    onClick={() => { setRole('investor'); setStep(2) }}
                    className="p-5 rounded-xl border border-[rgba(246,196,69,0.15)] bg-[rgba(246,196,69,0.05)] hover:border-[rgba(246,196,69,0.4)] hover:bg-[rgba(246,196,69,0.1)] transition-colors text-left group"
                  >
                    <Briefcase size={28} className="text-gold mb-3" />
                    <p className="font-heading font-semibold text-sm text-parchment tracking-wider">Investor</p>
                    <p className="text-xs text-text-dim mt-1 font-body leading-relaxed">I need bird dogs to find leads in my markets</p>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && role === 'bird_dog' && (
              /* Step 2: Bird Dog profile form */
              <div>
                <button onClick={() => setStep(1)} className="text-xs text-text-dim hover:text-cyan font-heading tracking-wider mb-4">
                  ← Back
                </button>
                <h2 className="font-heading font-semibold text-lg tracking-wider text-parchment mb-5">
                  Set Up Your Bird Dog Profile
                </h2>
                <div className="flex flex-col gap-4">
                  {/* Service Area tags */}
                  <div>
                    <label className={labelCls}>Service Area</label>
                    <form onSubmit={addArea} className="flex gap-2">
                      <input className={inputCls} placeholder="e.g. Dallas, TX" value={areaInput} onChange={e => setAreaInput(e.target.value)} />
                      <button type="submit" className="px-3 py-2 bg-cyan/10 border border-cyan/30 rounded-sm text-cyan text-sm hover:bg-cyan/20 transition-colors">
                        <Plus size={14} />
                      </button>
                    </form>
                    {form.serviceArea.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.serviceArea.map(a => (
                          <span key={a} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-heading bg-cyan/10 border border-cyan/30 text-cyan">
                            {a}
                            <button onClick={() => removeArea(a)} className="hover:text-white"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Methods checkboxes */}
                  <div>
                    <label className={labelCls}>Methods</label>
                    <div className="flex flex-wrap gap-2">
                      {METHODS.map(m => (
                        <button key={m} type="button" onClick={() => toggleMethod(m)}
                          className={[
                            'px-3 py-1.5 rounded-full text-xs font-heading tracking-wider border transition-colors',
                            form.methods.includes(m) ? 'bg-cyan/15 border-cyan/40 text-cyan' : 'bg-transparent border-gold-dim/20 text-text-dim hover:border-gold-dim/40',
                          ].join(' ')}
                        >
                          {form.methods.includes(m) && <Check size={10} className="inline mr-1" />}{m}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Bio */}
                  <div>
                    <label className={labelCls}>Bio / Pitch <span className="normal-case text-text-muted">({form.bio.length}/280)</span></label>
                    <textarea className={inputCls + ' h-20 resize-none'} placeholder="What do you bring to the table?" maxLength={280} value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} />
                  </div>
                  {/* Availability */}
                  <div>
                    <label className={labelCls}>Availability</label>
                    <div className="flex gap-3">
                      {['available', 'unavailable'].map(v => (
                        <button key={v} onClick={() => setForm(prev => ({ ...prev, availability: v }))}
                          className={[
                            'px-4 py-2 rounded-sm text-xs font-heading tracking-wider border transition-colors',
                            form.availability === v ? 'bg-cyan/15 border-cyan/40 text-cyan' : 'border-gold-dim/20 text-text-dim hover:border-gold-dim/40',
                          ].join(' ')}
                        >
                          {v === 'available' ? 'Available Now' : 'Not Available'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Contact Preferences */}
                  <div>
                    <label className={labelCls}>Contact Preferences</label>
                    <div className="flex flex-col gap-2">
                      {[
                        { key: 'showPhone', label: 'Show my phone number' },
                        { key: 'showEmail', label: 'Show my email' },
                        { key: 'dmsOnly', label: 'DMs only (recommended)' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <div className={[
                            'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
                            form.contactPrefs[key] ? 'border-cyan bg-cyan/15' : 'border-gold-dim/20',
                          ].join(' ')}>
                            {form.contactPrefs[key] && <Check size={10} className="text-cyan" />}
                          </div>
                          <span className="text-xs text-text-dim font-body">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Submit */}
                  <button onClick={handleSubmit}
                    className="mt-2 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
                  >
                    Save Profile & Continue
                  </button>
                </div>
              </div>
            )}

            {step === 2 && role === 'investor' && (
              /* Step 2: Investor profile form — same structure, different fields */
              <div>
                <button onClick={() => setStep(1)} className="text-xs text-text-dim hover:text-cyan font-heading tracking-wider mb-4">
                  ← Back
                </button>
                <h2 className="font-heading font-semibold text-lg tracking-wider text-parchment mb-5">
                  Set Up Your Investor Profile
                </h2>
                <div className="flex flex-col gap-4">
                  {/* Markets tags */}
                  <div>
                    <label className={labelCls}>Markets You're Active In</label>
                    <form onSubmit={addMarket} className="flex gap-2">
                      <input className={inputCls} placeholder="e.g. Fort Worth, TX" value={areaInput} onChange={e => setAreaInput(e.target.value)} />
                      <button type="submit" className="px-3 py-2 bg-gold/10 border border-gold/30 rounded-sm text-gold text-sm hover:bg-gold/20 transition-colors">
                        <Plus size={14} />
                      </button>
                    </form>
                    {form.markets.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.markets.map(m => (
                          <span key={m} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-heading bg-gold/10 border border-gold/30 text-gold">
                            {m}
                            <button onClick={() => removeMarket(m)} className="hover:text-white"><X size={10} /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Deal Types */}
                  <div>
                    <label className={labelCls}>Deal Types</label>
                    <div className="flex flex-wrap gap-2">
                      {DEAL_TYPES.map(dt => (
                        <button key={dt} type="button" onClick={() => toggleDealType(dt)}
                          className={[
                            'px-3 py-1.5 rounded-full text-xs font-heading tracking-wider border transition-colors',
                            form.dealTypes.includes(dt) ? 'bg-gold/15 border-gold/40 text-gold' : 'bg-transparent border-gold-dim/20 text-text-dim hover:border-gold-dim/40',
                          ].join(' ')}
                        >
                          {form.dealTypes.includes(dt) && <Check size={10} className="inline mr-1" />}{dt}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Bio */}
                  <div>
                    <label className={labelCls}>Bio <span className="normal-case text-text-muted">({form.bio.length}/280)</span></label>
                    <textarea className={inputCls + ' h-20 resize-none'} placeholder="Tell bird dogs about your operation..." maxLength={280} value={form.bio} onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))} />
                  </div>
                  {/* Contact Preferences */}
                  <div>
                    <label className={labelCls}>Contact Preferences</label>
                    <div className="flex flex-col gap-2">
                      {[
                        { key: 'showPhone', label: 'Show my phone number' },
                        { key: 'showEmail', label: 'Show my email' },
                        { key: 'dmsOnly', label: 'DMs only (recommended)' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <div className={[
                            'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
                            form.contactPrefs[key] ? 'border-gold bg-gold/15' : 'border-gold-dim/20',
                          ].join(' ')}>
                            {form.contactPrefs[key] && <Check size={10} className="text-gold" />}
                          </div>
                          <span className="text-xs text-text-dim font-body">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {/* Submit */}
                  <button onClick={handleSubmit}
                    className="mt-2 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] active:scale-[0.98] transition-colors shadow-[0_4px_20px_rgba(229,57,53,0.25)]"
                  >
                    Save Profile & Continue
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
```

**Step 2: Wire modal into BirdDog.jsx**

In the `BirdDog` component, add state and handler:

```jsx
const [showProfileModal, setShowProfileModal] = useState(false)
const [showPostModal, setShowPostModal] = useState(false)

function handleCreatePost() {
  if (!profile?.birdDogProfile) {
    setShowProfileModal(true)
  } else {
    setShowPostModal(true) // Task 3 builds this
  }
}

async function handleProfileComplete(profileData) {
  await updateProfile({ birdDogProfile: profileData })
  setShowProfileModal(false)
  setShowPostModal(true) // go straight to post creation
}
```

Add to JSX (inside the `<>` fragment, after the main content div):

```jsx
<ProfileSetupModal
  isOpen={showProfileModal}
  onClose={() => setShowProfileModal(false)}
  onComplete={handleProfileComplete}
/>
```

Add import: `import ProfileSetupModal from '../components/birddog/ProfileSetupModal'`

Destructure `updateProfile` from `useAuth()`.

**Step 3: Commit**
```bash
git add frontend/src/components/birddog/ProfileSetupModal.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: add Bird Dog profile onboarding modal"
```

---

## Task 3: Create Post Modal (Bird Dog + Job Posts)

Build the modal for creating marketplace posts (both bird dog offerings and investor job posts). Posts are saved to a new `bird_dog_posts` Firestore collection.

**Files:**
- Create: `frontend/src/components/birddog/CreatePostModal.jsx`
- Modify: `frontend/src/pages/BirdDog.jsx` (wire up)

**Step 1: Create CreatePostModal component**

The modal should:
- Show two tabs/options at top: "Offer My Services" (bird dog post) and "Post a Job" (investor post)
- Pre-fill service area / methods from the user's `birdDogProfile`
- Save to Firestore `bird_dog_posts` collection with the schema from the design doc
- Fields per design: title, area, methods/taskType, description, availability/payout/urgency/deadline

Form fields follow the existing `inputCls` / `labelCls` pattern from BirdDog.jsx. Use the same tag input pattern from ProfileSetupModal for areas.

Post type field: `postType: 'bird_dog' | 'job'`

On submit: `addDoc(collection(db, 'bird_dog_posts'), { ...formData, userId: firebaseUid, authorName: profile.displayName, status: 'active', createdAt: serverTimestamp(), updatedAt: serverTimestamp() })`

**Step 2: Wire into BirdDog.jsx**

Import and render `<CreatePostModal>`, controlled by `showPostModal` state (already stubbed in Task 2).

**Step 3: Commit**
```bash
git add frontend/src/components/birddog/CreatePostModal.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: add create post modal for bird dog and job posts"
```

---

## Task 4: Find Bird Dogs Tab — Listing Cards + Filters

Build the "Find Bird Dogs" tab with real-time Firestore listener, filter bar, and card grid.

**Files:**
- Create: `frontend/src/components/birddog/BirdDogCard.jsx`
- Create: `frontend/src/components/birddog/FilterBar.jsx`
- Modify: `frontend/src/pages/BirdDog.jsx` (replace stub FindBirdDogsTab)

**Step 1: Build BirdDogCard component**

Card layout per design doc section 3:
- Top: avatar placeholder (first letter circle) + author name + star rating (from reviews — default "New" if no reviews)
- Title bold
- Service area as cyan chip tags
- Method badges
- Availability badge (green/gold)
- Track record line from user stats
- "View Profile" and "Message" buttons at bottom

Use `<GlassPanel className="p-4">` as wrapper. Apply `motion.div` with `itemVariants` for stagger animation.

**Step 2: Build FilterBar component**

Reusable filter bar that accepts a `type` prop ('bird_dog' | 'job') and renders appropriate filters:
- Location search input (text, filters by matching against post `area` array)
- Method filter chips (for bird dog tab)
- Availability toggle
- All filters work client-side by filtering the already-fetched posts array

**Step 3: Build FindBirdDogsTab**

Replace the stub. Fetches posts where `postType === 'bird_dog'` and `status === 'active'` using `onSnapshot`:

```jsx
const q = query(
  collection(db, 'bird_dog_posts'),
  where('postType', '==', 'bird_dog'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
)
```

Render FilterBar + responsive card grid:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {filteredPosts.map(post => <BirdDogCard key={post.id} post={post} />)}
</div>
```

Empty state: GlassPanel with "No bird dogs available yet. Be the first to post!"

**Step 4: Commit**
```bash
git add frontend/src/components/birddog/BirdDogCard.jsx frontend/src/components/birddog/FilterBar.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: build Find Bird Dogs tab with cards and filters"
```

---

## Task 5: Find Jobs Tab — Job Cards + Filters

Build the "Find Jobs" tab with job post cards and contextual filters.

**Files:**
- Create: `frontend/src/components/birddog/JobCard.jsx`
- Modify: `frontend/src/pages/BirdDog.jsx` (replace stub FindJobsTab)

**Step 1: Build JobCard component**

Card layout per design doc section 3:
- Top: avatar + poster name + star rating
- Title bold
- Target area as gold chip tags
- Task type badge
- Payout in large bold text (gold color `#F6C445`)
- Urgency badge: Low (green `#10b981`), Medium (gold `#F6C445`), High (orange `#f97316`), ASAP (red `#E53935`)
- Deadline if set
- "View Details" and "Apply" buttons

**Step 2: Build FindJobsTab**

Same pattern as FindBirdDogsTab but queries `postType === 'job'`. FilterBar gets type='job' which shows: location search, task type dropdown, payout range, urgency filter.

**Step 3: Commit**
```bash
git add frontend/src/components/birddog/JobCard.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: build Find Jobs tab with job cards and filters"
```

---

## Task 6: Application System

Build the apply flow — bird dogs can apply to job posts, investors can review and accept/pass applicants.

**Files:**
- Create: `frontend/src/components/birddog/ApplyModal.jsx`
- Create: `frontend/src/components/birddog/ApplicantsList.jsx`
- Modify: `frontend/src/components/birddog/JobCard.jsx` (wire Apply button)

**Step 1: Build ApplyModal**

Modal with:
- Job title and poster name at top (read-only context)
- Pitch message textarea (280 char limit)
- Auto-display of applicant's stats and methods below the textarea (read-only, pulled from their profile)
- Submit button

On submit: update the post document to add applicant to `applicants` array:
```js
await updateDoc(doc(db, 'bird_dog_posts', postId), {
  applicants: arrayUnion({
    userId: firebaseUid,
    name: profile.displayName,
    pitch: pitchText,
    status: 'pending', // pending | accepted | passed
    appliedAt: new Date().toISOString(),
  }),
})
```

Import `arrayUnion` from `firebase/firestore`.

**Step 2: Build ApplicantsList**

Component shown when an investor views their own job post. Lists each applicant with:
- Name, methods, track record stats, their pitch message
- Accept and Pass buttons
- On Accept: update that applicant's status in the array to 'accepted', create a message thread (Task 8), change post status to 'in_progress' if first accept
- On Pass: update status to 'passed'

**Step 3: Wire into JobCard**

"Apply" button opens ApplyModal. If the current user is the post author, show "View Applicants" instead which expands the ApplicantsList.

**Step 4: Commit**
```bash
git add frontend/src/components/birddog/ApplyModal.jsx frontend/src/components/birddog/ApplicantsList.jsx frontend/src/components/birddog/JobCard.jsx
git commit -m "feat: add application system for bird dog job posts"
```

---

## Task 7: My Activity Tab

Build out the full My Activity tab with four sections: My Posts, My Applications, Pending Reviews, and Lead Submissions.

**Files:**
- Modify: `frontend/src/pages/BirdDog.jsx` (replace MyActivityTab stub)

**Step 1: Build MyActivityTab sections**

Replace the stub with four stacked sections, each in a GlassPanel:

1. **My Posts** — Query `bird_dog_posts` where `userId === firebaseUid`, show cards with status badge, applicant count, edit/close buttons. Include "Create New Post" button at top.

2. **My Applications** — Query `bird_dog_posts` where `applicants` array contains an entry with user's ID. Show job title, investor name, application status badge (Pending/Accepted/Passed). If accepted, show "Open Messages" link.

3. **Pending Reviews** — Query `bird_dog_posts` where status is 'completed' and user is a participant, then check `bird_dog_reviews` to see if they've already reviewed. Show banner prompting review if not.

4. **Lead Submissions** — Move existing `SubmissionForm` and `MySubmissions` components here unchanged.

**Step 2: Commit**
```bash
git add frontend/src/pages/BirdDog.jsx
git commit -m "feat: build My Activity tab with posts, applications, and reviews"
```

---

## Task 8: Messaging System

Build the slide-out DM panel with real-time messaging tied to job threads.

**Files:**
- Create: `frontend/src/components/birddog/MessagePanel.jsx`
- Create: `frontend/src/components/birddog/MessageThread.jsx`
- Modify: `frontend/src/pages/BirdDog.jsx` (add message icon + panel)

**Step 1: Build MessagePanel (slide-out container)**

Fixed position panel that slides in from the right:
- Width: `w-96` on desktop, full-width on mobile
- Header: "Messages" with close button and unread count
- Thread list: each thread shows other person's name, job title, last message preview, timestamp, unread indicator
- Click a thread to open MessageThread view

Firestore listener on `bird_dog_threads` where `participants` array contains current user's ID, ordered by `lastMessageAt` desc.

**Step 2: Build MessageThread (chat view)**

- Header: other person's name, avatar, rating, job title, contact info bar if shared
- Messages area: scrollable, messages from `bird_dog_messages` subcollection ordered by `createdAt` asc
- User's messages right-aligned with cyan background, theirs left-aligned with dark glass
- Text input + send button at bottom

On send:
```js
await addDoc(collection(db, 'bird_dog_threads', threadId, 'bird_dog_messages'), {
  senderId: firebaseUid,
  text: messageText,
  createdAt: serverTimestamp(),
})
await updateDoc(doc(db, 'bird_dog_threads', threadId), {
  lastMessage: messageText,
  lastMessageAt: serverTimestamp(),
  unreadBy: [otherUserId],
})
```

**Step 3: Add message icon to Bird Dog page header**

Next to the "+ Create Post" button, add a mail icon with unread count badge. Clicking opens/closes the MessagePanel.

**Step 4: Thread creation helper**

Export a `createThread` function used by ApplicantsList (Task 6) when accepting an applicant:
```js
export async function createThread(jobPostId, jobTitle, userId1, userId2) {
  return await addDoc(collection(db, 'bird_dog_threads'), {
    jobPostId, jobTitle,
    participants: [userId1, userId2],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadBy: [],
    createdAt: serverTimestamp(),
  })
}
```

**Step 5: Commit**
```bash
git add frontend/src/components/birddog/MessagePanel.jsx frontend/src/components/birddog/MessageThread.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: add real-time messaging system for bird dog marketplace"
```

---

## Task 9: Review System

Build the two-way review system triggered when jobs are marked complete.

**Files:**
- Create: `frontend/src/components/birddog/ReviewForm.jsx`
- Create: `frontend/src/components/birddog/StarRating.jsx`
- Create: `frontend/src/components/birddog/ReviewsList.jsx`
- Modify: `frontend/src/components/birddog/JobCard.jsx` (add "Mark Complete" button)
- Modify: `frontend/src/pages/BirdDog.jsx` (My Activity pending reviews section)

**Step 1: Build StarRating component**

Interactive star rating (1-5). Clickable stars that fill on hover and selection. Gold color `#F6C445`. Also supports read-only display mode for showing ratings on cards.

**Step 2: Build ReviewForm component**

Modal or inline form with:
- Star rating (StarRating component)
- Review text textarea (280 char max)
- Quick-select tag buttons: "Responsive", "Reliable", "Quality Leads", "Fair Pay", "Good Communicator"
- Submit button

On submit:
```js
await addDoc(collection(db, 'bird_dog_reviews'), {
  jobPostId,
  reviewerId: firebaseUid,
  revieweeId: otherUserId,
  rating: starValue,
  text: reviewText,
  tags: selectedTags,
  reviewerRole: currentUserRole, // 'bird_dog' or 'investor'
  createdAt: serverTimestamp(),
})
```

**Step 3: Build ReviewsList component**

Displays reviews for a user profile. Fetches from `bird_dog_reviews` where `revieweeId === userId`. Shows: reviewer name, star rating, text, tags, date. Newest first. Also compute and expose average rating.

**Step 4: Create a helper hook `useUserRating(userId)`**

Returns `{ avgRating, reviewCount, loading }` — queries `bird_dog_reviews` where `revieweeId === userId`, computes average. Used by BirdDogCard and JobCard to display ratings.

**Step 5: Add "Mark Complete" to job posts**

On accepted job posts, both the investor and accepted bird dog see a "Mark Complete" button. Clicking sets post status to 'completed' and triggers review prompt.

**Step 6: Commit**
```bash
git add frontend/src/components/birddog/ReviewForm.jsx frontend/src/components/birddog/StarRating.jsx frontend/src/components/birddog/ReviewsList.jsx frontend/src/components/birddog/JobCard.jsx frontend/src/pages/BirdDog.jsx
git commit -m "feat: add two-way review system for bird dog marketplace"
```

---

## Task 10: Admin Panel — Bird Dog Section

Add a dedicated Bird Dog section to the admin dashboard with KPIs and management tables.

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Add "Bird Dogs" to admin tab array**

Add a new tab entry to the existing tabs array in AdminDashboard. Follow the same pattern as existing tabs (Live Deals, Buyers List, etc.).

**Step 2: Build KPI cards**

Four KPI cards across the top, following the existing admin KPI pattern (GlassPanel + kanji watermark + icon badge + CountUp):

1. Bird Dogs on File — count docs in `users` where `birdDogProfile.role === 'bird_dog'`
2. Investors on File — count docs where `birdDogProfile.role === 'investor'`
3. Active Posts — count docs in `bird_dog_posts` where `status === 'active'`
4. Completed Jobs — count docs in `bird_dog_posts` where `status === 'completed'`

Use `onSnapshot` listeners to keep counts real-time.

**Step 3: Build Bird Dog Directory table**

Table with columns: Name, Service Area, Methods, Availability, Rating, Reviews, Leads Submitted, Leads Qualified, Leads Closed, Date Joined. Follow existing admin table pattern (thead with cyan text, motion.tr with stagger).

Admin actions per row: Edit (opens inline edit form), Deactivate (sets a `deactivated: true` flag on their birdDogProfile).

**Step 4: Build Investor Directory table**

Same pattern, columns: Name, Markets, Deal Types, Rating, Reviews, Jobs Posted, Jobs Completed, Date Joined. Same admin actions.

**Step 5: Build Posts & Jobs management table**

Table: Title, Type, Author, Area, Status, Date Posted, Applicants, Accepted. Admin can Edit, Close, or Delete any post. Add filter chips: post type, status.

Use sub-tabs within the Bird Dog admin section (same pattern as existing admin sub-tabs):
```jsx
const BD_TABS = [
  { id: 'birddogs', label: 'Bird Dog Directory' },
  { id: 'investors', label: 'Investor Directory' },
  { id: 'posts', label: 'Posts & Jobs' },
]
```

**Step 6: Commit**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: add Bird Dog admin section with KPIs and management tables"
```

---

## Task 11: Wire Active Deals Admin Section to Firestore

Connect the existing Active Deals section on the admin page to actual Live Deals Firestore data.

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Investigate current Active Deals**

Read through the AdminDashboard.jsx Active Deals section to understand what data it currently shows and whether it's using mock data or a disconnected source.

**Step 2: Wire to Firestore `liveDeals` collection**

Use `onSnapshot` on the `liveDeals` collection (same pattern used by LiveDeals.jsx) to populate the admin Active Deals table with real data. Ensure admin can edit deal fields inline and changes persist to Firestore via `updateDoc`.

**Step 3: Commit**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "fix: wire admin Active Deals to Firestore live data"
```

---

## Task 12: Profile Settings Integration

Allow users to edit their Bird Dog profile from their profile settings page.

**Files:**
- Modify: `frontend/src/pages/CommunityProfile.jsx` (or wherever profile settings live)

**Step 1: Add Bird Dog Profile section**

If the user has a `birdDogProfile`, show an editable section in their profile settings with all the fields from the onboarding modal (service area, methods/deal types, bio, availability, contact prefs).

Use the same form patterns from ProfileSetupModal but in an inline editable format (not a modal). Save via `updateProfile({ birdDogProfile: updatedData })`.

If they don't have a profile yet, show a CTA: "Join the Bird Dog Network" that links to the Bird Dog page.

**Step 2: Commit**
```bash
git add frontend/src/pages/CommunityProfile.jsx
git commit -m "feat: add Bird Dog profile editing to user profile settings"
```

---

## Execution Order Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Page layout with tabs | None |
| 2 | Profile onboarding modal | Task 1 |
| 3 | Create post modal | Task 2 |
| 4 | Find Bird Dogs tab | Task 3 |
| 5 | Find Jobs tab | Task 3 |
| 6 | Application system | Task 5 |
| 7 | My Activity tab | Tasks 4, 5, 6 |
| 8 | Messaging system | Task 6 |
| 9 | Review system | Tasks 6, 7 |
| 10 | Admin panel Bird Dog section | Tasks 4, 5 |
| 11 | Wire Active Deals admin | None (independent) |
| 12 | Profile settings integration | Task 2 |

Tasks 4+5 can run in parallel. Tasks 10+11+12 can run in parallel after their dependencies are met.
