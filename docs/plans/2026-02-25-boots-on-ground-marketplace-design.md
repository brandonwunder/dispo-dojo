# Boots on the Ground Marketplace — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Approach:** Full marketplace rebuild mirroring Bird Dog architecture

---

## 1. Overview

Transform the Boots on the Ground page from a one-directional task board into a full two-sided marketplace where:
- **Boots operators** can advertise their services, browse job postings, and apply for work
- **Investors** can search for boots people in their markets, post jobs, and hire operators
- All posts and activity are tied to user accounts
- Consistent UX with the Bird Dog marketplace (same tab pattern, onboarding, messaging, reviews)

## 2. Page Layout & Tabs

Mirror the Bird Dog tab structure:

| Tab | Purpose |
|-----|---------|
| **Find Boots People** | Browse operator service posts by market, task type, availability |
| **Find Jobs** | Browse investor job postings for boots work |
| **My Activity** | Personal dashboard — posts, applications, active jobs, reviews |
| **+ Create Post** | Persistent CTA button in header — creates service or job post |

Header: Page title, subtitle, background image (`boots-on-ground-bg.png`) with gradient overlay, tabs below.

## 3. Onboarding / Profile Setup

**Trigger:** First time user clicks "+ Create Post" without a `bootsProfile`.

**Just-in-time, 2-step flow:**

### Step 1 — Role Selection
- "I'm a Boots Operator" — field work for investors
- "I'm an Investor" — need boots people in my markets
- Users can act as both (flexible roles)

### Step 2 — Profile Form (adapts to role)

**Boots Operator fields:**
- Service area (cities/zips, multi-select)
- Task types offered (6 core + "Other" with free text)
- Weekly availability (day toggles)
- Bio (280 char max)
- Contact preferences (show phone / show email / DMs only)

**Investor fields:**
- Markets where boots are needed (cities/zips, multi-select)
- Task types commonly needed (6 core + Other)
- Bio (280 char max)
- Contact preferences

### Task Types (6 core + Other)
1. Photos
2. Video Walkthroughs
3. Lockbox Placement
4. Sign Placement
5. Occupant Check
6. HOA Docs
7. Other (free text input)

## 4. Posts & Listings

### Boots Service Post (created by operators)
*"I'm available to do field work in your market"*

- Title
- Task types offered (from 6 + Other)
- Service area (auto-filled from profile, editable)
- Availability status (Available / Unavailable toggle)
- Description (experience, equipment, turnaround time)
- No pricing — handled in DMs

### Job Post (created by investors)
*"I need someone on the ground for a specific job"*

- Title
- Task type needed (single or multiple from 6 + Other)
- Location (specific address or general area)
- Description (details, timeline)
- Urgency (Normal / Urgent badge)
- No pricing — handled in DMs

### Card Display

**Find Boots People tab cards:**
- Operator name + avatar
- Task types (colored badges)
- Service area
- Availability status (green/gray dot)
- Star rating (from reviews)
- "Contact" button → opens DM

**Find Jobs tab cards:**
- Investor name + avatar
- Task type needed (badges)
- Location
- Urgency badge (if urgent)
- Posted date
- "Apply" button

### Filtering & Search

Both tabs share a filter bar:
- Search (text across title/description)
- Task Type filter
- Market/Area filter
- Sort: Newest / Closest / Best Rated

## 5. Application & Job Workflow

### Job Posts (Investor posts → Boots person applies)

1. Boots person clicks "Apply" → short application (optional message + profile auto-attached)
2. Investor sees applications in My Activity → reviews profiles, ratings
3. Investor accepts an applicant → status = "Accepted", DM thread opens automatically
4. Work coordinated via DMs
5. Boots person marks "Submitted" → investor reviews deliverables
6. Investor marks "Complete" → both prompted to leave reviews

**Status flow:** `open → has_applicants → accepted → in_progress → submitted → complete`

### Service Posts (Boots person advertises → Investor contacts)

1. Investor clicks "Contact" → DM thread opens
2. Discussion happens via DMs (scope, timeline, etc.)
3. Either party marks conversation as "completed job" → triggers review prompt

### My Activity Tab — Sub-sections

- **My Posts** — manage service/job posts (edit, deactivate, delete)
- **My Applications** — jobs applied to + status
- **My Jobs** — active/completed work with status tracking
- **My Reviews** — reviews given and received

## 6. Messaging (DMs)

Same lightweight system as Bird Dog:

- Slide-out panel on right side
- Text-only threads (no file uploads)
- Each thread tied to a specific post (service or job)
- Thread list accessible from My Activity
- Unread indicators on My Activity tab

## 7. Reviews

Triggered after a job is marked "Complete":

- Both parties receive a review prompt (banner in My Activity)
- 1-5 star rating
- Optional text review (280 char max)
- Reviews are public — displayed on profile cards
- Aggregate shown as star average + total count
- No editing/deleting reviews
- Feeds into user stats: `bootsReviewsReceived`, `bootsAvgRating`

## 8. Firestore Data Model

### New Collections

**`boots_posts`**
```
{
  id, userId, userName, userAvatar,
  type: 'service' | 'job',
  title, description,
  taskTypes: [],
  customTaskType: '',
  location: '',
  urgency: 'normal' | 'urgent',  // jobs only
  status: 'active' | 'filled' | 'closed',
  applicantCount: 0,
  acceptedUserId: null,
  createdAt, updatedAt
}
```

**`boots_applications`**
```
{
  id, postId, applicantId, applicantName,
  message: '',
  status: 'pending' | 'accepted' | 'rejected',
  createdAt
}
```

**`boots_threads`**
```
{
  id, postId,
  participants: [userId1, userId2],
  lastMessage: '', lastMessageAt,
  createdAt
}
```

**`boots_messages`** (subcollection under boots_threads)
```
{
  id, senderId, text,
  readBy: [],
  createdAt
}
```

**`boots_reviews`**
```
{
  id, reviewerId, revieweeId, postId,
  rating: 1-5, text: '',
  createdAt
}
```

### User Document Updates

```
bootsProfile: {
  role: 'operator' | 'investor',
  serviceArea: [],
  taskTypes: [],
  customTaskType: '',
  availability: { mon, tue, wed, thu, fri, sat, sun },
  bio: '',
  contactPrefs: { showPhone, showEmail, dmsOnly },
  createdAt
}

stats: {
  ...existing,
  bootsJobsCompleted: 0,
  bootsReviewsReceived: 0,
  bootsAvgRating: 0
}
```

### Migration

- Existing `boots_tasks` collection remains but new page won't read from it
- Old `bootsProfile` fields migrate to new schema shape on first profile edit
- Clean removal of legacy collection can happen later

## 9. Design Decisions

| Decision | Rationale |
|----------|-----------|
| Mirror Bird Dog architecture | Consistent UX, shared components, reduced maintenance |
| Flexible roles (operator + investor) | Users may play both sides |
| Just-in-time onboarding | Don't force profile setup until needed |
| No in-app pricing | Let users negotiate privately via DMs |
| 6 task types + Other | Covers core needs with escape hatch for custom services |
| Two-way reviews | Builds trust for both operators and investors |
| Text-only DMs tied to posts | Simple, contextual, no feature creep |
| Lazy migration from old schema | No breaking changes, smooth transition |
