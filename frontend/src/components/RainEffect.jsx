import { useEffect, useRef, useCallback } from 'react'

const RAIN_COUNT = 280
const RAIN_SPEED_MIN = 14
const RAIN_SPEED_MAX = 30
const RAIN_LENGTH_MIN = 20
const RAIN_LENGTH_MAX = 42
const WIND_ANGLE = 0.15
const LIGHTNING_MIN_INTERVAL = 6000
const LIGHTNING_MAX_INTERVAL = 18000
const LIGHTNING_FLASH_DURATION = 180
const LIGHTNING_BOLT_DURATION = 400

export default function RainEffect() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const raindrops = useRef([])
  const splashes = useRef([])
  const lightning = useRef({
    active: false,
    bolts: [],
    flashOpacity: 0,
    nextStrike: 0,
    fadeStart: 0,
  })

  const initRaindrop = useCallback((canvas, existing) => {
    const speed = RAIN_SPEED_MIN + Math.random() * (RAIN_SPEED_MAX - RAIN_SPEED_MIN)
    const length = RAIN_LENGTH_MIN + Math.random() * (RAIN_LENGTH_MAX - RAIN_LENGTH_MIN)
    const opacity = 0.15 + Math.random() * 0.25
    const width = Math.random() > 0.6 ? 1.5 : 1
    const layer = Math.random() // depth layer: 0 = far, 1 = near

    if (existing) {
      existing.x = Math.random() * (canvas.width + 200) - 100
      existing.y = -length - Math.random() * canvas.height * 0.5
      existing.speed = speed * (0.6 + layer * 0.4)
      existing.length = length * (0.5 + layer * 0.5)
      existing.opacity = opacity * (0.4 + layer * 0.6)
      existing.width = width * (0.5 + layer * 0.5)
      existing.layer = layer
      return existing
    }

    return {
      x: Math.random() * (canvas.width + 200) - 100,
      y: Math.random() * canvas.height * 2 - canvas.height,
      speed: speed * (0.6 + layer * 0.4),
      length: length * (0.5 + layer * 0.5),
      opacity: opacity * (0.4 + layer * 0.6),
      width: width * (0.5 + layer * 0.5),
      layer,
    }
  }, [])

  const generateBolt = useCallback((startX, startY, canvas) => {
    const segments = []
    let x = startX
    let y = startY
    const endY = startY + canvas.height * (0.3 + Math.random() * 0.5)

    while (y < endY) {
      const newX = x + (Math.random() - 0.5) * 70
      const newY = y + 8 + Math.random() * 22
      segments.push({ x1: x, y1: y, x2: newX, y2: newY, width: 2.5 + Math.random() * 1.5, main: true })

      // Branches
      if (Math.random() < 0.35) {
        const dir = Math.random() > 0.5 ? 1 : -1
        let bx = newX, by = newY
        const len = 2 + Math.floor(Math.random() * 5)
        for (let i = 0; i < len; i++) {
          const nbx = bx + dir * (12 + Math.random() * 30)
          const nby = by + 6 + Math.random() * 14
          segments.push({ x1: bx, y1: by, x2: nbx, y2: nby, width: 0.8 + Math.random() * 0.8, main: false })
          bx = nbx
          by = nby
        }
      }

      x = newX
      y = newY
    }

    return segments
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    raindrops.current = Array.from({ length: RAIN_COUNT }, () => initRaindrop(canvas, null))
    lightning.current.nextStrike = Date.now() + 2000 + Math.random() * 4000

    let lastTime = performance.now()
    const W = () => window.innerWidth
    const H = () => window.innerHeight

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3)
      lastTime = now
      ctx.clearRect(0, 0, W(), H())

      // === RAIN ===
      ctx.lineCap = 'round'
      for (const drop of raindrops.current) {
        drop.y += drop.speed * dt
        drop.x += WIND_ANGLE * drop.speed * dt

        if (drop.y > H() + drop.length) {
          // Spawn splash
          if (Math.random() < 0.3) {
            splashes.current.push({
              x: drop.x + WIND_ANGLE * drop.length,
              y: H() - 2 + Math.random() * 4,
              radius: 1 + Math.random() * 2,
              opacity: 0.3 + Math.random() * 0.2,
              life: 0,
              maxLife: 8 + Math.random() * 6,
            })
          }
          initRaindrop({ width: W(), height: H() }, drop)
          drop.y = -drop.length
        }

        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(drop.x + WIND_ANGLE * drop.length, drop.y + drop.length)
        ctx.strokeStyle = `rgba(170, 195, 220, ${drop.opacity})`
        ctx.lineWidth = drop.width
        ctx.stroke()
      }

      // === SPLASHES ===
      for (let i = splashes.current.length - 1; i >= 0; i--) {
        const s = splashes.current[i]
        s.life += dt
        if (s.life >= s.maxLife) {
          splashes.current.splice(i, 1)
          continue
        }
        const progress = s.life / s.maxLife
        const alpha = s.opacity * (1 - progress)
        const r = s.radius * (1 + progress * 2)
        ctx.beginPath()
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180, 200, 220, ${alpha})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // === LIGHTNING ===
      const lt = lightning.current
      const time = Date.now()

      if (!lt.active && time >= lt.nextStrike) {
        const startX = W() * (0.15 + Math.random() * 0.7)
        lt.bolts = generateBolt(startX, -10, { width: W(), height: H() })
        lt.active = true
        lt.flashOpacity = 0.3 + Math.random() * 0.25
        lt.fadeStart = time + LIGHTNING_FLASH_DURATION

        if (Math.random() < 0.35) {
          const startX2 = W() * (0.1 + Math.random() * 0.8)
          lt.bolts.push(...generateBolt(startX2, -10, { width: W(), height: H() }))
        }

        lt.nextStrike = time + LIGHTNING_MIN_INTERVAL + Math.random() * (LIGHTNING_MAX_INTERVAL - LIGHTNING_MIN_INTERVAL)
      }

      if (lt.active) {
        const elapsed = time - (lt.fadeStart - LIGHTNING_FLASH_DURATION)

        // Screen flash
        if (time < lt.fadeStart) {
          ctx.fillStyle = `rgba(200, 215, 240, ${lt.flashOpacity})`
          ctx.fillRect(0, 0, W(), H())
        } else {
          const fadeProgress = (time - lt.fadeStart) / (LIGHTNING_BOLT_DURATION - LIGHTNING_FLASH_DURATION)
          if (fadeProgress < 1) {
            ctx.fillStyle = `rgba(200, 215, 240, ${lt.flashOpacity * 0.25 * (1 - fadeProgress)})`
            ctx.fillRect(0, 0, W(), H())
          }
        }

        // Draw bolts
        const boltFade = elapsed < LIGHTNING_FLASH_DURATION
          ? 1
          : Math.max(0, 1 - (time - lt.fadeStart) / (LIGHTNING_BOLT_DURATION * 1.5))

        if (boltFade > 0) {
          ctx.lineCap = 'round'
          for (const seg of lt.bolts) {
            const alpha = seg.main
              ? boltFade * (0.85 + Math.random() * 0.15)
              : boltFade * (0.4 + Math.random() * 0.25)

            // Outer glow
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(140, 170, 255, ${alpha * 0.25})`
            ctx.lineWidth = seg.width * 8
            ctx.stroke()

            // Mid glow
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(190, 205, 255, ${alpha * 0.55})`
            ctx.lineWidth = seg.width * 3.5
            ctx.stroke()

            // Core
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(235, 240, 255, ${alpha})`
            ctx.lineWidth = seg.width
            ctx.stroke()
          }
        }

        if (time > lt.fadeStart + LIGHTNING_BOLT_DURATION * 1.5) {
          lt.active = false
          lt.bolts = []
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [initRaindrop, generateBolt])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}
