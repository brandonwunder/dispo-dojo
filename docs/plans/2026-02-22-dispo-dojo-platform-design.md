# Dispo Dojo Platform — Design Document

**Date:** 2026-02-22
**Status:** Approved

## Overview

Transform the existing Agent Finder tool into a full JV partner ecosystem called **Dispo Dojo**. The platform includes a login system, a dashboard with 9 tools organized by workflow, and a CRM that connects everything into a seamless pipeline.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | SPA with smooth page transitions |
| Styling | Tailwind CSS + custom dark/gold theme | Premium design system |
| Animations | Framer Motion + GSAP | Page transitions, micro-interactions |
| Icons | Lucide React | Consistent iconography |
| Routing | React Router v6 | Client-side navigation |
| Backend | FastAPI (existing) | API endpoints |
| Auth | JWT tokens | Per-user sessions |
| Database | SQLite (upgrade to PostgreSQL later) | Users, CRM data, LOI/contract history |
| Fonts | Playfair Display + DM Sans | Existing design language |

## Design Language

Carry forward the existing premium theme:
- Background: `#0a0a0f`
- Gold accents: `#c9a96e`, `#dfc08a`, `#a08550`
- Glass-morphism: `rgba(22, 22, 31, 0.6)` with `backdrop-filter: blur(12px)`
- Cards: `#16161f` with gold border glows on hover
- Gradient orbs and floating particle canvas
- Typography: Playfair Display (headings), DM Sans (body)

## Architecture

### Login Screen
- Full-screen centered card with Dispo Dojo logo
- Email + password fields with gold "Sign In" button
- Dark theme with gradient orbs backdrop
- **For now:** Any click on "Sign In" bypasses validation (placeholder auth)
- **Later:** JWT-based auth with user registration

### Layout (Post-Login)
```
┌──────────────────────────────────────────────────┐
│  DISPO DOJO              [User Avatar] Brandon ▾ │
├────────────┬─────────────────────────────────────┤
│  Sidebar   │  Main Content Area                  │
│  (nav)     │  (React Router outlet)              │
│            │                                     │
│  Dashboard │                                     │
│            │                                     │
│  LEAD GEN  │                                     │
│  ────────  │                                     │
│  Agent     │                                     │
│   Finder   │                                     │
│  FSBO      │                                     │
│   Finder   │                                     │
│  Lead      │                                     │
│   Scrub    │                                     │
│            │                                     │
│  DEAL MGMT │                                     │
│  ────────  │                                     │
│  CRM       │                                     │
│  Free      │                                     │
│   Underw.  │                                     │
│  LOI Gen   │                                     │
│  Contract  │                                     │
│   Gen      │                                     │
│            │                                     │
│  RESOURCES │                                     │
│  ────────  │                                     │
│  Direct    │                                     │
│   Agent    │                                     │
│  Join Team │                                     │
└────────────┴─────────────────────────────────────┘
```

### Dashboard (Home)
Grid of 9 tool cards organized in 3 sections:
- **Lead Generation:** Agent Finder, FSBO Finder, Lead Scrubbing
- **Deal Management:** CRM, Free Underwriting, LOI Generator, Contract Generator
- **Resources:** Direct Agent Wholesaling, Join Our Team

Each card: glass-morphism styling, icon, title, description, "Launch →" action. Staggered fade-up animation on load. Gold border glow on hover.

---

## Page Designs

### 1. Agent Finder (Existing — wrapped in new layout)
- Existing CSV upload + agent scraping functionality
- Add "Send to CRM" button on results table rows
- No functional changes, just wrapped in the sidebar layout

### 2. FSBO Finder (New Interactive Tool)
**Input:** City/state or ZIP code(s), optional price range and property type filters
**Process:** Scrapes free sources:
- Zillow FSBO listings
- Craigslist real estate
- Facebook Marketplace
- Realtor.com / Redfin FSBO filters

