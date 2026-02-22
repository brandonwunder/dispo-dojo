# Premium UI Overhaul — Design Document

**Date:** 2026-02-22
**Style:** Luxury Dark SaaS (Linear/Raycast/Vercel inspired)
**Scope:** Single-file frontend overhaul (`templates/index.html`) + bug fixes

---

## Bug Fixes (bundled in)

1. **Total/Remaining counters** — Add "Total" and "Remaining" stat cards to the progress section so users see `42 / 3,000` progress and `2,958 remaining` at a glance.
2. **Concurrent uploads** — `goHome()` re-shows the upload drop zone so users can start a second job while one is running. Backend already supports this.

---

## CDN Dependencies

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest"></script>
```

No npm, no build tools. Three `<script>` tags in `<head>`.

---

## Visual Systems

### Background & Atmosphere
- **Animated gradient mesh**: 3 radial gradients (gold, deep purple, dark blue) orbiting on a 20s CSS `@keyframes` loop
- **Noise overlay**: existing SVG noise texture at 0.02 opacity
- **Floating particles**: ~15 tiny gold dots drifting via GSAP timeline, absolute-positioned behind content

### Glassmorphism Cards
- All cards: `backdrop-filter: blur(12px); background: rgba(26,26,34,0.6); border: 1px solid rgba(201,169,110,0.1)`
- Applies to: drop zone, stat cards, active job cards, history items, modal

### Color Palette (refined, not changed)
- Keep existing `--gold`, `--bg`, `--bg-elevated`, `--bg-card` vars
- Add `--glass: rgba(26,26,34,0.6)` and `--glass-border: rgba(201,169,110,0.1)`

---

## Component Designs

### Nav Bar
- Glass: `backdrop-filter: blur(20px); background: rgba(11,11,15,0.7)`
- Running job pills get pulsing gold border
- Smooth height transition when pills appear/disappear

### Drop Zone
- Glass card with border glow on hover
- GSAP spring scale on hover (1.0 → 1.015)
- On file drop: icon morphs (upload arrow → checkmark via GSAP)
- **Concurrent fix**: `goHome()` re-shows drop zone

### Progress Section — 6 Stat Cards
| Card | Icon (Lucide) | Color |
|------|--------------|-------|
| Found | check-circle | green |
| Partial | alert-triangle | yellow |
| Cached | database | blue |
| Not Found | x-circle | red |
| **Total** | list | text-dim |
| **Remaining** | hourglass | gold |

- GSAP count-up animation when values change
- Progress bar: animated gradient sweep with glow trail
- Current address: fade-swap animation on change

### Results Section
- Success rate: animated SVG donut/ring chart (gold arc fills via GSAP)
- Table rows: stagger entrance (`opacity: 0, y: 12`, stagger 0.03s)
- Glass-style header row, hover glow on data rows

### History Section
- Cards stagger-slide from right via GSAP on load
- Delete: card slides out left + fades
- Resume button: subtle pulse to draw attention
- Download button: gold shimmer sweep on hover

### Delete Modal
- Backdrop blur + fade in
- Modal scales 0.95 → 1.0 with GSAP
- Button hover glow effects

### Buttons (global)
- **Gold**: CSS shimmer sweep on hover (diagonal light streak)
- **Outline**: border glow on hover
- **Danger**: red glow on hover
- All: `translateY(-1px)` lift on hover

---

## GSAP Page Load Timeline

```
0.0s  — Nav bar fades in from top
0.2s  — Logo scales in with elastic overshoot
0.4s  — Tagline fades up
0.5s  — Drop zone fades up
0.7s  — History items stagger in from right
```

---

## Files Changed

| File | Change |
|------|--------|
| `templates/index.html` | Full CSS + JS overhaul (same HTML structure, elevated visuals + animations) |
| `app.py` | No changes — concurrent uploads already supported |

---

## What Stays the Same
- Single HTML file architecture (no build step)
- FastAPI backend (unchanged)
- Dark/gold color scheme (refined)
- All existing functionality (upload, progress, results, history, delete, resume, nav)
- Logo with floating animation
- ETA time remaining calculation
