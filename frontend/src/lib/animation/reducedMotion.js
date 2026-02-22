/**
 * Reduced motion detection — shared across all animation systems.
 * Every animation utility checks this before running.
 */

const query =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null

export function prefersReducedMotion() {
  return query?.matches ?? false
}

/** Subscribe to changes (user toggles setting mid-session) */
export function onReducedMotionChange(callback) {
  if (!query) return () => {}
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
