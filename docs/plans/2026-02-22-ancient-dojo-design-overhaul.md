# Ancient Dojo — Full Design Overhaul

**Date:** 2026-02-22
**Approach:** "Ancient Dojo" — Traditional Japanese Immersion
**Status:** Approved

---

## Vision

Transform Dispo Dojo from a generic dark-mode SaaS dashboard into a fully immersive martial arts dojo experience. Every interaction should feel like training in a traditional Japanese compound — disciplined, atmospheric, and purposeful. The app IS the dojo.

---

## 1. Design System Foundation

### Color Palette

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg` | `#08080e` | Deep void — dojo at night |
| `--bg-elevated` | `#0f0f18` | Slightly lifted surfaces |
| `--bg-card` | `#13131d` | Card interiors — inside the shoji screen |
| `--gold` | `#d4a853` | Warmer lantern-light gold |
| `--gold-bright` | `#e8c36b` | Active/hover gold |
| `--gold-dim` | `#8b7340` | Borders/dividers |
| `--crimson` | `#8b2232` | Danger/critical — blood red, muted |
| `--crimson-bright` | `#c43a4f` | Active danger states |
| `--ink` | `#1a1a2e` | Ink wash overlay |
| `--parchment` | `rgba(214, 198, 172, 0.03)` | Subtle warm card texture |
| `--text-primary` | `#ede9e3` | Candlelit parchment white |
| `--text-dim` | `#7a7680` | Receded text |

### Typography

| Role | Font | Details |
|------|------|---------|
| Display / H1-H2 | **Onari** (custom .otf) | letter-spacing: 0.08em |
| H3 / Card titles | **Rajdhani** (600 weight) | Geometric warrior feel |
| Body | **DM Sans** (keep) | Clean and readable |
| Mono / data | **JetBrains Mono** | Stats, numbers, tables |
| Signature | **Dancing Script** (keep) | Contracts only |
| Section labels | **Rajdhani** all-caps | 0.15em tracking |

### Spacing
- Card padding: 2rem (generous, content breathes like a scroll)
- Section gaps: 2rem minimum (intentional negative space)
- Sidebar: 250px width (visual overhaul, not layout change)

---

## 2. Core Components

### Custom Cursor — "Blade Point"
- Default cursor → small blade-tip SVG (angled 45°, ~20px)
- Mouse move: faint trailing line (fades 200ms)
- Click: gold slash lines radiate from click point (fade 300ms)
- Hover on interactives: cursor scales up with subtle glow
- Text inputs: vertical ink brush cursor
- Global React context provider, GPU-accelerated via `transform`

### Cards — "Shoji Panels" (3 tiers)

**Shoji Card (primary):**
- Thin wood-frame border (`--gold-dim` at 30% opacity)
- Decorative corner notches (CSS `clip-path`)
- Washi paper texture (SVG noise at 2-3% opacity over `--parchment`)
- 2rem padding, hover: frame glows gold

**Scroll Card (long content):**
- Curved/rolled top and bottom edges (border-radius + shadow)
- Unfurling animation on mount (top-to-bottom reveal with parallax)
- Used for: Scripts sections, process steps, LOI/Contract steps

**Stat Card (dashboard numbers):**
- Onari font numbers, large
- CountUp animation on mount
- Thin gold blade-edge accent line at bottom
- Icon in hanko stamp circle

### Buttons — "Forged Actions"
- **Primary gold:** Hammered-metal texture, ember glow on hover, forge-strike ripple on click
- **Outline:** Brush-stroke style irregular SVG border, fills translucent gold on hover
- **Danger:** `--crimson` color, crimson glow on hover
- All: scale pulse on click (0.97→1.0, 100ms)

### Sidebar — "Weapon Rack"
- Section dividers: thin katana blade lines (tapered ends via SVG/gradient)
- Section labels: all-caps Rajdhani, 0.15em tracking
- Active state: vertical gold accent bar on left (lit incense stick) + warm glow
- Hover: faint mist/smoke overlay on item background
- Logo: slow breathing animation (refined from existing)
- Bottom: faint rising mist effect (CSS gradient animation)

### Header — "Dojo Banner"
- Page title in Onari with brush-stroke SVG underline
- User avatar: hanko seal (red circle with initials)
- Horizontal divider with tapered katana-blade ends

---

## 3. Animations & Transitions

### Login → Dashboard ("Ninja Arrival") ~1-1.5s
1. Screen goes to black (100ms)
2. Smoke burst from center (CSS radial gradient + opacity, 400ms)
3. Single gold diagonal slash (SVG path animation, 300ms)
4. Smoke clears → dashboard elements stagger in from below (Framer Motion, 300ms)

### Page Transitions ("Smoke Teleport")
- Routes wrapped in `AnimatePresence`
- **Exit:** fade + scale(0.98), smoke particles burst outward (200ms)
- **Enter:** fade in through clearing mist, content staggers up (300ms)
- Smoke: 15-20 small circles that expand and fade (Framer Motion)

### Background Effects
- **Cherry blossom petals:** 8-12 petals drifting slowly, rotating, fading. Three.js or pure CSS.
- **Mist layers:** 2-3 large, subtle fog patches drifting slowly. CSS background with animated translate.
- Both: atmospheric, not distracting

### Micro-Interactions
- Buttons: scale pulse (0.97→1.0), ember glow hover
- Cards: frame glow on hover, subtle lift (translateY -2px)
- Nav items: mist overlay hover, lantern glow active
- Form inputs: calligraphy-stroke focus border (SVG stroke-dashoffset animation)
- Table rows: stagger in on mount, gold highlight on hover
- Tooltips: smoke-puff appearance
- Modals: emerge from smoke, mist dim overlay

