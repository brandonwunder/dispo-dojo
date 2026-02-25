# Bird Dog Page Redesign — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Replaces:** `2026-02-25-bird-dog-marketplace-design.md` (two-sided marketplace — scrapped)

## Context

The Bird Dog page was incorrectly built as a two-sided marketplace connecting bird dogs with investors. The actual purpose is simpler: bird dogs bring deals to **Dispo Dojo**, and Dispo Dojo dispos the deals. There is no need for bird dogs to connect with each other or with investors on the platform.

The marketplace concept (jobs, applications, messaging, reviews) belongs on the **Boots on the Ground** page instead.

## Purpose

A single scrollable page with three responsibilities:

1. **Explain** what bird dogging is (always visible)
2. **Sign up** new bird dogs for Dispo Dojo (shown if not registered)
3. **Dashboard** for registered bird dogs to submit leads and track their pipeline

## Page Architecture — Single Scrollable Page (Approach A)

### Section 1: Hero / Explainer (Always Visible)

- Full-width section with `bird-dog-bg.png` background + gradient overlay
- **Headline:** "Bird Dog for Dispo Dojo" (Onari display font)
- **Subheadline:** "Find deals. Submit leads. Get paid." (Rajdhani)
- Explainer body (3-4 short paragraphs, DM Sans): What is bird dogging? How it works with Dispo Dojo. What's in it for you.
- **How It Works** — 3-step visual:
  1. **Find a Deal** — Spot a distressed/vacant/motivated seller property
  2. **Submit the Lead** — Fill out details and send to our team
  3. **Get Paid** — Deal closes, you earn a bird dog fee
- If not registered: "Become a Bird Dog" CTA → smooth-scrolls to signup form
- Styling: dark background, glass panel overlays, electric cyan accents

### Section 2: Signup Form (Not Registered Only)

Centered GlassPanel card, ~600px max width.

**Fields:**
- Full Name (text)
- Phone (tel)
- Email (email, pre-filled from auth)
- Market / Area (text — city, county, or region)
- Experience Level (3 toggle pills: Beginner | Intermediate | Pro)
- Brief Pitch (textarea, 280 char limit)

**CTA:** "Sign Up as a Bird Dog" (headband red #E53935 gradient)

**On submit:** Creates `birdDogProfile` on user document → page transitions to dashboard.

### Section 3: Dashboard (Registered Bird Dogs Only)

Replaces the signup form below the explainer.

#### 3a. Stats Bar (Top)

Horizontal row of compact stat cards:
- Total Leads Submitted
- In Pipeline (active leads)
- Closed Deals
- Acceptance Rate (%)

Cyan/gold accent numbers.

#### 3b. Submit a Lead

GlassPanel form:
- Property Address (text)
- Owner Name (text, if known)
- Owner Contact (text, phone/email)
- Property Condition (dropdown: Distressed, Vacant, Pre-Foreclosure, Probate, Tired Landlord, Other)
- Asking Price / Estimated ARV (number, optional)
- Why It's a Deal (textarea)
- Photo Upload (optional file)
- "Submit Lead" button (headband red CTA)

#### 3c. My Leads Pipeline

List of submitted leads, each as a GlassPanel card showing:
- Property address (bold)
- Date submitted
- Status badge (color-coded):

| Stage | Color |
|-------|-------|
| Submitted | Gray |
| Under Review | Cyan |
| Contacting Seller | Blue |
| Seller Interested | Teal |
| Underwriting | Gold |
| Offer Made | Orange |
| Under Contract | Purple |
| Closed / Paid | Green |
| Seller Not Interested | Red |
| Seller Declined Offer | Red |

Cards expandable for full details.

## Data Architecture

### Firestore — `birdDogProfile` (on user document)

```json
{
  "registered": true,
  "name": "string",
  "phone": "string",
  "email": "string",
  "market": "string",
  "experienceLevel": "beginner | intermediate | pro",
  "pitch": "string (280 char max)",
  "registeredAt": "timestamp"
}
```

### Firestore — `bird_dog_leads` collection (one doc per lead)

```json
{
  "userId": "string",
  "userName": "string",
  "propertyAddress": "string",
  "ownerName": "string",
  "ownerContact": "string",
  "propertyCondition": "string",
  "askingPrice": "number | null",
  "dealReason": "string",
  "photoUrl": "string | null",
  "status": "submitted | under_review | contacting_seller | seller_interested | underwriting | offer_made | under_contract | closed_paid | seller_not_interested | seller_declined_offer",
  "payout": "null (TBD — admin sets later)",
  "submittedAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Collections to Remove

- `bird_dog_posts` — marketplace posts (no longer needed)
- `bird_dog_reviews` — review system (no longer needed)
- `bird_dog_threads` — message threads (no longer needed)
- `bird_dog_messages` — messages (no longer needed)

## Components to Remove

All files in `frontend/src/components/birddog/`:
- ProfileSetupModal.jsx
- CreatePostModal.jsx
- BirdDogCard.jsx
- JobCard.jsx
- ApplyModal.jsx
- ApplicantsList.jsx
- FilterBar.jsx
- MessagePanel.jsx
- MessageThread.jsx
- ReviewForm.jsx
- ReviewsList.jsx
- StarRating.jsx

## Admin Panel Updates

- Update the existing bird dog admin section to manage lead submissions (view, update status) instead of marketplace posts
- Add a **high importance TODO** item: "Define bird dog payout structure"

## What This Does NOT Include

- Payout tracking / earnings (TBD — placeholder for now)
- Bird dog to bird dog communication (not wanted)
- Bird dog to investor connection (Dispo Dojo is the middleman)
- Job postings or applications (belongs on Boots on the Ground)
