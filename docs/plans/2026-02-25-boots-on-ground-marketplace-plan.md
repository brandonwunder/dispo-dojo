# Boots on the Ground Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Boots on the Ground page from a one-directional task board into a full two-sided marketplace mirroring the Bird Dog architecture — with tabs, profiles, posts, applications, messaging, and reviews.

**Architecture:** Replace the existing BootsOnGround.jsx (onboarding wizard + two-column task board) with a tabbed marketplace layout (Find Boots People / Find Jobs / My Activity). New Firestore collections for posts, applications, reviews, threads, and messages. Boots profile data stored as an updated `bootsProfile` field on the existing `users` document. Messaging via a slide-out panel with real-time Firestore listeners. Reuse shared patterns from the Bird Dog marketplace components wherever possible.

**Tech Stack:** React 19, Firebase/Firestore, Framer Motion, Lucide icons, GlassPanel component, Tailwind CSS v4

**Design Doc:** `docs/plans/2026-02-25-boots-on-ground-marketplace-design.md`

---

## Task 1: Scaffold Page Layout with Tabs

Replace the current onboarding-or-main-view toggle with a tabbed marketplace layout. The old `OnboardingWizard`, `MainView`, `OpenTaskCard`, and `MyTaskCard` components are removed entirely.

**Files:**
- Modify: `frontend/src/pages/BootsOnGround.jsx`

**Step 1: Replace page body with tab structure**

Remove the `OnboardingWizard`, `MainView`, `OpenTaskCard`, `MyTaskCard` components and the `AnimatePresence` toggle in the default export. Replace with:

```jsx
// Tab state
const [activeTab, setActiveTab] = useState('find-boots')

// Tab constants
const TABS = [
  { id: 'find-boots', label: 'Find Boots People' },
  { id: 'find-jobs', label: 'Find Jobs' },
  { id: 'my-activity', label: 'My Activity' },
]
```

Tab bar UI — same pattern as Bird Dog:
```jsx
<div className="min-h-screen px-6 py-16 relative z-10">
  <div className="relative max-w-6xl mx-auto">
    {/* Header */}
    <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}>
      <div className="flex items-center justify-center gap-3 mb-3">
        <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
          <Navigation2 size={36} style={{ color: '#00C6FF' }} />
        </div>
        <h1 className="font-display text-4xl" style={{ color: '#F4F7FA', textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)' }}>
          Boots on Ground
        </h1>
      </div>
      <p className="text-sm mt-2 mx-auto max-w-[480px] leading-relaxed" style={{ color: '#C8D1DA' }}>
        Connect with boots-on-the-ground operators and investors in your market
      </p>
    </motion.div>

    {/* Tab bar + Create Post */}
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
                layoutId="boots-tab"
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
    {activeTab === 'find-boots' && <FindBootsTab />}
    {activeTab === 'find-jobs' && <FindJobsTab />}
    {activeTab === 'my-activity' && <MyActivityTab firebaseUid={uid} profile={profile} user={user} />}
  </div>
</div>
```

**Step 2: Create placeholder tab components**

Add stubs at the bottom of BootsOnGround.jsx:

```jsx
function FindBootsTab() {
  return (
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Boots operator listings coming soon...</p>
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
    <GlassPanel className="p-8 text-center">
      <p className="text-text-dim font-body text-sm">Your activity will appear here...</p>
    </GlassPanel>
  )
}
```

**Step 3: Add handleCreatePost stub + update imports**

```jsx
function handleCreatePost() {
  // Will check for bootsProfile and show onboarding modal — Task 2
}
```

Add `Plus` to lucide-react import. Remove unused imports: `Camera`, `Eye`, `Lock`, `MapPin` (icon), `User`, `FileText`, `Pencil`, `ChevronLeft`, `ChevronRight`, `CheckCircle`, `incrementStat`. Keep: `Navigation2`, `Plus`.

Remove unused constants: `RADIUS_OPTIONS`, `DAYS`, `STATUS`, `containerVariants`, `itemVariants`, `cardItem`, `formatDue`. Keep: `TASK_TYPES`, `BADGE_COLORS`.

