# Electric Ninja Rebrand — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand the entire Dispo Dojo site from warm gold/crimson to an electric ninja command center aesthetic using the official brand colors.

**Architecture:** CSS-variable-first approach — swap the theme variables in `index.css` first (cascading 70% of changes automatically), then enhance individual components with neon glow effects, updated gradients, and electric hover states.

**Tech Stack:** React 19, Tailwind CSS v4, Framer Motion, Vite

**Brand Reference:** `Brand Colors.png` in project root

---

## Phase 1: CSS Variable System + Global Styles

### Task 1: Swap Theme Color Variables

**Files:**
- Modify: `frontend/src/index.css` (lines 15–47, the `:root` / `@theme` block)

**Step 1: Update all color variables**

Replace the theme color definitions with the new brand palette:

```css
--color-gold: #F6C445;
--color-gold-dim: #C49A20;
--color-gold-bright: #FFD97A;
--color-gold-shimmer: #FFEFB8;
--color-crimson: #E53935;
--color-steel: #0E5A88;
--color-bamboo: #1C3B4D;
--color-ember: #00C6FF;
--color-text-primary: #F4F7FA;
--color-text-dim: #C8D1DA;
--color-bg: #0B0F14;
--color-bg-elevated: #111B24;
```

Add new variables:
```css
--color-cyan: #00C6FF;
--color-purple-glow: #7F00FF;
--color-ninja-blue: #0E5A88;
--color-midnight: #111B24;
--color-steel-blue: #1C3B4D;
```

**Step 2: Verify dev server shows updated colors**

Run: `node screenshot.mjs http://localhost:3000 rebrand-step1`
Expected: Background shifts slightly darker, gold tones become brighter/warmer

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: swap theme variables to electric ninja brand palette"
```

---

### Task 2: Update Elevation Shadows

**Files:**
- Modify: `frontend/src/index.css` (elevation-1 through elevation-3 classes, ~lines 220–260)

**Step 1: Replace warm gold shadow tints with cool cyan tints**

```css
.elevation-1 {
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.5),
    0 1px 2px rgba(0, 0, 0, 0.3),
    0 0 1px rgba(0, 198, 255, 0.08),
    inset 0 1px 0 rgba(0, 198, 255, 0.04);
}

.elevation-2 {
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.6),
    0 2px 4px rgba(0, 0, 0, 0.4),
    0 0 1px rgba(0, 198, 255, 0.1),
    inset 0 1px 0 rgba(0, 198, 255, 0.06),
    inset 0 0 20px rgba(0, 198, 255, 0.02);
}

