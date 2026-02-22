/**
 * Animation barrel export — single import point.
 *
 * Responsibilities (no overlap):
 *   GSAP          → complex timelines, SVG, controlled sequences
 *   Framer Motion → UI transitions, page transitions, hover/tap
 *   Lenis         → smooth scrolling (ONLY scroll system)
 *   Three.js      → 3D hero visuals only
 *   React CountUp  → stats counters (imported directly where used)
 */

// Reduced motion (shared)
export {
  prefersReducedMotion,
  onReducedMotionChange,
} from './reducedMotion'

// GSAP utilities
export {
  useStaggerReveal,
  useGSAPTimeline,
  animateElement,
  createTimeline,
  gsap,
  useGSAP,
} from './gsapUtils'

// Framer Motion variants
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

// Lenis smooth scroll
export {
  initSmoothScroll,
  destroySmoothScroll,
  getLenis,
  scrollTo,
} from './smoothScroll'

// Three.js hero
export { createHeroScene } from './threeScene'
