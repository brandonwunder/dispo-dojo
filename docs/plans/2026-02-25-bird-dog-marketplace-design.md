# Bird Dog Marketplace Design

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Two-Tab Marketplace (Approach A)

## Overview

Transform the Bird Dog page from a one-way lead submission form into a two-sided marketplace where bird dogs and investors connect. Bird dogs post their services and availability; investors post jobs with payout details. Users apply, message, work together, and review each other — all tied to their existing accounts.

## Core Decisions

- **Flexible roles** — Any user can act as both a bird dog and an investor from one account
- **Just-in-time onboarding** — Bird Dog profile created on first post attempt, not forced upfront
- **Apply then message** — Bird dogs apply to jobs, then both parties message to finalize before investor accepts
- **Two-way reviews** — Both parties rate each other after every completed job for accountability
- **In-app DMs + optional contact reveal** — Users choose whether to share phone/email or use DMs only

## Section 1: Page Layout & Navigation

- Header: Bird Dog Network with updated tagline — "Connect with bird dogs and investors in your market."
- **Tab bar** below header with three tabs:
  - **Find Bird Dogs** — Browse bird dogs offering services
  - **Find Jobs** — Browse investor job postings
  - **My Activity** — Personal dashboard (posts, applications, reviews, lead submissions)
- **"+ Create Post" button** — Persistent, top-right of tab bar, always visible
- **Filter bar** below tabs, contextual to active tab:
  - Find Bird Dogs: location search, methods, minimum rating, availability toggle
  - Find Jobs: location search, task type, payout range, urgency level
- **Responsive card grid** below filters: 3 columns desktop, 2 tablet, 1 mobile
- Cards use existing GlassPanel component

## Section 2: Bird Dog Profile & Onboarding

### Just-in-time flow
When user clicks "+ Create Post" without an existing Bird Dog profile:

