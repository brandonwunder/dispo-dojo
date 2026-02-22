import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'
import { Sparkles, Zap, BarChart3, Layers, MousePointer2, Monitor } from 'lucide-react'
import {
  // GSAP — complex timelines
  useStaggerReveal,
  useGSAPTimeline,
  gsap,
  // Framer Motion — UI transitions
  fadeUp,
  fadeLeft,
  fadeRight,
  scaleUp,
  staggerContainer,
  staggerItem,
  hoverLift,
  glowPulse,
  // Three.js — 3D hero
  createHeroScene,
  // Scroll — Lenis already wired globally in main.jsx
  scrollTo,
  // Reduced motion
  prefersReducedMotion,
} from '../lib/animation'

/** Section 1: Three.js 3D Hero */
function ThreeHero() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const scene = createHeroScene(canvasRef.current)
    return () => scene?.destroy()
  }, [])

  return (
    <section className="relative h-[500px] rounded-2xl border border-border bg-bg-card overflow-hidden mb-10">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <motion.div {...fadeUp(0.2)}>
          <div className="flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full border border-gold/30 bg-gold/[0.08] backdrop-blur-md">
            <Sparkles size={14} className="text-gold" />
            <span className="text-xs font-semibold text-gold tracking-wide uppercase">
              Three.js 3D Hero
            </span>
          </div>
        </motion.div>
        <motion.h1
          {...fadeUp(0.35)}
          className="font-display text-4xl text-text-primary mb-3 drop-shadow-lg"
        >
          Animation Systems Demo
        </motion.h1>
        <motion.p
          {...fadeUp(0.5)}
          className="text-text-dim text-base max-w-md backdrop-blur-sm"
        >
          Five libraries, zero overlap. Each system has one job.
        </motion.p>
      </div>
      {prefersReducedMotion() && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-card">
          <p className="text-text-dim text-sm">Reduced motion enabled — 3D disabled</p>
        </div>
      )}
    </section>
  )
}

