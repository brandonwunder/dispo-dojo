import { useEffect, useRef, useCallback } from 'react'

const RAIN_COUNT = 220
const RAIN_SPEED_MIN = 12
const RAIN_SPEED_MAX = 28
const RAIN_LENGTH_MIN = 18
const RAIN_LENGTH_MAX = 38
const WIND_ANGLE = 0.12 // slight slant
const LIGHTNING_MIN_INTERVAL = 6000
const LIGHTNING_MAX_INTERVAL = 18000
const LIGHTNING_FLASH_DURATION = 180
const LIGHTNING_BOLT_DURATION = 350

export default function RainEffect() {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const raindrops = useRef([])
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
    const opacity = 0.08 + Math.random() * 0.18
    const width = Math.random() > 0.7 ? 1.5 : 1

    if (existing) {
      existing.x = Math.random() * (canvas.width + 100) - 50
      existing.y = -length - Math.random() * canvas.height
      existing.speed = speed
      existing.length = length
      existing.opacity = opacity
      existing.width = width
      return existing
    }

    return {
      x: Math.random() * (canvas.width + 100) - 50,
      y: Math.random() * canvas.height * 2 - canvas.height,
      speed,
      length,
      opacity,
      width,
    }
  }, [])

  const generateBolt = useCallback((startX, startY, canvas) => {
    const segments = []
    let x = startX
    let y = startY
    const endY = startY + canvas.height * (0.3 + Math.random() * 0.5)
    const mainBranches = []

    // Main bolt
    while (y < endY) {
      const newX = x + (Math.random() - 0.5) * 60
      const newY = y + 10 + Math.random() * 25
      segments.push({ x1: x, y1: y, x2: newX, y2: newY, width: 2.5 + Math.random(), main: true })

      // Random branches
      if (Math.random() < 0.3) {
        const branchDir = Math.random() > 0.5 ? 1 : -1
        let bx = newX
        let by = newY
        const branchLen = 2 + Math.floor(Math.random() * 4)
        const branch = []
        for (let i = 0; i < branchLen; i++) {
          const nbx = bx + branchDir * (15 + Math.random() * 25)
          const nby = by + 8 + Math.random() * 15
          branch.push({ x1: bx, y1: by, x2: nbx, y2: nby, width: 1 + Math.random() * 0.8, main: false })
          bx = nbx
          by = nby
        }
        mainBranches.push(...branch)
      }

      x = newX
      y = newY
    }

    return [...segments, ...mainBranches]
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init raindrops
    raindrops.current = Array.from({ length: RAIN_COUNT }, () => initRaindrop(canvas, null))

    // Schedule first lightning
    lightning.current.nextStrike = Date.now() + 2000 + Math.random() * 5000

    let lastTime = performance.now()

    const animate = (now) => {
      const dt = Math.min((now - lastTime) / 16.67, 3) // normalize to ~60fps, cap at 3x
      lastTime = now
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // === RAIN ===
      for (const drop of raindrops.current) {
        drop.y += drop.speed * dt
        drop.x += WIND_ANGLE * drop.speed * dt

        if (drop.y > canvas.height + drop.length) {
          initRaindrop(canvas, drop)
          drop.y = -drop.length
        }

        ctx.beginPath()
        ctx.moveTo(drop.x, drop.y)
        ctx.lineTo(
          drop.x + WIND_ANGLE * drop.length,
          drop.y + drop.length
        )
        ctx.strokeStyle = `rgba(180, 200, 220, ${drop.opacity})`
        ctx.lineWidth = drop.width
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // === LIGHTNING ===
      const lt = lightning.current
      const time = Date.now()

      // Trigger new strike
      if (!lt.active && time >= lt.nextStrike) {
        const startX = canvas.width * (0.15 + Math.random() * 0.7)
        lt.bolts = generateBolt(startX, -10, canvas)
        lt.active = true
        lt.flashOpacity = 0.35 + Math.random() * 0.2
        lt.fadeStart = time + LIGHTNING_FLASH_DURATION

        // Sometimes double-strike
        if (Math.random() < 0.35) {
          const startX2 = canvas.width * (0.1 + Math.random() * 0.8)
          lt.bolts.push(...generateBolt(startX2, -10, canvas))
        }

        lt.nextStrike = time + LIGHTNING_MIN_INTERVAL + Math.random() * (LIGHTNING_MAX_INTERVAL - LIGHTNING_MIN_INTERVAL)
      }

      if (lt.active) {
        const elapsed = time - (lt.fadeStart - LIGHTNING_FLASH_DURATION)

        // Screen flash
        if (time < lt.fadeStart) {
          ctx.fillStyle = `rgba(200, 210, 230, ${lt.flashOpacity})`
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else {
          const fadeProgress = (time - lt.fadeStart) / (LIGHTNING_BOLT_DURATION - LIGHTNING_FLASH_DURATION)
          if (fadeProgress < 1) {
            const fadeAlpha = lt.flashOpacity * 0.3 * (1 - fadeProgress)
            ctx.fillStyle = `rgba(200, 210, 230, ${fadeAlpha})`
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
        }

        // Draw bolts
        const boltFade = elapsed < LIGHTNING_FLASH_DURATION
          ? 1
          : Math.max(0, 1 - (time - lt.fadeStart) / (LIGHTNING_BOLT_DURATION * 1.5))

        if (boltFade > 0) {
          for (const seg of lt.bolts) {
            const alpha = seg.main
              ? boltFade * (0.8 + Math.random() * 0.2)
              : boltFade * (0.4 + Math.random() * 0.2)

            // Outer glow
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(170, 190, 255, ${alpha * 0.3})`
            ctx.lineWidth = seg.width * 6
            ctx.lineCap = 'round'
            ctx.stroke()

            // Mid glow
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(200, 210, 255, ${alpha * 0.6})`
            ctx.lineWidth = seg.width * 3
            ctx.stroke()

            // Core
            ctx.beginPath()
            ctx.moveTo(seg.x1, seg.y1)
            ctx.lineTo(seg.x2, seg.y2)
            ctx.strokeStyle = `rgba(240, 245, 255, ${alpha})`
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
      style={{ zIndex: 1 }}
    />
  )
}
