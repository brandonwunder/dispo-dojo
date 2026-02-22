import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'

/* ─── Smoke Transition (default — login / navigation) ─── */
function SmokeTransition({ phase }) {
  const smokePuffs = [
    { x: '50%', y: '50%', size: 220, delay: 0 },
    { x: '35%', y: '40%', size: 180, delay: 0.04 },
    { x: '65%', y: '55%', size: 200, delay: 0.06 },
    { x: '45%', y: '65%', size: 160, delay: 0.08 },
    { x: '60%', y: '35%', size: 190, delay: 0.05 },
    { x: '50%', y: '50%', size: 260, delay: 0.02 },
  ]

  return (
    <>
      {/* Black fill */}
      <AnimatePresence>
        {(phase === 'enter' || phase === 'active') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-bg"
          />
        )}
      </AnimatePresence>

      {/* Smoke burst — multiple radial puffs */}
      <AnimatePresence>
        {phase === 'active' && smokePuffs.map((puff, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.7, scale: 2.2 }}
            exit={{ opacity: 0, scale: 2.6 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: puff.delay }}
            className="absolute rounded-full blur-[60px]"
            style={{
              left: puff.x,
              top: puff.y,
              width: puff.size,
              height: puff.size,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(212,168,83,0.25) 0%, rgba(19,19,29,0.7) 70%)`,
            }}
          />
        ))}
      </AnimatePresence>
    </>
  )
}

/* ─── Ink Wash Transition (tool pages) ─── */
function InkWashTransition({ phase }) {
  const edges = [
    { origin: 'top',    style: { top: 0, left: 0, right: 0, height: '50%', transformOrigin: 'top center' } },
    { origin: 'bottom', style: { bottom: 0, left: 0, right: 0, height: '50%', transformOrigin: 'bottom center' } },
    { origin: 'left',   style: { top: 0, bottom: 0, left: 0, width: '50%', transformOrigin: 'center left' } },
    { origin: 'right',  style: { top: 0, bottom: 0, right: 0, width: '50%', transformOrigin: 'center right' } },
  ]

  const isVertical = (origin) => origin === 'top' || origin === 'bottom'

  return (
    <>
      {/* SVG filter for ink texture */}
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="ink-turbulence">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" seed="2" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Ink bleed from edges */}
      <AnimatePresence>
        {(phase === 'enter' || phase === 'active') && edges.map((edge) => (
          <motion.div
            key={edge.origin}
            className="absolute bg-bg"
            style={edge.style}
            initial={isVertical(edge.origin) ? { scaleY: 0 } : { scaleX: 0 }}
            animate={isVertical(edge.origin) ? { scaleY: 1 } : { scaleX: 1 }}
            exit={phase === 'exit' ? { opacity: 0 } : undefined}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </AnimatePresence>

      {/* Active: full coverage with ink texture ripple */}
      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            className="absolute inset-0 bg-bg"
            style={{ filter: 'url(#ink-turbulence)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.25 }}
          />
        )}
      </AnimatePresence>

      {/* Exit: dissolve from center outward */}
      <AnimatePresence>
        {phase === 'exit' && (
          <motion.div
            className="absolute inset-0 bg-bg"
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.4 }}
            transition={{ duration: 0.28, ease: 'easeIn' }}
            style={{ transformOrigin: 'center center' }}
          />
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Slash Transition (quick actions) ─── */
function SlashTransition({ phase }) {
  return (
    <>
      {/* Diagonal slash wipe — SVG line from top-left to bottom-right */}
      <AnimatePresence>
        {phase === 'enter' && (
          <motion.svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <motion.line
              x1="0" y1="0"
              x2="100" y2="100"
              stroke="#d4a853"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* Active: brief white flash */}
      <AnimatePresence>
        {phase === 'active' && (
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 0.15, times: [0, 0.5, 1] }}
          />
        )}
      </AnimatePresence>

      {/* Exit: two halves slide apart */}
      <AnimatePresence>
        {phase === 'exit' && (
          <>
            {/* Top-left half */}
            <motion.div
              className="absolute inset-0 bg-bg"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: '-50%', y: '-50%', opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Bottom-right half */}
            <motion.div
              className="absolute inset-0 bg-bg"
              style={{
                clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
              }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: '50%', y: '50%', opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            />
          </>
        )}
      </AnimatePresence>
    </>
  )
}

/* ─── Main NinjaTransition Component ─── */
export default function NinjaTransition({ active, onComplete, variant = 'smoke' }) {
  const [phase, setPhase] = useState('idle')

  const handleComplete = useCallback(() => {
    if (onComplete) onComplete()
  }, [onComplete])

  useEffect(() => {
    if (!active) { setPhase('idle'); return }

    setPhase('enter')
    const t1 = setTimeout(() => setPhase('active'), 300)
    const t2 = setTimeout(() => setPhase('exit'), 600)
    const t3 = setTimeout(() => { setPhase('idle'); handleComplete() }, 900)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [active, handleComplete])

  if (phase === 'idle') return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] pointer-events-none">
        {variant === 'smoke' && <SmokeTransition phase={phase} />}
        {variant === 'inkWash' && <InkWashTransition phase={phase} />}
        {variant === 'slash' && <SlashTransition phase={phase} />}
      </div>
    </AnimatePresence>
  )
}
