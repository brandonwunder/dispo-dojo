# Ancient Dojo Design Overhaul — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Dispo Dojo from a generic dark-mode SaaS into a fully immersive Japanese martial arts dojo experience with custom cursor, smoke transitions, shoji panel cards, cherry blossom backgrounds, and ninja-themed micro-interactions across all 14+ pages.

**Architecture:** Bottom-up approach — build the design system tokens and shared components first, then update the layout shell (sidebar, header, backgrounds), then overhaul each page. Each phase builds on the previous. New components are created alongside existing ones, then swapped in page by page.

**Tech Stack:** React 19, Tailwind CSS 4, Framer Motion 12, GSAP 3, Three.js, Lenis. Custom Onari font (.otf). No new major dependencies.

---

## Phase 1: Design System Foundation

### Task 1: Move Onari font and set up @font-face

**Files:**
- Move: `Onari Font.otf` → `frontend/src/assets/fonts/Onari.otf`
- Modify: `frontend/src/index.css`

**Step 1: Create fonts directory and move the font file**

```bash
mkdir -p frontend/src/assets/fonts
cp "Onari Font.otf" frontend/src/assets/fonts/Onari.otf
```

**Step 2: Add @font-face declarations to index.css**

Add BEFORE the `@theme` block in `frontend/src/index.css`:

```css
@font-face {
  font-family: 'Onari';
  src: url('./assets/fonts/Onari.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

**Step 3: Verify the app still loads**

Run: `cd frontend && npm run dev`
Expected: App loads without errors, no font loading failures in console.

---

### Task 2: Update Google Fonts in index.html

**Files:**
- Modify: `frontend/index.html`

**Step 1: Replace the Google Fonts link**

Replace the existing `<link>` for Google Fonts with:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400..700&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Rajdhani:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
  rel="stylesheet"
/>
```

This removes Playfair Display and adds Rajdhani + JetBrains Mono.

**Step 2: Verify fonts load in browser Network tab**

Expected: Rajdhani and JetBrains Mono font files downloaded successfully.

---

### Task 3: Update color tokens and font tokens in index.css

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Replace the entire `@theme` block**

```css
@theme {
  /* Background colors — deeper dojo void */
  --color-bg: #08080e;
  --color-bg-elevated: #0f0f18;
  --color-bg-card: #13131d;
  --color-glass: rgba(19, 19, 29, 0.6);
  --color-glass-border: rgba(212, 168, 83, 0.08);
  --color-glass-border-hover: rgba(212, 168, 83, 0.18);
  --color-border: #1a1a28;

  /* Gold accent — warm lantern light */
  --color-gold: #d4a853;
  --color-gold-bright: #e8c36b;
  --color-gold-dim: #8b7340;
  --color-gold-glow: rgba(212, 168, 83, 0.12);
  --color-gold-glow-strong: rgba(212, 168, 83, 0.25);

  /* Crimson — blood red for danger */
  --color-crimson: #8b2232;
  --color-crimson-bright: #c43a4f;

  /* Ink & Parchment — dojo texture */
  --color-ink: #1a1a2e;
  --color-parchment: rgba(214, 198, 172, 0.03);

  /* Text — candlelit warmth */
  --color-text-primary: #ede9e3;
  --color-text-dim: #7a7680;
  --color-text-muted: #4a4850;

  /* Status colors */
  --color-success: #6ee7a0;
  --color-warning: #f0c060;
  --color-error: #f07070;
  --color-info: #70b8f0;

  /* Fonts */
  --font-display: 'Onari', serif;
  --font-heading: 'Rajdhani', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Step 2: Add new utility classes after the body rule**

```css
/* Dojo typography utilities */
.font-heading {
  font-family: var(--font-heading);
}

.font-mono {
  font-family: var(--font-mono);
}

/* Brush stroke underline — used on section headers */
.brush-underline {
  position: relative;
  display: inline-block;
}

.brush-underline::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, var(--color-gold) 0%, var(--color-gold-dim) 60%, transparent 100%);
  border-radius: 2px;
  mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='6'%3E%3Cpath d='M0 3 Q25 0.5 50 3 Q75 5.5 100 3 Q125 0.5 150 3 Q175 5.5 200 3' stroke='black' stroke-width='6' fill='none'/%3E%3C/svg%3E");
  mask-size: 100% 100%;
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='6'%3E%3Cpath d='M0 3 Q25 0.5 50 3 Q75 5.5 100 3 Q125 0.5 150 3 Q175 5.5 200 3' stroke='black' stroke-width='6' fill='none'/%3E%3C/svg%3E");
  -webkit-mask-size: 100% 100%;
}

/* Washi paper texture overlay for shoji cards */
.washi-texture {
  position: relative;
}

.washi-texture::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  background-repeat: repeat;
  border-radius: inherit;
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: overlay;
}

/* Calligraphy focus for inputs */
.input-calligraphy {
  position: relative;
}

.input-calligraphy:focus {
  border-color: var(--color-gold);
  box-shadow: 0 0 0 1px var(--color-gold), 0 0 20px -8px rgba(212, 168, 83, 0.3);
}