.elevation-3 {
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.7),
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 1px rgba(0, 198, 255, 0.12),
    inset 0 1px 0 rgba(0, 198, 255, 0.08),
    inset 0 0 30px rgba(0, 198, 255, 0.03);
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: update elevation shadows to cool cyan tints"
```

---

### Task 3: Update Katana Lines + Gold Shimmer Animation

**Files:**
- Modify: `frontend/src/index.css` (`.katana-line` ~line 127, `.gold-shimmer-text` ~line 291)

**Step 1: Update katana-line to cyan gradient**

```css
.katana-line {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--color-cyan), var(--color-ninja-blue), var(--color-cyan), transparent);
  box-shadow: 0 0 8px rgba(0, 198, 255, 0.2);
}
```

**Step 2: Update gold-shimmer-text to use brighter gold with cyan flash**

```css
.gold-shimmer-text {
  background: linear-gradient(
    120deg,
    var(--color-gold-dim) 0%,
    var(--color-gold) 25%,
    #00C6FF 50%,
    var(--color-gold) 75%,
    var(--color-gold-dim) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 4s linear infinite;
}
```

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: update katana lines and shimmer to cyan/electric palette"
```

---

### Task 4: Update Lacquer + Sidebar Styles

**Files:**
- Modify: `frontend/src/index.css` (`.lacquer-deep`, `.lacquer-shine`, `.sidebar-shadow`)

**Step 1: Update lacquer backgrounds to midnight blue tones**

Find `.lacquer-deep` and update its background gradient to use `#0B0F14` base with `#111B24` highlights.

Find `.sidebar-shadow` and update to use cool blue shadow tints instead of warm.

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: update lacquer and sidebar styles to midnight blue"
```

---

### Task 5: Update Torch Glow to Cool Blue

**Files:**
- Modify: `frontend/src/index.css` (`.torch-glow` ~line 158)

**Step 1: Shift torch glow radial gradient from warm amber to cool cyan/blue**

```css
.torch-glow {
  background: radial-gradient(
    ellipse 600px 400px at 50% 0%,
    rgba(0, 198, 255, 0.10) 0%,
    rgba(14, 90, 136, 0.05) 40%,
    transparent 70%
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: shift torch glow to cool cyan radial"
```

---

### Task 6: Screenshot + Compare Phase 1

**Step 1: Start dev server if not running**

```bash
cd frontend && npx vite --host --port 3000 &
```

**Step 2: Screenshot login page**

```bash
node screenshot.mjs http://localhost:3000 phase1-login
```

**Step 3: Log in and screenshot dashboard**

Visual verification: all gold should be brighter (#F6C445), backgrounds darker/bluer (#0B0F14), katana lines should glow cyan. Compare against `Brand Colors.png`.

**Step 4: Commit any CSS tweaks from visual review**

---

## Phase 2: Dashboard Component Enhancements

### Task 7: Enhance KPI Cards

**Files:**
- Modify: `frontend/src/components/KpiCard.jsx`

**Step 1: Update card styling**

Replace the current card border and hover styles with neon treatment:
- Base border: `rgba(0,198,255,0.12)`
- Hover border: `rgba(0,198,255,0.35)`
- Hover shadow: `0 0 24px rgba(0,198,255,0.12), 0 8px 32px rgba(0,0,0,0.5)`
- Add a top-edge glow line (1px pseudo-element with cyan gradient)
- Value text color: `#00C6FF` for default values (keep green `#7da87b` overrides)
- Increase hover lift from `-translate-y-1` to `-translate-y-1.5`

**Step 2: Screenshot and verify**

```bash
node screenshot.mjs http://localhost:3000 kpi-cards
```

**Step 3: Commit**

```bash
git add frontend/src/components/KpiCard.jsx
git commit -m "style: enhance KPI cards with neon cyan borders and glow hover"
```

---

### Task 8: Enhance Tool Cards

**Files:**
- Modify: `frontend/src/components/ToolCard.jsx`

**Step 1: Update accent color cycle**

Replace the 8-color cycle with a 4-color brand cycle:
```js
const accents = ['#0E5A88', '#E53935', '#00C6FF', '#F6C445']
const accent = accents[index % accents.length]
```

**Step 2: Increase left accent bar width and opacity**

Change from 2px to 3px, increase opacity from 50% to 70%.

**Step 3: Add animated glow pulse to icon badges**

Add a CSS keyframe animation `glowPulse` that subtly pulses the icon badge shadow:
```css
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 8px var(--glow-color); }
  50% { box-shadow: 0 0 16px var(--glow-color); }
}
```

**Step 4: Update hover shadow to explosive neon glow**

On hover, the card shadow should include the accent color at higher intensity:
```js
boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,198,255,0.2), 0 0 32px -8px ${accent}44`
```

**Step 5: Update "Open" button to cyan**

Text: `#00C6FF`, hover text: `#FFD97A`, hover bg: `rgba(0,198,255,0.08)`

**Step 6: Screenshot and verify**

```bash
node screenshot.mjs http://localhost:3000 tool-cards
```

**Step 7: Commit**

```bash
git add frontend/src/components/ToolCard.jsx frontend/src/index.css
git commit -m "style: enhance tool cards with neon accents, glow pulse, and electric hover"
```

---

### Task 9: Update Dashboard Header + Buttons

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx` (lines 147–170)

**Step 1: Update "Submit a Deal" button**

Change from gold to red CTA gradient:
```jsx
className="font-heading tracking-wide text-white shadow-[0_0_16px_rgba(229,57,53,0.3)] hover:shadow-[0_0_24px_rgba(229,57,53,0.5)] transition-shadow duration-200"
style={{ background: 'linear-gradient(135deg, #E53935, #B3261E)' }}
```

**Step 2: Update "View Dispo Pipeline" button**

Change to cyan outline:
```jsx
className="font-heading tracking-wide border-[rgba(0,198,255,0.3)] text-[#00C6FF] hover:bg-[rgba(0,198,255,0.08)] hover:text-[#FFD97A] hover:border-[rgba(0,198,255,0.5)] hover:shadow-[0_0_16px_rgba(0,198,255,0.15)]"
```

**Step 3: Update date text color**

Change from `#8a8578` to `#C8D1DA`.

**Step 4: Add subtle cyan radial glow behind header section**

Add a `::before` pseudo or a wrapper div with:
```css
background: radial-gradient(ellipse 60% 40% at 50% 30%, rgba(0,198,255,0.04) 0%, transparent 70%);
```

**Step 5: Update "Tools to Succeed" heading color**

Change from `rgba(212,168,83,0.8)` to `rgba(0,198,255,0.8)`.

**Step 6: Screenshot and verify**

```bash
node screenshot.mjs http://localhost:3000 dashboard-header
```

**Step 7: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "style: update dashboard header and buttons to electric ninja palette"
```

---

## Phase 3: Sidebar + Login + Atmosphere

### Task 10: Rebrand Sidebar

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Update active nav glow strip**

Change the gradient from gold to cyan:
```jsx
background: 'linear-gradient(180deg, #00C6FF, #0E5A88, #00C6FF)'
boxShadow: '0 0 14px rgba(0,198,255,0.5), 0 0 28px rgba(0,198,255,0.2)'
```

**Step 2: Update active icon/text color**

Change all `text-gold` to `text-[#00C6FF]` for active state.

**Step 3: Update hover background**

Change `hover:bg-gold/5` to `hover:bg-[rgba(0,198,255,0.05)]`.

**Step 4: Update "DOJO" wordmark**

Keep `gold-shimmer-text` class (already updated in Task 3).

**Step 5: Update user initials badge**

Change `hanko-seal` background to ninja blue gradient.

**Step 6: Update section divider colors**

Section title text: change from `text-gold-dim/60` to `text-[#C8D1DA]/40`.

**Step 7: Commit**

```bash
git add frontend/src/components/Sidebar.jsx
git commit -m "style: rebrand sidebar to cyan active states and ninja blue tones"
```

---

### Task 11: Rebrand Login Page

**Files:**
- Modify: login page component (find via `grep "Enter the Dojo"`)

**Step 1: Update login card border to cyan glow**

`border: 1px solid rgba(0,198,255,0.15)`
Hover/focus: `box-shadow: 0 0 30px rgba(0,198,255,0.08)`

**Step 2: Update "Enter the Dojo" button**

Change to red CTA gradient (same as Dashboard "Submit a Deal").

**Step 3: Update "Begin Training" link**

Color: `#00C6FF`

**Step 4: Update input focus states**

Focus border: `rgba(0,198,255,0.4)` with subtle glow.

**Step 5: Commit**

```bash
git add frontend/src/pages/Login.jsx  # or wherever login lives
git commit -m "style: rebrand login page to electric ninja palette"
```

---

### Task 12: Update Atmosphere Components

**Files:**
- Modify: `frontend/src/components/MistLayer.jsx`
- Modify: `frontend/src/components/TorchLight.jsx`
- Modify: `frontend/src/components/EmberField.jsx`

**Step 1: MistLayer — shift from warm gold mist to cool blue mist**

Replace rgba colors:
- Gold `rgba(212,168,83,0.3)` → Blue `rgba(14,90,136,0.2)`
- Amber `rgba(232,160,60,0.25)` → Cyan `rgba(0,198,255,0.12)`
- Brown → Steel Blue `rgba(28,59,77,0.15)`
- Deep Gold → Purple `rgba(127,0,255,0.08)`

**Step 2: TorchLight — shift from warm amber to cool blue**

Update radial gradient colors to use `rgba(0,198,255,...)` and `rgba(14,90,136,...)`.

**Step 3: EmberField — shift from orange/amber particles to electric blue/cyan sparks**

Replace particle colors:
- `rgb(235,160,60)` → `rgb(0,198,255)` (cyan)
- `rgb(232,101,46)` → `rgb(14,90,136)` (ninja blue)
- `rgb(245,208,120)` → `rgb(127,0,255)` (purple glow)

Update shadowBlur glow color to cyan.

**Step 4: Screenshot full atmosphere**

```bash
node screenshot.mjs http://localhost:3000 atmosphere
```

**Step 5: Commit**

```bash
git add frontend/src/components/MistLayer.jsx frontend/src/components/TorchLight.jsx frontend/src/components/EmberField.jsx
git commit -m "style: shift atmosphere effects to cool cyan/blue electric tones"
```

---

### Task 13: Final Visual Review + Deploy

**Step 1: Full-page screenshots of all key pages**

```bash
node screenshot.mjs http://localhost:3000 final-login
# log in
node screenshot.mjs http://localhost:3000 final-dashboard
# navigate to agent-finder
node screenshot.mjs http://localhost:3000 final-agent-finder
```

**Step 2: Compare against Brand Colors.png**

Check:
- Background darkness matches `#0B0F14`
- Gold brightness matches `#F6C445`
- Cyan accents match `#00C6FF`
- Red buttons match `#E53935`
- Text readability on new backgrounds
- Card hover states feel electric/neon

**Step 3: Fix any mismatches found**

**Step 4: Push to GitHub and deploy**

```bash
git push origin master
cd frontend && npx vercel --prod
```

---

## Summary

| Phase | Tasks | Focus |
|-------|-------|-------|
| Phase 1 | Tasks 1–6 | CSS variables, shadows, global styles |
| Phase 2 | Tasks 7–9 | Dashboard cards, buttons, header |
| Phase 3 | Tasks 10–13 | Sidebar, login, atmosphere, deploy |

**Total estimated tasks:** 13
**Total files modified:** ~10
