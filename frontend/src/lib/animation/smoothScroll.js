/**
 * Lenis — smooth scrolling. The ONLY scroll system in the app.
 * No GSAP ScrollTrigger, no Framer scroll-linked animations.
 */

import Lenis from '@studio-freight/lenis'
import { prefersReducedMotion, onReducedMotionChange } from './reducedMotion'

let lenisInstance = null
let rafId = null

/** Initialize Lenis smooth scrolling globally */
export function initSmoothScroll() {
  if (lenisInstance) return lenisInstance
  if (prefersReducedMotion()) return null

  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  })

  function raf(time) {
    lenisInstance.raf(time)
    rafId = requestAnimationFrame(raf)
  }
  rafId = requestAnimationFrame(raf)

  // Disable if user toggles reduced motion mid-session
  onReducedMotionChange((e) => {
    if (e.matches) {
      destroySmoothScroll()
    }
  })

  return lenisInstance
}

/** Tear down Lenis */
export function destroySmoothScroll() {
  if (rafId) cancelAnimationFrame(rafId)
  if (lenisInstance) lenisInstance.destroy()
  lenisInstance = null
  rafId = null
}

/** Get current Lenis instance */
export function getLenis() {
  return lenisInstance
}

/** Scroll to element or position */
export function scrollTo(target, options = {}) {
  if (lenisInstance) {
    lenisInstance.scrollTo(target, { offset: 0, duration: 1.2, ...options })
  } else if (typeof target === 'string') {
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
  }
}