/* Hanko seal stamp for avatars */
.hanko-seal {
  background: linear-gradient(135deg, var(--color-crimson) 0%, var(--color-crimson-bright) 100%);
  border: 1.5px solid rgba(196, 58, 79, 0.4);
  box-shadow: 0 0 12px -4px rgba(139, 34, 50, 0.5);
}

/* Katana divider line */
.katana-line {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-gold-dim) 15%, var(--color-gold) 50%, var(--color-gold-dim) 85%, transparent 100%);
  opacity: 0.3;
}

/* Scrollbar styling — thin, gold */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: var(--color-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--color-gold-dim);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-gold);
}
```

**Step 3: Verify the app renders with new colors**

Expected: Slightly deeper backgrounds, warmer gold, text slightly warmer. No layout breakage.

**Step 4: Commit**

```bash
git add frontend/src/assets/fonts/Onari.otf frontend/src/index.css frontend/index.html
git commit -m "feat: establish Ancient Dojo design system — new colors, fonts, CSS utilities"
```

---

## Phase 2: New Shared Components

### Task 4: Create ShojiCard component

**Files:**
- Create: `frontend/src/components/ShojiCard.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

export default function ShojiCard({
  children,
  className = '',
  hover = true,
  onClick,
  glow = false,
  ...props
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      className={`
        relative washi-texture overflow-hidden
        bg-bg-card/80 backdrop-blur-xl
        border border-gold-dim/[0.15] rounded-xl
        ${hover ? 'cursor-pointer transition-all duration-300 hover:border-gold-dim/30 hover:shadow-[0_0_40px_-15px_rgba(212,168,83,0.15)]' : ''}
        ${glow ? 'shadow-[0_0_30px_-10px_rgba(212,168,83,0.2)]' : ''}
        ${className}
      `}
      style={{
        clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
      }}
      {...props}
    >
      {/* Corner notch accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold-dim/20 rounded-tl-sm pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold-dim/20 rounded-tr-sm pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold-dim/20 rounded-bl-sm pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold-dim/20 rounded-br-sm pointer-events-none z-10" />

      {/* Parchment warmth overlay */}
      <div className="absolute inset-0 bg-parchment pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-[2]">
        {children}
      </div>
    </motion.div>
  )
}
```

**Step 2: Verify by temporarily rendering on Dashboard**

Import ShojiCard in Dashboard.jsx, render one next to an existing GlassCard. Confirm the shoji aesthetic: corner notches, subtle texture, wood-frame border, hover glow.

---

### Task 5: Create ScrollCard component

**Files:**
- Create: `frontend/src/components/ScrollCard.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ScrollCard({
  children,
  className = '',
  title,
  defaultOpen = true,
  collapsible = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden
        bg-bg-card/60 backdrop-blur-xl
        border-x border-gold-dim/[0.12]
        ${className}
      `}
    >
      {/* Top scroll roll */}
      <div className="h-3 bg-gradient-to-b from-gold-dim/10 to-transparent rounded-t-2xl border-t border-gold-dim/20" />

      {/* Title bar (optional) */}
      {title && (
        <button
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          className={`
            w-full flex items-center justify-between px-6 py-3
            font-heading text-sm font-semibold tracking-[0.08em] uppercase text-gold
            ${collapsible ? 'cursor-pointer hover:text-gold-bright transition-colors' : 'cursor-default'}
          `}
        >
          <span>{title}</span>
          {collapsible && (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gold-dim"
            >
              ▾
            </motion.span>
          )}
        </button>
      )}

      {/* Content with unfurl animation */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5">
          {children}
        </div>
      </motion.div>

      {/* Bottom scroll roll */}
      <div className="h-3 bg-gradient-to-t from-gold-dim/10 to-transparent rounded-b-2xl border-b border-gold-dim/20" />
    </motion.div>
  )
}
```

---

### Task 6: Create StatCard component

**Files:**
- Create: `frontend/src/components/StatCard.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'
import CountUp from 'react-countup'

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  prefix = '',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden
        bg-bg-card/80 backdrop-blur-xl
        border border-gold-dim/[0.15] rounded-xl
        p-5
        ${className}
      `}
    >
      {/* Hanko seal icon */}
      {Icon && (
        <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center mb-3">
          <Icon size={18} className="text-white" />
        </div>
      )}

      {/* Label */}
      <p className="font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="font-display text-3xl text-text-primary tracking-wide">
        {prefix}
        <CountUp end={typeof value === 'number' ? value : 0} duration={1.5} separator="," />
        {suffix}
      </p>

      {/* Blade edge accent */}
      <div className="absolute bottom-0 left-4 right-4 katana-line" />
    </motion.div>
  )
}
```

---

### Task 7: Create ShurikenLoader component

**Files:**
- Create: `frontend/src/components/ShurikenLoader.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

