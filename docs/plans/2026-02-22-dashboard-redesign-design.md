# Dashboard Redesign — Design Document
**Date:** 2026-02-22
**Approach:** Option A — Clean Slate Rebuild

## Goal
Replace the current novelty-themed dashboard (hanging scrolls, ink landscape, shoji panels) with a premium modern SaaS layout that retains the Dispo Dojo theme through color, typography, and subtle texture — not literal props.

## Reference
- `Dashboard Example.png` in project root
- Match layout: welcome header → 3 KPI cards → 2-column tool grid

## Design Decisions
- **3 KPIs** (Active Deals, Pipeline Value, Deals Closed) — matching reference
- **No chart/tasks/activity sections** — match reference only
- **shadcn/ui** for Card, Button primitives — override with dojo theme tokens
- **lucide-react** icons for tool cards (replacing custom ninja SVGs)
- **Framer Motion** for micro-interactions (existing dep)
- **react-countup** for KPI number animations (existing dep)

## Layout Structure

### 1. Welcome Header
- Heading: Onari display font, ~36px, gold shimmer
- Date: DM Sans, 14px, muted text
- Primary CTA: "Submit a Deal" — solid gold, glow on hover
- Secondary CTA: "View Dispo Pipeline" — ghost outline, gold text
- Framer Motion fade-in (opacity + y translate)

### 2. KPI Row (3 cards)
- Grid: 3-col desktop, 1-col mobile
- shadcn Card, bg #0d0d1a, 1px gold-tinted border
- Big number: Rajdhani, ~40px, bold, white
- Label: DM Sans, 13px uppercase, muted
- Delta: 12px, green/red indicator
- Hover: lift 2px + border brightens
- CountUp on mount, stagger fade-in

### 3. Tools to Succeed (8 tool cards)
- Section title: Onari, ~20px, muted gold, centered with katana-line dividers
- Grid: 2-col desktop, 1-col mobile
- Each card: icon (lucide, 24px, gold) + title + description + "Open" button
- Layout: flex row, content left, button right
- Hover: lift + border brighten
- Click navigates to tool route
- Stagger fade-in

## Theme Token Overrides (shadcn → dojo)
```
--background: #06060f
--card: #0d0d1a
--primary: #d4a853
--primary-foreground: #06060f
--muted-foreground: #8a8578
--border: rgba(212,168,83,0.12)
--radius: 12px
```

## Shadow System
```
cards: 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)
hover: 0 2px 4px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.25)
```

## Files to Change
| File | Action |
|------|--------|
| `src/pages/Dashboard.jsx` | Full rewrite |
| `src/components/KpiCard.jsx` | New — shadcn Card wrapper |
| `src/components/ToolCard.jsx` | New — shadcn Card wrapper |
| `src/index.css` | Remap shadcn CSS variables to dojo palette |

## Files NOT Changed
- Sidebar, Header, Layout — untouched
- All other pages — untouched
- Existing components (HangingScroll, ShojiPanel, InkLandscape) — kept in codebase, just not used by Dashboard

## Responsive Behavior
- Desktop (≥1024px): KPIs 3-col, tools 2-col
- Tablet (≥768px): KPIs 3-col, tools 2-col
- Mobile (<768px): KPIs 1-col stacked, tools 1-col stacked

## Micro-interactions
- Card hover: translateY(-2px), border opacity increase, 200ms ease
- Primary button: gold glow shadow on hover
- Section reveal: fadeUp with stagger (Framer Motion)
- KPI numbers: CountUp from 0 on viewport entry