**Step 4: Keep background intact**

The background image + gradient overlay in the default export stays as-is. Remove the `AnimatePresence mode="wait"` toggle between onboarding/main and replace with the new tab layout.

**Step 5: Commit**
```bash
git add frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: scaffold Boots on Ground marketplace with tab layout"
```

---

## Task 2: Boots Profile Onboarding Modal

Build the just-in-time onboarding flow that appears when a user clicks "+ Create Post" without a boots profile.

**Files:**
- Create: `frontend/src/components/boots/ProfileSetupModal.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (wire up modal)

**Step 1: Create ProfileSetupModal component**

Follow the exact same pattern as `frontend/src/components/birddog/ProfileSetupModal.jsx` but adapted for boots:

```jsx
// frontend/src/components/boots/ProfileSetupModal.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Navigation2, Briefcase, Plus, Check } from 'lucide-react'
import GlassPanel from '../GlassPanel'

const TASK_TYPES = [
  { id: 'photos', label: 'Property Photos' },
  { id: 'walkthrough', label: 'Walkthroughs' },
  { id: 'lockbox', label: 'Lockbox Access' },
  { id: 'sign', label: 'Sign Placement' },
  { id: 'occupant', label: 'Occupant Check' },
  { id: 'hoa', label: 'HOA Docs' },
  { id: 'other', label: 'Other' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const inputCls = 'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

export default function ProfileSetupModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null) // 'operator' | 'investor'
  const [form, setForm] = useState({
    serviceArea: [],
    taskTypes: [],
    customTaskType: '',
    availability: { Mon: false, Tue: false, Wed: false, Thu: false, Fri: false, Sat: false, Sun: false },
    bio: '',
    contactPrefs: { showPhone: false, showEmail: false, dmsOnly: true },
  })
  const [areaInput, setAreaInput] = useState('')

  // ... tag add/remove helpers same as Bird Dog pattern
  // ... toggle helpers for taskTypes and availability days

  function handleSubmit() {
    const profileData = {
      role,
      serviceArea: form.serviceArea,
      taskTypes: form.taskTypes,
      customTaskType: form.taskTypes.includes('other') ? form.customTaskType : '',
      availability: form.availability,
      bio: form.bio,
      contactPrefs: form.contactPrefs,
      createdAt: new Date().toISOString(),
    }
    onComplete(profileData)
  }

  // Modal structure: same AnimatePresence + backdrop + GlassPanel as Bird Dog
  // Step 1: Role selection — "I'm a Boots Operator" (cyan, Navigation2 icon) / "I'm an Investor" (gold, Briefcase icon)
  // Step 2 (operator): Service area tags, task type toggles (6 + Other with free text), availability day toggles, bio, contact prefs
  // Step 2 (investor): Markets tags, task types commonly needed, bio, contact prefs
}
```

When "Other" is selected in task types, show a text input: "Describe your service" below the toggles.

**Step 2: Wire modal into BootsOnGround.jsx**

```jsx
const [showProfileModal, setShowProfileModal] = useState(false)
const [showPostModal, setShowPostModal] = useState(false)

function handleCreatePost() {
  if (!profile?.bootsProfile) {
    setShowProfileModal(true)
  } else {
    setShowPostModal(true) // Task 3 builds this
  }
}

async function handleProfileComplete(profileData) {
  await updateProfile({ bootsProfile: profileData })
  setShowProfileModal(false)
  setShowPostModal(true)
}
```

Add to JSX after the main content:
```jsx
<ProfileSetupModal
  isOpen={showProfileModal}
  onClose={() => setShowProfileModal(false)}
  onComplete={handleProfileComplete}
/>
```

Import: `import ProfileSetupModal from '../components/boots/ProfileSetupModal'`

**Step 3: Commit**
```bash
git add frontend/src/components/boots/ProfileSetupModal.jsx frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: add Boots on Ground profile onboarding modal"
```

---

## Task 3: Create Post Modal (Service + Job Posts)

Build the modal for creating marketplace posts. Posts saved to new `boots_posts` Firestore collection.

**Files:**
- Create: `frontend/src/components/boots/CreatePostModal.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (wire up)