export default function ShurikenLoader({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        {/* 4-pointed shuriken */}
        <path
          d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gold"
        />
        <path
          d="M20 6 L22 16 L34 20 L22 22 L20 34 L18 22 L6 20 L18 18 Z"
          fill="currentColor"
          className="text-gold/40"
        />
        {/* Center circle */}
        <circle cx="20" cy="20" r="3" fill="currentColor" className="text-gold" />
      </motion.svg>
    </div>
  )
}
```

---

### Task 8: Create EmberDots loader (for inline loading)

**Files:**
- Create: `frontend/src/components/EmberDots.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

export default function EmberDots({ className = '' }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-gold"
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
```

**Step 2: Commit all new shared components**

```bash
git add frontend/src/components/ShojiCard.jsx frontend/src/components/ScrollCard.jsx frontend/src/components/StatCard.jsx frontend/src/components/ShurikenLoader.jsx frontend/src/components/EmberDots.jsx
git commit -m "feat: add dojo shared components — ShojiCard, ScrollCard, StatCard, loaders"
```

---

## Phase 3: Custom Cursor

### Task 9: Create CustomCursor component

**Files:**
- Create: `frontend/src/components/CustomCursor.jsx`

**Step 1: Create the custom cursor component**

```jsx
import { useEffect, useRef, useState, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CursorContext = createContext({ setCursorVariant: () => {} })
export const useCursor = () => useContext(CursorContext)

export function CursorProvider({ children }) {
  const [cursorVariant, setCursorVariant] = useState('default')

  return (
    <CursorContext.Provider value={{ setCursorVariant }}>
      {children}
      <CustomCursor variant={cursorVariant} />
    </CursorContext.Provider>
  )
}

function CustomCursor({ variant }) {
  const cursorRef = useRef(null)
  const trailRef = useRef(null)
  const [clicks, setClicks] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const posRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = 'none'

    const handleMouseMove = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px) rotate(-45deg)`
      }
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      }
      setIsVisible(true)
    }

    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    const handleClick = (e) => {
      const id = Date.now()
      setClicks((prev) => [...prev.slice(-4), { id, x: e.clientX, y: e.clientY }])
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== id))
      }, 400)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('mouseenter', handleMouseEnter)
    window.addEventListener('click', handleClick)

    return () => {
      document.body.style.cursor = ''
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('mouseenter', handleMouseEnter)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]" style={{ mixBlendMode: 'normal' }}>
      {/* Trailing glow */}
      <div
        ref={trailRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full transition-transform duration-100 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)',
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Blade cursor */}
      <div
        ref={cursorRef}
        className="absolute -translate-x-1/2 -translate-y-1/2 transition-opacity duration-150"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          {/* Blade shape */}
          <path
            d="M10 0 L12 8 L10 18 L8 8 Z"
            fill="url(#blade-gradient)"
            stroke="rgba(212,168,83,0.6)"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="blade-gradient" x1="10" y1="0" x2="10" y2="18">
              <stop offset="0%" stopColor="#e8c36b" />
              <stop offset="100%" stopColor="#8b7340" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Click slash effects */}
      <AnimatePresence>
        {clicks.map((click) => (
          <motion.div
            key={click.id}
            initial={{ opacity: 0.8, scale: 0.3 }}
            animate={{ opacity: 0, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: click.x, top: click.y }}
          >
            {/* Cross slash */}
            <svg width="30" height="30" viewBox="0 0 30 30">
              <line x1="5" y1="5" x2="25" y2="25" stroke="#d4a853" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <line x1="25" y1="5" x2="5" y2="25" stroke="#d4a853" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default CustomCursor
```

**Step 2: Add `cursor: none` to all interactive elements in index.css**

Add to the end of `frontend/src/index.css`:

```css
/* Hide default cursor globally when custom cursor is active */
*, *::before, *::after {
  cursor: none !important;
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/CustomCursor.jsx frontend/src/index.css
git commit -m "feat: add custom blade cursor with click slash effects"
```

---

## Phase 4: Background Effects

### Task 10: Create MistLayer component (replaces GradientOrbs)

**Files:**
- Create: `frontend/src/components/MistLayer.jsx`

**Step 1: Create the component**

```jsx
export default function MistLayer() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Mist patch 1 — large, slow drift right */}
      <div
        className="absolute w-[800px] h-[400px] opacity-[0.04] blur-[80px] animate-[mistDrift1_30s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,168,83,0.3) 0%, transparent 70%)',
          top: '10%',
          left: '-10%',
        }}
      />

      {/* Mist patch 2 — medium, drift left */}
      <div
        className="absolute w-[600px] h-[350px] opacity-[0.035] blur-[70px] animate-[mistDrift2_25s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(180,170,200,0.25) 0%, transparent 70%)',
          bottom: '5%',
          right: '-5%',
        }}
      />

      {/* Mist patch 3 — subtle center drift */}
      <div
        className="absolute w-[500px] h-[300px] opacity-[0.025] blur-[60px] animate-[mistDrift3_35s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(200,190,170,0.2) 0%, transparent 70%)',
          top: '45%',
          left: '25%',
        }}
      />

      <style>{`
        @keyframes mistDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -20px) scale(1.05); }
          66% { transform: translate(-30px, 15px) scale(0.95); }
        }
        @keyframes mistDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 25px) scale(1.08); }
          66% { transform: translate(40px, -30px) scale(0.92); }
        }
        @keyframes mistDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -15px) scale(1.03); }
        }
      `}</style>
    </div>
  )
}
```

