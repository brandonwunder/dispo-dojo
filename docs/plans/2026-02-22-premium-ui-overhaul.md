# Premium UI Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Agent Finder UI into a luxury dark SaaS experience with GSAP animations, glassmorphism, micro-interactions, and bug fixes (total/remaining counters, concurrent uploads).

**Architecture:** Single-file frontend overhaul of `templates/index.html`. All CSS, HTML, and JS live in one file. GSAP + Lucide loaded via CDN. No backend changes. The existing structure (nav → header → drop zone → progress → results → history → modal) stays identical — we're re-skinning and adding motion.

**Tech Stack:** GSAP 3.12 + ScrollTrigger (CDN), Lucide Icons (CDN), CSS custom properties, vanilla JS.

**Design doc:** `docs/plans/2026-02-22-premium-ui-overhaul-design.md`

---

### Task 1: CDN Dependencies + CSS Variables

**Files:**
- Modify: `agent_finder/templates/index.html:1-10` (head section)
- Modify: `agent_finder/templates/index.html:12-31` (CSS variables)

**Step 1: Add GSAP and Lucide CDN scripts to `<head>`**

Add before `</head>` (before `<style>`):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

**Step 2: Update CSS custom properties**

Replace the `:root` block with expanded palette:

```css
:root {
  --bg: #0a0a0f;
  --bg-elevated: #12121a;
  --bg-card: #16161f;
  --glass: rgba(22, 22, 31, 0.6);
  --glass-border: rgba(201, 169, 110, 0.08);
  --glass-border-hover: rgba(201, 169, 110, 0.18);
  --border: #1e1e2a;
  --border-hover: #2e2e3d;
  --gold: #c9a96e;
  --gold-bright: #dfc08a;
  --gold-dim: #a08550;
  --gold-glow: rgba(201, 169, 110, 0.12);
  --gold-glow-strong: rgba(201, 169, 110, 0.25);
  --text: #e8e6e2;
  --text-dim: #8a8790;
  --text-muted: #4e4d55;
  --success: #6ee7a0;
  --warning: #f0c060;
  --error: #f07070;
  --blue: #70b8f0;
  --purple: #a78bfa;
  --radius: 14px;
  --radius-sm: 10px;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', -apple-system, sans-serif;
}
```

**Step 3: Verify** — Refresh browser, page should load with slightly darker tones. No visual breakage.

---

### Task 2: Animated Background + Atmosphere

**Files:**
- Modify: `agent_finder/templates/index.html` — CSS `body::before` and `.ambient` sections (~lines 44-64)

**Step 1: Replace the static ambient glow and noise with animated gradient mesh**

Replace `body::before` and `.ambient` CSS with:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 9999;
}

.gradient-mesh {
  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.gradient-mesh .orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.gradient-mesh .orb-1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(201, 169, 110, 0.2) 0%, transparent 70%);
  top: -200px;
  left: 30%;
  animation: orbFloat1 20s ease-in-out infinite;
}

.gradient-mesh .orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(120, 100, 180, 0.12) 0%, transparent 70%);
  top: 40%;
  right: -100px;
  animation: orbFloat2 25s ease-in-out infinite;
}

.gradient-mesh .orb-3 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(80, 120, 180, 0.1) 0%, transparent 70%);
  bottom: -100px;
  left: -50px;
  animation: orbFloat3 22s ease-in-out infinite;
}

@keyframes orbFloat1 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(60px, 40px); }
  66% { transform: translate(-40px, 20px); }
}

@keyframes orbFloat2 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-50px, -30px); }
  66% { transform: translate(30px, 50px); }
}

@keyframes orbFloat3 {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(40px, -40px); }
  66% { transform: translate(-30px, 30px); }
}
```

**Step 2: Update HTML** — Replace `<div class="ambient"></div>` with:

```html
<div class="gradient-mesh">
  <div class="orb orb-1"></div>
  <div class="orb orb-2"></div>
  <div class="orb orb-3"></div>