/** Section 2: GSAP Stagger Reveal */
function GSAPSection() {
  const containerRef = useStaggerReveal({
    selector: '[data-animate]',
    stagger: 0.1,
    y: 40,
    delay: 0.3,
  })

  const features = [
    { icon: Zap, title: 'Complex Timelines', desc: 'Orchestrate multi-step sequences with precise control' },
    { icon: Layers, title: 'SVG Animations', desc: 'Morph paths, draw strokes, animate attributes' },
    { icon: Monitor, title: 'Controlled Sequences', desc: 'Play, pause, reverse, scrub with full timeline API' },
  ]

  return (
    <section className="mb-10">
      <motion.div {...fadeUp()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
            GSAP
          </span>
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          Stagger Reveal
        </h2>
      </motion.div>

      <div ref={containerRef} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            data-animate
            className="rounded-2xl border border-border bg-bg-card p-6 opacity-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-glow flex items-center justify-center mb-4">
              <f.icon size={20} className="text-gold" />
            </div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">{f.title}</h3>
            <p className="text-xs text-text-dim leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Section 3: GSAP Timeline (SVG line draw) */
function GSAPTimeline() {
  const containerRef = useGSAPTimeline((tl, container) => {
    const path = container.querySelector('#draw-path')
    if (!path) return

    const length = path.getTotalLength()
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length })

    tl.to(path, {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.inOut',
    })
      .to(path, {
        opacity: [1, 0.5, 1],
        duration: 1.5,
        repeat: -1,
        ease: 'sine.inOut',
      })
  })

  return (
    <section className="mb-10">
      <motion.div {...fadeUp()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
            GSAP Timeline
          </span>
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          SVG Line Draw
        </h2>
      </motion.div>

      <div
        ref={containerRef}
        className="rounded-2xl border border-border bg-bg-card p-8 flex items-center justify-center"
      >
        <svg viewBox="0 0 400 120" className="w-full max-w-md">
          <path
            id="draw-path"
            d="M 20 60 C 80 10, 120 110, 200 60 C 280 10, 320 110, 380 60"
            fill="none"
            stroke="#c9a96e"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  )
}

/** Section 4: Framer Motion — UI Transitions */
function FramerSection() {
  const cards = [
    { dir: 'fadeUp', variant: fadeUp, label: 'Fade Up' },
    { dir: 'fadeLeft', variant: fadeLeft, label: 'Fade Left' },
    { dir: 'fadeRight', variant: fadeRight, label: 'Fade Right' },
    { dir: 'scaleUp', variant: scaleUp, label: 'Scale Up' },
  ]

  return (
    <section className="mb-10">
      <motion.div {...fadeUp()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-info" />
          <span className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
            Framer Motion
          </span>
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          UI Transitions & Hover States
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <motion.div
            key={c.dir}
            {...c.variant(0.1 + i * 0.1)}
            {...hoverLift()}
            className="rounded-2xl border border-border bg-bg-card p-5 text-center cursor-pointer"
          >
            <MousePointer2 size={20} className="text-gold mx-auto mb-2" />
            <p className="text-sm font-medium text-text-primary">{c.label}</p>
            <p className="text-[10px] text-text-muted mt-1">Hover me</p>
          </motion.div>
        ))}
      </div>

      {/* Stagger list */}
      <motion.div
        {...staggerContainer(0.08)}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {['Deal Found', 'LOI Sent', 'Under Contract', 'Closed'].map((step, i) => (
          <motion.div
            key={step}
            {...staggerItem()}
            className="rounded-xl border border-gold/20 bg-gold/[0.04] p-4 text-center"
          >
            <span className="text-lg font-display text-gold">{i + 1}</span>
            <p className="text-xs text-text-dim mt-1">{step}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Glow pulse */}
      <div className="mt-6 flex justify-center">
        <motion.div
          {...glowPulse()}
          className="w-3 h-3 rounded-full bg-gold shadow-[0_0_12px_rgba(201,169,110,0.6)]"
        />
      </div>
    </section>
  )
}

/** Section 5: React CountUp — Stats */
function CountUpSection() {
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const stats = [
    { value: 1247, suffix: '+', label: 'Deals Closed' },
    { value: 98, suffix: '%', label: 'Success Rate' },
    { value: 14, suffix: ' Days', label: 'Avg. Close Time' },
    { value: 3500, prefix: '$', suffix: 'K+', label: 'Revenue Generated' },
  ]

  return (
    <section className="mb-10" ref={ref}>
      <motion.div {...fadeUp()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
            React CountUp
          </span>
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          Stats Counters
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            {...fadeUp(0.1 + i * 0.08)}
            className="rounded-2xl border border-border bg-bg-card p-6 text-center"
          >
            <div className="flex items-center justify-center">
              <BarChart3 size={16} className="text-gold mr-2" />
              <p className="text-2xl font-display text-text-primary">
                {s.prefix}
                {inView ? (
                  <CountUp
                    end={s.value}
                    duration={2.5}
                    separator=","
                    useEasing
                  />
                ) : (
                  '0'
                )}
                {s.suffix}
              </p>
            </div>
            <p className="text-xs text-text-dim mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/** Section 6: Lenis smooth scroll demo */
function LenisSection() {
  return (
    <section className="mb-10">
      <motion.div {...fadeUp()}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-error" />
          <span className="text-[10px] font-semibold tracking-[0.15em] text-text-muted uppercase">
            Lenis Smooth Scroll
          </span>
        </div>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          Smooth Scrolling
        </h2>
      </motion.div>

      <div className="rounded-2xl border border-border bg-bg-card p-8 text-center">
        <p className="text-sm text-text-dim mb-4">
          Lenis is active globally — scroll this page to feel it.
          Or click below to smooth-scroll to the top.
        </p>
        <button
          onClick={() => scrollTo(0, { duration: 1.5 })}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold-dim via-gold to-gold-bright text-bg text-sm font-semibold shadow-[0_4px_20px_-4px_rgba(201,169,110,0.4)] hover:shadow-[0_4px_30px_-4px_rgba(201,169,110,0.6)] transition-shadow duration-300"
        >
          Scroll to Top
        </button>
      </div>
    </section>
  )
}

/** Responsibility matrix */
function ResponsibilityMatrix() {
  const rows = [
    { lib: 'GSAP', role: 'Complex timelines, SVG, controlled sequences', color: 'bg-success' },
    { lib: 'Framer Motion', role: 'UI transitions, page transitions, hover/tap', color: 'bg-info' },
    { lib: 'Lenis', role: 'Smooth scrolling (only scroll system)', color: 'bg-error' },
    { lib: 'Three.js', role: '3D hero visuals only', color: 'bg-gold' },
    { lib: 'React CountUp', role: 'Stats counters only', color: 'bg-warning' },
  ]

  return (
    <section className="mb-6">
      <motion.div {...fadeUp()}>
        <h2 className="font-display text-2xl text-text-primary mb-5">
          Responsibility Matrix
        </h2>
      </motion.div>

      <div className="rounded-2xl border border-border bg-bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted tracking-wide uppercase">Library</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-text-muted tracking-wide uppercase">Responsibility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.lib} className="border-b border-border/50">
                <td className="px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${r.color}`} />
                    <span className="text-sm font-medium text-text-primary">{r.lib}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-sm text-text-dim">{r.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** Main demo page */
export default function AnimationDemo() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-[900px] mx-auto"
    >
      <ThreeHero />
      <GSAPSection />
      <GSAPTimeline />
      <FramerSection />
      <CountUpSection />
      <LenisSection />
      <ResponsibilityMatrix />
    </motion.div>
  )
}