---

### Task 11: Create CherryBlossoms component (replaces ParticleCanvas)

**Files:**
- Create: `frontend/src/components/CherryBlossoms.jsx`

**Step 1: Create the cherry blossom particle system**

```jsx
import { useRef, useEffect } from 'react'

export default function CherryBlossoms() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create petals
    const petals = Array.from({ length: 10 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 6 + 3,
      speedX: (Math.random() - 0.3) * 0.4,
      speedY: Math.random() * 0.3 + 0.15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      opacity: Math.random() * 0.25 + 0.05,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.01 + 0.005,
    }))

    const drawPetal = (p) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.globalAlpha = p.opacity

      // Petal shape — teardrop
      ctx.beginPath()
      ctx.moveTo(0, -p.size)
      ctx.bezierCurveTo(p.size * 0.6, -p.size * 0.5, p.size * 0.5, p.size * 0.3, 0, p.size * 0.5)
      ctx.bezierCurveTo(-p.size * 0.5, p.size * 0.3, -p.size * 0.6, -p.size * 0.5, 0, -p.size)
      ctx.closePath()

      // Warm pink-gold petal color
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size)
      gradient.addColorStop(0, 'rgba(212, 168, 83, 0.6)')
      gradient.addColorStop(1, 'rgba(180, 130, 80, 0.2)')
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.restore()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of petals) {
        p.wobblePhase += p.wobbleSpeed
        p.x += p.speedX + Math.sin(p.wobblePhase) * 0.3
        p.y += p.speedY
        p.rotation += p.rotationSpeed

        // Reset when off screen
        if (p.y > canvas.height + 20) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
        if (p.x < -20) p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20

        drawPetal(p)
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
    />
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/MistLayer.jsx frontend/src/components/CherryBlossoms.jsx
git commit -m "feat: add dojo background effects — MistLayer and CherryBlossoms"
```

---

## Phase 5: Animation System Updates

### Task 12: Add smoke transition variants to motionVariants.js

**Files:**
- Modify: `frontend/src/lib/animation/motionVariants.js`

**Step 1: Add new dojo-specific variants at the end of the file**

```js
/** Smoke teleport — page exit */
export const smokeExit = () =>
  safe({
    initial: { opacity: 1, scale: 1 },
    exit: {
      opacity: 0,
      scale: 0.98,
      filter: 'blur(4px)',
      transition: { duration: 0.2, ease: 'easeIn' },
    },
  })

/** Smoke teleport — page enter */
export const smokeEnter = () =>
  safe({
    initial: { opacity: 0, scale: 1.02, filter: 'blur(4px)' },
    animate: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
  })

/** Scroll unfurl — content reveals top to bottom */
export const scrollUnfurl = (delay = 0) =>
  safe({
    initial: { opacity: 0, height: 0, y: -10 },
    animate: {
      opacity: 1,
      height: 'auto',
      y: 0,
      transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
    },
  })

/** Forge strike — button press */
export const forgeStrike = () => {
  if (prefersReducedMotion()) return {}
  return {
    whileTap: { scale: 0.97, transition: { duration: 0.1 } },
  }
}
```

**Step 2: Export the new variants from index.js**

Add to the Framer Motion variants section of `frontend/src/lib/animation/index.js`:

```js
export {
  pageTransition,
  fadeUp,
  fadeLeft,
  fadeRight,
  scaleUp,
  staggerContainer,
  staggerItem,
  hoverLift,
  glowPulse,
  smokeExit,
  smokeEnter,
  scrollUnfurl,
  forgeStrike,
} from './motionVariants'
```

---

### Task 13: Create NinjaTransition component (login → dashboard)

**Files:**
- Create: `frontend/src/components/NinjaTransition.jsx`

**Step 1: Create the component**

```jsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

export default function NinjaTransition({ active, onComplete }) {
  const [phase, setPhase] = useState('idle') // idle | smoke | slash | clear

  useEffect(() => {
    if (!active) return

    setPhase('smoke')
    const t1 = setTimeout(() => setPhase('slash'), 400)
    const t2 = setTimeout(() => setPhase('clear'), 700)
    const t3 = setTimeout(() => {
      setPhase('idle')
      onComplete?.()
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [active, onComplete])

  if (phase === 'idle') return null

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Black fill */}
      <AnimatePresence>
        {(phase === 'smoke' || phase === 'slash') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-bg"
          />
        )}
      </AnimatePresence>

      {/* Smoke burst */}
      <AnimatePresence>
        {phase === 'smoke' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.6, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full blur-[60px]"
            style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, rgba(19,19,29,0.8) 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* Diagonal slash */}
      <AnimatePresence>
        {(phase === 'slash' || phase === 'clear') && (
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="0" y1="100"
              x2="100" y2="0"
              stroke="#d4a853"
              strokeWidth="0.3"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 1, 1, 0] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Commit animation updates**

```bash
git add frontend/src/lib/animation/motionVariants.js frontend/src/lib/animation/index.js frontend/src/components/NinjaTransition.jsx
git commit -m "feat: add dojo animations — smoke transitions, ninja arrival, forge strike"
```

---

## Phase 6: Layout Shell Overhaul

### Task 14: Overhaul Sidebar — "Weapon Rack"

**Files:**
- Modify: `frontend/src/components/Sidebar.jsx`

**Step 1: Rewrite the Sidebar component**

Replace the entire file with the new weapon rack design:

- Section headers: `font-heading` class, `tracking-[0.15em]`, uppercase, `text-gold-dim`
- Section dividers: replace the simple header with the katana-line class underneath
- Active nav item: left gold accent bar (3px wide, gold background), warm glow via `shadow-[inset_0_0_20px_-10px_rgba(212,168,83,0.15)]`
- Hover: subtle background `bg-gold/[0.04]`
- Logo: keep floating animation, refine timing
- Bottom mist: add a div at the bottom of the sidebar with gradient from transparent to `bg-elevated`
- Add `cursor: none` implicit from global CSS
- Remove the `<style>` block — move the keyframe to index.css (cleaner)

Key changes to the JSX:
- Section header `<h3>` gets `font-heading` instead of default
- NavLink active class: replace `bg-gold-glow text-gold border-l-2 border-gold` with `bg-gold/[0.05] text-gold border-l-[3px] border-gold shadow-[inset_0_0_20px_-10px_rgba(212,168,83,0.15)]`
- NavLink hover class: `hover:bg-gold/[0.04] hover:text-gold-dim`
- Add katana-line div after each section header
- Add bottom mist gradient div after `</nav>`

**Step 2: Verify sidebar renders correctly**

Expected: Section dividers are thin golden tapered lines. Active state has a warm incense-stick glow on the left. Hover has subtle gold tinting. Section headers use Rajdhani font.

---

### Task 15: Overhaul Header — "Dojo Banner"

**Files:**
- Modify: `frontend/src/components/Header.jsx`

**Step 1: Update the Header component**

Key changes:
- `<h1>` gets `font-display` (Onari) + `brush-underline` class + `tracking-[0.08em]`
- User avatar div: replace `bg-gradient-to-br from-gold-dim to-gold` with `hanko-seal` class (crimson seal)
- Text color on initials: `text-white` instead of `text-bg`
- Border bottom: replace `border-b border-border` with a katana-line div positioned below
- Slightly taller: `h-[64px]`
- Background: `bg-bg/80 backdrop-blur-xl` (more transparent)

---

### Task 16: Overhaul Layout — swap backgrounds, add cursor

**Files:**
- Modify: `frontend/src/components/Layout.jsx`

**Step 1: Update Layout imports and rendering**

Replace:
```jsx
import GradientOrbs from './GradientOrbs'
import ParticleCanvas from './ParticleCanvas'
```

With:
```jsx
import MistLayer from './MistLayer'
import CherryBlossoms from './CherryBlossoms'
import { CursorProvider } from './CustomCursor'
```

Replace the component body:
```jsx
export default function Layout() {
  return (
    <CursorProvider>
      <div className="min-h-screen bg-bg">
        {/* Background effects */}
        <MistLayer />
        <CherryBlossoms />

        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="ml-[250px] min-h-screen flex flex-col relative z-10">
          <Header />
          <main className="flex-1 overflow-y-auto p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </CursorProvider>
  )
}
```

Note: padding increased from `p-6` to `p-8` for more breathing room.

**Step 2: Commit layout shell overhaul**

```bash
git add frontend/src/components/Sidebar.jsx frontend/src/components/Header.jsx frontend/src/components/Layout.jsx
git commit -m "feat: overhaul layout shell — weapon rack sidebar, dojo banner header, new backgrounds"
```

---

## Phase 7: Login Page Overhaul

### Task 17: Redesign Login page

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

**Step 1: Update background effects**

Replace `GradientOrbs` and `ParticleCanvas` imports with `MistLayer` and `CherryBlossoms`.

**Step 2: Redesign the login card**

Key changes:
- Card: use ShojiCard-like styling manually (since Login is outside Layout, it doesn't have the cursor provider). Apply `washi-texture` class, corner notch borders, `bg-bg-card/80 backdrop-blur-xl border border-gold-dim/[0.15]`.
- Logo: keep floating animation
- Heading: `font-display` (Onari), change "Welcome Back" to "Enter the Dojo"
- Subtitle: "Sign in to begin your training"
- Input focus: add `input-calligraphy` class styling
- Submit button text: "Enter" with a small blade icon (Sword from Lucide or custom SVG)
- Sign Up link: "New recruit?" instead of "Don't have an account?"
- Signup modal heading: "Begin Training" instead of "Create Account"
- Step 1 subtitle: "Tell us who you are"
- Step 2 subtitle: "Choose your weapons" (username & password)
- Add the `CursorProvider` wrapping the entire login page

**Step 3: Add NinjaTransition on successful login**

In the `handleSubmit` function, instead of immediately calling `navigate('/')`, set a state `showNinja = true`, render `<NinjaTransition active={showNinja} onComplete={() => navigate('/')} />`. Same for `quickLogin` and signup.

**Step 4: Verify login flow**

Expected: Login page has dojo aesthetic, entering credentials triggers the quick smoke + slash transition before reaching dashboard.

**Step 5: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "feat: redesign Login page — dojo aesthetic with ninja transition on entry"
```