</div>
```

**Step 3: Verify** — Refresh, see slowly drifting gradient orbs behind content.

---

### Task 3: Glassmorphism + Button Upgrades

**Files:**
- Modify: `agent_finder/templates/index.html` — CSS for cards, buttons (~lines 114-340, 387-413, 589-661, 749-791)

**Step 1: Add global glass mixin styles**

Add after `:root`:

```css
/* Glass utility */
.glass {
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
}

.glass:hover {
  border-color: var(--glass-border-hover);
}
```

**Step 2: Update card styles to use glass**

Update `.drop-zone`:
```css
.drop-zone {
  position: relative;
  border: 1.5px dashed var(--glass-border-hover);
  border-radius: var(--radius);
  padding: 64px 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.drop-zone:hover, .drop-zone.drag-over {
  border-color: var(--gold-dim);
  background: linear-gradient(180deg, rgba(201,169,110,0.06) 0%, var(--glass) 100%);
  box-shadow: 0 0 80px -20px var(--gold-glow), 0 0 0 1px var(--glass-border-hover);
}
```

Update `.stat-card`:
```css
.stat-card {
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 18px 16px;
  text-align: center;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  border-color: var(--glass-border-hover);
}
```

Update `.history-item`:
```css
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  padding: 18px 22px;
  transition: border-color 0.3s, box-shadow 0.3s, transform 0.3s;
}

.history-item:hover {
  border-color: var(--glass-border-hover);
  box-shadow: 0 4px 24px -8px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}
```

Update `.active-job-card`:
```css
.active-job-card {
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--gold-dim);
  border-radius: var(--radius);
  padding: 20px 24px;
  margin-bottom: 10px;
  box-shadow: 0 0 30px -10px var(--gold-glow);
}
```

Update `.file-info`:
```css
.file-info {
  display: none;
  align-items: center;
  justify-content: space-between;
  background: var(--glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  padding: 18px 22px;
  margin-top: 16px;
}
```

Update `.delete-modal`:
```css
.delete-modal {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border-hover);
  border-radius: var(--radius);
  padding: 36px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 24px 80px -20px rgba(0,0,0,0.5);
}
```

**Step 3: Upgrade button styles**

Add shimmer keyframe:
```css
@keyframes shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

Update `.btn-gold`:
```css
.btn-gold {
  background: linear-gradient(135deg, var(--gold), var(--gold-bright), var(--gold));
  background-size: 200% 100%;
  color: #0b0b0f;
  font-weight: 600;
  box-shadow: 0 2px 12px -2px rgba(201,169,110,0.3);
  transition: all 0.3s ease;
}

.btn-gold:hover {
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
  box-shadow: 0 4px 24px -4px rgba(201,169,110,0.5);
  transform: translateY(-1px);
}
```

Update `.btn-outline` hover:
```css
.btn-outline:hover {
  border-color: var(--gold-dim);
  background: var(--gold-glow);
  color: var(--text);
  box-shadow: 0 0 20px -6px var(--gold-glow);
}
```

Update `.btn-danger` hover:
```css
.btn-danger:hover {
  background: rgba(240,112,112,0.1);
  border-color: rgba(240,112,112,0.4);
  box-shadow: 0 0 20px -6px rgba(240,112,112,0.2);
  transform: translateY(-1px);
}
```

**Step 4: Verify** — Refresh. All cards should have glass effect, buttons should shimmer on hover.

---

### Task 4: Nav Bar + Progress Bar Glow

**Files:**
- Modify: `agent_finder/templates/index.html` — CSS for nav bar (~lines 663-746) and progress bar (~lines 364-378)

**Step 1: Upgrade nav bar glass effect**

```css
.nav-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10, 10, 15, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--glass-border);
  padding: 0 32px;
  display: flex;
  align-items: center;
  height: 54px;
  gap: 16px;
  transition: background 0.3s;
}
```