---

## 4. Page-Specific Designs

### Login Page
- Full-screen dark with slow drifting mist background
- Logo with breathing glow
- Form card as scroll/parchment style
- Ink-brush focus animations on inputs
- "Enter the Dojo" CTA button
- Signup modal matches scroll aesthetic

### Dashboard
- Hero stat cards: Onari numbers, hanko-seal icons, blade-edge accents
- Quick action cards: shoji panel style
- Staggered mount animation
- "Welcome back, [Name]" in Onari with brush-stroke underline

### Agent Finder / FSBO Finder
- Search/filter bar: scroll unfurling style
- Results: shoji panel cards
- Loading: spinning shuriken

### LOI Generator / Contract Generator
- Multi-step progress: ascending mountain path or belt progression visual
- Step transitions: scroll-unfurl animation
- Form sections in scroll cards

### Scripts Page
- Script sections: scroll cards with unfurl animation
- Objection handlers: collapsible shoji panels
- SMS templates: written scroll appearance

### CRM / Kanban
- Columns: wooden dojo post styling
- Lead cards: paper notes pinned to board
- Drag-and-drop: flutter animation

### Underwriting
- Form in scroll card
- Cash vs Sub2 toggle styled as dojo training paths
- Submission: forge-strike button effect

### Admin Dashboard
- User list in shoji panels
- Stats in stat cards with hanko icons
- Clean table with gold hover highlights

### All Remaining Pages (DirectAgent, DispoProcess, WebsiteExplainer, JoinTeam, LeadScrubbing)
- Consistent shoji card usage
- Section headers: Onari + brush-stroke underline
- Long content: scroll cards
- Link cards: shoji panels with gold hover

---

## 5. Loading & Empty States

| State | Design |
|-------|--------|
| Page loading | Spinning gold shuriken, centered |
| Data loading | Three dots pulsing like embers |
| Empty state | Ink brush illustration + "The scroll is empty" message |
| Error state | Broken katana illustration + crimson accent text |

---

## 6. Technical Implementation Notes

### Font Loading
- Move `Onari Font.otf` to `frontend/src/assets/fonts/`
- Load via `@font-face` in `index.css`
- Add Rajdhani + JetBrains Mono via Google Fonts

### New Component Files
- `ShojiCard.jsx` — replaces GlassCard as primary card
- `ScrollCard.jsx` — for long/expandable content
- `StatCard.jsx` — dashboard number cards
- `CustomCursor.jsx` — global cursor provider
- `NinjaTransition.jsx` — login→dashboard animation
- `SmokeTransition.jsx` — page transition wrapper
- `CherryBlossoms.jsx` — background petal effect
- `MistLayer.jsx` — background mist effect
- `ShurikenLoader.jsx` — loading spinner
- `BrushUnderline.jsx` — SVG brush-stroke underline component

### Migration Strategy
- Update `GlassCard` → `ShojiCard` incrementally per page
- Update `index.css` with new tokens first (non-breaking)
- New components added alongside existing, swap per page
- Background effects swapped last (replace ParticleCanvas + GradientOrbs)

### Dependencies
- No new major dependencies needed
- Framer Motion + GSAP + Three.js already installed
- May add a small SVG noise library or inline the texture

---

## Files Affected (All)

### Global / Shared
- `frontend/src/index.css` — New color tokens, @font-face, typography
- `frontend/src/components/Layout.jsx` — New backgrounds, cursor provider
- `frontend/src/components/Sidebar.jsx` — Weapon rack redesign
- `frontend/src/components/Header.jsx` — Dojo banner redesign
- `frontend/src/components/GlassCard.jsx` → Evolve or replace with ShojiCard
- `frontend/src/components/Button.jsx` — Forged button redesign
- `frontend/src/components/GradientOrbs.jsx` → Replace with MistLayer
- `frontend/src/components/ParticleCanvas.jsx` → Replace with CherryBlossoms
- `frontend/src/lib/animation/motionVariants.js` — New smoke/slash variants
- `frontend/src/App.jsx` — Page transition wrapper
- `frontend/index.html` — Updated Google Fonts links

### New Components
- `frontend/src/components/ShojiCard.jsx`
- `frontend/src/components/ScrollCard.jsx`
- `frontend/src/components/StatCard.jsx`
- `frontend/src/components/CustomCursor.jsx`
- `frontend/src/components/NinjaTransition.jsx`
- `frontend/src/components/SmokeTransition.jsx`
- `frontend/src/components/CherryBlossoms.jsx`
- `frontend/src/components/MistLayer.jsx`
- `frontend/src/components/ShurikenLoader.jsx`
- `frontend/src/components/BrushUnderline.jsx`
- `frontend/src/assets/fonts/Onari.otf`

### Pages (all 14+)
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/pages/AdminDashboard.jsx`
- `frontend/src/pages/AgentFinder.jsx`
- `frontend/src/pages/FSBOFinder.jsx`
- `frontend/src/pages/LeadScrubbing.jsx`
- `frontend/src/pages/Underwriting.jsx`
- `frontend/src/pages/LOIGenerator.jsx`
- `frontend/src/pages/ContractGenerator.jsx`
- `frontend/src/pages/DirectAgent.jsx`
- `frontend/src/pages/Scripts.jsx`
- `frontend/src/pages/WebsiteExplainer.jsx`
- `frontend/src/pages/DispoProcess.jsx`
- `frontend/src/pages/JoinTeam.jsx`
- `frontend/src/pages/CRM.jsx`
