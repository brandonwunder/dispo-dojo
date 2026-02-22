/**
 * EmberField — canvas-based floating ember particles drifting upward.
 * Checks prefersReducedMotion and renders nothing if enabled.
 */

import { useRef, useEffect } from 'react'
import { prefersReducedMotion } from '../lib/animation/reducedMotion'

export default function EmberField({
  density = 30,
  className = '',
  color = { r: 232, g: 140, b: 46 },
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

    // Create particles
    const particles = Array.from({ length: density }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 1.5 + 1.5, // 1.5 - 3px
      speedY: -(Math.random() * 0.5 + 0.3), // -0.3 to -0.8 (upward)
      speedX: (Math.random() - 0.5) * 0.3, // -0.15 to 0.15
      opacity: Math.random() * 0.7 + 0.3, // 0.3 - 1.0
      opacityDir: Math.random() > 0.5 ? 1 : -1,
    }))

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
        }

        // Draw ember with glow
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.shadowBlur = 4
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.opacity})`
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${p.opacity})`
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
  }, [density, color])

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