Update `.nav-pill` with pulse border for active:
```css
.nav-pill.active {
  border-color: var(--gold);
  color: var(--gold);
  background: var(--gold-glow);
  box-shadow: 0 0 16px -4px var(--gold-glow-strong);
  animation: pillPulse 2s ease-in-out infinite;
}

@keyframes pillPulse {
  0%, 100% { box-shadow: 0 0 16px -4px var(--gold-glow-strong); }
  50% { box-shadow: 0 0 24px -2px var(--gold-glow-strong); }
}
```

**Step 2: Animated progress bar**

```css
.progress-bar-wrap {
  background: var(--bg-card);
  border-radius: 8px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
}

.progress-bar {
  height: 100%;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--gold-dim), var(--gold), var(--gold-bright), var(--gold));
  background-size: 300% 100%;
  animation: progressSweep 2s ease-in-out infinite;
  width: 0%;
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 16px 2px var(--gold-glow-strong);
  position: relative;
}

@keyframes progressSweep {
  0% { background-position: 0% center; }
  100% { background-position: 300% center; }
}
```

**Step 3: Verify** — Refresh. Nav bar more translucent. Progress bar (when visible) has animated gradient sweep + glow.

---

### Task 5: Progress Section — Total/Remaining + Icons

**Files:**
- Modify: `agent_finder/templates/index.html` — progress stats grid HTML (~lines 867-872) and CSS (~lines 380-413) and JS progress handler (~lines 1142-1152)

**Step 1: Update progress stats grid from 4 to 6 columns**

CSS change:
```css
.progress-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}
```

(3 columns × 2 rows = 6 cards)

Add stat card icon styling:
```css
.stat-card .stat-icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

.stat-card .stat-icon svg {
  width: 18px;
  height: 18px;
}

.stat-card.found .stat-icon { color: var(--success); }
.stat-card.partial .stat-icon { color: var(--warning); }
.stat-card.cached .stat-icon { color: var(--blue); }
.stat-card.missing .stat-icon { color: var(--error); }
.stat-card.total-card .stat-icon { color: var(--text-dim); }
.stat-card.remaining-card .stat-icon { color: var(--gold); }
.stat-card.total-card .stat-value { color: var(--text); }
.stat-card.remaining-card .stat-value { color: var(--gold); }
```

**Step 2: Update HTML — add icons and Total/Remaining cards**

```html
<div class="progress-stats">
  <div class="stat-card found">
    <div class="stat-icon"><i data-lucide="check-circle"></i></div>
    <div class="stat-value" id="statFound">0</div>
    <div class="stat-label">Found</div>
  </div>
  <div class="stat-card partial">
    <div class="stat-icon"><i data-lucide="alert-triangle"></i></div>
    <div class="stat-value" id="statPartial">0</div>
    <div class="stat-label">Partial</div>
  </div>
  <div class="stat-card cached">
    <div class="stat-icon"><i data-lucide="database"></i></div>
    <div class="stat-value" id="statCached">0</div>
    <div class="stat-label">Cached</div>
  </div>
  <div class="stat-card missing">
    <div class="stat-icon"><i data-lucide="x-circle"></i></div>
    <div class="stat-value" id="statMissing">0</div>
    <div class="stat-label">Not Found</div>
  </div>
  <div class="stat-card total-card">
    <div class="stat-icon"><i data-lucide="list"></i></div>
    <div class="stat-value" id="statTotal">0</div>
    <div class="stat-label">Total</div>
  </div>
  <div class="stat-card remaining-card">
    <div class="stat-icon"><i data-lucide="hourglass"></i></div>
    <div class="stat-value" id="statRemaining">0</div>
    <div class="stat-label">Remaining</div>
  </div>
</div>
```

**Step 3: Update JS progress handler**

In the `listenProgress` SSE handler, after setting Found/Partial/Cached/Missing, add:

```javascript
document.getElementById('statTotal').textContent = total;
const done = (d.completed || 0) + (d.cached || 0);
document.getElementById('statRemaining').textContent = Math.max(0, total - done);
```

