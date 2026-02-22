import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'

export default function NinjaTransition({ active, onComplete }) {
  const [phase, setPhase] = useState('idle')

  const stableOnComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  useEffect(() => {
    if (!active) return

    setPhase('smoke')
    const t1 = setTimeout(() => setPhase('slash'), 400)
    const t2 = setTimeout(() => setPhase('clear'), 700)
    const t3 = setTimeout(() => {
      setPhase('idle')
      stableOnComplete()
    }, 1100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [active, stableOnComplete])

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