**Results table:**
- Property address, asking price, owner name, phone, email
- Listing source, days on market, beds/baths/sqft
- "Send to CRM" button per row

### 3. Lead Scrubbing (Deal Sauce Walkthrough)
- Large embedded video player (YouTube/Loom)
- Title + description
- Optional timestamps/table of contents
- Dark themed video page

### 4. CRM (New — Core of Platform)

#### Dual Pipeline Kanban
**Acquisitions Pipeline:**
New → Contacted → Qualified → Follow-Up → Offer Made → Underwriting → Approved → Under Contract → Closing → Closed | Dead (with reason) | Denied

**Disposition Pipeline:**
Locked Up → Marketing to Buyers → Buyer Interested → Assigned → Closing → Closed

Both: drag-and-drop cards, count badges, color-coded source badges

#### Lead Card (on Kanban board)
- Property address
- Source badge (Agent Finder / FSBO / Manual) — color-coded
- Seller name + motivation dot (Hot=red, Warm=yellow, Cold=blue)
- Deal amount / ARV
- Days in current stage
- Next action due (red if overdue)

#### Lead Detail Panel (slide-out from right, tabbed)

**Tab 1 — Overview:**
Status dropdown, motivation level, lead source, date acquired, next action + due date, quick notes

**Tab 2 — Contact Info:**
Seller: name, phones, emails, mailing address
Agent: name, phone, email, brokerage (if from Agent Finder)
Preferred contact method, tags/labels

**Tab 3 — Property Details:**
Type, beds, baths, sqft, lot size, year built
Condition: foundation, roof (+age), AC (+age), electric, plumbing
Occupancy, photos upload, mortgage info (for Sub2)

**Tab 4 — Deal Analyzer:**
ARV, itemized repair estimate (roof, HVAC, kitchen, bath, foundation, electric, plumbing, cosmetic)
MAO auto-calc: `ARV × 70% - Repairs - Wholesale Fee`
Seller asking, offer amount, wholesale fee, expected profit
Traffic light: Green/Yellow/Red deal indicator

**Tab 5 — Documents:**
Drag-drop uploads, mortgage statements, disclosures, LOIs, contracts, other files

**Tab 6 — Activity Timeline:**
Chronological feed: notes, stage changes, LOIs sent, contracts generated, underwriting submissions. @mentions for team. All auto-logged from platform tools.

**Tab 7 — Dispo (Buyer Side):**
Add buyer contacts, track interest, walkthrough scheduling, accept offers

#### Smart Features
- **Dead lead resurfacing:** Pick dead reason → auto-resurface after 30/60/90 days
- **Next action required:** Every lead must have a next action with due date
- **Task gate-keeping:** Require actions before stage advancement (optional)
- **Pipeline analytics:** Conversion rates, avg days/stage, funnel drop-off

#### CRM Integrations
| Tool | Integration |
|------|------------|
| Agent Finder | "Send to CRM" → new lead, source=Agent Finder, agent info pre-filled |
| FSBO Finder | "Send to CRM" → new lead, source=FSBO, owner info pre-filled |
| Free Underwriting | Submit from CRM lead → moves to Underwriting, results update status |
| LOI Generator | Generate from CRM lead → pre-fills data, logs to timeline, moves to Offer Made |
| Contract Generator | Generate from CRM lead → pre-fills data, logs to timeline, moves to Under Contract |

### 5. Free Underwriting (Interactive Form)
**Deal type selector:** Cash Deal vs. Subject-To (Sub2)

**Cash Deal fields:**
- Property address
- Foundation condition (Good/Fair/Needs Repair)
- Roof condition + age
- AC condition + age
- Electric condition, plumbing condition
- Drag-drop: seller disclosures

**Sub2 fields (adds):**
- Drag-drop: mortgage statement (required)
- Additional docs: solar, key lock, water softener, other liens

**Legal checkbox (required before submit):**
"By checking this box, you agree that if this property goes under contract, Dispo Dojo has first right to locate a buyer and dispo the deal during the inspection period (minimum 8 business days). This grants Dispo Dojo the exclusive ability to market and assign this deal during the inspection window."

