/**
 * Framer Motion — UI transitions, page transitions, hover/tap states.
 * NOT used for complex timelines (GSAP handles those).
 */

import { prefersReducedMotion } from './reducedMotion'

/** Safe variant — returns static state if reduced motion is on */
function safe(variant) {
  if (prefersReducedMotion()) {
    return {
      initial: variant.animate || variant.visible || {},
      animate: variant.animate || variant.visible || {},
      exit: variant.animate || variant.visible || {},
    }
  }
  return variant
}

/** Page transition wrapper */
export const pageTransition = () =>
  safe({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -16 },
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  })

/** Fade in from below */
export const fadeUp = (delay = 0) =>
  safe({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: 'easeOut' } },
  })

/** Fade in from left */
export const fadeLeft = (delay = 0) =>
  safe({
    initial: { opacity: 0, x: -30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay, ease: 'easeOut' } },
  })

/** Fade in from right */
export const fadeRight = (delay = 0) =>
  safe({
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, delay, ease: 'easeOut' } },
  })

/** Scale up reveal */
export const scaleUp = (delay = 0) =>
  safe({
    initial: { opacity: 0, scale: 0.92 },
    animate: { opacity: 1, scale: 1, transition: { duration: 0.4, delay, ease: 'easeOut' } },
  })

/** Stagger container + children */
export const staggerContainer = (stagger = 0.06) =>
  safe({
    initial: {},
    animate: { transition: { staggerChildren: stagger } },
  })

export const staggerItem = () =>
  safe({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
  })

/** Hover lift effect for cards */
export const hoverLift = () => {
  if (prefersReducedMotion()) return {}
  return {
    whileHover: { y: -4, transition: { duration: 0.2 } },
    whileTap: { scale: 0.98 },
  }
}

/** Shimmer / glow pulse */
export const glowPulse = () =>
  safe({
    initial: { opacity: 0.4 },
    animate: {
      opacity: [0.4, 1, 0.4],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
    },
  })

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
