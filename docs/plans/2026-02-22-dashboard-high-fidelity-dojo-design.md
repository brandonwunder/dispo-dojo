# Dashboard Redesign: High-Fidelity Dojo

**Date:** 2026-02-22
**Direction:** Double down on traditional Japanese dojo aesthetic, dramatically increase execution quality
**Scope:** Dashboard page, sidebar, header — full experience redesign

---

## Design Principles

- Replace flat CSS approximations with layered, realistic visual techniques
- Use multi-layer CSS gradients, inset shadows, and beveled edges for dimensional surfaces
- Keep pure CSS/React (no external image assets) but achieve dramatically higher fidelity
- Quality over quantity — fewer decorative elements, but each one executed at a premium level

---

## 1. Hero Banner

**Remove:** Three.js `DojoHallScene` component entirely (saves bundle size + load time)

**Replace with:** CSS-painted Japanese landscape silhouette
- Layered mountain ridge silhouettes using CSS gradients and clip-paths
- Torii gate silhouette in the midground
- Mist gradient layers drifting slowly across the landscape
- Ember particles still float upward over the scene

**Welcome text — centered vertically and horizontally:**
- "Welcome back, {name}-san" — large Onari calligraphy font, gold-shimmer effect
- Date underneath in smaller Rajdhani font
- Brush-stroke underline beneath the name
- Height: ~220px (slightly shorter than current 280px but more impactful)

---

## 2. Honor Wall — Stat Cards as Hanging Scrolls (Kakejiku)

**Remove:** Current flat wood-panel cards, metal corner brackets, idle sway animation

**Replace with:** Realistic hanging scroll panels

**Each scroll has:**
- **Top dowel:** Thick cylindrical wooden bar with realistic wood grain gradient, rounded finial ends with dark lacquer tips, subtle highlight stripe for 3D roundness
- **Rope ties:** Two short decorative cords from dowel ends, rendered with CSS gradients (twisted rope texture)
- **Parchment body:** Aged cream/tan background (#f5f0e6 → #e8dcc8 gradient) with subtle noise texture. Slightly narrower than the dowel.
- **Content layout:**
  - Kanji watermark large and centered (~8% opacity)
  - Stat number prominently centered, bold ink-brush style, CountUp animation
  - Label beneath in smaller calligraphy font
  - Hanko seal stamp in the bottom corner
- **Bottom dowel:** Matching wooden roller
- **Shadow:** Multi-layered realistic drop shadow suggesting hanging off wall
- **Hover:** Scroll lifts forward (scale 1.02, shadow deepens), rope sways slightly

**Layout:** 4-column grid with generous spacing. Section header: "Honor Wall" with brush-stroke divider above.

---

## 3. Weapon Wall — Tool Cards as Shoji Door Panels

**Remove:** Current WoodPanel tool cards with basic hover lift

**Replace with:** Shoji (sliding paper door) panels

**Each panel has:**
- **Frame:** Dark wooden frame (~8px) with realistic wood grain gradient, beveled edges with inset shadows. Not a thin CSS border — a substantial, dimensional frame.
- **Paper interior:** Warm translucent white/cream (rgba(245, 240, 230, 0.08)) with washi paper texture (CSS noise). Faint grid lines mimicking shoji lattice pattern.
- **Default state:** Ninja icon (large, centered) + tool name below. Description hidden. Warm backlight glow bleeding through the "paper" like a lantern behind a shoji door.
- **Hover state:** Shoji panel slides open to the right (translateX), revealing description text and an "Enter" prompt behind it, with warm golden light flooding through. This is the signature interaction.
- **Section header:** "Training Grounds" with horizontal katana-line divider

**Layout:** 3-column grid with generous spacing. Panels slightly taller than current cards to accommodate shoji proportions.

---

## 4. Sidebar Redesign

**Remove:** Circular "twin-letter" logo image, rope dividers

**Replace:**
- **Logo area:** Clean text wordmark — "DOJO" in Onari calligraphy font, gold-shimmer, small and elegant
- **Background:** Deep lacquered wood — richer, darker gradient (#0a0806 → #12100c) with subtle vertical grain pattern. Polished lacquer surface feel, not flat brown.
- **Navigation items:**
  - Small (20px) ninja icon for each page alongside text label
  - **Active state:** Warm glowing ember strip on left edge (not just a border — a radiating glow line), text turns gold, subtle golden light leak behind icon
  - **Hover:** Smooth slide-right motion, increased distance
- **Section dividers:** Thin katana-line gradients (transparent → gold → transparent) instead of rope
- **Bottom area:** User info — small hanko seal with initials + name, clean and minimal

---

## 5. Header Bar Redesign

**Changes:**
- **Page title centered** in the header with kanji watermark floating behind it. Large Onari font, brush-underline effect.
- **Left side:** Subtle breadcrumb in dim text (e.g., "Lead Generation > Agent Finder")
- **Right side:** Refined hanko seal — deeper red gradient, more realistic stamp texture with slight irregular edges (real hanko stamps aren't perfectly circular)
- **Bottom border:** Thinner, more refined gold-shimmer animated line
- **Background:** Slightly darker with horizontal highlight stripe (polished lacquer light reflection)

---

## 6. Atmospheric & Global Polish

- **Torch lights:** Repositioned as if mounted on the "wall" — flanking the hero banner. Warm orange glow pools that illuminate scrolls below. Flicker animation stays.
- **Embers:** Reduced count (20 vs 25-30) but higher individual quality — larger glow radius, warmer color, more natural float paths.
- **Mist:** All patches locked to warm tones (amber/gold tints only). No cool-toned drift.
- **Page background:** Very subtle dark texture on #06060f — aged plaster or dark stone feel. Enough to feel like a surface, not a flat color.
- **Scroll-to-reveal:** Sections fade in with slight upward motion as they enter viewport (Framer Motion whileInView). Scrolls gently "unroll" on appear.
- **Typography:** Increased font weight contrast (headings bolder, body lighter). Tighter letter-spacing on Onari display font.

---

## Files Affected

| File | Changes |
|------|---------|
| `Dashboard.jsx` | Complete restructure — new hero, scroll stats, shoji tool cards |
| `StatCard.jsx` | Rewrite as HangingScroll component |
| `ScrollCard.jsx` | May be removed or repurposed |
| `WoodPanel.jsx` | Refactored for shoji frame variant |
| `Sidebar.jsx` | Remove logo, new lacquer styling, katana dividers |
| `Header.jsx` | Center title, add breadcrumb, refine seal |
| `index.css` | New utility classes, textures, animations |
| `DojoHallScene.jsx` | Removed (no longer needed) |
| `MistLayer.jsx` | Warm-tone lock |
| `EmberField.jsx` | Reduced count, improved quality |
| `TorchLight.jsx` | Repositioned |
| `Layout.jsx` | Minor adjustments for new atmospheric positioning |