Submission → creates/updates CRM lead to "Underwriting" status

### 6. LOI Generator (Interactive Tool)
**Steps:**
1. Deal info: property address, seller/agent name, offer price, terms, inspection period, closing date, earnest money
2. Template selection (user's LOI template)
3. Preview: formatted LOI document, editable
4. Send options: Download PDF / Send via Gmail (OAuth) / Batch mode (upload spreadsheet, up to 100/day with humanistic timing)

**History panel:** All LOIs sent with dates, statuses, re-download links
**CRM link:** Pre-fills from CRM lead data, logs back to CRM timeline

### 7. Contract Generator (Mini DocuSign)
**Steps:**
1. Deal info form: property address, buyer, seller, price, earnest money, inspection period, closing date, contingencies
2. Template mapping: contract template with auto-filled fields
3. Signature pad: draw or type signature (cursive font preview), auto-date
4. Preview & sign: full contract preview with placed signature
5. Export: download PDF / send via Gmail

**Contract history:** All contracts with dates, download links
**CRM link:** Pre-fills from CRM lead, logs to timeline

### 8. Direct Agent Wholesaling (Guide Page)
- Hero: "Direct Agent Wholesaling — How We Close Deals"
- Numbered step-by-step sections:
  1. Send LOI to listing agent
  2. Request mortgage statement from agent
  3. Send to underwriter (or use Free Underwriting)
  4. Pitch contract with underwriting backup
- Tool callout cards linking to LOI Gen, Contract Gen, Underwriting, Agent Finder, FSBO Finder
- Clean typography, gold accent dividers

### 9. Join Our Team (Recruiting + Form)
**Pitch section:**
- Headline: "Do You Like to Cold Call?"
- Body: warmed leads, underwritten deals, scaling lead sources, exclusive small team, looking for 1-2 people, full vetting by both partners, hustle mentality + problem-solving + long-term goals, experience + income

**Application form:**
- Full name, email, phone number
- Text area: "Tell us about your experience"
- Submit → "Brandon or Brad will reach out"

---

## Database Schema (High Level)

### Users
- id, email, password_hash, name, avatar_url, gmail_token, created_at

### CRM Leads
- id, user_id, property_address, property_type, beds, baths, sqft, lot_size, year_built
- condition_foundation, condition_roof, roof_age, condition_ac, ac_age, condition_electric, condition_plumbing
- occupancy, mortgage_balance, mortgage_lender, mortgage_rate
- seller_name, seller_phone, seller_email, seller_mailing_address
- agent_name, agent_phone, agent_email, agent_brokerage
- lead_source (agent_finder, fsbo, manual), source_job_id
- pipeline (acquisitions, disposition), status, motivation (hot, warm, cold)
- arv, repair_estimate, mao, offer_amount, wholesale_fee, expected_profit
- asking_price, deal_type (cash, sub2)
- dead_reason, dead_at, resurface_at
- next_action, next_action_due
- tags (JSON), created_at, updated_at

### CRM Activities
- id, lead_id, user_id, type (note, stage_change, loi_sent, contract_generated, underwriting_submitted, document_uploaded)
- content, metadata (JSON), created_at

### CRM Documents
- id, lead_id, user_id, filename, file_path, doc_type, created_at

### LOIs
- id, user_id, lead_id, property_address, agent_name, agent_email, offer_price, terms, template_used
- pdf_path, email_sent, email_sent_at, status, created_at

### Contracts
- id, user_id, lead_id, property_address, buyer_name, seller_name, purchase_price
- signature_data, signed_at, pdf_path, email_sent, email_sent_at, status, created_at

### Team Applications
- id, name, email, phone, experience_text, created_at

### Underwriting Submissions
- id, user_id, lead_id, deal_type, property_address, conditions (JSON), documents (JSON)
- agreement_accepted, status (pending, approved, denied), notes, created_at