---

## Phase 8: Dashboard Overhaul

### Task 18: Redesign Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.jsx`

**Step 1: Replace GlassCard imports with ShojiCard**

```jsx
import ShojiCard from '../components/ShojiCard'
```

**Step 2: Update the greeting section**

- H1: `font-display` (Onari) + `brush-underline` class
- Subtitle: "Your deal-closing arsenal — every weapon you need."

**Step 3: Update section headers**

- Section header text: `font-heading tracking-[0.15em] uppercase text-gold-dim`
- Divider: replace `h-px bg-gradient-to-r from-gold/20 to-transparent` with `katana-line`

**Step 4: Replace GlassCard with ShojiCard in tool cards**

Replace `<GlassCard className="p-5 h-full...">` with `<ShojiCard className="p-6 h-full...">`

- Card title: `font-heading text-lg font-semibold` (Rajdhani) instead of `font-display`
- Icon: wrap in a hanko-seal circle (small, 36px, with crimson bg)
- "Launch" text: change to "Enter" with arrow
- Padding increased to `p-6`

**Step 5: Verify dashboard renders**

Expected: Onari greeting, katana dividers, shoji panel tool cards with hanko seal icons, Rajdhani card titles.

**Step 6: Commit**

```bash
git add frontend/src/pages/Dashboard.jsx
git commit -m "feat: redesign Dashboard — shoji cards, Onari typography, dojo aesthetic"
```

---

## Phase 9: Page-by-Page Overhaul (All Remaining Pages)

For each page below, the pattern is the same:
1. Replace `GlassCard` → `ShojiCard` or `ScrollCard` where appropriate
2. Replace `font-display` → `font-display` (now Onari) or `font-heading` (Rajdhani) for card titles
3. Add `brush-underline` to major section headers
4. Replace loading spinners with `ShurikenLoader`
5. Add `katana-line` dividers between sections
6. Use `hanko-seal` for icon containers where appropriate
7. Use `input-calligraphy` styling on form inputs
8. Add stagger animations where missing

### Task 19: Overhaul AdminDashboard.jsx

**Files:**
- Modify: `frontend/src/pages/AdminDashboard.jsx` (173 lines)

**Key changes:**
- Import `StatCard` and `ShojiCard`
- Replace the 3 raw stat divs with `<StatCard>` components (hanko seal icons, Onari numbers, blade-edge accent)
- User table: wrap in `ShojiCard`, table header text in `font-heading uppercase tracking-wide`
- Table rows: add `hover:bg-gold/[0.03]` transition
- Page title area: `brush-underline` on heading

**Commit:** `feat: redesign AdminDashboard — stat cards, shoji table, dojo typography`

---

### Task 20: Overhaul FSBOFinder.jsx

