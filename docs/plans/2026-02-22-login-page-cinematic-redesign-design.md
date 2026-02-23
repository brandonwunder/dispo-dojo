# Login Page Cinematic Redesign — Design Document

**Date:** 2026-02-22
**Status:** Approved
**Approach:** Photo-First Cinematic (no Three.js)

---

## Summary

Replace the Three.js torii gate scene with a composited 2D layer stack built on the existing photorealistic background image. Add a cinematic zoom-in entrance animation and redesign the login card + sign-up modal using glassmorphism with the dashboard's design language (cyan glow, elevation shadows, gold accents).

---

## Scene Architecture (Layer Stack)

All layers are full-viewport, absolutely positioned.

| Z-Index | Layer | Description |
|---------|-------|-------------|
| z-0 | Background photo (`login-bg.png`) | CSS transform: `scale(1.15)` → `scale(1.0)` over 3.5s. Filter: `blur(4px)` → `blur(0)`. Easing: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| z-1 | Vignette overlay | Radial gradient: transparent center → `rgba(11,15,20,0.85)` edges. Static. |
| z-2 | Rain canvas | Reuse `RainEffect` component. Reduce particle count to 150 (login is calmer). No lightning. |
| z-3 | Fog/mist layer | 3 radial gradient blobs (ninja-blue, cyan, steel-blue). Start at opacity 0.6, thin to 0.15 as zoom completes. Gentle 40s drift loop. |
| z-4 | Lantern glow accents | 2-3 warm radial gradients at lantern positions. Color: `rgba(255,154,60,0.12)` pulsing to 0.18. 4s cycle. Start dim, intensify after zoom. |
| z-10 | Login card container | Fade-in (opacity 0→1) + slide up (translateY 30→0). 600ms, starts at 2s delay. Spring easing via Framer Motion. |

---

## Login Card Design

### Container
- `backdrop-filter: blur(20px) saturate(1.2)`
- Background: `rgba(17, 27, 36, 0.75)`
- Border: `1px solid rgba(0, 198, 255, 0.12)`
- Border-radius: `12px`
- Shadow: elevation-2 system
- Max-width: `420px`, centered
- Padding: `40px 36px`

### Top Accent Line
- 1px height, full width at card top
- `linear-gradient(90deg, transparent, #00C6FF, transparent)` at 30% opacity

### Logo & Heading
- Logo: centered, 64px height, gold drop-shadow glow
- "Enter the Dojo": Onari font, gold shimmer animation
- Subtitle: DM Sans, `#C8D1DA`

### Input Fields
- Background: `rgba(11, 15, 20, 0.6)`
- Border: `1px solid rgba(0, 198, 255, 0.1)`
- Focus: border `rgba(0, 198, 255, 0.4)` + `box-shadow: 0 0 12px rgba(0, 198, 255, 0.15)`
- Placeholder: `#C8D1DA` at 40% opacity
- Label: Rajdhani, 11px, uppercase, tracking-wider, `#C8D1DA`
- Border-radius: `8px`
- Padding: `14px 16px`

### CTA Button
- Full width, height `48px`
- Gradient: `#E53935` → `#B3261E`
- Rajdhani font, uppercase, tracking-widest, weight 600
- Hover: lift -2px, red glow shadow
- Active: scale 0.98
- Border-radius: `8px`

### Secondary Links
- "New to the dojo?" in `#C8D1DA`
- "Sign up for free" in `#00C6FF` with hover glow + underline

---

## Sign-Up Modal Design

### Overlay
- `rgba(11, 15, 20, 0.7)` + `backdrop-filter: blur(8px)`

### Modal Card
- Same glassmorphism as login card
- Background: `rgba(17, 27, 36, 0.8)` (slightly more opaque)
- Max-width: `480px`
- Same border, shadow, top accent line

### Step Indicator
- Two dots + connecting katana-line gradient
- Active: `#00C6FF` + `box-shadow: 0 0 8px rgba(0,198,255,0.4)`
- Inactive: `rgba(200, 209, 218, 0.3)`

### Steps
- Step 1: First name, last name, phone
- Step 2: Email, password

### Inputs
- Identical to login card inputs

### Buttons
- "Continue" / "Create Account": Red CTA gradient (same as login)
- "Back": Ghost outline, `border: 1px solid rgba(0,198,255,0.2)`, Rajdhani uppercase

### Step Transition
- Framer Motion AnimatePresence
- Current step slides out left, next slides in from right
- 300ms duration

---

## Entrance Choreography

```
0.0s    Page loads
        - Photo visible at scale(1.15) + blur(4px)
        - Rain begins immediately (subtle)
        - Fog layers at full density (opacity 0.6)

0.0-3.5s  Zoom-in animation
        - Photo: scale 1.15 → 1.0, blur 4px → 0
        - Fog: opacity 0.6 → 0.15
        - Lanterns: dim → bright pulse begins

2.0s    Login card entrance begins
        - Opacity 0 → 1, translateY 30 → 0
        - Logo first, then heading, then fields stagger in
        - Total card entrance: ~800ms

3.5s    Scene fully settled
        - Rain continues, lanterns pulse, fog drifts
        - Everything alive but calm
```

---

## Files Modified

| File | Change |
|------|--------|
| `frontend/src/pages/Login.jsx` | Major rewrite: remove DojoGateScene import, new layer stack, glassmorphism card, sign-up modal redesign, entrance animation |
| `frontend/src/index.css` | Add glassmorphism card utilities if needed |

No new component files. Reuse existing `RainEffect`. `DojoGateScene.jsx` left untouched (still used by dashboard if needed).

---

## Design Decisions

1. **Remove Three.js from login** — The photorealistic background image carries all the realism. Three.js primitives (cylinders, boxes) clash with the photo's quality. CSS/canvas layers are lighter and more maintainable.
2. **Glassmorphism card** — Matches dashboard's elevated, glowing design language. Semi-transparency lets the scene breathe through, integrating the card with the environment.
3. **2s card delay** — The zoom-in is the hero moment. Letting the scene establish before showing the form creates anticipation and avoids visual overload.
4. **No lightning on login** — Rain is atmospheric and calming. Lightning would be jarring for a first-time visitor.
5. **Consistent input/button styling** — Same patterns as dashboard (cyan focus glow, red CTA gradient, Rajdhani labels) for brand cohesion.