**Step 1:** Modal — "Join the Bird Dog Network" — choose primary role: Bird Dog or Investor (doesn't lock them out of the other side)

**Step 2:** Profile form based on role:

**Bird Dog profile fields:**
- Service Area — Multi-select tags (city/zip/county)
- Methods — Checkboxes: Driving for Dollars, Door-Knocking, Cold Calling, Skip Tracing, Referral Network, Other
- Bio/Pitch — 280 char max
- Availability — Toggle: Available Now / Not Available
- Contact Preferences — Show phone, Show email, DMs only

**Investor profile fields:**
- Markets — Multi-select tags
- Deal Types — Wholesale, Fix & Flip, Buy & Hold, Subject-To, Creative Finance
- Bio — 280 char max
- Contact Preferences — Same options

### Storage
New `birdDogProfile` field on the existing Firestore `users` document:
```
birdDogProfile: {
  role: 'bird_dog' | 'investor',
  serviceArea: [],
  methods: [],
  markets: [],
  dealTypes: [],
  bio: '',
  availability: 'available' | 'unavailable',
  contactPrefs: { showPhone, showEmail, dmsOnly },
  createdAt
}
```

Track record (leads submitted, qualified, closed) auto-populates from existing `stats` object — no manual entry.

Profile editable from user's main profile settings page.

## Section 3: Posts & Cards

### Bird Dog Post (offering services)

**Creation form:**
- Title (e.g. "Experienced door-knocker covering all of Fort Worth")
- Service Area — Pre-filled from profile, editable per post
- Methods — Pre-filled from profile, editable
- Description — Details, specialties, availability
- Availability — Available Now / Available Starting [date]

**Card display (Find Bird Dogs tab):**
- Avatar + name + star rating
- Title (bold)
- Service area tags (cyan chips)
- Method badges (icons + labels)
- Availability badge (green "Available" or gold "Starting Mar 5")
- Track record: "12 leads · 8 qualified · 3 closed"
- "View Profile" and "Message" buttons

### Investor Job Post (requesting help)

**Creation form:**
- Title (e.g. "Need bird dog for driving routes in South Dallas")
- Target Area — City/zip/county
- Task Type — Dropdown: Driving for Dollars, Door-Knocking, Cold Calling, Skip Trace Verification, General Scouting, Other
- Payout Offered — Dollar amount or range
- Description — What they're looking for, lead criteria
- Urgency — Low / Medium / High / ASAP
- Deadline — Optional date

**Card display (Find Jobs tab):**
- Avatar + name + star rating
- Title (bold)
- Target area tags (gold chips)
- Task type badge
- Payout in large text ("$500/lead")
- Urgency badge (color-coded: green/gold/red)
- Deadline if set
- "View Details" and "Apply" buttons

### Firestore Structure
`bird_dog_posts` collection:
```
{
  postId, userId, authorName, postType: 'bird_dog' | 'job',
  title, description, area: [], methods: [], taskType,
  payout, urgency, deadline, availability,
  status: 'active' | 'filled' | 'closed',
  applicants: [], createdAt, updatedAt
}
```

## Section 4: Application & Job Workflow

### Applying
1. Bird dog clicks "Apply" on a job post
2. Modal opens — write a short pitch message (why they're a good fit)
3. Profile card auto-attached (stats, rating, methods, service area)
4. Submit — investor gets notified, application appears on their post

### Investor reviews applicants
1. Investor opens their post → "Applicants" tab
2. Each applicant card: name, rating, track record, pitch message, methods
3. Investor can **Accept** (one or multiple) or **Pass** each applicant
4. Accepting reveals messaging thread + optional contact info

### Job lifecycle statuses
- **Active** — Live, accepting applications
- **In Progress** — Investor accepted a bird dog, work underway
- **Completed** — Job done, triggers review prompt
- **Closed** — Post removed/expired

### Status control
- Investor moves to "In Progress" on accept
- Either party can mark "Completed"
- Completed triggers two-way review prompt

## Section 5: Reviews & Accountability

### Trigger
When either party marks a job "Completed," both get a review prompt (banner on My Activity tab + modal on next page visit).

### Review form (same for both sides)
- Star rating (1-5)
- Short review text (280 char max)
- Optional quick-select tags: "Responsive," "Reliable," "Quality Leads," "Fair Pay," "Good Communicator"

### Display
- Average star rating + review count on every card and profile (e.g. "4.7 (12 reviews)")
- Full review list on expanded profile, newest first
- Both given and received reviews visible (two-way transparency)

### Rules
- Can only review someone from a completed job (enforced by jobPostId reference)
- One review per completed job per party
- Reviews cannot be edited or deleted

### Firestore Structure
`bird_dog_reviews` collection:
```
{
  reviewId, jobPostId, reviewerId, revieweeId,
  rating (1-5), text, tags: [],
  reviewerRole: 'bird_dog' | 'investor',
  createdAt
}
```

## Section 6: Admin Panel — Bird Dog Section

New "Bird Dogs" section in the admin dashboard, matching existing Live Deals and Buyers List pattern.

### KPI Cards (4 across top)
- **Bird Dogs on File** — Total bird dog profiles
- **Investors on File** — Total investor profiles
- **Active Posts** — Live posts (both types combined)
- **Completed Jobs** — Total completed jobs

### Tab 1: Bird Dog Directory
Table: name, service area, methods, availability, star rating, reviews, leads submitted/qualified/closed, date joined. Admin can edit profile or deactivate.

### Tab 2: Investor Directory
Table: name, markets, deal types, star rating, reviews, jobs posted/completed, total payouts offered, date joined. Admin can edit or deactivate.

### Tab 3: Posts & Jobs
Table: title, type, author, area, status, date posted, applicant count, accepted count. Admin can edit, close, or delete any post. Filters: post type, status, date range.

### Also
Wire existing Active Deals section on admin page to actual Live Deals Firestore data (currently disconnected).

## Section 7: Messaging / DMs

### Architecture
Lightweight in-app messaging for negotiating job details. Not a full chat platform.

### Flow
- Thread created when investor accepts an applicant (or bird dog messages from a profile)
- Messages: text only, no attachments
- Thread tied to a specific job post

### UI
- **Slide-out panel** from the right side — doesn't navigate away from marketplace
- Header: other person's name, avatar, rating, job title
- Chat bubbles: user's messages right-aligned (cyan), theirs left-aligned (dark glass)
- Text input + send button
- Contact info bar at top if either party opted to share

### Access points
- **Message icon** in Bird Dog page header with unread count badge
- Thread list: person name, job title, last message preview, timestamp, unread dot
- Also accessible from My Activity tab

### Firestore Structure
`bird_dog_threads` collection:
```
{
  threadId, jobPostId, participants: [userId1, userId2],
  lastMessage, lastMessageAt,
  unreadBy: [userId], createdAt
}
```

`bird_dog_messages` subcollection (under each thread):
```
{
  messageId, senderId, text, createdAt
}
```

Real-time via Firestore `onSnapshot` listeners.

## Section 8: My Activity Tab

Third tab on the Bird Dog page — user's personal hub.

### My Posts
- Cards for all user's posts (bird dog + job posts)
- Status badge, applicant count, edit/close buttons
- "Create New Post" at top

### My Applications
- Job posts user applied to as a bird dog
- Application status: Pending / Accepted / Passed
- Quick link to message thread if accepted
- Review received or prompt to leave one if completed

### Pending Reviews
- Highlighted cards for completed jobs without a review
- "You worked with [Name] on [Job Title] — leave a review"
- Inline review form

### Lead Submissions (existing functionality)
- Original lead submission form relocated here
- "My Submissions" list with statuses
- Functionally identical to current page, just reorganized

## Firestore Collections Summary

| Collection | Purpose |
|---|---|
| `users` (existing) | Extended with `birdDogProfile` field |
| `bird_dog_posts` (new) | All marketplace posts (bird dog + job) |
| `bird_dog_reviews` (new) | Two-way reviews tied to completed jobs |
| `bird_dog_threads` (new) | Message threads between users |
| `bird_dog_messages` (new, subcollection) | Individual messages within threads |
| `bird_dog_leads` (existing) | Lead submissions (unchanged) |