Also set total when progress section first appears in `startProcessing()`:
```javascript
document.getElementById('statTotal').textContent = data.total;
document.getElementById('statRemaining').textContent = data.total;
```

And in `reconnectJob()`:
```javascript
document.getElementById('statTotal').textContent = total;
document.getElementById('statRemaining').textContent = total;
```

**Step 4: Initialize Lucide icons**

At the end of `DOMContentLoaded` handler, add:
```javascript
lucide.createIcons();
```

**Step 5: Verify** — Refresh. Progress section should show 6 cards in 3×2 grid with Lucide icons. Total and Remaining should update during processing.

---

### Task 6: GSAP Count-Up Animation + Address Fade

**Files:**
- Modify: `agent_finder/templates/index.html` — JS section

**Step 1: Add GSAP count-up helper function**

```javascript
function animateValue(elementId, newValue) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const current = parseInt(el.textContent) || 0;
  const target = parseInt(newValue) || 0;
  if (current === target) return;
  gsap.to({ val: current }, {
    val: target,
    duration: 0.4,
    ease: 'power2.out',
    onUpdate: function() {
      el.textContent = Math.round(this.targets()[0].val);
    }
  });
}
```

**Step 2: Replace direct `.textContent` assignments in progress handler**

Replace:
```javascript
document.getElementById('statFound').textContent = d.found;
document.getElementById('statPartial').textContent = d.partial;
document.getElementById('statCached').textContent = d.cached;
document.getElementById('statMissing').textContent = d.not_found;
```

With:
```javascript
animateValue('statFound', d.found);
animateValue('statPartial', d.partial);
animateValue('statCached', d.cached);
animateValue('statMissing', d.not_found);
animateValue('statTotal', total);
animateValue('statRemaining', Math.max(0, total - done));
```

**Step 3: Add address fade-swap**

Replace:
```javascript
progressAddress.textContent = d.current_address || '';
```

With:
```javascript
const newAddr = d.current_address || '';
if (progressAddress.textContent !== newAddr) {
  gsap.to(progressAddress, {
    opacity: 0, duration: 0.15, ease: 'power1.in',
    onComplete: () => {
      progressAddress.textContent = newAddr;
      gsap.to(progressAddress, { opacity: 1, duration: 0.15, ease: 'power1.out' });
    }
  });
}
```

**Step 4: Verify** — Upload a file, watch stat numbers animate smoothly between values and addresses fade-swap.

---

### Task 7: Success Rate Donut Chart

**Files:**
- Modify: `agent_finder/templates/index.html` — CSS for `.success-rate`, HTML for `#successRate`, JS completion handler

**Step 1: Update CSS**

Replace `.success-rate` styles with:
```css
.success-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 32px 0;
}

.success-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.success-ring svg {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}

.success-ring .ring-bg {
  fill: none;
  stroke: var(--border);
  stroke-width: 8;
}

.success-ring .ring-fill {
  fill: none;
  stroke: var(--gold);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 314;
  stroke-dashoffset: 314;
  filter: drop-shadow(0 0 6px var(--gold-glow-strong));
}

.success-ring .ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--gold);
}

.success-rate-label {
  font-size: 0.85rem;
  color: var(--text-dim);
}
```

**Step 2: Update HTML**

Replace `<div class="success-rate" id="successRate"></div>` with:
```html
<div class="success-rate" id="successRate">
  <div class="success-ring">
    <svg viewBox="0 0 120 120">
      <circle class="ring-bg" cx="60" cy="60" r="50"/>
      <circle class="ring-fill" id="successRingFill" cx="60" cy="60" r="50"/>
    </svg>
    <div class="ring-text" id="successRingText">0%</div>
  </div>
  <div class="success-rate-label">success rate</div>
</div>
```

**Step 3: Update JS completion handler**

