# Dispo Dojo Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Dispo Dojo JV partner ecosystem — a React SPA with login, dashboard, 9 tool pages, and a CRM, backed by the existing FastAPI server.

**Architecture:** React + Vite frontend in a `frontend/` directory. FastAPI backend serves the built React app in production. Vite dev server proxies API calls to FastAPI during development. SQLite database for users, CRM leads, LOIs, contracts, and applications.

**Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, React Router v6, Lucide React, FastAPI, SQLAlchemy, SQLite, JWT auth

---

## Phase 1: React Scaffold + Foundation

### Task 1: Initialize React + Vite project

**Files:**
- Create: `frontend/` directory with Vite React scaffold
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/index.html`

**Step 1: Scaffold Vite React project**

Run:
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
npm create vite@latest frontend -- --template react
```

**Step 2: Install dependencies**

Run:
```bash
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend"
npm install
npm install tailwindcss @tailwindcss/vite framer-motion react-router-dom lucide-react
```

**Step 3: Configure Vite with Tailwind and API proxy**

`frontend/vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:9000',
        changeOrigin: true,
      }
    }
  }
})
```

**Step 4: Configure Tailwind with custom Dispo Dojo theme**

`frontend/src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-bg-elevated: #12121a;
  --color-bg-card: #16161f;
  --color-glass: rgba(22, 22, 31, 0.6);
  --color-glass-border: rgba(201, 169, 110, 0.08);
  --color-glass-border-hover: rgba(201, 169, 110, 0.18);
  --color-border: #1e1e2a;
  --color-border-hover: #2e2e3d;
  --color-gold: #c9a96e;
  --color-gold-bright: #dfc08a;
  --color-gold-dim: #a08550;
  --color-gold-glow: rgba(201, 169, 110, 0.12);
  --color-gold-glow-strong: rgba(201, 169, 110, 0.25);
  --color-text-primary: #e8e6e2;
  --color-text-dim: #8a8790;
  --color-text-muted: #4e4d55;
  --color-success: #6ee7a0;
  --color-warning: #f0c060;
  --color-error: #f07070;
  --color-info: #70b8f0;
  --color-purple: #a78bfa;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;
}

body {
  font-family: var(--font-body);
  background: var(--color-bg);
  color: var(--color-text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
```

**Step 5: Verify dev server runs**

Run: `cd "c:/Users/brand/OneDrive/Desktop/Agent Finder/frontend" && npm run dev`
Expected: Vite dev server starts on port 3000

**Step 6: Commit**

```bash
git add frontend/
git commit -m "feat: scaffold React + Vite frontend with Tailwind and Dispo Dojo theme"
```

---

### Task 2: Create shared UI components and layout

**Files:**
- Create: `frontend/src/components/GlassCard.jsx`
- Create: `frontend/src/components/GradientOrbs.jsx`
- Create: `frontend/src/components/ParticleCanvas.jsx`
- Create: `frontend/src/components/Button.jsx`
- Create: `frontend/src/components/Sidebar.jsx`
- Create: `frontend/src/components/Header.jsx`
- Create: `frontend/src/components/Layout.jsx`

**Step 1: Create GlassCard component**

A reusable glass-morphism card matching the existing design:
```jsx
// GlassCard.jsx
export default function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <div
      className={`backdrop-blur-xl bg-glass border border-glass-border rounded-[14px]
        ${hover ? 'transition-all duration-300 hover:border-glass-border-hover hover:shadow-[0_0_60px_-20px_var(--color-gold-glow-strong)] hover:-translate-y-0.5' : ''}
        ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
