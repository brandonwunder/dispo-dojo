/**
 * EmberField — canvas-based floating particles drifting upward.
 * Checks prefersReducedMotion and renders nothing if enabled.
 */

import { useRef, useEffect } from 'react'
import { prefersReducedMotion } from '../lib/animation/reducedMotion'

// Color palette for cool-toned particles
const EMBER_COLORS = [
  { r: 0, g: 198, b: 255 },    // electric cyan
  { r: 14, g: 90, b: 136 },    // ninja blue
  { r: 127, g: 0, b: 255 },    // purple glow
]

export default function EmberField({
  density = 30,
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

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

    // Create particles with varied colors
    const particles = Array.from({ length: density }, () => {
      const c = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)]
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 2, // 2 - 5px
        speedY: -(Math.random() * 0.5 + 0.3),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        color: c,
      }
    })

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        // Move upward with slight horizontal wobble
        p.y += p.speedY
        p.x += p.speedX + Math.sin(Date.now() * 0.001 + p.y) * 0.05

        // Pulse opacity
        p.opacity += p.opacityDir * 0.005
        if (p.opacity >= 1.0) {
          p.opacity = 1.0
          p.opacityDir = -1
        } else if (p.opacity <= 0.3) {
          p.opacity = 0.3
          p.opacityDir = 1
        }

        // Reset when above top
        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
          p.color = EMBER_COLORS[Math.floor(Math.random() * EMBER_COLORS.length)]
        }

        const { r, g, b } = p.color

        // Draw ember with glow
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.shadowBlur = 14
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${p.opacity})`
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [density])

  if (prefersReducedMotion()) return null

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