Replace the success rate innerHTML assignment with:
```javascript
if (d.summary) {
  // ... existing stat updates ...

  // Animate donut chart
  const pctStr = d.summary.success_rate; // e.g. "85.2%"
  const pct = parseFloat(pctStr) / 100;
  const circumference = 314; // 2 * PI * 50
  const offset = circumference * (1 - pct);

  document.getElementById('successRingText').textContent = pctStr;
  gsap.to('#successRingFill', {
    strokeDashoffset: offset,
    duration: 1.2,
    ease: 'power2.out',
    delay: 0.3
  });
}
```

**Step 4: Verify** — Complete a job, see the gold donut ring animate to fill the success percentage.

---

### Task 8: GSAP Page Load Timeline + Section Entrances

**Files:**
- Modify: `agent_finder/templates/index.html` — JS DOMContentLoaded handler and CSS

**Step 1: Remove CSS `animation: fadeUp` from elements** (GSAP will handle this)

Remove `animation: fadeUp ...` from these CSS rules:
- `header` (line ~78)
- `.drop-zone` (line ~200)
- `.history-section` (line ~555)
- `.file-info` (line ~270)
- `.active-jobs` (line ~109)

Set initial hidden state instead:
```css
header, .drop-zone, .file-info, .history-section, .active-jobs {
  opacity: 0;
}
```

Keep the `@keyframes fadeUp` definition (used by other things like delete confirm).

**Step 2: Add GSAP entrance timeline in DOMContentLoaded**

```javascript
// Page entrance timeline
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

tl.from('.nav-bar', { y: -20, opacity: 0, duration: 0.5 })
  .from('.header-logo', { scale: 0.8, opacity: 0, duration: 0.6, ease: 'back.out(1.7)' }, 0.15)
  .from('header p', { y: 10, opacity: 0, duration: 0.5 }, 0.35)
  .from('.drop-zone', { y: 20, opacity: 0, duration: 0.5 }, 0.45)
  .from('.history-section', { y: 20, opacity: 0, duration: 0.5 }, 0.55);

// Set opacity to 1 for elements managed by GSAP (so they're not stuck invisible if GSAP hasn't loaded)
gsap.set(['header', '.drop-zone', '.history-section'], { opacity: 1 });
```

**Step 3: Add stagger entrance for history items**

In `loadAllJobs()`, after appending all history items to `historyList`, add:
```javascript
gsap.from('.history-item', {
  x: 30, opacity: 0, duration: 0.4,
  stagger: 0.06, ease: 'power2.out',
  clearProps: 'all'
});
```

**Step 4: Add stagger entrance for results table rows**

In the completion handler, after appending all table rows, add:
```javascript
gsap.from('#resultsBody tr', {
  y: 12, opacity: 0, duration: 0.3,
  stagger: 0.03, ease: 'power2.out',
  clearProps: 'all'
});
```

**Step 5: Verify** — Refresh page. Elements should stagger in smoothly. History items slide from right.

---

### Task 9: Drop Zone Micro-interactions

**Files:**
- Modify: `agent_finder/templates/index.html` — JS drop zone handlers

**Step 1: Add GSAP spring hover on drop zone**

```javascript
dropZone.addEventListener('mouseenter', () => {
  gsap.to(dropZone, { scale: 1.015, duration: 0.4, ease: 'power2.out' });
  gsap.to('.drop-icon', { scale: 1.1, rotation: 5, duration: 0.4, ease: 'back.out(2)' });
});

dropZone.addEventListener('mouseleave', () => {
  gsap.to(dropZone, { scale: 1, duration: 0.3, ease: 'power2.inOut' });
  gsap.to('.drop-icon', { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.inOut' });
});
```

**Step 2: Add icon morph on file select**

In `handleFile()`, after setting the file info, add:
```javascript
// Morph upload icon to checkmark
gsap.to('.drop-icon svg', {
  rotation: 360, scale: 0, duration: 0.3,
  onComplete: () => {
    document.querySelector('.drop-icon').innerHTML = '<i data-lucide="check" style="width:22px;height:22px;color:var(--gold);"></i>';
    lucide.createIcons();
    gsap.from('.drop-icon i', { scale: 0, duration: 0.4, ease: 'back.out(3)' });
  }
});
```