**Step 1: Create CreatePostModal component**

Modal with two tabs at top: "Offer My Services" (operator post) and "Post a Job" (investor post).

**Service Post fields:**
- Title (text input)
- Task types offered (toggles from 6 + Other with free text)
- Service area (tag input, pre-filled from bootsProfile)
- Availability status toggle (Available / Unavailable)
- Description (textarea, 500 char max)

**Job Post fields:**
- Title (text input)
- Task type needed (toggles from 6 + Other with free text)
- Location (text input — address or area)
- Urgency (Normal / Urgent toggle)
- Description (textarea, 500 char max)

On submit:
```jsx
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

await addDoc(collection(db, 'boots_posts'), {
  userId: firebaseUid,
  userName: profile.displayName || 'Anonymous',
  userAvatar: profile.avatarConfig || null,
  type: postType, // 'service' | 'job'
  title,
  description,
  taskTypes: selectedTaskTypes,
  customTaskType: selectedTaskTypes.includes('other') ? customTaskType : '',
  location: postType === 'job' ? location : '',
  serviceArea: postType === 'service' ? serviceAreas : [],
  urgency: postType === 'job' ? urgency : 'normal',
  status: 'active',
  applicantCount: 0,
  acceptedUserId: null,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
})
```

**Step 2: Wire into BootsOnGround.jsx**

Import and render `<CreatePostModal>` controlled by `showPostModal` state (already stubbed in Task 2). Pass `firebaseUid`, `profile`, and `bootsProfile` (for pre-fill).

**Step 3: Commit**
```bash
git add frontend/src/components/boots/CreatePostModal.jsx frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: add create post modal for boots marketplace"
```

---

## Task 4: Find Boots People Tab — Cards + Filters

Build the "Find Boots People" tab with real-time Firestore listener, filter bar, and card grid.

**Files:**
- Create: `frontend/src/components/boots/BootsOperatorCard.jsx`
- Create: `frontend/src/components/boots/BootsFilterBar.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (replace stub FindBootsTab)

**Step 1: Build BootsOperatorCard**

Card layout in GlassPanel:
- Top row: avatar circle (first letter) + operator name + star rating (default "New")
- Title bold
- Service area as cyan chip tags
- Task type badges (reuse `BADGE_COLORS` from existing constants)
- Availability dot (green = available, gray = unavailable)
- "Contact" button at bottom → opens DM (Task 8)

```jsx
import GlassPanel from '../GlassPanel'
import { motion } from 'framer-motion'
import { MessageSquare, Star } from 'lucide-react'

