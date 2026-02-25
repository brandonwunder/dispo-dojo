# Remove GlassShell Background Containers — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the GlassShell wrapper component from 8 pages so individual cards sit directly on the background image, making backgrounds more visible.

**Architecture:** Each page wraps its content cards in a `<GlassShell>` component that renders a semi-transparent card with animated border, ambient orbs, and backdrop blur. We remove the `<GlassShell>` tag while preserving the inner content, layout containers, and all `<GlassPanel>` cards. The `GlassShell` import is also removed from each file.

**Tech Stack:** React, Tailwind CSS, framer-motion

---

## Scope

**8 pages, 9 GlassShell instances to remove:**

| # | Page | File | Instances |
|---|------|------|-----------|
| 1 | AdminDashboard | `frontend/src/pages/AdminDashboard.jsx` | 1 |
| 2 | BootsOnGround | `frontend/src/pages/BootsOnGround.jsx` | 2 (wizard + main) |
| 3 | BuyBoxes | `frontend/src/pages/BuyBoxes.jsx` | 1 |
| 4 | ContractGenerator | `frontend/src/pages/ContractGenerator.jsx` | 1 |
| 5 | FindBuyers | `frontend/src/pages/FindBuyers.jsx` | 1 |
| 6 | OfferComparison | `frontend/src/pages/OfferComparison.jsx` | 1 |
| 7 | Scripts | `frontend/src/pages/Scripts.jsx` | 1 |
| 8 | WebsiteExplainer | `frontend/src/pages/WebsiteExplainer.jsx` | 1 |

**NOT touched:** LOISender (per user request), BirdDog, CallRecordings (already no GlassShell), all other pages.

## Pattern

For each page, the transformation is:

**Before:**
```jsx
import GlassShell from '../components/GlassShell'
...
<GlassShell orbColors="..." maxWidth="max-w-[...]">
  {/* inner content */}
</GlassShell>
```

**After:**
```jsx
// GlassShell import removed
...
{/* inner content — now unwrapped */}
```

The GlassShell already sits inside a `max-w-*` container div on most pages, so layout is preserved. Where GlassShell provided the only `max-w-*` or `mx-auto`, we keep those on the parent.

---

### Task 1: AdminDashboard

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx`

**Step 1: Remove GlassShell import (line 8)**
Delete the line: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 367 and 585)**
Remove `<GlassShell orbColors="default" maxWidth="max-w-[1200px]">` (line 367) and its closing `</GlassShell>` (line 585). Keep all content between them in place.

**Step 3: Verify the app compiles**
Run: `cd frontend && npx vite build --mode development 2>&1 | head -20`
Expected: Build succeeds with no errors.

**Step 4: Commit**
```bash
git add frontend/src/pages/AdminDashboard.jsx
git commit -m "refactor: remove GlassShell from AdminDashboard"
```

---

### Task 2: BootsOnGround

**Files:**
- Modify: `frontend/src/pages/BootsOnGround.jsx`

**Step 1: Remove GlassShell import (line 13)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove OnboardingWizard GlassShell (lines 143 and 334)**
Remove `<GlassShell orbColors="purple" maxWidth="max-w-lg">` and its closing `</GlassShell>`. Keep all inner content (step indicator, GlassPanel, navigation buttons).

**Step 3: Remove MainView GlassShell (lines 490 and 589)**
Remove `<GlassShell orbColors="emerald">` and its closing `</GlassShell>`. Keep the inner grid div.

**Step 4: Verify the app compiles**
Run: `cd frontend && npx vite build --mode development 2>&1 | head -20`

**Step 5: Commit**
```bash
git add frontend/src/pages/BootsOnGround.jsx
git commit -m "refactor: remove GlassShell from BootsOnGround"
```

---

### Task 3: BuyBoxes

**Files:**
- Modify: `frontend/src/pages/BuyBoxes.jsx`

**Step 1: Remove GlassShell import (line 7)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 132 and 348)**
Remove `<GlassShell orbColors="gold" maxWidth="max-w-[900px]">` and its closing `</GlassShell>`. Keep the inner grid div and all GlassPanels.

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/BuyBoxes.jsx
git commit -m "refactor: remove GlassShell from BuyBoxes"
```

---

### Task 4: ContractGenerator

**Files:**
- Modify: `frontend/src/pages/ContractGenerator.jsx`

**Step 1: Remove GlassShell import (line 14)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 921 and 951)**
Remove `<GlassShell orbColors="default" maxWidth="max-w-[1200px]">` and its closing `</GlassShell>`. Also remove the comment on line 920. Keep StepIndicator, step content, and ContractHistory.

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/ContractGenerator.jsx
git commit -m "refactor: remove GlassShell from ContractGenerator"
```

---

### Task 5: FindBuyers

**Files:**
- Modify: `frontend/src/pages/FindBuyers.jsx`

**Step 1: Remove GlassShell import (line 8)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 543 and 750)**
Remove `<GlassShell orbColors="default" maxWidth="max-w-[1000px]">` and its closing `</GlassShell>`. Keep all inner content (advantage banner, platform cards, buyer types, blurred table, bottom CTA).

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/FindBuyers.jsx
git commit -m "refactor: remove GlassShell from FindBuyers"
```

---

### Task 6: OfferComparison

**Files:**
- Modify: `frontend/src/pages/OfferComparison.jsx`

**Step 1: Remove GlassShell import (line 8)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 324 and 592)**
Remove `<GlassShell orbColors="default" maxWidth="max-w-[1000px]">` and its closing `</GlassShell>`. Keep disclaimer, history panel, input form, and results.

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/OfferComparison.jsx
git commit -m "refactor: remove GlassShell from OfferComparison"
```

---

### Task 7: Scripts

**Files:**
- Modify: `frontend/src/pages/Scripts.jsx`

**Step 1: Remove GlassShell import (line 4)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 348 and 421)**
Remove `<GlassShell orbColors="default" maxWidth="max-w-[900px]">` and its closing `</GlassShell>`. Keep the tab bar and content divs.

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/Scripts.jsx
git commit -m "refactor: remove GlassShell from Scripts"
```

---

### Task 8: WebsiteExplainer

**Files:**
- Modify: `frontend/src/pages/WebsiteExplainer.jsx`

**Step 1: Remove GlassShell import (line 4)**
Delete: `import GlassShell from '../components/GlassShell'`

**Step 2: Remove GlassShell wrapper (lines 90 and 219)**
Remove `<GlassShell orbColors="default">` and its closing `</GlassShell>`. Keep URL section, usage tips grid, and coming soon note.

**Step 3: Verify + Commit**
```bash
cd frontend && npx vite build --mode development 2>&1 | head -20
git add frontend/src/pages/WebsiteExplainer.jsx
git commit -m "refactor: remove GlassShell from WebsiteExplainer"
```

---

### Task 9: Visual Verification

**Step 1: Start dev server**
Run: `node serve.mjs` (if not already running)

**Step 2: Screenshot key pages and compare**
Take screenshots of at least 4 pages (BuyBoxes, FindBuyers, Scripts, AdminDashboard) to visually confirm:
- Background image is now visible behind the individual cards
- Cards still have their glass styling
- Layout/spacing is preserved
- No broken elements

**Step 3: Fix any spacing issues**
If removing GlassShell caused any cards to lose their `mb-8` bottom margin or max-width constraint, add those directly to the parent container.
