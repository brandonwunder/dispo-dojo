# Ninja Profile Page Revamp — Design Document

**Date:** 2026-02-25
**Status:** Approved
**Scope:** Full page redesign of `/ninja-profile` with premium baseball card hero

---

## Decisions

| Decision | Choice |
|----------|--------|
| Image source | Pre-made AI asset library (8 images, user-generated with free AI tools) |
| Card style | Premium baseball/trading card (Topps Chrome / Prizm aesthetic) |
| Base styles | 8 styles, one per rank (Initiate → Kage) |
| Page scope | Full revamp — all sections redesigned |
| Architecture | Card-Centric Page — card is the hero, everything orbits it |
| Cost | Zero runtime API cost |
| Armory section | Removed (rank determines card image automatically) |
| FAQ section | Removed (move essential info to tooltips or help page) |

---

## 1. The Ninja Card (Hero Component)

### Dimensions
- Aspect ratio: 2.5:3.5 (standard trading card)
- Max width: 320px desktop, min 260px mobile
- Centered at top of page with ambient glow behind (rank-colored)

### Layering (front to back)

```
┌─────────────────────────────────┐
│ ░░░ HOLOGRAPHIC BORDER ░░░░░░░ │  ← Animated conic-gradient (4px)
│ ┌─────────────────────────────┐ │     shifts hue on mousemove
│ │                             │ │
│ │    AI NINJA PORTRAIT        │ │  ← Pre-made PNG, full bleed
│ │    (rank-specific image)    │ │     with bottom gradient fade
│ │                             │ │
│ │  ┌──────┐                   │ │  ← Rank badge (top-left)
│ │  │ KAGE │                   │ │     foil-stamped, glow effect
│ │  └──────┘                   │ │
│ │                             │ │
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ │  ← Bottom gradient overlay
│ │ NINJA NAME                  │ │     (transparent → black)
│ │ @username · Dallas, TX      │ │
│ ├─────────────────────────────┤ │
│ │ UW: 12 │ LOI: 8 │ DEALS: 5 │ │  ← Stat bar (compact)
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Effects

| Effect | Implementation |
|--------|---------------|
| **Holographic border** | 4px animated `conic-gradient` that shifts based on mouse position. Colors cycle: cyan → gold → purple → red → cyan. Mobile: auto-animates slowly. |
| **3D tilt** | CSS `perspective(1000px)` + `rotateX/Y` on mousemove. Max tilt: 15deg. Spring easing on mouseout to return to flat. |
| **Foil stamp rank badge** | Top-left badge with metallic gradient fill, shifts with holographic border. Rank-specific color (gold=Kage, cyan=Scout, red=Jonin, etc.). |
| **Shine sweep** | Diagonal white highlight sweeps across card on hover (pseudo-element with animated translateX). |
| **Bottom gradient** | Image fades to near-black at bottom 30%. Text sits on top for readability. |

### Card Back (Flip)
- Triggered by click or "Flip Card" button
- CSS 3D transform (`rotateY(180deg)`) with `backface-visibility: hidden`
- Back shows: extended stats, bio text, earned badges grid, community rank
- Same holographic border treatment as front

### Typography (on card)

| Element | Font | Size | Color |
|---------|------|------|-------|
| Name | Rajdhani Bold | 20px | #F4F7FA (white) |
| Username/location | DM Sans Regular | 12px | #C8D1DA (text-dim) |
| Stats | Rajdhani Semibold | 14px | #00C6FF (cyan) or rank color |
| Rank badge | Rajdhani Bold | 11px uppercase | Metallic gradient |

---

## 2. Pre-Made Ninja Images (8 Rank Styles)

Each rank gets a unique, AI-generated ninja portrait. Images stored in `frontend/public/avatars/`.

| Rank | Style Name | Visual Direction | Prompt Keywords |
|------|-----------|-----------------|----------------|
| 1. Initiate | Training Ninja | Simple white gi, basic stance, clean background | "young ninja trainee, white uniform, humble stance, dark dojo background, anime-inspired, high detail" |
| 2. Scout | Recon Ninja | Hood, observant pose, binoculars/scope detail | "ninja scout, hooded, crouching on rooftop, cyan accents, night cityscape, reconnaissance gear" |
| 3. Shinobi | Shadow Ninja | Dark outfit, stealthy, smoke wisps | "shadow ninja, all black, crouching in darkness, purple smoke wisps, mysterious, stealth pose" |
| 4. Shadow | Phantom Ninja | Partially transparent/ethereal, mist | "phantom ninja, semi-transparent, dissolving into shadow mist, glowing eyes, eerie, spectral" |
| 5. Blade | Sword Ninja | Katana drawn, battle-ready, fierce | "sword master ninja, katana drawn, battle stance, cyan blade glow, wind effects, fierce expression" |
| 6. Jonin | Elite Ninja | Armored, tactical, commanding | "elite jonin ninja, red armor accents, tactical gear, arms crossed, powerful stance, war veteran" |
| 7. Shadow Master | Dark Sensei | Flowing robes, dark aura, wisdom | "dark sensei, flowing black robes, dark purple aura, commanding presence, ancient power, sensei pose" |
| 8. Kage | Legendary Kage | Gold accents, godlike, radiant | "legendary kage, gold and black armor, radiant golden aura, throne or mountaintop, godlike presence, ultimate power" |

### Image Requirements
- **Resolution:** 640×896px minimum (2.5:3.5 ratio)
- **Format:** WebP preferred (PNG fallback)
- **Style consistency:** All images should share a cohesive art style (recommend: semi-realistic anime, dark background, dramatic lighting)
- **Background:** Dark/transparent-friendly (card will overlay on dark surface)
- **File naming:** `rank-1-initiate.webp` through `rank-8-kage.webp`
- **Storage path:** `frontend/public/avatars/`

### Fallback
- Until real images are added, use gradient silhouettes with rank-colored glow
- SVG silhouette placeholder auto-generated per rank color

---

## 3. Page Layout

### Overall Structure
Single-column, centered, max-width 720px. Card is the hero. Sections below in consistent dark glass cards.

```
┌──────────────────────────────────────────────────┐
│              NINJA CARD (centered)                │
│              + ambient glow behind                │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ THE PATH ──────────────────────────────────┐ │
│  │  Horizontal rank timeline                   │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ MISSION LOG ───────────────────────────────┐ │
│  │  2×3 stat card grid                         │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ TROPHY WALL ──────────────────────────────┐ │
│  │  Badge grid with locked/unlocked states     │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ HUNTING GROUNDS ──────────────────────────┐ │
│  │  Market info, buy box (conditional)         │ │
│  └─────────────────────────────────────────────┘ │
│                                                  │
│  ┌─ INTEL FILE (own profile only) ────────────┐ │
│  │  Contact info, notification prefs           │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Section Card Styling (all sections)
```css
background: linear-gradient(135deg, rgba(17,27,36,0.85) 0%, rgba(11,15,20,0.92) 100%);
border: 1px solid rgba(246,196,69,0.08);
border-radius: 12px;
box-shadow: 0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(0,198,255,0.06);
padding: 24px;
margin-bottom: 24px;
```

