# Agent Finder Redesign — Glassmorphism Command Station
**Date:** 2026-02-22
**Status:** Approved
**Approach:** Full Glassmorphism (Approach A)

---

## Context

The existing Agent Finder page uses stacked full-width `WoodPanel` components with a plain night-sky star gradient background. The background never shows through the UI. A new cinematic background image (`Agent Finder Background.png` — ninja with glowing house orb, rainy mountain command station) was provided to set the scene. Goal: redesign the page to match the Login and Dashboard aesthetic — glass cards over a dramatic photo background — while keeping all existing functionality (upload, SSE processing, results table, job history) 100% intact.

---

## Design Decisions

### Layout
- All content is **horizontally centered** on the page
- Upload / processing / summary / job history: `max-w-[680px]`
- Results table only: `max-w-5xl` (1024px) — 9 columns need space
- Page wrapper: `min-h-screen`, `px-6 py-8`

### Background Layers (z-index stacking)
| z | Layer | Description |
|---|---|---|
| 0 | Photo | `Agent Finder Background.png`, `object-cover`, full screen |
| 1 | Vignette | `radial-gradient(ellipse, transparent 30%, rgba(11,15,20,0.65) 100%)` |
| 2 | Bottom fade | `linear-gradient` → `#0B0F14` at bottom 80px |
| 3 | Rain effect | Provided by Layout wrapper (no change) |
| 10 | Content | Glass cards |

Background image is copied to `frontend/public/agent-finder-bg.png` so Vite can serve it.

### Hero Header (floating, no glass card)
- `CompassIcon` (32px, `#00C6FF` with cyan drop-shadow glow)
- "Agent Finder" — Onari display font, `text-4xl`, `#F4F7FA`
- "Scout Tower — Agent Dispatch" — Rajdhani, `tracking-[0.14em]`, uppercase, `#00C6FF`
- Subtitle — DM Sans, `text-sm`, `#C8D1DA`
- No panel behind it; subtle `text-shadow` for legibility over photo

### Glass Card Spec
Applied to all panels (upload, processing, summary, job history):
```css
background: rgba(11, 15, 20, 0.82)
backdrop-filter: blur(20px) saturate(1.2)
border: 1px solid rgba(0, 198, 255, 0.12)
border-radius: 16px (rounded-2xl)
box-shadow:
  0 24px 48px -12px rgba(0,0,0,0.7),
  0 0 0 1px rgba(0,198,255,0.06),
  inset 0 1px 0 rgba(255,255,255,0.04),
  inset 0 0 40px rgba(0,198,255,0.03)
```
Top accent line: `2px` pseudo-element or border-top, gradient
`transparent → rgba(0,198,255,0.5) → transparent`

### Section Labels
All panel section titles: Rajdhani, `text-xs`, `tracking-[0.14em]`, `uppercase`, `#00C6FF`
(Previously: gold. Changed to cyan to match the page's discovery/scanning theme.)

### Upload Phase Card
- Section label: "UPLOAD PROPERTY LIST"
- Drop zone: `min-h-[160px]`, dashed border
  - Idle: `border rgba(0,198,255,0.25)`
  - Drag over: `border #00C6FF`, `bg rgba(0,198,255,0.05)`, outer glow
  - File selected: `border bamboo/40`, `bg bamboo/5`
- "Find Agents" CTA: full-width, gold shimmer button with sweep animation
- Clear link: text button, hover crimson

### Processing Phase Card
- Gold shimmer progress bar, `height: 20px`, pill shaped, with inner glow
- 6 stat chips in `grid-cols-2` (compact glass sub-cards)
- "Scanning:" row with ShurikenLoader
- ETA badge (monospace, right-aligned)
- "Cancel" button: crimson, full-width

### Complete Phase
1. **Summary card** (680px): DonutRing + stats legend side-by-side; Download + Process Another buttons
2. **Results table** (1024px): glass panel; `overflow-x-auto`; gold header row; row hover with gold/5 glow
3. **Job History** (680px): compact glass rows; inline Download + Delete

### Color Accent for This Page
- Primary: **Electric Cyan #00C6FF** (discovery / scanning theme matches bg image)
- CTAs: **Gold #F6C445** (unchanged from app-wide CTA style)
- Danger: **Crimson #E53935** (unchanged)
- WoodPanel classes: **removed** from this page entirely

---

## Files to Change
| File | Change |
|---|---|
| `frontend/src/pages/AgentFinder.jsx` | Full redesign of JSX/styles; all logic unchanged |
| `frontend/public/agent-finder-bg.png` | Add background image (copy from project root) |

## Files NOT Changed
- All API calls, state management, SSE logic
- `StatusBadge`, `ConfidenceBar`, `DonutRing` subcomponents (kept as-is, already well-styled)
- `Layout.jsx`, `RainEffect.jsx` (rain effect already provided by wrapper)
- `index.css`, `tailwind.config` (no new tokens needed)

---

## Verification
1. Run `npm run dev` from `frontend/`
2. Navigate to `/agent-finder`
3. Confirm: background photo visible, glass card centered, hero header floating
4. Upload a test CSV — confirm processing phase renders in same glass card
5. On complete: summary card + wider results table appear below hero
6. Job history rows render with glass style
7. Download / Delete actions still work