```

**Step 2: Create GradientOrbs background component**

Port the existing CSS gradient orbs to a React component with the same animations.

**Step 3: Create ParticleCanvas component**

Port the existing floating particle canvas to a React component using useEffect + useRef for the canvas.

**Step 4: Create Button component**

Gold, outline, danger variants matching existing `.btn-gold`, `.btn-outline`, `.btn-danger` styles.

**Step 5: Create Sidebar component**

Persistent left sidebar with:
- Dispo Dojo logo at top
- Dashboard link
- Grouped sections: LEAD GEN, DEAL MGMT, RESOURCES
- Each item: icon (Lucide) + label
- Active state: gold highlight with glow
- Glass-morphism background

**Step 6: Create Header component**

Top bar with: breadcrumb/page title on left, user avatar + name + dropdown on right.

**Step 7: Create Layout component**

Combines Sidebar + Header + main content area (React Router `<Outlet />`). This wraps all authenticated pages.

**Step 8: Commit**

```bash
git add frontend/src/components/
git commit -m "feat: add shared UI components — GlassCard, Sidebar, Header, Layout"
```

---

### Task 3: Set up routing and auth context

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create AuthContext**

Simple context with `isLoggedIn`, `user`, `login()`, `logout()`. For now, `login()` just sets a flag in state (no real auth). Later we'll add JWT.

```jsx
// AuthContext.jsx
import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = (email) => {
    setUser({ email, name: email.split('@')[0] })
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

**Step 2: Create Login page**

Full-screen centered glass card:
- Dispo Dojo logo (floating animation)
- Email input + Password input (styled dark inputs with gold focus ring)
- "Sign In" gold button — calls `login()` with any input
- Gradient orbs + particle canvas backdrop

**Step 3: Set up App.jsx with routing**

```jsx
// App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
// ... other page imports

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="agent-finder" element={<AgentFinder />} />
            <Route path="fsbo-finder" element={<FSBOFinder />} />
            <Route path="lead-scrubbing" element={<LeadScrubbing />} />
            <Route path="crm" element={<CRM />} />
            <Route path="underwriting" element={<Underwriting />} />
            <Route path="loi-generator" element={<LOIGenerator />} />
            <Route path="contract-generator" element={<ContractGenerator />} />
            <Route path="direct-agent" element={<DirectAgent />} />
            <Route path="join-team" element={<JoinTeam />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
```

**Step 4: Verify login flow works**

Run dev server, navigate to `/`, should redirect to `/login`. Click "Sign In", should redirect to dashboard.

**Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add auth context, login page, and protected routing"
```

---

## Phase 2: Dashboard + All Page Shells

### Task 4: Build Dashboard page

**Files:**
- Create: `frontend/src/pages/Dashboard.jsx`

**Step 1: Build Dashboard with 3 grouped sections of tool cards**

Each section has a subtle heading ("Lead Generation", "Deal Management", "Resources") and a responsive grid of GlassCards. Each card has:
- Lucide icon
- Tool name
- Short description
- "Launch →" link (React Router `<Link>`)
- Framer Motion: staggered fadeUp on mount, scale+glow on hover

**Step 2: Add page transition animation**

Wrap the page in a Framer Motion `<motion.div>` with fade+slide entrance.

**Step 3: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: add dashboard page with tool cards grid"
```

---

### Task 5: Build Agent Finder page (embed existing)

**Files:**
- Create: `frontend/src/pages/AgentFinder.jsx`

**Step 1: Create AgentFinder page that embeds the existing tool**

Use an `<iframe>` pointing to the existing FastAPI app at `/agent-finder-legacy` (we'll add this route to FastAPI). This preserves the existing tool exactly while wrapping it in the new layout.

Alternative approach: Rewrite the Agent Finder as a React component that calls the existing API endpoints (`/upload`, `/progress/{id}`, `/download/{id}`, `/jobs`). This is cleaner long-term.

**Recommended: iframe for now** to avoid breaking the running tool. We can rewrite it in React later.

**Step 2: Add "Send to CRM" button concept (placeholder)**

Add a banner at the top: "Results can be sent to your CRM pipeline" with a placeholder button.

**Step 3: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: add Agent Finder page wrapping existing tool"
```

---

### Task 6: Build Free Underwriting page

**Files:**
- Create: `frontend/src/pages/Underwriting.jsx`
- Create: `frontend/src/components/FileDropZone.jsx`

**Step 1: Create FileDropZone reusable component**

Drag-and-drop file upload component with gold border, matching the existing Agent Finder drop zone style. Shows file name + size after selection. Accepts configurable file types.

**Step 2: Build Underwriting form**

- Deal type toggle: "Cash Deal" / "Subject-To" (styled tab switcher)
- Cash Deal form: property address, foundation/roof/AC/electric/plumbing dropdowns, roof age, AC age, disclosures drop zone
- Sub2 form: everything from cash + mortgage statement drop zone (required) + additional docs drop zone
- Legal agreement checkbox with full text
- "Submit for Underwriting" gold button (disabled until checkbox checked)
- All inputs styled: dark background, gold focus ring, glass-morphism container sections

**Step 3: Commit**

```bash
git add frontend/src/pages/Underwriting.jsx frontend/src/components/FileDropZone.jsx
git commit -m "feat: add Free Underwriting page with cash/sub2 forms"
```

---

### Task 7: Build Direct Agent Wholesaling page

**Files:**
- Create: `frontend/src/pages/DirectAgent.jsx`

**Step 1: Build guide/content page**

- Hero section with gold accent line
- 4 numbered steps with headings + descriptions
- Tool callout cards at bottom linking to LOI Gen, Contract Gen, Underwriting, Agent Finder, FSBO Finder
- Smooth scroll animation (Framer Motion `whileInView`)

**Step 2: Commit**

```bash
git add frontend/src/pages/DirectAgent.jsx
git commit -m "feat: add Direct Agent Wholesaling process guide page"
```

---

### Task 8: Build Lead Scrubbing page

**Files:**
- Create: `frontend/src/pages/LeadScrubbing.jsx`

**Step 1: Build video walkthrough page**

- Large video embed placeholder (16:9 aspect ratio container, dark background)
- Title + description below
- Placeholder text: "Video coming soon — Deal Sauce walkthrough"
- Styled to match theme

**Step 2: Commit**

```bash
git add frontend/src/pages/LeadScrubbing.jsx
git commit -m "feat: add Lead Scrubbing video walkthrough page"
```

---

### Task 9: Build FSBO Finder page

**Files:**
- Create: `frontend/src/pages/FSBOFinder.jsx`

**Step 1: Build FSBO Finder search interface**

- Search input: city/state or ZIP code (styled dark input with gold focus)
- Optional filters: price range (min/max), property type dropdown
- "Search" gold button
- Results table (placeholder/empty state for now): address, price, owner, phone, email, source, DOM, beds/baths/sqft
- "Send to CRM" button per row
- Matching the Agent Finder's table styling

**Step 2: Commit**

```bash
git add frontend/src/pages/FSBOFinder.jsx
git commit -m "feat: add FSBO Finder page with search interface"
```

---

### Task 10: Build LOI Generator page

**Files:**
- Create: `frontend/src/pages/LOIGenerator.jsx`

**Step 1: Build multi-step LOI form**

Step indicator at top (1. Deal Info → 2. Preview → 3. Send)

Step 1 form: property address, seller/agent name, agent email, offer price, terms textarea, inspection period (days), closing date, earnest money amount

Step 2: formatted LOI preview (styled document view in a white/light card)

Step 3: send options — Download PDF button, Send via Email button (placeholder), Batch mode toggle (placeholder)

**Step 2: Build LOI history sidebar/section**

Table of past LOIs: date, property, agent, status. Download links.

**Step 3: Commit**

```bash
git add frontend/src/pages/LOIGenerator.jsx
git commit -m "feat: add LOI Generator page with multi-step form"
```

---

### Task 11: Build Contract Generator page

**Files:**
- Create: `frontend/src/pages/ContractGenerator.jsx`
- Create: `frontend/src/components/SignaturePad.jsx`

**Step 1: Create SignaturePad component**

Canvas-based signature drawing area with:
- Draw mode (freehand on canvas)
- Type mode (text input rendered in cursive font)
- Clear button
- Dark canvas with gold border

**Step 2: Build multi-step contract form**

Step 1: Deal info — property address, buyer name, seller name, purchase price, earnest money, inspection period, closing date, contingencies

Step 2: Contract preview — styled document view with filled-in fields highlighted

Step 3: Sign — SignaturePad + date selector + "Sign & Finalize" button

Step 4: Export — Download PDF / Send via Email buttons

**Step 3: Build contract history section**

Table of past contracts with dates and download links.

**Step 4: Commit**

```bash
git add frontend/src/pages/ContractGenerator.jsx frontend/src/components/SignaturePad.jsx
git commit -m "feat: add Contract Generator page with signature pad"
```

---

### Task 12: Build Join Our Team page

**Files:**
- Create: `frontend/src/pages/JoinTeam.jsx`

**Step 1: Build recruiting content + application form**

Top section (content):
- "Do You Like to Cold Call?" headline
- Pitch copy about the opportunity (warmed leads, small team, vetting, hustle mentality, growth)

Bottom section (form):
- Full name, email, phone inputs
- "Tell us about your experience" textarea
- "Submit Application" gold button
- Success state: "Thanks! Brandon or Brad will reach out."

**Step 2: Commit**

```bash
git add frontend/src/pages/JoinTeam.jsx
git commit -m "feat: add Join Our Team recruiting page"
```

---

## Phase 3: CRM Foundation

### Task 13: Build CRM page — Pipeline Kanban board

**Files:**
- Create: `frontend/src/pages/CRM.jsx`
- Create: `frontend/src/components/crm/KanbanBoard.jsx`
- Create: `frontend/src/components/crm/KanbanColumn.jsx`
- Create: `frontend/src/components/crm/LeadCard.jsx`

**Step 1: Build KanbanColumn component**

Glass card column with:
- Status header + count badge
- Scrollable list of LeadCards
- Drop target styling (gold border glow when dragging over)

**Step 2: Build LeadCard component**

Small glass card showing:
- Property address (bold)
- Source badge (color-coded: blue=Agent Finder, green=FSBO, gold=Manual)
- Seller name + motivation dot (red/yellow/blue)
- Deal amount if set
- Days in stage
- Next action due (red if overdue)
- Click opens detail panel

**Step 3: Build KanbanBoard component**

Horizontal scrollable row of KanbanColumns. Two board tabs at top: "Acquisitions" and "Disposition". Pipeline toggle switches between the two sets of columns.

Use HTML5 drag-and-drop for card movement between columns.

**Step 4: Build CRM page wrapper**

- Header: "CRM Pipeline" + "+ New Lead" button + List/Board view toggle
- KanbanBoard below
- Sample data for visual testing (hardcoded mock leads)

**Step 5: Commit**

```bash
git add frontend/src/pages/CRM.jsx frontend/src/components/crm/
git commit -m "feat: add CRM page with Kanban pipeline board"
```

---

### Task 14: Build CRM Lead Detail panel

**Files:**
- Create: `frontend/src/components/crm/LeadDetail.jsx`
- Create: `frontend/src/components/crm/TabOverview.jsx`
- Create: `frontend/src/components/crm/TabContact.jsx`
- Create: `frontend/src/components/crm/TabProperty.jsx`
- Create: `frontend/src/components/crm/TabDealAnalyzer.jsx`
- Create: `frontend/src/components/crm/TabDocuments.jsx`
- Create: `frontend/src/components/crm/TabActivity.jsx`
- Create: `frontend/src/components/crm/TabDispo.jsx`

**Step 1: Build LeadDetail slide-out panel**

Right-side panel that slides in (Framer Motion) when a LeadCard is clicked. Fixed position, takes up ~50% of screen width. Has:
- Property address header + close button
- Tab bar: Overview | Contact | Property | Deal | Documents | Activity | Dispo
- Tab content area below

**Step 2: Build each tab component**

Each tab is a form/display component:
- **TabOverview:** Status dropdown, motivation, source, next action + due date, quick notes
- **TabContact:** Seller info fields, agent info fields, tags
- **TabProperty:** Type, beds/baths/sqft, condition fields, photos, mortgage info
- **TabDealAnalyzer:** ARV, itemized repairs, auto-calculated MAO, offer, profit, traffic light
- **TabDocuments:** FileDropZone + list of uploaded docs
- **TabActivity:** Chronological timeline feed with icons per activity type
- **TabDispo:** Buyer list, add buyer, track interest

All fields styled with dark inputs, gold focus, glass-morphism sections.

**Step 3: Wire LeadCard click → LeadDetail open**

**Step 4: Commit**

```bash
git add frontend/src/components/crm/
git commit -m "feat: add CRM lead detail panel with all 7 tabs"
```

---

## Phase 4: Backend API + Database

### Task 15: Set up SQLite database + models

**Files:**
- Create: `agent_finder/database.py`
- Create: `agent_finder/models_db.py`
- Modify: `agent_finder/app.py` (add DB startup)

**Step 1: Create SQLAlchemy models**

Tables: users, crm_leads, crm_activities, crm_documents, lois, contracts, team_applications, underwriting_submissions

**Step 2: Create database.py with engine + session**

SQLite file at `data/dispo_dojo.db`. Session dependency for FastAPI.

**Step 3: Add DB initialization to FastAPI startup**

**Step 4: Commit**

```bash
git add agent_finder/database.py agent_finder/models_db.py
git commit -m "feat: add SQLite database with SQLAlchemy models"
```

---

### Task 16: Add auth API endpoints

**Files:**
- Create: `agent_finder/auth.py`
- Modify: `agent_finder/app.py`

**Step 1: Create auth routes**

- `POST /api/auth/login` — accepts email+password, returns JWT token (for now accepts anything)
- `POST /api/auth/register` — creates user
- `GET /api/auth/me` — returns current user from JWT
- JWT utility functions (create_token, verify_token)

**Step 2: Commit**

```bash
git add agent_finder/auth.py
git commit -m "feat: add JWT auth API endpoints"
```

---

### Task 17: Add CRM API endpoints

**Files:**
- Create: `agent_finder/crm_routes.py`
- Modify: `agent_finder/app.py`

**Step 1: Create CRM CRUD routes**

- `GET /api/crm/leads` — list leads for user (filterable by pipeline, status)
- `POST /api/crm/leads` — create lead
- `GET /api/crm/leads/{id}` — get lead detail
- `PUT /api/crm/leads/{id}` — update lead (status, fields)
- `DELETE /api/crm/leads/{id}` — delete lead
- `POST /api/crm/leads/{id}/activities` — add activity/note
- `GET /api/crm/leads/{id}/activities` — list activities
- `POST /api/crm/leads/{id}/documents` — upload document
- `PUT /api/crm/leads/{id}/move` — move to new pipeline stage

**Step 2: Commit**

```bash
git add agent_finder/crm_routes.py
git commit -m "feat: add CRM API endpoints"
```

---

### Task 18: Add LOI + Contract + Application API endpoints

**Files:**
- Create: `agent_finder/loi_routes.py`
- Create: `agent_finder/contract_routes.py`
- Create: `agent_finder/team_routes.py`
- Create: `agent_finder/underwriting_routes.py`

**Step 1: Create LOI routes**

- `POST /api/loi/generate` — generate LOI PDF from form data
- `GET /api/loi/history` — list user's LOIs
- `GET /api/loi/{id}/download` — download LOI PDF

**Step 2: Create Contract routes**

- `POST /api/contracts/generate` — generate contract PDF with signature
- `GET /api/contracts/history` — list user's contracts
- `GET /api/contracts/{id}/download` — download contract PDF

**Step 3: Create Team Application route**

- `POST /api/team/apply` — submit application (name, email, phone, experience)

**Step 4: Create Underwriting routes**

- `POST /api/underwriting/submit` — submit underwriting request with files
- `GET /api/underwriting/history` — list user's submissions

**Step 5: Commit**

```bash
git add agent_finder/loi_routes.py agent_finder/contract_routes.py agent_finder/team_routes.py agent_finder/underwriting_routes.py
git commit -m "feat: add LOI, Contract, Team, and Underwriting API endpoints"
```

---

## Phase 5: Connect Frontend to Backend

### Task 19: Create API client and connect all pages

**Files:**
- Create: `frontend/src/api/client.js`
- Create: `frontend/src/api/auth.js`
- Create: `frontend/src/api/crm.js`
- Create: `frontend/src/api/loi.js`
- Create: `frontend/src/api/contracts.js`
- Modify: All page components to use real API calls

**Step 1: Create base API client with JWT interceptor**

Fetch wrapper that adds Authorization header from stored JWT token.

**Step 2: Create API modules for each domain**

Each module exports functions matching the backend endpoints.

**Step 3: Update AuthContext to use real login API**

**Step 4: Update CRM page to fetch/update real data**

**Step 5: Update all form pages to submit to real endpoints**

**Step 6: Commit**

```bash
git add frontend/src/api/ frontend/src/
git commit -m "feat: connect frontend to backend API endpoints"
```

---

## Phase 6: Polish + Production Build

### Task 20: Add Framer Motion page transitions

**Files:**
- Create: `frontend/src/components/PageTransition.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create PageTransition wrapper with fade+slide animation**

**Step 2: Wrap all routes in AnimatePresence + PageTransition**

**Step 3: Commit**

---

### Task 21: Configure FastAPI to serve React build

**Files:**
- Modify: `agent_finder/app.py`

**Step 1: Add static file serving for React build output**

After `npm run build`, FastAPI serves `frontend/dist/` at `/` and returns `index.html` for all non-API routes (SPA fallback).

**Step 2: Add build script**

**Step 3: Commit**

---

## Execution Priority

For the initial build-out (visual demo), execute Phases 1-3 first. This gives you:
- Working login screen
- Dashboard with all 9 tool cards
- All page shells with forms and layouts
- CRM with Kanban board and lead detail panel
- All using mock/local data

Phases 4-6 add the real backend, database, and API connections.