### Section Headers
- Font: Rajdhani Bold, 14px, uppercase, tracking-widest
- Color: #C8D1DA at 50% opacity
- Left-aligned with a small rank-colored accent bar (3px × 16px) to the left

---

## 4. Section Details

### 4a. The Path (Rank Progression)
- Horizontal timeline with 8 circular nodes connected by a gradient line
- **Current rank:** Large node (48px), glowing border, card thumbnail visible inside
- **Past ranks:** Medium node (32px), check mark overlay, muted color
- **Future ranks:** Medium node (32px), locked icon, grayscale, "?" overlay
- Progress bar: filled gradient (left=cyan, right=gold) up to current rank, gray after
- Click past rank: shows mini card preview in a tooltip/popover
- Mobile: scrollable horizontal with snap points

### 4b. Mission Log (Stats)
- 2×3 grid on desktop, 1-column stack on mobile
- Each stat card:
  - Dark glass background
  - Lucide icon (top, 20px, rank-colored at 60% opacity)
  - Number (Rajdhani Bold, 32px, #00C6FF)
  - Label (DM Sans, 12px, #C8D1DA at 60%)
  - Hover: translateY(-2px), shadow increase
- Stats displayed: Underwrites, LOIs, Contracts, Deals Closed, Messages, Bird Dog Leads

### 4c. Trophy Wall (Badges)
- Grid: 4-5 badges per row (desktop), 3 per row (mobile)
- **Earned:** Full color, subtle glow matching badge category color
- **Locked:** Grayscale, 40% opacity, small lock icon overlay
- Hover earned: scale(1.1), tooltip with badge name + description
- Hover locked: tooltip with "Unlock by: [criteria]"
- Deal badges and Community badges shown together, sorted by rarity (rarest first)

### 4d. Hunting Grounds
- Simple key-value card layout
- Only visible if user has market/buy box data
- Fields: Market, Target Property Types, Buy Box criteria
- Clean typography, no visual frills

### 4e. Intel File (Own Profile Only)
- Contact info (email, phone) in editable fields
- Notification preferences as toggle switches (cyan when active)
- Role badge (admin/member)
- Compact layout — this is utility, not showcase

---

## 5. Edit Mode

- Pencil icon in the top-right corner of each editable section
- Clicking pencil expands inline edit fields within the section
- Save (green) and Cancel (gray) buttons appear in section header
- Edit targets:
  - **Card/Identity:** Name, username, bio, market (edits apply to card display)
  - **Hunting Grounds:** Buy box, target properties
  - **Intel File:** Contact info, notification prefs
- Avatar image is NOT editable — it's determined by rank

---

## 6. Removed Sections

| Section | Reason | Migration |
|---------|--------|-----------|
| The Armory | Avatar is now rank-based image, no SVG customization | Replaced by rank timeline in "The Path" |
| FAQ | Clutters profile page | Move essential items to tooltips on relevant sections, or to a standalone help page |

---

## 7. Reusable Card Component

The `NinjaCard` component should be designed for reuse across the app:

| Context | Size | Features |
|---------|------|----------|
| Profile page (hero) | 320px wide | Full effects: 3D tilt, holographic border, flip, stats |
| Community member list | 48px thumbnail | Just the image in a small frame, rank-colored border |
| Message thread avatar | 36px circle | Circular crop of card image, subtle glow |
| Leaderboard row | 64px | Small card with name + rank, no flip |

---

## 8. AI Image Generation Prompts

### Universal Style Prefix
Use this prefix for ALL 8 images to ensure visual consistency:

> "Digital illustration, semi-realistic anime style, dramatic cinematic lighting, dark moody background, single ninja character, upper body portrait, facing slightly left, high detail, 4K quality, dark atmospheric, no text, no watermark"

### Per-Rank Suffixes (append to prefix)

1. **Initiate:** "young ninja student, simple white training gi, humble expression, basic white headband, clean wooden dojo background, soft warm lighting"
2. **Scout:** "ninja scout, dark blue hooded cloak, alert eyes, crouching pose, nighttime rooftop setting, cyan moonlight accents, urban backdrop"
3. **Shinobi:** "shadow ninja, all-black tactical outfit, face mask, stealthy crouching pose, purple smoke tendrils, moonlit forest background"
4. **Shadow:** "phantom ninja, ethereal semi-transparent body, dissolving into dark mist, glowing cyan eyes piercing through shadow, otherworldly presence"
5. **Blade:** "master swordsman ninja, katana drawn with glowing cyan edge, battle-ready stance, wind-swept hair/cloth, sparks and energy effects"
6. **Jonin:** "elite jonin commander, red-accented tactical armor over black, arms crossed, battle-scarred, commanding presence, war camp background"
7. **Shadow Master:** "dark sensei figure, flowing black and purple robes, radiating dark purple aura, ancient wisdom in eyes, temple setting, mystical energy"
8. **Kage:** "legendary kage leader, ornate gold and black ceremonial armor, radiant golden aura and particles, mountaintop throne, godlike presence, peak power"

### Recommended Free Tools
- **Leonardo.ai** (free tier: 150 tokens/day) — best style consistency
- **Bing Image Creator** (free, uses DALL-E 3) — highest quality per generation
- **Playground AI** (free tier) — good for iteration
- **Ideogram.ai** (free tier) — strong with specific styles

### Quality Checklist Per Image
- [ ] Dark background (works on #0B0F14 page bg)
- [ ] Character is centered, upper body visible
- [ ] Consistent art style with other rank images
- [ ] No text or watermarks in the image
- [ ] Resolution ≥ 640×896px
- [ ] Faces roughly similar direction (slight left)
- [ ] Dramatic lighting present

---

## 9. Technical Notes

### Dependencies
- **Existing:** React 19, Framer Motion, Tailwind CSS v4, Lucide icons
- **New:** None. All effects are CSS-only (conic-gradient, perspective, transform, backdrop-filter)
- **Removed:** The 575-line `NinjaAvatar.jsx` SVG component is replaced by `NinjaCard.jsx`

### Files to Create
- `frontend/src/components/NinjaCard.jsx` — Reusable card component
- `frontend/public/avatars/` — 8 rank images + placeholder silhouettes

### Files to Modify
- `frontend/src/pages/NinjaProfile.jsx` — Full rewrite of page layout
- `frontend/src/lib/userProfile.js` — Remove SVG-specific avatar config, keep rank logic

### Files to Deprecate
- `frontend/src/components/NinjaAvatar.jsx` — Replaced by NinjaCard
- Avatar customization logic in NinjaProfile (armory section)

### Performance
- Images: lazy-loaded with `loading="lazy"`, WebP with PNG fallback
- 3D tilt: uses `requestAnimationFrame` for smooth mousemove tracking
- Holographic border: single CSS animation, GPU-accelerated (transform + opacity only)
- Card flip: CSS 3D transform, no JS animation library needed