**Step 3: Reset icon in `resetAll()`**

Add to `resetAll()`:
```javascript
document.querySelector('.drop-icon').innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';
```

**Step 4: Verify** — Hover drop zone (subtle scale up), drop a file (icon spins and morphs to checkmark).

---

### Task 10: Delete Modal GSAP + History Delete Animation

**Files:**
- Modify: `agent_finder/templates/index.html` — JS `confirmDelete()`, `executeDelete()`, `closeDeleteModal()`

**Step 1: GSAP modal entrance**

Update `confirmDelete()`:
```javascript
function confirmDelete(jobId) {
  const modal = document.getElementById('deleteModal');
  const confirmBtn = document.getElementById('deleteModalConfirm');
  confirmBtn.onclick = function(e) {
    e.stopPropagation();
    executeDelete(jobId);
  };
  modal.classList.add('visible');
  gsap.from('.delete-modal', { scale: 0.92, opacity: 0, duration: 0.25, ease: 'back.out(1.5)' });
}
```

**Step 2: GSAP modal exit**

Update `closeDeleteModal()`:
```javascript
function closeDeleteModal() {
  gsap.to('.delete-modal', {
    scale: 0.95, opacity: 0, duration: 0.15, ease: 'power2.in',
    onComplete: () => {
      document.getElementById('deleteModal').classList.remove('visible');
      gsap.set('.delete-modal', { clearProps: 'all' });
    }
  });
}
```

**Step 3: Animate delete item out**

In `executeDelete()`, replace the item animation with:
```javascript
const item = document.getElementById('history-' + jobId);
if (item) {
  gsap.to(item, {
    x: -30, opacity: 0, height: 0, padding: 0, margin: 0,
    duration: 0.35, ease: 'power2.in',
    onComplete: () => { loadHistory(); }
  });
} else {
  loadHistory();
}
```

**Step 4: Verify** — Click delete on a history item, modal scales in, click Delete, item slides out left and disappears.

---

### Task 11: Concurrent Upload Fix (goHome)

**Files:**
- Modify: `agent_finder/templates/index.html` — JS `goHome()` function

**Step 1: Update goHome to re-show upload zone**

Find `goHome()` and ensure it re-shows the drop zone and hides the progress/results sections, so users can start another upload while a job runs:

```javascript
function goHome() {
  // Detach from current progress view but don't cancel the job
  if (currentEventSource) {
    currentEventSource.close();
    currentEventSource = null;
  }

  // Hide progress and results
  progressSection.classList.remove('visible');
  resultsSection.classList.remove('visible');
  hideError();

  // Show the upload zone again
  dropZone.style.display = '';
  fileInfo.classList.remove('visible');
  selectedFile = null;
  fileInput.value = '';
  startBtn.disabled = false;
  startBtn.textContent = 'Find Agents';

  // Reset drop zone icon
  document.querySelector('.drop-icon').innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>';

  // Refresh active jobs list
  loadAllJobs();

  // Animate entrance
  gsap.from('.drop-zone', { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' });
}
```

**Step 2: Verify** — Start a job, click home in nav, upload zone reappears, start another file — both jobs should run.

---

### Task 12: Floating Particles

**Files:**
- Modify: `agent_finder/templates/index.html` — HTML (add canvas) + JS (particle system)

**Step 1: Add particle canvas to HTML**

After the gradient-mesh div:
```html
<canvas id="particleCanvas"></canvas>
```

**Step 2: Add CSS**

```css
#particleCanvas {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}
```

**Step 3: Add particle system JS**

At the end of the script, before DOMContentLoaded:

