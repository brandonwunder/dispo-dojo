/**
 * GSAP — complex timelines, SVG morphs, controlled sequences.
 * NOT used for scroll triggers or page transitions (Framer handles those).
 */

import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { useRef } from 'react'
import { prefersReducedMotion } from './reducedMotion'

gsap.registerPlugin(useGSAP)

/** Stagger-in children of a container */
export function useStaggerReveal(options = {}) {
  const containerRef = useRef(null)
  const {
    selector = '[data-animate]',
    stagger = 0.08,
    duration = 0.6,
    y = 30,
    delay = 0,
  } = options

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return

      const els = containerRef.current.querySelectorAll(selector)
      if (!els.length) return

      gsap.fromTo(
        els,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          stagger,
          delay,
          ease: 'power3.out',
        }
      )
    },
    { scope: containerRef }
  )

  return containerRef
}

/** Animate a counter from 0 to value (for SVG/canvas, not DOM counters) */
export function useGSAPTimeline(builder) {
  const containerRef = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion() || !containerRef.current) return

      const tl = gsap.timeline()
      builder(tl, containerRef.current)
      return () => tl.kill()
    },
    { scope: containerRef }
  )

  return containerRef
}

/** One-shot animate an element */
export function animateElement(el, props, options = {}) {
  if (prefersReducedMotion() || !el) return null
  return gsap.to(el, { ...props, ...options })
}

/** Create a timeline with reduced-motion guard */
export function createTimeline(options = {}) {
  if (prefersReducedMotion()) return gsap.timeline({ paused: true })
  return gsap.timeline(options)
}

export { gsap, useGSAP }
