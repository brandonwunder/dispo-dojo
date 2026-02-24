# Electric Ninja Rebrand — Full Site Design

**Date:** 2026-02-22
**Scope:** Full site rebrand + Dashboard enhancements
**Vibe:** "Electric Ninja Command Center" — neon glows, cyan/blue energy, brighter gold

## Brand Colors (from Brand Colors.png)

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| Ninja Blue | `#0E5A88` | Primary buttons, headings accent |
| Headband Red | `#E53935` | CTA buttons, alerts, warnings |
| Gold Glow | `#F6C445` | Display text, shimmer, highlights |
| Electric Cyan | `#00C6FF` | Links, accents, glow effects, active states |

### Dark/Gritty Theme
| Name | Hex | Usage |
|------|-----|-------|
| Background Black | `#0B0F14` | Page background |
| Midnight Blue | `#111B24` | Elevated surfaces (cards, sidebar) |
| Steel Blue | `#1C3B4D` | Tertiary surfaces, subtle borders |
| Muted Ninja Blue | `#1F5D7A` | Muted accents |
| Dark Red Accent | `#00B7FF` | — |
| Electric Cyan | `#00C6FF` | Accent glow |

### Gradients
| Name | Values |
|------|--------|
| Primary Button | `#0E5A88` -> `#1F5D7A` |
| CTA Button | `#E53935` -> `#B3261E` |
| Gold Highlight | `#F6C445` -> `#FFD97A` |
| Glow Effect | `#00C6FF` -> `#7F00FF` |
| Logo Gradient | `#FFAE50` -> `#F6C445` -> `#00C6FF` -> `#7F00FF` |

### Text
| Role | Hex |
|------|-----|
| Headings | `#F4F7FA` |
| Subhead | `#F4F7FA` |
| Body Text | `#C8D1DA` |
| Accent/Links | `#00C6FF` |
| Alerts | `#E53935` |

### Neutrals
`#0B0F14` · `#111B24` · `#1E2A36` · `#2E3F4E` · `#F4F7FA` · `#FFFFFF`

---

## Phase 1: CSS Variable System Swap

**File:** `frontend/src/index.css`

Replace all theme variables:
```
--color-bg: #0B0F14
--color-bg-elevated: #111B24
--color-gold: #F6C445
--color-gold-dim: #C49A20
--color-gold-bright: #FFD97A
--color-gold-shimmer: #FFEFB8
--color-crimson: #E53935
--color-steel: #0E5A88
--color-bamboo: #1C3B4D
--color-ember: #00C6FF
--color-text-primary: #F4F7FA
--color-text-dim: #C8D1DA
NEW: --color-cyan: #00C6FF
NEW: --color-purple-glow: #7F00FF
NEW: --color-ninja-blue: #0E5A88
NEW: --color-midnight: #111B24
```

Update pseudo-element textures (ink-wash, wall-texture, washi-texture) to use cooler tones.

Update elevation shadows to use cool blue tints instead of warm gold:
```css
.elevation-2 {
  box-shadow:
    0 4px 12px rgba(0,0,0,0.6),
    0 2px 4px rgba(0,0,0,0.4),
    0 0 1px rgba(0,198,255,0.1),
    inset 0 1px 0 rgba(0,198,255,0.06),
    inset 0 0 20px rgba(0,198,255,0.02);
}
```

Update `gold-shimmer-text` gradient to use brighter gold + cyan flash.

Update `katana-line` to use cyan gradient.

---

## Phase 2: Dashboard Enhancements

### KPI Cards (`KpiCard.jsx`)
- Background: `#111B24`
- Border: `1px solid rgba(0,198,255,0.15)`
- Hover: border glows cyan `rgba(0,198,255,0.35)`, shadow `0 0 24px rgba(0,198,255,0.12)`
- Lift: `-translate-y-1.5` on hover (slightly more dramatic)
- Value color: Electric Cyan for default, keep green override for success metrics
- Add subtle top-edge glow line (1px gradient from transparent -> cyan -> transparent)

### Tool Cards (`ToolCard.jsx`)
- Accent color cycle updated: Ninja Blue, Headband Red, Electric Cyan, Gold Glow (4 colors, not 8)
- Left accent bar: 3px wide (up from 2px), higher opacity
- Icon badge: animated pulsing glow ring (`@keyframes glowPulse`)
- Hover shadow: explosive accent-colored neon glow
- Bottom accent line: brighter, uses accent -> cyan gradient
- "Open" button: cyan text, cyan glow border on hover

### Welcome Header (`Dashboard.jsx`)
- Gold shimmer: gradient uses `#C49A20` -> `#F6C445` -> `#00C6FF` -> `#F6C445` -> `#C49A20`
- Date text: `#C8D1DA` (lighter than current)
- Primary button: Red gradient `#E53935` -> `#B3261E`, red glow shadow, white text
- Secondary button: Ninja Blue outline, cyan text, cyan glow on hover
- Add subtle radial glow behind entire header section (cyan, very low opacity)

### Buttons (global)
- Primary: `linear-gradient(135deg, #E53935, #B3261E)` with `0 0 16px rgba(229,57,53,0.3)` glow
- Outline: `border-color: rgba(0,198,255,0.3)`, `color: #00C6FF`, hover glow
- Ghost: `hover:bg-rgba(0,198,255,0.08)`

---

## Phase 3: Sidebar + Login + Global

### Sidebar (`Sidebar.jsx`)
- Background: `#0B0F14` (deepest dark)
- Active nav glow strip: cyan gradient (replacing gold)
- Active icon/text: `#00C6FF` (replacing gold)
- Hover bg: `rgba(0,198,255,0.05)` (replacing gold)
- Section divider (katana-line): cyan-blue gradient
- "DOJO" wordmark: use new gold `#F6C445` shimmer
- User initials badge: ninja blue gradient background

### Login Page
- Card border: `1px solid rgba(0,198,255,0.15)` with glow
- "Enter the Dojo" heading: gold shimmer (new palette)
- Button: Red CTA gradient
- "Begin Training" link: `#00C6FF`
- Subtle cyan radial glow behind the card

### Global Atmosphere
- Torch glow colors: shift from warm amber to cool blue-cyan radial
- Mist layer: shift from gold/amber mist to blue/cyan mist patches
- Ember field: shift from warm orange embers to electric blue/cyan sparks
- Rain + Lightning: keep as-is (already cool-toned)
- Katana lines everywhere: cyan gradient

---

## Files to Modify

### Core (Phase 1)
- `frontend/src/index.css` — all theme variables, shadows, textures, animations

### Dashboard (Phase 2)
- `frontend/src/components/KpiCard.jsx` — border, shadow, glow treatment
- `frontend/src/components/ToolCard.jsx` — accent colors, glow effects, hover states
- `frontend/src/pages/Dashboard.jsx` — button styles, header glow, section styling

### Global (Phase 3)
- `frontend/src/components/Sidebar.jsx` — active states, colors
- `frontend/src/components/MistLayer.jsx` — color shift to cool tones
- `frontend/src/components/TorchLight.jsx` — color shift to cool tones
- `frontend/src/components/EmberField.jsx` — color shift to electric sparks
- Login page component (if separate)

---

## Verification
1. Start dev server, screenshot each page
2. Compare brand colors PNG to implemented colors
3. Check all hover/focus states on cards and buttons
4. Verify rain/lightning still visible and layered correctly
5. Test mobile responsive (sidebar drawer, card grid)
6. Deploy to Vercel, test production