```javascript
// Floating particles
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 15;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(201, 169, 110, ${p.opacity})`;
      ctx.fill();

      p.x += p.speedX;
      p.y += p.speedY;

      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
      if (p.y < -10) p.y = canvas.height + 10;
      if (p.y > canvas.height + 10) p.y = -10;
    });
    requestAnimationFrame(draw);
  }
  draw();
}
```

Call `initParticles()` in `DOMContentLoaded`.

**Step 4: Verify** — Refresh. Tiny gold dots slowly drift across the background.

---

### Task 13: Results Table Glow + Responsive Updates

**Files:**
- Modify: `agent_finder/templates/index.html` — CSS for table and responsive breakpoints

**Step 1: Add table row hover glow**

```css
tbody tr:hover {
  background: rgba(201, 169, 110, 0.03);
  box-shadow: inset 3px 0 0 var(--gold-dim);
}
```

**Step 2: Glass-style table header**

```css
thead {
  background: var(--glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.results-table-wrap {
  border: 1px solid var(--glass-border);
  border-radius: var(--radius);
  overflow: hidden;
  overflow-x: auto;
  background: var(--glass);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
```

**Step 3: Update responsive breakpoints**

```css
@media (max-width: 640px) {
  .container { padding: 40px 16px 60px; }
  .progress-stats { grid-template-columns: repeat(2, 1fr); }
  .file-info { flex-direction: column; gap: 12px; text-align: center; }
  .history-item { flex-direction: column; align-items: flex-start; gap: 12px; }
  .history-item-actions { margin-left: 0; }
  .active-job-top { flex-direction: column; align-items: flex-start; gap: 8px; }
  .nav-bar { padding: 0 16px; }
  .success-ring { width: 100px; height: 100px; }
  .success-ring svg { width: 100px; height: 100px; }
  .success-ring .ring-text { font-size: 1.3rem; }
}
```

**Step 4: Verify** — Refresh. Table rows glow gold on hover. Resize to mobile — grid goes to 2-col.

---

### Task 14: Final Polish + Reset All Stats

**Files:**
- Modify: `agent_finder/templates/index.html` — JS cleanup

**Step 1: Reset all 6 stat values in `resetAll()`**

Add to `resetAll()`:
```javascript
['statFound','statPartial','statCached','statMissing','statTotal','statRemaining'].forEach(id => {
  document.getElementById(id).textContent = '0';
});
// Reset donut chart
gsap.set('#successRingFill', { strokeDashoffset: 314 });
document.getElementById('successRingText').textContent = '0%';
```

**Step 2: Reset stat values in `reconnectJob()`**

Add clearing of stat card values so they start fresh when reconnecting.

**Step 3: Verify full flow**

1. Refresh page — smooth GSAP entrance
2. Hover drop zone — spring scale
3. Drop a CSV — icon morphs to checkmark
4. Click "Find Agents" — progress section shows with 6 stat cards (including Total & Remaining)
5. Numbers count up with GSAP, address fades between updates
6. ETA shows time remaining
7. Click Home in nav — upload zone reappears
8. Upload another file simultaneously — both run, nav shows pills
9. Job completes — donut chart animates, table rows stagger in
10. Delete a past run — modal scales in, item slides out
11. Mobile resize — everything adapts

**Step 4: Restart server and final test**

```bash
# Kill and restart
netstat -ano | grep :9000  # find PID
taskkill /PID <pid> /F
cd "c:/Users/brand/OneDrive/Desktop/Agent Finder"
python -m agent_finder.app
```

---

## Implementation Order Summary

| Task | Description | Estimated Size |
|------|-------------|----------------|
| 1 | CDN deps + CSS variables | Small |
| 2 | Animated gradient background | Small |
| 3 | Glassmorphism + button upgrades | Medium |
| 4 | Nav bar + progress bar glow | Small |
| 5 | Total/Remaining stat cards + icons | Medium |
| 6 | GSAP count-up + address fade | Small |
| 7 | Success rate donut chart | Medium |
| 8 | GSAP page load timeline | Medium |
| 9 | Drop zone micro-interactions | Small |
| 10 | Delete modal GSAP + history animation | Small |
| 11 | Concurrent upload fix | Small |
| 12 | Floating particles | Small |
| 13 | Table glow + responsive | Small |
| 14 | Final polish + full verification | Small |
