# The Grand Dojo - Full Site Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign every page of Dispo Dojo as a unique room in a feudal Japanese dojo compound with bold 3D animations, wood textures, custom brush-stroke SVG icons, per-page ninja logo variants, and immersive atmospheric effects.

**Architecture:** Theme-first approach. Build the new design system (colors, textures, cards, icons, sidebar) first, then redesign each page one at a time. Shared atmosphere components (torchlight, embers, wood textures) are built as reusable primitives. 3D Three.js scenes are isolated per-page and lazy-loaded. All existing functionality is preserved — only visuals change.

**Tech Stack:** React 19, Vite 7, Tailwind CSS 4, Three.js, GSAP + @gsap/react, Framer Motion 12, Lenis, Lucide React (being replaced by custom SVGs), React CountUp

---

## Phase 1: Design System Foundation

### Task 1: Update Color Palette & Theme Variables

**Files:**
- Modify: `frontend/src/index.css` (lines 11-52, @theme section)

**Step 1: Replace the @theme block with the new Grand Dojo palette**

Replace the entire `@theme { ... }` block (lines 11-52) with:

```css
@theme {
  /* === BASE COLORS === */
  --color-bg: #06060f;
  --color-bg-elevated: #0d0d1a;
  --color-bg-card: #1a1510;
  --color-bg-card-hover: #231c14;
  --color-glass: rgba(26, 21, 16, 0.85);
  --color-glass-hover: rgba(35, 28, 20, 0.9);

  /* === GOLD (metallic gradient via classes, base for singles) === */
  --color-gold: #d4a853;
  --color-gold-dim: #a67c2e;
  --color-gold-bright: #f5d078;
  --color-gold-shimmer: #fce8a8;

  /* === CRIMSON === */
  --color-crimson: #8b0000;
  --color-crimson-bright: #a83232;
  --color-crimson-glow: rgba(139, 0, 0, 0.4);

  /* === ACCENT COLORS === */
  --color-steel: #4a6fa5;
  --color-bamboo: #4a7c59;
  --color-ember: #e8652e;
  --color-torch: #ff9a3c;

  /* === TEXT === */
  --color-ink: #1a1a2e;
  --color-parchment: #f5f0e6;
  --color-text-primary: #ede9e3;
  --color-text-dim: #8a8578;
  --color-text-gold: #d4a853;

  /* === STATUS === */
  --color-status-success: #4a7c59;
  --color-status-warning: #d4a853;
  --color-status-danger: #8b0000;
  --color-status-info: #4a6fa5;

  /* === FONTS === */
  --font-display: 'Onari', serif;
  --font-heading: 'Rajdhani', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Step 2: Add wood texture, torch glow, metal bracket, and rope utility classes**

After the existing `.katana-line` class (~line 136), add these new utility classes:

```css
/* === WOOD TEXTURES === */
.wood-panel {
  background-color: #1a1510;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.15 0.02' numOctaves='4' seed='2'/%3E%3CfeColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.06 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

.wood-panel-dark {
  background-color: #110e0a;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.12 0.015' numOctaves='5' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.07 0 0 0 0 0.05 0 0 0 0 0.04 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

.wood-panel-light {
  background-color: #2a2118;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.13 0.018' numOctaves='4' seed='12'/%3E%3CfeColorMatrix values='0 0 0 0 0.16 0 0 0 0 0.12 0 0 0 0 0.09 0 0 0 0.45 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

/* === TORCH GLOW === */
.torch-glow {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(circle, rgba(255, 154, 60, 0.08) 0%, rgba(255, 154, 60, 0.02) 40%, transparent 70%);
  animation: torchFlicker 3s ease-in-out infinite alternate;
}

@keyframes torchFlicker {
  0% { opacity: 0.6; transform: scale(1); }
  25% { opacity: 0.8; transform: scale(1.02); }
  50% { opacity: 0.5; transform: scale(0.98); }
  75% { opacity: 0.9; transform: scale(1.03); }
  100% { opacity: 0.7; transform: scale(1); }
}

/* === METAL BRACKETS === */
.metal-bracket {
  position: absolute;
  width: 20px;
  height: 20px;
  border-color: var(--color-gold-dim);
  opacity: 0.6;
}
.metal-bracket.top-left { top: 0; left: 0; border-top: 2px solid; border-left: 2px solid; }
.metal-bracket.top-right { top: 0; right: 0; border-top: 2px solid; border-right: 2px solid; }
.metal-bracket.bottom-left { bottom: 0; left: 0; border-bottom: 2px solid; border-left: 2px solid; }
.metal-bracket.bottom-right { bottom: 0; right: 0; border-bottom: 2px solid; border-right: 2px solid; }

/* === GOLD SHIMMER === */
.gold-shimmer {
  background: linear-gradient(135deg, var(--color-gold-bright), var(--color-gold), var(--color-gold-dim));
  background-size: 200% 200%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gold-shimmer-text {
  background: linear-gradient(135deg, var(--color-gold-bright), var(--color-gold), var(--color-gold-dim));
  background-size: 200% 200%;
  animation: shimmer 3s ease-in-out infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* === ROPE BINDING === */
.rope-top {
  position: relative;
}
.rope-top::before {
  content: '';
  position: absolute;
  top: 0; left: 10%; right: 10%;
  height: 3px;
  background: repeating-linear-gradient(90deg, #8b7355 0px, #6b5a42 4px, #a08968 8px);
  border-radius: 2px;
  opacity: 0.5;
}

/* === LACQUERED HEADER BAR === */
.lacquer-bar {
  background: linear-gradient(180deg, #1a1510 0%, #0f0c08 50%, #1a1510 100%);
  border-bottom: 1px solid rgba(212, 168, 83, 0.2);
}

/* === EMBER FLOAT === */
@keyframes emberFloat {
  0% { transform: translateY(0) translateX(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
}

/* === INK WASH BACKGROUND === */
.ink-wash {
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='i'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='3' seed='5'/%3E%3CfeColorMatrix values='0 0 0 0 0.03 0 0 0 0 0.03 0 0 0 0 0.06 0 0 0 0.3 0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23i)'/%3E%3C/svg%3E");
  background-size: 400px 400px;
}

/* === STONE TEXTURE === */
.stone-texture {
  background-color: #0a0a14;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='s'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.05' numOctaves='3' seed='9'/%3E%3CfeColorMatrix values='0 0 0 0 0.06 0 0 0 0 0.06 0 0 0 0 0.08 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23s)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}

/* === PARCHMENT TEXTURE === */
.parchment-texture {
  background-color: #f5f0e6;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.4' numOctaves='4' seed='3'/%3E%3CfeColorMatrix values='0 0 0 0 0.92 0 0 0 0 0.89 0 0 0 0 0.84 0 0 0 0.15 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23p)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  color: var(--color-ink);
}

/* === HANGING SCROLL === */
.scroll-card {
  position: relative;
  border-radius: 2px;
}
.scroll-card::before,
.scroll-card::after {
  content: '';
  display: block;
  height: 8px;
  background: linear-gradient(180deg, #2a2118 0%, #1a1510 40%, #0f0c08 100%);
  border-radius: 4px;
  margin: 0 -4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
```

**Step 3: Run dev server to verify styles compile**

Run: `cd frontend && npm run dev`
Expected: No CSS compilation errors, dev server starts on port 3000

**Step 4: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: overhaul theme with Grand Dojo color palette, wood textures, torch glow, metal brackets, and utility classes"
```

---

### Task 2: Create Custom Brush-Stroke SVG Icon Set

**Files:**
- Create: `frontend/src/components/icons/index.jsx`

**Step 1: Create the icon components file**

Create `frontend/src/components/icons/index.jsx` with all 15+ custom SVG icons. Each icon:
- Is a React component accepting `size` (default 48), `className`, and `animate` (boolean) props
- Uses bold brush-stroke style with 2-color (ink + gold accent)
- Has optional SVG path draw-on animation via CSS

Icons to create (each as its own named export):
1. `KatanaIcon` — Contracts/Documents (curved blade with handle wrapping)
2. `ScrollIcon` — Scripts/Text (rolled scroll with seal)
3. `ShurikenIcon` — Quick actions/Search (4-point throwing star)
4. `ToriiIcon` — Navigation/Entry (torii gate with thick pillars)
5. `CompassIcon` — Agent Finder (compass with directional pointer)
6. `ForgeHammerIcon` — Lead Scrubbing (heavy hammer with sparks)
7. `InkBrushIcon` — LOI/Writing (brush with ink drip)
8. `WarFanIcon` — Strategy/Process (tessen war fan, spread)
9. `HawkIcon` — Direct outreach (hawk in flight silhouette)
10. `BannerIcon` — Team/Recruitment (nobori flag)
11. `LanternIcon` — Dashboard/Overview (paper lantern with glow)
12. `AbacusIcon` — Underwriting/Numbers (abacus frame with beads)
13. `MonomiEyeIcon` — Admin oversight (stylized eye)
14. `MapIcon` — FSBO Finder (folded map with pin)
15. `SealStampIcon` — Contract seal (circular hanko stamp)

Each icon should be 48x48 viewBox, stroke-based with `strokeWidth={2.5}` for bold brush feel, and include a gold accent element (fill or secondary stroke using `currentColor` for theming).

Add a `drawOnAnimation` CSS class that uses `stroke-dasharray` and `stroke-dashoffset` for the draw-on hover effect.

**Step 2: Verify icons render**

Import 2-3 icons into Dashboard.jsx temporarily to check they render correctly at different sizes.

**Step 3: Commit**

```bash
git add frontend/src/components/icons/
git commit -m "feat: add custom brush-stroke SVG icon set (15 icons)"
```

---

### Task 3: Create Per-Page Ninja Logo Variants

**Files:**
- Create: `frontend/src/components/icons/NinjaLogos.jsx`

**Step 1: Create ninja logo variant components**

Each is a React component rendering an SVG of the Dispo Dojo ninja in a unique pose/action themed to its page. All share the same ninja base silhouette style (hooded figure, dark ink with gold accents) but each has unique props/action.

Create these named exports:
1. `NinjaGates` — Standing before torii (Login)
2. `NinjaLantern` — Holding lantern, surveying (Dashboard)
3. `NinjaWarTable` — Moving pieces on table (CRM)
4. `NinjaTelescope` — With spyglass on tower (Agent Finder)
5. `NinjaTracker` — Crouching in forest (FSBO)
6. `NinjaForge` — At anvil hammering (Lead Scrubbing)
7. `NinjaScroll` — Reading scrolls by candle (Underwriting)
8. `NinjaCalligraphy` — Writing with ink brush (LOI)
9. `NinjaSeal` — Pressing stamp/seal (Contract)
10. `NinjaTraining` — Stance with bokken (Scripts)
11. `NinjaHawk` — Launching hawk from arm (Direct Agent)
12. `NinjaStrategy` — Studying map (Dispo)
13. `NinjaBanner` — Holding recruitment flag (Join Team)
14. `NinjaGuide` — Gesturing/guiding (Explainer)
15. `NinjaSensei` — On platform, arms crossed (Admin)

Each component: `(size = 120, className)` props, consistent ink-black + gold-accent 2-color scheme, 120x120 default viewBox.

**Step 2: Commit**

```bash
git add frontend/src/components/icons/NinjaLogos.jsx
git commit -m "feat: add 15 per-page ninja logo SVG variants"
```

---

### Task 4: Create Atmospheric Components (TorchLight, EmberField, enhanced MistLayer)

**Files:**
- Create: `frontend/src/components/TorchLight.jsx`
- Create: `frontend/src/components/EmberField.jsx`
- Modify: `frontend/src/components/MistLayer.jsx` (full rewrite)

**Step 1: Create TorchLight component**

A reusable component that renders 2-3 fixed-position radial warm glows with flickering animation. Props: `intensity` (0-1), `positions` (array of {top, left} or {top, right}), `color` (default warm orange).

Uses the `.torch-glow` CSS class from Task 1 plus inline positioning. Each torch has slightly different animation delay for natural flicker.

**Step 2: Create EmberField component**

Replaces the simple EmberDots. Uses a canvas element (like CherryBlossoms) to render 25-40 small orange/gold particles that drift upward with slight horizontal wobble. Each particle:
- Starts at random bottom position
- Drifts upward at varying speeds
- Has subtle opacity pulse
- Glows slightly (radial gradient fill)
- Wraps from top to bottom

Props: `density` (number of particles, default 30), `className`

**Step 3: Rewrite MistLayer**

Replace the current 3 static mist patches with a more dynamic system:
- 5-7 mist patches with varying sizes (400-800px)
- Randomized starting positions
- Slower, more organic drift paths
- Uses gold/warm tones instead of purple
- Lower opacity (0.03-0.06) for subtlety
- Uses requestAnimationFrame for smoother animation

**Step 4: Verify all three render in Layout**

**Step 5: Commit**

```bash
git add frontend/src/components/TorchLight.jsx frontend/src/components/EmberField.jsx frontend/src/components/MistLayer.jsx
git commit -m "feat: add TorchLight, EmberField, enhanced MistLayer atmosphere components"
```

---

### Task 5: Redesign WoodPanel Card (Replace GlassCard & ShojiCard)

**Files:**
- Create: `frontend/src/components/WoodPanel.jsx`
- Modify: `frontend/src/components/GlassCard.jsx` (add deprecation, re-export WoodPanel)
- Modify: `frontend/src/components/ShojiCard.jsx` (add deprecation, re-export WoodPanel)

**Step 1: Create WoodPanel component**

The new universal card component. Replaces both GlassCard and ShojiCard.

Props: `children`, `className`, `hover` (boolean), `onClick`, `glow` (boolean), `variant` ('default' | 'elevated' | 'parchment'), `withBrackets` (boolean, default true), `withRope` (boolean, default false), `headerBar` (string - optional lacquered header text)

Structure:
```jsx
<motion.div className={`wood-panel relative ${variant classes} ${hover classes}`}
  whileHover={hover ? { y: -4, boxShadow: '0 8px 32px rgba(212,168,83,0.15)' } : undefined}
  whileTap={hover ? { scale: 0.98 } : undefined}
>
  {withRope && <div className="rope-top" />}
  {headerBar && <div className="lacquer-bar px-4 py-2 font-heading text-gold text-sm tracking-widest uppercase">{headerBar}</div>}
  {withBrackets && (
    <>
      <div className="metal-bracket top-left" />
      <div className="metal-bracket top-right" />
      <div className="metal-bracket bottom-left" />
      <div className="metal-bracket bottom-right" />
    </>
  )}
  <div className="relative z-10 p-5">{children}</div>
</motion.div>
```

Hover glow effect: warm torch light emanating from behind the panel (box-shadow with gold/orange).

**Step 2: Make GlassCard re-export WoodPanel**

Replace GlassCard internals to just render `<WoodPanel {...props} />` so existing imports don't break.

**Step 3: Make ShojiCard re-export WoodPanel**

Same approach — ShojiCard becomes a thin wrapper around WoodPanel with `withBrackets={true}` default.

**Step 4: Verify existing pages still render**

**Step 5: Commit**

```bash
git add frontend/src/components/WoodPanel.jsx frontend/src/components/GlassCard.jsx frontend/src/components/ShojiCard.jsx
git commit -m "feat: create WoodPanel card component, deprecate GlassCard and ShojiCard as wrappers"
```

---

### Task 6: Redesign Sidebar as Weapon Rack

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx` (full rewrite, 120 lines)

**Step 1: Rewrite Sidebar**

Replace the current sidebar with the weapon rack design:

- Background: `wood-panel-dark` class with visible planks
- Top: Dispo Dojo clan crest (logo.png) with gold border ring, 80px
- Nav items: each is a weapon/tool on a peg
  - Custom brush icon (from Task 2) at 28px + text label on wooden plaque
  - Active: warm `torch-glow` behind item (gold box-shadow), gold text
  - Hover: translateX(4px) shift (pulling from rack feel)
  - Framer Motion whileHover animation
- Section dividers: rope-style horizontal lines (repeating-linear-gradient)
- Section headers: uppercase tracking-widest with pyrography style (gold-dim, font-heading)
- Bottom: subtle mist gradient fade
- Collapse: width transition from 250px to 70px (icons only mode)

Update the `navSections` array to reference the new custom icons instead of Lucide icons.

**Step 2: Verify navigation still works**

Click every nav link and verify routing works correctly.

**Step 3: Commit**

```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "feat: redesign sidebar as weapon rack with custom brush icons and torch glow active states"
```

---

### Task 7: Redesign Header with Page Ninja Logos

**Files:**
- Modify: `frontend/src/components/Header.jsx` (62 lines)

**Step 1: Update Header**

- Add imports for all NinjaLogo variants from Task 3
- Create a `routeLogos` map: route path → NinjaLogo component
- Display the page-specific ninja logo (64px) next to the page title
- Page title: Onari font at 32px with brush-underline
- Optional kanji watermark behind the title (large, 15% opacity)
- Lacquer bar background instead of transparent
- User avatar: keep hanko-seal but make it larger (40px) with gold border ring
- Bottom divider: upgrade katana-line to be wider with gold shimmer animation

**Step 2: Verify header shows correct logo per page**

Navigate to each page and verify the correct ninja variant appears.

**Step 3: Commit**

```bash
git add frontend/src/components/Header.jsx
git commit -m "feat: redesign header with per-page ninja logos, Onari titles, lacquer bar"
```

---

### Task 8: Update Layout with New Atmosphere Stack

**Files:**
- Modify: `frontend/src/components/Layout.jsx` (43 lines)

**Step 1: Update Layout**

Replace the current background effects with the full atmosphere stack:
1. Base: `ink-wash` class on root div
2. TorchLight component with 2 fixed positions (top-left, bottom-right)
3. Enhanced MistLayer
4. EmberField with density 25
5. Keep CherryBlossoms (but make it conditional — only on Dashboard and Login)
6. Keep CursorProvider

Add a subtle wood-grain border/frame effect around the main content area (thin inset border with wood color).

**Step 2: Verify layout renders with all atmosphere layers**

**Step 3: Commit**

```bash
git add frontend/src/components/Layout.jsx
git commit -m "feat: update Layout with full atmosphere stack (torch, embers, mist, ink wash)"
```

---

### Task 9: Enhance Page Transitions

**Files:**
- Modify: `frontend/src/components/NinjaTransition.jsx` (84 lines)

**Step 1: Add transition variants**

Add a `variant` prop: 'smoke' (default), 'inkWash', 'slash'

- **smoke:** Current behavior but enhanced with more particles
- **inkWash:** Black ink bleeds from edges to center, then dissolves (for tool pages)
- **slash:** Diagonal katana slash wipe with flash (for quick actions)

Each variant has the same phase system (enter → active → exit) but different visual effects.

**Step 2: Update Layout to pass transition variant based on route category**

**Step 3: Commit**

```bash
git add frontend/src/components/NinjaTransition.jsx frontend/src/components/Layout.jsx
git commit -m "feat: add ink wash and slash transition variants"
```

---

## Phase 2: Page Redesigns

### Task 10: Redesign Login - "The Dojo Gates"

**Files:**
- Modify: `frontend/src/pages/Login.jsx` (334 lines)
- Create: `frontend/src/components/three/DojoGateScene.jsx`

**Step 1: Create DojoGateScene Three.js component**

A new Three.js scene for the Login page background:
- Massive wooden torii gate model (constructed from box/cylinder geometries)
- Fog (Three.js Fog, near 1, far 15, color matching `#06060f`)
- Two stone lanterns (cylinder + sphere geometries) with PointLights (warm orange, intensity 2)
- Ground plane with stone texture
- Camera slowly pushes forward (z position animation from 8 to 5 over 10 seconds)
- Stars in skybox (Points geometry, 500 stars)
- Cherry blossom particle system (50 small planes falling and rotating)
- Respects `prefersReducedMotion()`
- Returns cleanup with `destroy()` method

**Step 2: Redesign Login form**

Replace the current form layout:
- Full-screen Three.js background (DojoGateScene)
- Centered login panel: `wood-panel` with metal brackets, rope binding at top
- Dispo Dojo crest at top with ink-brush draw-on animation (GSAP SVG path)
- Inputs: parchment-textured backgrounds (`parchment-texture` class), dark ink text, brush-style labels
- "Enter the Dojo" button: `gold-shimmer` class, large, with katana icon
- Sign-up toggle: animated scroll unfurl (height + opacity animation)
- Keep ALL existing auth logic (login, signup, quickLogin, validation)
- Remove the old MistLayer/CherryBlossoms from this page (DojoGateScene replaces them)

**Step 3: Verify login and signup still work**

Test: login, signup, quickLogin, validation errors, admin login

**Step 4: Commit**

```bash
git add frontend/src/pages/Login.jsx frontend/src/components/three/DojoGateScene.jsx
git commit -m "feat: redesign Login as Dojo Gates with 3D torii gate scene"
```

---

### Task 11: Redesign Dashboard - "The Main Hall (Honbu Dojo)"

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx` (204 lines)
- Create: `frontend/src/components/three/DojoHallScene.jsx`

**Step 1: Create DojoHallScene Three.js component**

Interior dojo hall scene for Dashboard hero:
- Wooden floor plane with plank texture
- Hanging vertical banners (plane geometries with alpha maps)
- Weapon rack silhouettes on side walls
- Central floating clan crest (gold torus + emblem) rotating slowly
- Overhead lantern light (warm PointLight from above)
- Subtle dust motes (small particle system floating in light beam)

**Step 2: Redesign Dashboard layout in 3 zones**

**Zone 1 - Hero Banner (top 300px):**
- DojoHallScene as background
- Overlaid: "Welcome back, [Name]-san" in Onari 56px, gold-shimmer-text
- Date below in DM Sans with kanji accent
- Stagger fade-in animation

**Zone 2 - Honor Wall (stats):**
- Replace StatCard grid with hanging scroll (kakejiku) layout
- Each stat is a vertical card with:
  - `scroll-card` class (wooden rollers top/bottom)
  - Large kanji watermark at 20% opacity as background
  - CountUp number in Rajdhani Bold 36px, gold-shimmer-text
  - Label in font-heading below
  - Gentle CSS sway animation (rotate ±1deg, 4s ease-in-out)
- 4 scrolls in a row with stagger animation

**Zone 3 - Weapon Wall (tools):**
- Masonry-style grid using CSS grid with varying row spans
- Each tool is a WoodPanel with:
  - Custom brush icon (from Task 2) at 48px
  - Tool name in font-heading, tracking-wide
  - One-line description in text-dim
  - Hover: panel lifts, torch glow behind, icon animates (draw-on)
- Primary tools (Agent Finder, CRM, Underwriting) get 2-row height
- Secondary tools get 1-row
- Quick Actions row at top: smaller horizontal cards

Replace all Lucide icon imports with custom icons from Task 2.

**Step 3: Verify all tool links navigate correctly**

**Step 4: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx frontend/src/components/three/DojoHallScene.jsx
git commit -m "feat: redesign Dashboard as Main Hall with 3D scene, honor wall stats, weapon wall tools"
```

---

### Task 12: Redesign CRM - "The War Room"

**Files:**
- Modify: `frontend/src/pages/CRM.jsx` (164 lines)
- Modify: `frontend/src/components/crm/KanbanBoard.jsx` (43 lines)
- Modify: `frontend/src/components/crm/KanbanColumn.jsx` (79 lines)
- Modify: `frontend/src/components/crm/LeadCard.jsx` (103 lines)
- Modify: `frontend/src/components/crm/LeadDetail.jsx` (852 lines)

**Step 1: Redesign CRM.jsx page wrapper**

- Background: `stone-texture` with torch glow from 4 corners (TorchLight with 4 positions)
- Pipeline toggle: two large banner flags (nobori) using SVG flag shapes
  - Active banner: full gold color, slight wave animation
  - Inactive: dimmed, grayscale
  - Switch animation: ink splash transition (AnimatePresence)
- Stats bar: wooden plaque style with gold text

**Step 2: Redesign KanbanBoard.jsx**

- Overall board background: subtle parchment-toned area (like a map spread on the table)
- Horizontal scroll container with wood-textured scroll indicators

**Step 3: Redesign KanbanColumn.jsx**

- Each column: vertical wooden pillar aesthetic
  - Header: lacquer-bar with carved stage name, colored wax dot instead of plain circle
  - Body: lighter wood-panel background for card area
  - Drop zone highlight: gold border glow + "place here" text in brush style

**Step 4: Redesign LeadCard.jsx as Ema tags**

- Shape: clip-path to create pentagonal ema shape (or border-radius approximation)
- Background: wood-panel-light texture
- Address: font-heading, bold
- Amount: gold-shimmer-text, font-mono
- Status indicator: small colored wax seal SVG (circle with shine) instead of plain dot
- Drag state: deeper shadow, slight rotation, gold border

**Step 5: Redesign LeadDetail.jsx panel**

- Slide-in panel: `wood-panel` background with rope-top
- Header: large brush-stroke text for address, wax seal badge for stage
- Tab bar: wooden plaques with active = torch glow
- Form inputs: parchment-texture backgrounds, brush-style labels
- Action buttons: wax seal stamp style (circular with text)
- Keep ALL 7 tabs and their complete functionality
- Keep all form state, callbacks, calculations

**Step 6: Verify CRM functionality**

Test: drag-drop between columns, pipeline switching, lead detail editing, tab navigation, profit calculations.

**Step 7: Commit**

```bash
git add frontend/src/pages/CRM.jsx frontend/src/components/crm/
git commit -m "feat: redesign CRM as War Room with ema cards, banner toggles, wooden pillars"
```

---

### Task 13: Redesign Agent Finder - "The Scout Tower"

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` (89 lines)

**Step 1: Redesign page wrapper**

- Background: dark sky gradient (deep navy to near-black) with stars (CSS radial gradients as stars)
- Tower railing at bottom edge (wood-panel-dark strip with vertical posts)
- TorchLight: 2 torches at top corners
- NinjaTelescope logo in header

**Step 2: Style the legacy HTML container**

Since AgentFinder injects legacy HTML, we can't modify internal markup. Instead:
- Wrap the injected content in a styled container
- Apply CSS overrides for the legacy HTML:
  - Override form inputs with parchment-texture styling
  - Override buttons with gold-shimmer styling
  - Override tables with wood-panel backgrounds
  - Override headers with font-heading
- Scroll-style wrapper around the entire legacy content area
- "Dispatch scroll" frame: scroll-card wrapper with decorative elements

**Step 3: Verify legacy tool still works after styling**

Test: file upload, results display, status updates.

**Step 4: Commit**

```bash
git add frontend/src/pages/AgentFinder.jsx
git commit -m "feat: redesign Agent Finder as Scout Tower with sky background and styled legacy container"
```

---

### Task 14: Redesign FSBO Finder - "The Hunting Grounds"

**Files:**
- Modify: `frontend/src/pages/FSBOFinder.jsx` (559 lines)

**Step 1: Create forest background**

- CSS layered background: dark gradient base + parallax tree silhouette layers (SVG trees at different depths)
- Moon: radial gradient in upper-right with blue-white glow
- Fireflies: EmberField with green-tinted particles and lower intensity

**Step 2: Redesign search interface**

- Search bar: parchment-texture background with compass rose SVG decoration
- Filters: styled as wooden toggle switches (custom checkbox styling)
- "Hunt" button: bold, crimson-bright background, hawk icon, large
- Filter expansion: unfurl animation (like a map unrolling)

**Step 3: Redesign results**

- Results as wooden signpost cards (WoodPanel with pointed top using clip-path)
- Property info in carved/burned text style (font-heading, tracking-wider)
- Status: animal track SVGs (paw prints in different freshness = opacity)
- Selection: wax seal checkbox replacements
- Table → card grid layout (more visual than table rows)
- "Send to CRM" button: hawk dispatch animation

**Step 4: Verify search, filter, select, send-to-CRM all work**

**Step 5: Commit**

```bash
git add frontend/src/pages/FSBOFinder.jsx
git commit -m "feat: redesign FSBO Finder as Hunting Grounds with forest background and signpost cards"
```

---

### Task 15: Redesign Lead Scrubbing - "The Forge"

**Files:**
- Modify: `frontend/src/pages/LeadScrubbing.jsx` (92 lines)

**Step 1: Create forge environment**

- Background: dark with intense orange/red glow from left side (large radial gradient)
- Animated sparks: EmberField with high density (50), bright orange, fast upward drift
- Metal texture strip at bottom (stone-texture class)
- TorchLight: intense single torch from left (forge fire)

**Step 2: Redesign content as forging stages**

- Replace simple bullet list with 5 forge stages:
  1. Raw Ore → 2. Smelting → 3. Hammering → 4. Tempering → 5. Finished Blade
- Each stage is a WoodPanel with:
  - Stage number in a forge-themed icon (different per stage)
  - Stage name in Onari font
  - Content description
  - Visual connector between stages (glowing line/arrow)
- Progress indicator: katana SVG that fills from hilt to tip as you scroll through stages
- Video placeholder: framed in iron/riveted border (dark metal aesthetic)

**Step 3: Commit**

```bash
git add frontend/src/pages/LeadScrubbing.jsx
git commit -m "feat: redesign Lead Scrubbing as The Forge with forging stages and spark effects"
```

---

### Task 16: Redesign Underwriting - "The Scroll Library"

**Files:**
- Modify: `frontend/src/pages/Underwriting.jsx` (492 lines)

**Step 1: Create library environment**

- Background: warm amber tones (dark base with amber radial glow from center, like candlelight)
- Bookshelf silhouettes at left/right edges (CSS pseudo-elements with scroll shapes)
- Dust motes: EmberField with very low density (10), warm white, slow drift
- TorchLight: single warm candle glow from center

**Step 2: Redesign form as desk workspace**

- Overall form: on a `wood-panel-light` background (desk surface)
- Deal type toggle (Cash/Sub2): two scroll tube SVGs
  - Click one: it "unrolls" (height animation) to reveal its form section
  - Other rolls back up
- Form sections: parchment-texture input backgrounds with ink-colored text
- Section headers: red wax seal SVG with section number inside
- Input labels: font-heading, gold-dim color, tracking-wide
- FileDropZone: styled as a scroll receiving tray (wood inset with dotted border)

**Step 3: Redesign submission UX**

- Submit button: large red wax seal stamp with press animation (scale down then up with rotation)
- Agreement checkbox: styled as a signature line instead of checkbox
- Progress: candle icon that burns down (SVG height change)
- Success: scroll rolls up with ribbon animation

**Step 4: Verify all form states, file uploads, validation still work**

**Step 5: Commit**

```bash
git add frontend/src/pages/Underwriting.jsx
git commit -m "feat: redesign Underwriting as Scroll Library with candlelit desk and scroll toggles"
```

---

### Task 17: Redesign LOI Generator - "The Calligraphy Room"

**Files:**
- Modify: `frontend/src/pages/LOIGenerator.jsx` (784 lines)

**Step 1: Create calligraphy room environment**

- Background: LIGHTER than other pages — cream parchment base with subtle ink-wash overlay
- Bamboo shadow silhouettes at edges (SVG)
- Ink pot SVG decoration in corner
- No heavy torch glow — softer, more zen lighting
- TorchLight: very low intensity, single warm glow

**Step 2: Redesign step indicator**

- Replace dots/numbers with ink brush stroke circles
- Active step: filled with ink (black circle with number in gold)
- Completed: gold check mark stamp
- Connected by brushed ink line

**Step 3: Redesign form area (left side)**

- Parchment-texture background
- Inputs: brush-stroke bottom-border only (no full border), dark ink text
- Labels: calligraphy style (font-display at smaller size)
- Section dividers: horizontal ink brush strokes (SVG)

**Step 4: Redesign preview area (right side)**

- scroll-card styling with wooden rollers
- Aged paper background (parchment-texture with extra grain)
- Text: simulate ink writing with GSAP character-by-character reveal
- Formal letter format preserved

**Step 5: Redesign bulk/export**

- Stacked scroll visualization (overlapping scroll-cards with offset)
- Export button: roll-up animation + wax seal stamp
- History table: wooden panel with ink text

**Step 6: Verify 3-step wizard, preview, export, history all work**

**Step 7: Commit**

```bash
git add frontend/src/pages/LOIGenerator.jsx
git commit -m "feat: redesign LOI Generator as Calligraphy Room with scroll preview and ink animations"
```

---

### Task 18: Redesign Contract Generator - "The Seal Chamber"

**Files:**
- Modify: `frontend/src/pages/ContractGenerator.jsx` (886 lines)

**Step 1: Create seal chamber environment**

- Background: stone-texture with gold trim accents
- Overhead lantern: bright PointLight radial glow from top-center
- Banner silhouettes at edges
- TorchLight: 2 torches, medium intensity

**Step 2: Redesign stepper**

- Seal stamps in a row: circular SVG stamps
- Incomplete: faded outline stamp
- Active: pulsing gold border
- Complete: red stamped seal (with slam animation on completion)

**Step 3: Redesign form**

- Heavy parchment on stone desk (parchment-texture on stone-texture)
- Gold-bordered field groupings
- Dropdown selects: scroll unfurl animation (AnimatePresence on option list)

**Step 4: Redesign signature area**

- Silk-texture background for the signing area (lighter parchment with sheen)
- Ink brush cursor (via CustomCursor variant)
- Post-signature: dramatic red seal STAMP animation:
  - Seal SVG scales from 200% to 100% with rotation
  - Gold spark particles burst on impact
  - Slight screen shake (translateX ±2px, 200ms)
- Keep canvas drawing logic and type signature option

**Step 5: Redesign export**

- Completed contract: scroll roll-up animation
- Download buttons: gold-embossed metal plate aesthetic (linear-gradient with bevel)
- History table: WoodPanel with lacquer-bar header

**Step 6: Verify 4-step wizard, canvas signature, type signature, export, history all work**

**Step 7: Commit**

```bash
git add frontend/src/pages/ContractGenerator.jsx
git commit -m "feat: redesign Contract Generator as Seal Chamber with stamp animations and gold sparks"
```

---

### Task 19: Redesign Scripts - "The Training Dojo"

**Files:**
- Modify: `frontend/src/pages/Scripts.jsx` (350 lines)

**Step 1: Create training dojo environment**

- Background: clean wooden floor visible (wood-panel-light base at bottom 20%, fading to dark)
- Training equipment silhouettes at edges (SVG)
- Overhead lanterns: 3 warm lights in a row
- TorchLight: 3 positions (overhead)

**Step 2: Redesign tab navigation**

- Tabs as wooden plaques mounted on wall
- Active: torch glow behind plaque, gold text
- Inactive: dimmed wood, text-dim
- Switch animation: AnimatePresence slide

**Step 3: Redesign script cards as wall scrolls**

- Each script: scroll-card class (kakemono hanging scroll)
- Click to unroll (height animation from 60px to full)
- Collapsed: shows only title with "unroll" indicator
- Copy button: small stamp icon

**Step 4: Redesign objection handling as attack/defense**

- Objection: red-bordered WoodPanel charging from left (translateX -100% to 0)
- Response: gold-bordered WoodPanel blocking from right (translateX 100% to 0)
- When both visible: subtle clash SVG effect (crossed swords icon) between them
- Sequential reveal: objection first, response 300ms later

**Step 5: Verify tab switching, collapse/expand, copy all work**

**Step 6: Commit**

```bash
git add frontend/src/pages/Scripts.jsx
git commit -m "feat: redesign Scripts as Training Dojo with wall scrolls and attack/defense objections"
```

---

### Task 20: Redesign Direct Agent - "The Messenger Hawk Post"

**Files:**
- Modify: `frontend/src/pages/DirectAgent.jsx` (183 lines)

**Step 1: Create hawk post environment**

- Background: dawn sky gradient (deep purple bottom → amber horizon top)
- Mountain silhouettes: CSS pseudo-elements with dark triangular shapes
- Circling hawk: SVG silhouette with CSS orbit animation (slow circle path)
- Wind particles: EmberField with white/light color, horizontal drift

**Step 2: Redesign process flow**

- Horizontal journey layout with hawk flying between 4 stations:
  - Station SVGs: scroll desk → compass/map → hawk perch → waiting tower
  - Hawk SVG flies along a curved SVG path connecting stations
  - Each station is a WoodPanel with:
    - Numbered hanko seal
    - Station name in font-heading
    - Description content
    - Connected by dotted path line (SVG)

**Step 3: Redesign tool cards**

- Message templates: small rolled parchment shapes (WoodPanel with rounded ends)
- Tips: feather-bordered callout boxes (custom border-image or SVG frame)
- Links to tools: wooden directional signs pointing right

**Step 4: Verify all links and navigation work**

**Step 5: Commit**

```bash
git add frontend/src/pages/DirectAgent.jsx
git commit -m "feat: redesign Direct Agent as Hawk Post with dawn sky and journey flow"
```

---

### Task 21: Redesign Dispo Process - "The Strategy Board"

**Files:**
- Modify: `frontend/src/pages/DispoProcess.jsx` (329 lines)

**Step 1: Create strategy room environment**

- Background: parchment-texture center (map on table) with dark edges (room around table)
- Candle glow from 4 corners (TorchLight)
- War figurine silhouettes: small ninja SVGs at fixed positions on the map

**Step 2: Redesign as battle strategy map**

- Overall layout: parchment "map" in center with positions/territories
- Each dispo step: a territory marker on the map
  - Connected by dotted ink path lines (SVG)
  - Small ninja figurine at current/active step
  - Click: zooms in (scale animation) and reveals detail scroll
- Platform section: 4 platform cards as fortified positions (castle icons)
- Buyer types: arranged as army groups on the map
  - Conventional: standard soldier silhouettes
  - Non-conventional: elite warrior silhouettes (gold highlights)

**Step 3: Redesign bottom CTA**

- Battle horn call-to-action (bold, urgent styling)
- Gold-shimmer button

**Step 4: Commit**

```bash
git add frontend/src/pages/DispoProcess.jsx
git commit -m "feat: redesign Dispo Process as Strategy Board with map layout and territory markers"
```

---

### Task 22: Redesign Join Team - "The Recruitment Hall"

**Files:**
- Modify: `frontend/src/pages/JoinTeam.jsx` (257 lines)

**Step 1: Create recruitment hall environment**

- Background: tall hall with vertical banner flags (SVG nobori) hanging from top
- Warm torch glow from multiple points (grand hall lighting)
- Wood and stone floor visible at bottom

**Step 2: Redesign job description**

- Large recruitment poster: WoodPanel with ornate gold SVG frame border
- Title in Onari font, large (48px), gold-shimmer-text
- Benefits: wooden token cards (circular/octagonal WoodPanels)
  - Each with a small brush icon and benefit text
  - Arranged in horizontal row

**Step 3: Redesign application form**

- Clan registration document styling
- Parchment-texture background
- Official seals: red circular badges at top of form
- "Pledge Your Blade" submit button:
  - Katana icon
  - Gold-shimmer background
  - Hover: sword raise animation (translateY -4px + slight rotation)
- Success state: full-screen banner unfurl with clan crest

**Step 4: Verify form submission and success state**

**Step 5: Commit**

```bash
git add frontend/src/pages/JoinTeam.jsx
git commit -m "feat: redesign Join Team as Recruitment Hall with banner flags and pledge button"
```

---

### Task 23: Redesign Website Explainer - "The Grand Tour"

**Files:**
- Modify: `frontend/src/pages/WebsiteExplainer.jsx` (153 lines)

**Step 1: Create tour environment**

- Background: transitions between environments as you scroll
  - Each section has its own background matching the page it represents
  - Shoji door transition between sections (SVG sliding panels)
- Small ninja guide character: fixed SVG at left edge that "walks" with scroll position

**Step 2: Redesign as vertical scroll journey**

- Each tool section is a "room stop":
  - Room name in Onari font with matching page's ninja logo variant
  - Miniature environment preview (color/texture from that page's theme)
  - Tool description with key features
  - "Try This Tool" CTA: wooden directional sign pointing right (arrow + text)
- Section transitions: parallax scroll between rooms (different scroll speeds for bg/content)
- Room order: follows the dojo compound layout

**Step 3: Redesign URL share section**

- Share section: messenger scroll with URL on parchment
- Copy button: stamp-style with gold shimmer

**Step 4: Verify copy functionality and navigation links**

**Step 5: Commit**

```bash
git add frontend/src/pages/WebsiteExplainer.jsx
git commit -m "feat: redesign Website Explainer as Grand Tour with scroll journey and room stops"
```

---

### Task 24: Redesign Admin Dashboard - "The Sensei's Quarters"

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx` (165 lines)

**Step 1: Create sensei's quarters environment**

- Background: elevated platform view (darker at edges, lighter center — spotlight effect)
- Paper screen silhouettes at edges
- Premium ink and gold color emphasis
- TorchLight: overhead, bright, authoritative

**Step 2: Redesign stats**

- Horizontal makimono scroll spanning full width
- 3 stat sections on the scroll:
  - Each with large calligraphy number (Onari 56px, gold-shimmer-text, CountUp)
  - Label below in font-heading
  - Separated by vertical ink brush dividers

**Step 3: Redesign user table as student roster**

- Vertical scroll-card wrapper (unrolled scroll)
- Table header: lacquer-bar with gold text
- Each user row: wooden plaque style with:
  - Larger avatar (hanko-seal, 40px) with initials
  - Username with brush-style @ symbol
  - Email, phone, date in organized columns
  - Hover: row lifts slightly, torch glow
- Reverse order preserved (newest first)
- Staggered row animations preserved

**Step 4: Verify user data displays correctly, counts are accurate**

**Step 5: Commit**

```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "feat: redesign Admin Dashboard as Sensei's Quarters with makimono stats and student roster"
```

---

## Phase 3: Polish & Integration

### Task 25: Update Button Component with Grand Dojo Styling

**Files:**
- Modify: `frontend/src/components/Button.jsx` (69 lines)

**Step 1: Redesign button variants**

- `gold`: gold-shimmer gradient + subtle bevel shadow + shimmer animation
- `outline`: wood-textured border with gold text, hover fills with wood
- `danger`: crimson with blood-splash texture hover
- Add new variant `seal`: circular stamp-style for special actions
- All variants: font-heading text, tracking-wider, uppercase
- Press animation: scale(0.95) with slight rotation (like stamping)

**Step 2: Commit**

```bash
git add frontend/src/components/Button.jsx
git commit -m "feat: update Button with Grand Dojo styling and seal variant"
```

---

### Task 26: Update StatCard with Hanging Scroll Style

**Files:**
- Modify: `frontend/src/components/StatCard.jsx` (49 lines)

**Step 1: Redesign as hanging scroll**

- scroll-card wrapper (wooden rollers top/bottom)
- Kanji watermark in background (SVG at 15% opacity)
- Number: gold-shimmer-text, Rajdhani 36px bold
- Label: font-heading, tracking-wide
- Icon: replace Lucide with custom brush icon
- Gentle sway animation: CSS transform rotate(±1deg) with 4s ease-in-out infinite

**Step 2: Commit**

```bash
git add frontend/src/components/StatCard.jsx
git commit -m "feat: redesign StatCard as hanging scroll with sway animation"
```

---

### Task 27: Update ScrollCard Component

**Files:**
- Modify: `frontend/src/components/ScrollCard.jsx` (71 lines)

**Step 1: Enhance scroll aesthetic**

- Use scroll-card class for proper wooden roller styling
- Wood-panel background instead of glass
- Collapse/expand: smooth unfurl with slight bounce
- Title bar: lacquer-bar styling with gold text

**Step 2: Commit**

```bash
git add frontend/src/components/ScrollCard.jsx
git commit -m "feat: update ScrollCard with wood panel and lacquer title bar"
```

---

### Task 28: Add Google Font "Zen Kaku Gothic New" to index.html

**Files:**
- Modify: `frontend/index.html` (line 7, Google Fonts link)

**Step 1: Add Zen Kaku Gothic New to the existing Google Fonts import**

Append `&family=Zen+Kaku+Gothic+New:wght@400;500;700` to the existing Google Fonts URL.

**Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat: add Zen Kaku Gothic New font for Japanese-flavored body text"
```

---

### Task 29: Final Integration Testing

**Files:** None (testing only)

**Step 1: Start dev server and test every page**

Run: `cd frontend && npm run dev`

Navigate to EVERY page and verify:
- [ ] Login: 3D scene renders, login works, signup works
- [ ] Dashboard: 3D hall scene, stats scroll, tool grid, all links work
- [ ] CRM: pipeline toggle, kanban drag-drop, lead detail all 7 tabs
- [ ] Agent Finder: legacy tool loads and works
- [ ] FSBO Finder: search, filter, results, selection, send to CRM
- [ ] Lead Scrubbing: forge stages display, video placeholder
- [ ] Underwriting: deal type toggle, form fields, file upload, submit
- [ ] LOI Generator: 3-step wizard, preview, export, history
- [ ] Contract Generator: 4-step wizard, signature canvas, export, history
- [ ] Scripts: tabs, collapse/expand, copy, objection handling
- [ ] Direct Agent: process flow, tool links
- [ ] Dispo Process: strategy layout, platform/buyer sections
- [ ] Join Team: form submit, success state
- [ ] Website Explainer: scroll journey, copy URL, navigation links
- [ ] Admin: stats, user table, counts

**Step 2: Verify sidebar navigation works for all pages**

**Step 3: Verify page transitions work between all routes**

**Step 4: Verify reduced motion preference is respected**

**Step 5: Run production build**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors

**Step 6: Commit any fixes**

```bash
git commit -m "fix: resolve integration issues from Grand Dojo redesign"
```

---

### Task 30: Final Commit - Clean Up Unused Imports

**Files:** All modified files

**Step 1: Search for unused Lucide imports across all files**

Any remaining Lucide icons that were replaced by custom brush icons should have their imports removed.

**Step 2: Remove any unused component imports**

If GlassCard or ShojiCard are no longer directly imported anywhere (only via the wrapper), clean up.

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused Lucide imports and clean up deprecated component references"
```