**Files:**
- Modify: `frontend/src/pages/FSBOFinder.jsx` (554 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard` for search card and results card
- Filter section: use `ScrollCard` with collapsible prop for advanced filters
- Search bar area: style like a scroll unfurling (use scrollUnfurl variant)
- Table: `font-heading` headers, gold hover on rows
- Loading state: `ShurikenLoader` instead of generic spinner
- Empty state: "The scroll is empty — no results found" messaging
- Source badges: keep but use gold-dim border styling
- Form inputs: `input-calligraphy` class

**Commit:** `feat: redesign FSBOFinder — shoji cards, scroll filters, dojo table`

---

### Task 21: Overhaul LeadScrubbing.jsx

**Files:**
- Modify: `frontend/src/pages/LeadScrubbing.jsx` (84 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard`
- Video placeholder: style as a scroll/parchment look
- "What You'll Learn" section: items in a vertical list with small gold dots instead of bullet points
- Section heading: `font-display brush-underline`

**Commit:** `feat: redesign LeadScrubbing — shoji card, dojo typography`

---

### Task 22: Overhaul Underwriting.jsx

**Files:**
- Modify: `frontend/src/pages/Underwriting.jsx` (476 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard` for the main form card
- Deal type toggle (cash/sub2): style as "training paths" — two shoji panels side by side, active one has gold glow
- File drop zones: `border-gold-dim/20 border-dashed` with gold accent
- Form inputs: `input-calligraphy` class
- Section headers within form: `font-heading uppercase tracking-wide text-gold-dim`
- Submit button: forge-strike animation (whileTap scale pulse)
- Conditional sections: use ScrollCard with unfurl animation

**Commit:** `feat: redesign Underwriting — shoji form, training path toggle, forge-strike submit`

---

### Task 23: Overhaul LOIGenerator.jsx

**Files:**
- Modify: `frontend/src/pages/LOIGenerator.jsx` (808 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard`
- Step indicator: redesign as ascending mountain path — 3 circles connected by a line, active steps filled gold, inactive dim. Each step labeled "Level 1/2/3"
- Step content cards: `ShojiCard` with generous padding
- Document preview: keep white bg but add a subtle parchment border
- Success modal: `ShojiCard` with `glow` prop
- History table: wrap in `ShojiCard`, `font-heading` headers
- Form inputs: `input-calligraphy` class

**Commit:** `feat: redesign LOIGenerator — mountain path progress, shoji cards, dojo forms`

---

### Task 24: Overhaul ContractGenerator.jsx

**Files:**
- Modify: `frontend/src/pages/ContractGenerator.jsx` (913 lines)

**Key changes:**
- Same pattern as LOI — replace GlassCard with ShojiCard, mountain path step indicator
- 4 levels instead of 3: "Prepare / Review / Sign / Export"
- Signature canvas: add a subtle parchment background, gold border
- Typed signature area: use `font-display` (Onari) for the preview
- History table: ShojiCard wrapper, font-heading headers

**Commit:** `feat: redesign ContractGenerator — mountain path progress, shoji cards, signature dojo`

---

### Task 25: Overhaul DirectAgent.jsx

**Files:**
- Modify: `frontend/src/pages/DirectAgent.jsx` (184 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard` for all cards
- 4-step process: replace numbered circles with gold kanji-style numbers or belt icons
- Process steps: use `ScrollCard` for each step content
- Tool cards at bottom: `ShojiCard` with `font-heading` titles
- Section heading: `font-display brush-underline`

**Commit:** `feat: redesign DirectAgent — scroll cards, dojo step process`

---

### Task 26: Overhaul Scripts.jsx

**Files:**
- Modify: `frontend/src/pages/Scripts.jsx` (348 lines)

**Key changes:**
- Tab bar: style as dojo weapon selection — each tab is a shoji panel segment, active tab has gold bottom border
- Script cards (accordion): replace with `ScrollCard` with `collapsible` prop and `title` prop
- Copy button: small gold outline button
- Objection cards: `ScrollCard` with collapsible
- Tab content container: `ShojiCard`

**Commit:** `feat: redesign Scripts — scroll card accordions, dojo weapon tabs`

---

### Task 27: Overhaul WebsiteExplainer.jsx

**Files:**
- Modify: `frontend/src/pages/WebsiteExplainer.jsx` (150 lines)

**Key changes:**
- Main card: `ShojiCard`
- URL display: styled as a scroll with gold border, monospace font
- Copy button: gold outline style
- Usage tip cards: `ShojiCard` with `font-heading` titles
- Section heading: `font-display brush-underline`

**Commit:** `feat: redesign WebsiteExplainer — shoji cards, scroll URL display`

---

### Task 28: Overhaul DispoProcess.jsx

**Files:**
- Modify: `frontend/src/pages/DispoProcess.jsx` (297 lines)

**Key changes:**
- Replace raw divs with `ShojiCard` for platform cards and buyer type cards
- Info banner: `ShojiCard` with gold left border accent
- Platform cards: `ShojiCard` with icon in hanko-seal circle
- Buyer type cards: `ShojiCard`, non-conventional highlighted with `glow` prop
- Section headers: `font-display brush-underline`
- Grid: keep layout, add stagger animation

**Commit:** `feat: redesign DispoProcess — shoji cards, hanko icons, stagger animation`

---

### Task 29: Overhaul JoinTeam.jsx

**Files:**
- Modify: `frontend/src/pages/JoinTeam.jsx` (252 lines)

**Key changes:**
- Replace `GlassCard` with `ShojiCard` for highlights and form
- Highlight cards: `ShojiCard` with icon in hanko-seal
- Application form: `ShojiCard` wrapper, `input-calligraphy` on inputs
- Success state: `ShojiCard` with `glow` prop, "You've been recruited" heading in Onari
- Section heading: `font-display brush-underline`

**Commit:** `feat: redesign JoinTeam — shoji cards, dojo recruitment form`

---

### Task 30: Overhaul AgentFinder.jsx

**Files:**
- Modify: `frontend/src/pages/AgentFinder.jsx` (77 lines)

**Key changes:**
- Loading spinner: `ShurikenLoader`
- Wrapper div: subtle ShojiCard-like border around the iframe area
- This page is mostly a legacy iframe — minimal changes beyond loading state and container styling

**Commit:** `feat: redesign AgentFinder — shuriken loader, dojo container`

---

### Task 31: Overhaul CRM.jsx (if wired into routes)

**Files:**
- Modify: `frontend/src/pages/CRM.jsx` (164 lines)
- Modify: `frontend/src/components/crm/KanbanBoard.jsx`
- Modify: `frontend/src/components/crm/KanbanColumn.jsx`
- Modify: `frontend/src/components/crm/LeadCard.jsx`
- Modify: `frontend/src/components/crm/LeadDetail.jsx`

**Key changes:**
- Pipeline toggle: dojo weapon selection tabs (same pattern as Scripts)
- View mode toggle: gold outline buttons
- Stats header: `StatCard` components
- Kanban columns: styled with wood-post top border (thick gold top, thin side borders)
- Lead cards: ShojiCard styling (paper note feel)
- Detail panel: ShojiCard, form inputs with `input-calligraphy`

**Commit:** `feat: redesign CRM — dojo kanban, wood-post columns, shoji lead cards`

---

## Phase 10: Final Polish

### Task 32: Add page-level AnimatePresence for smoke transitions

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/Layout.jsx`

**Step 1: Add AnimatePresence wrapper around Outlet**

In `Layout.jsx`, wrap `<Outlet />` with AnimatePresence and a motion.div that applies `smokeEnter` / `smokeExit` variants. Use `useLocation()` as the key.

```jsx
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

// Inside Layout component:
const location = useLocation()

// In JSX:
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
  >
    <Outlet />
  </motion.div>
</AnimatePresence>
```

**Commit:** `feat: add smoke teleport page transitions`

---

### Task 33: Update Button component with forge-strike effect

**Files:**
- Modify: `frontend/src/components/Button.jsx`

**Step 1: Wrap button in motion.button**

Replace `<button>` with `<motion.button>` and add `whileTap={{ scale: 0.97 }}` for the forge-strike micro-interaction.

**Step 2: Update gold variant gradient colors to new tokens**

Replace old gold RGBA values with new: `from-gold-dim via-gold to-gold-bright` (already matches, but update shadow RGBA to `212,168,83`).

**Step 3: Update danger variant to use crimson**

Replace `bg-error/10 border border-error/20 text-error` with `bg-crimson/10 border border-crimson/20 text-crimson-bright`.

**Commit:** `feat: update Button — forge-strike animation, crimson danger variant`

---

### Task 34: Clean up — remove unused components

**Files:**
- Delete (or archive): `frontend/src/components/GlassCard.jsx` (only if all pages have been migrated)
- Delete: `frontend/src/components/GradientOrbs.jsx`
- Delete: `frontend/src/components/ParticleCanvas.jsx`
- Remove unused imports from any page that still references them

**Step 1: Search for remaining GlassCard/GradientOrbs/ParticleCanvas imports**

```bash
grep -r "GlassCard\|GradientOrbs\|ParticleCanvas" frontend/src/ --include="*.jsx"
```

If any remain, update those files first. Then delete the old component files.

**Commit:** `chore: remove deprecated GlassCard, GradientOrbs, ParticleCanvas components`

---

### Task 35: Move logoFloat keyframe to index.css

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/Sidebar.jsx` (remove inline `<style>`)
- Modify: `frontend/src/pages/Login.jsx` (remove inline `<style>`)

**Step 1: Add to index.css**

```css
@keyframes logoFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
}
```

**Step 2: Remove `<style>` blocks from Sidebar.jsx and Login.jsx**

**Commit:** `chore: move shared keyframe animations to index.css`

---

### Task 36: Final visual verification

**Step 1: Run the dev server**

```bash
cd frontend && npm run dev
```

**Step 2: Walk through every page and verify**

Checklist:
- [ ] Login page: dojo aesthetic, "Enter the Dojo" text, ninja transition on login
- [ ] Dashboard: Onari greeting, katana dividers, shoji cards, hanko icons
- [ ] Sidebar: weapon rack feel, katana dividers, lantern glow active state
- [ ] Header: Onari title with brush underline, hanko seal avatar
- [ ] Custom cursor: blade point visible, slash on click
- [ ] Page transitions: smoke blur on navigate
- [ ] Background: cherry blossom petals drifting, mist layers
- [ ] AdminDashboard: stat cards, shoji table
- [ ] FSBOFinder: shoji search, scroll filters, shuriken loader
- [ ] LeadScrubbing: shoji cards, dojo typography
- [ ] Underwriting: shoji form, training path toggle
- [ ] LOIGenerator: mountain path progress, shoji cards
- [ ] ContractGenerator: mountain path progress, signature on parchment
- [ ] DirectAgent: scroll card steps, shoji tool cards
- [ ] Scripts: scroll card accordions, weapon tabs
- [ ] WebsiteExplainer: shoji cards, scroll URL
- [ ] DispoProcess: shoji cards, hanko icons, stagger
- [ ] JoinTeam: shoji cards, recruitment form
- [ ] AgentFinder: shuriken loader, dojo container
- [ ] Scrollbar: thin gold styling
- [ ] Reduced motion: verify animations respect prefers-reduced-motion

**Step 3: Fix any visual issues found**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Ancient Dojo design overhaul — all pages transformed"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Design system foundation (fonts, colors, CSS utilities) |
| 2 | 4-8 | New shared components (ShojiCard, ScrollCard, StatCard, loaders) |
| 3 | 9 | Custom blade cursor with slash effects |
| 4 | 10-11 | Background effects (MistLayer, CherryBlossoms) |
| 5 | 12-13 | Animation system (smoke variants, NinjaTransition) |
| 6 | 14-16 | Layout shell (Sidebar, Header, Layout) |
| 7 | 17 | Login page overhaul |
| 8 | 18 | Dashboard overhaul |
| 9 | 19-31 | All remaining pages (13 pages) |
| 10 | 32-36 | Final polish (page transitions, cleanup, verification) |

**Total: 36 tasks across 10 phases.**