const BADGE_COLORS = {
  photos: '#00C6FF', walkthrough: '#A855F7', lockbox: '#F6C445',
  sign: '#10b981', occupant: '#f97316', hoa: '#84cc16', other: '#C8D1DA',
}
```

**Step 2: Build BootsFilterBar**

Reusable filter bar:
- Search text input (filters title + description)
- Task type filter chips
- Availability toggle
- All client-side filtering on the already-fetched posts array

**Step 3: Build FindBootsTab**

Replace the stub. Fetches from Firestore with real-time listener:

```jsx
const q = query(
  collection(db, 'boots_posts'),
  where('type', '==', 'service'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
)
```

Render BootsFilterBar + responsive card grid:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {filteredPosts.map(post => <BootsOperatorCard key={post.id} post={post} />)}
</div>
```

Empty state: GlassPanel with "No boots operators available yet. Be the first to post your services!"

**Step 4: Commit**
```bash
git add frontend/src/components/boots/BootsOperatorCard.jsx frontend/src/components/boots/BootsFilterBar.jsx frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: build Find Boots People tab with cards and filters"
```

---

## Task 5: Find Jobs Tab — Job Cards + Filters

Build the "Find Jobs" tab with job post cards.

**Files:**
- Create: `frontend/src/components/boots/BootsJobCard.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (replace stub FindJobsTab)

**Step 1: Build BootsJobCard**

Card layout in GlassPanel:
- Top row: avatar + investor name + star rating
- Title bold
- Task type needed (badges)
- Location
- Urgency badge: Normal (green `#10b981`) / Urgent (red `#E53935`)
- Posted date (relative: "2h ago", "3d ago")
- "Apply" button at bottom

**Step 2: Build FindJobsTab**

Same pattern as FindBootsTab but queries `type === 'job'`. Reuses BootsFilterBar with task type + location search.

```jsx
const q = query(
  collection(db, 'boots_posts'),
  where('type', '==', 'job'),
  where('status', '==', 'active'),
  orderBy('createdAt', 'desc'),
)
```

Empty state: "No jobs posted yet. Post a job to find boots operators in your market!"

**Step 3: Commit**
```bash
git add frontend/src/components/boots/BootsJobCard.jsx frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: build Find Jobs tab with job cards and filters"
```

---

## Task 6: Application System

Build the apply flow — boots operators apply to job posts, investors review and accept/reject applicants.

**Files:**
- Create: `frontend/src/components/boots/ApplyModal.jsx`
- Create: `frontend/src/components/boots/ApplicantsList.jsx`
- Modify: `frontend/src/components/boots/BootsJobCard.jsx` (wire Apply button)

**Step 1: Build ApplyModal**

Modal with:
- Job title + investor name at top (read-only)
- Message textarea (280 char limit) — "Tell them why you're a good fit"
- Auto-display of applicant's task types and service area from profile (read-only)
- Submit button

On submit: write to `boots_applications` collection:
```js
await addDoc(collection(db, 'boots_applications'), {
  postId,
  applicantId: firebaseUid,
  applicantName: profile.displayName || 'Anonymous',
  message: pitchText,
  status: 'pending',
  createdAt: serverTimestamp(),
})
// Increment applicantCount on the post
await updateDoc(doc(db, 'boots_posts', postId), {
  applicantCount: increment(1),
})
```

**Step 2: Build ApplicantsList**

Component shown when an investor views their own job post. Lists each applicant with:
- Name, task types, service area, their pitch message
- Accept and Reject buttons
- On Accept: update application status to 'accepted', create a DM thread (Task 8), update post status to 'filled'
- On Reject: update application status to 'rejected'

Query: `boots_applications` where `postId === thisPost.id`, ordered by `createdAt` desc.

**Step 3: Wire into BootsJobCard**

- If current user is NOT the post author: show "Apply" button → opens ApplyModal
- If current user IS the post author: show "View Applicants (N)" → expands ApplicantsList inline
- If user already applied: show "Applied" disabled state

**Step 4: Commit**
```bash
git add frontend/src/components/boots/ApplyModal.jsx frontend/src/components/boots/ApplicantsList.jsx frontend/src/components/boots/BootsJobCard.jsx
git commit -m "feat: add application system for boots marketplace"
```

---

## Task 7: My Activity Tab

Build the full My Activity tab with sub-sections.

**Files:**
- Modify: `frontend/src/pages/BootsOnGround.jsx` (replace MyActivityTab stub)

**Step 1: Build MyActivityTab with four sections**

Each section in a GlassPanel with a section header:

1. **My Posts** — Query `boots_posts` where `userId === firebaseUid`. Show cards with status badge, applicant count, edit/close/delete buttons. If post type is 'job' and has applicants, show inline ApplicantsList.

2. **My Applications** — Query `boots_applications` where `applicantId === firebaseUid`. Show job title, investor name, status badge (Pending/Accepted/Rejected). If accepted, show "Open Messages" link.

3. **My Jobs** — Query `boots_posts` where `acceptedUserId === firebaseUid` or where user has an accepted application. Show active/completed job cards with status tracking.

4. **My Reviews** — Query `boots_reviews` where `reviewerId === firebaseUid` OR `revieweeId === firebaseUid`. Show reviews given/received with star ratings. (Placeholder until Task 9.)

Use sub-tab navigation within My Activity:
```jsx
const ACTIVITY_TABS = [
  { id: 'posts', label: 'My Posts' },
  { id: 'applications', label: 'My Applications' },
  { id: 'jobs', label: 'My Jobs' },
  { id: 'reviews', label: 'My Reviews' },
]
```

**Step 2: Commit**
```bash
git add frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: build My Activity tab with posts, applications, and jobs"
```

---

## Task 8: Messaging System

Build the slide-out DM panel with real-time messaging tied to posts.

**Files:**
- Create: `frontend/src/components/boots/MessagePanel.jsx`
- Create: `frontend/src/components/boots/MessageThread.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (add message icon + panel)

**Step 1: Build MessagePanel (slide-out container)**

Fixed position panel sliding from right:
- Width: `w-96` desktop, full-width mobile
- Header: "Messages" + close button + unread count badge
- Thread list: each thread shows other person's name, post title, last message preview, timestamp, unread dot

Firestore listener:
```jsx
const q = query(
  collection(db, 'boots_threads'),
  where('participants', 'array-contains', firebaseUid),
  orderBy('lastMessageAt', 'desc'),
)
```

Click thread → shows MessageThread view.

**Step 2: Build MessageThread (chat view)**

- Header: other person's name, post title reference
- Messages: scrollable area, `boots_messages` subcollection ordered by `createdAt` asc
- User's messages: right-aligned cyan bg, theirs: left-aligned dark glass
- Text input + send button at bottom

On send:
```js
await addDoc(collection(db, 'boots_threads', threadId, 'boots_messages'), {
  senderId: firebaseUid,
  text: messageText,
  readBy: [firebaseUid],
  createdAt: serverTimestamp(),
})
await updateDoc(doc(db, 'boots_threads', threadId), {
  lastMessage: messageText,
  lastMessageAt: serverTimestamp(),
})
```

**Step 3: Add message icon to page header**

Next to "+ Create Post" button, add a `MessageSquare` icon with unread count badge. Clicking toggles the MessagePanel.

**Step 4: Export createBootsThread helper**

Used by ApplicantsList (Task 6) when accepting an applicant:
```js
export async function createBootsThread(postId, postTitle, userId1, userId2) {
  return await addDoc(collection(db, 'boots_threads'), {
    postId, postTitle,
    participants: [userId1, userId2],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  })
}
```

Wire into ApplicantsList's accept handler (back-reference to Task 6).

**Step 5: Commit**
```bash
git add frontend/src/components/boots/MessagePanel.jsx frontend/src/components/boots/MessageThread.jsx frontend/src/pages/BootsOnGround.jsx frontend/src/components/boots/ApplicantsList.jsx
git commit -m "feat: add real-time messaging system for boots marketplace"
```

---

## Task 9: Review System

Build the two-way review system triggered when jobs are marked complete.

**Files:**
- Create: `frontend/src/components/boots/ReviewForm.jsx`
- Create: `frontend/src/components/boots/StarRating.jsx`
- Create: `frontend/src/components/boots/ReviewsList.jsx`
- Modify: `frontend/src/pages/BootsOnGround.jsx` (My Activity reviews section + mark complete)

**Step 1: Build StarRating component**

Interactive 1-5 stars. Gold `#F6C445`. Supports read-only display mode (for cards). Hover and click states.

**Step 2: Build ReviewForm**

Modal or inline form:
- StarRating component
- Review text textarea (280 char max)
- Quick-select tags: "Responsive", "Reliable", "Quality Work", "Good Communicator", "On Time"
- Submit button

On submit:
```js
await addDoc(collection(db, 'boots_reviews'), {
  postId,
  reviewerId: firebaseUid,
  revieweeId: otherUserId,
  rating: starValue,
  text: reviewText,
  tags: selectedTags,
  createdAt: serverTimestamp(),
})
```

Also update user stats:
```js
// Recalculate average rating for reviewee
// Update stats.bootsReviewsReceived and stats.bootsAvgRating on reviewee's user doc
```

**Step 3: Build ReviewsList**

Displays reviews for a user. Fetches `boots_reviews` where `revieweeId === userId`. Shows: reviewer name, stars, text, tags, date. Newest first.

**Step 4: Add "Mark Complete" to job workflow**

In My Activity → My Jobs section, add a "Mark Complete" button on accepted/in-progress jobs. On click:
- Update post status to 'complete'
- Show ReviewForm for the other party

**Step 5: Wire star ratings into cards**

Add a `useBootsRating(userId)` hook that returns `{ avgRating, reviewCount }`. Use in BootsOperatorCard and BootsJobCard to display ratings.

**Step 6: Commit**
```bash
git add frontend/src/components/boots/ReviewForm.jsx frontend/src/components/boots/StarRating.jsx frontend/src/components/boots/ReviewsList.jsx frontend/src/pages/BootsOnGround.jsx
git commit -m "feat: add two-way review system for boots marketplace"
```

---

## Task 10: Admin Panel — Boots on Ground Section

Add a dedicated Boots section to the admin dashboard.

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Add "Boots on Ground" to admin tab array**

Add a new tab entry following the existing pattern (Live Deals, Buyers List, etc.).

**Step 2: Build KPI cards**

Four KPI cards at top (same GlassPanel + icon pattern as existing admin KPIs):

1. Boots Operators — count users where `bootsProfile.role === 'operator'`
2. Investors on File — count users where `bootsProfile.role === 'investor'`
3. Active Posts — count `boots_posts` where `status === 'active'`
4. Completed Jobs — count `boots_posts` where `status === 'complete'`

**Step 3: Build management tables**

Sub-tabs within the Boots section:
```jsx
const BOOTS_TABS = [
  { id: 'operators', label: 'Operator Directory' },
  { id: 'investors', label: 'Investor Directory' },
  { id: 'posts', label: 'Posts & Jobs' },
]
```

**Operator Directory table:** Name, Service Area, Task Types, Availability, Rating, Reviews, Date Joined. Admin actions: Deactivate.

**Investor Directory table:** Name, Markets, Task Types Needed, Rating, Reviews, Jobs Posted, Date Joined. Admin actions: Deactivate.

**Posts & Jobs table:** Title, Type, Author, Location, Status, Date, Applicants. Admin actions: Close, Delete. Filter chips by post type and status.

**Step 4: Commit**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: add Boots on Ground admin section with KPIs and management"
```

---

## Task 11: Profile Settings Integration

Allow users to edit their Boots profile from their community profile page.

**Files:**
- Modify: `frontend/src/pages/CommunityProfile.jsx`

**Step 1: Add Boots Profile section**

If user has a `bootsProfile`, show an editable section with:
- Role display
- Service area tag editor
- Task type toggles (6 + Other)
- Availability day toggles
- Bio textarea
- Contact preferences checkboxes
- Save button → `updateProfile({ bootsProfile: updatedData })`

If no profile exists, show CTA: "Join the Boots Network" linking to `/boots-on-ground`.

Use same form patterns from ProfileSetupModal but inline (not modal).

**Step 2: Commit**
```bash
git add frontend/src/pages/CommunityProfile.jsx
git commit -m "feat: add Boots on Ground profile editing to user settings"
```

---

## Execution Order Summary

| Task | Description | Dependencies | Parallelizable |
|------|-------------|--------------|----------------|
| 1 | Page layout with tabs | None | — |
| 2 | Profile onboarding modal | Task 1 | — |
| 3 | Create post modal | Task 2 | — |
| 4 | Find Boots People tab | Task 3 | with Task 5 |
| 5 | Find Jobs tab | Task 3 | with Task 4 |
| 6 | Application system | Task 5 | — |
| 7 | My Activity tab | Tasks 4, 5, 6 | — |
| 8 | Messaging system | Task 6 | — |
| 9 | Review system | Tasks 7, 8 | — |
| 10 | Admin panel section | Tasks 4, 5 | with Tasks 8, 9, 11 |
| 11 | Profile settings integration | Task 2 | with Tasks 8, 9, 10 |

**Execution waves:**
- Wave 1: Task 1
- Wave 2: Task 2
- Wave 3: Task 3
- Wave 4: Tasks 4 + 5 (parallel)
- Wave 5: Task 6
- Wave 6: Task 7
- Wave 7: Tasks 8 + 10 + 11 (parallel)
- Wave 8: Task 9
