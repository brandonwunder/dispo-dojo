import { useEffect, useRef } from 'react'

export default function RainEffect() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId = null
    let running = true

    // Config
    const RAIN_COUNT = 280
    const WIND = 0.15
    const LIGHTNING_MIN = 6000
    const LIGHTNING_MAX = 18000

    // State
    const drops = []
    const splashes = []
    let ltActive = false
    let ltBolts = []
    let ltFlash = 0
    let ltFadeStart = 0
    let ltNext = Date.now() + 2000 + Math.random() * 4000

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    function makeDrop(fresh) {
      const layer = Math.random()
      const speed = (14 + Math.random() * 16) * (0.6 + layer * 0.4)
      const len = (20 + Math.random() * 22) * (0.5 + layer * 0.5)
      return {
        x: Math.random() * (canvas.width + 200) - 100,
        y: fresh ? Math.random() * canvas.height * 2 - canvas.height : -len - Math.random() * canvas.height * 0.3,
        speed,
        len,
        opacity: (0.15 + Math.random() * 0.25) * (0.4 + layer * 0.6),
        width: (Math.random() > 0.6 ? 1.5 : 1) * (0.5 + layer * 0.5),
      }
    }

    for (let i = 0; i < RAIN_COUNT; i++) drops.push(makeDrop(true))

    function bolt(sx, sy) {
      const segs = []
      let x = sx, y = sy
      const ey = sy + canvas.height * (0.3 + Math.random() * 0.5)
      while (y < ey) {
        const nx = x + (Math.random() - 0.5) * 70
        const ny = y + 8 + Math.random() * 22
        segs.push({ x1: x, y1: y, x2: nx, y2: ny, w: 2.5 + Math.random() * 1.5, m: true })
        if (Math.random() < 0.35) {
          const d = Math.random() > 0.5 ? 1 : -1
          let bx = nx, by = ny
          for (let i = 0; i < 2 + Math.floor(Math.random() * 5); i++) {
            const nbx = bx + d * (12 + Math.random() * 30)
            const nby = by + 6 + Math.random() * 14
            segs.push({ x1: bx, y1: by, x2: nbx, y2: nby, w: 0.8 + Math.random() * 0.8, m: false })
            bx = nbx; by = nby
          }
        }
        x = nx; y = ny
      }
      return segs
    }

    let last = performance.now()

    function frame(now) {
      if (!running) return
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      const w = canvas.width, h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // Rain
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.y += d.speed * dt
        d.x += WIND * d.speed * dt
        if (d.y > h + d.len) {
          if (Math.random() < 0.25) {
            splashes.push({
              x: d.x + WIND * d.len, y: h - 2 + Math.random() * 4,
              r: 1 + Math.random() * 2, o: 0.3 + Math.random() * 0.2,
              life: 0, max: 8 + Math.random() * 6,
            })
          }
          Object.assign(d, makeDrop(false))
        }
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x + WIND * d.len, d.y + d.len)
        ctx.strokeStyle = `rgba(170,195,220,${d.opacity})`
        ctx.lineWidth = d.width
        ctx.stroke()
      }

      // Splashes
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i]
        s.life += dt
        if (s.life >= s.max) { splashes.splice(i, 1); continue }
        const p = s.life / s.max
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r * (1 + p * 2), 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(180,200,220,${s.o * (1 - p)})`
        ctx.lineWidth = 0.5
        ctx.stroke()
      }

      // Lightning
      const t = Date.now()
      if (!ltActive && t >= ltNext) {
        ltBolts = bolt(w * (0.15 + Math.random() * 0.7), -10)
        if (Math.random() < 0.35) ltBolts.push(...bolt(w * (0.1 + Math.random() * 0.8), -10))
        ltActive = true
        ltFlash = 0.3 + Math.random() * 0.25
        ltFadeStart = t + 180
        ltNext = t + LIGHTNING_MIN + Math.random() * (LIGHTNING_MAX - LIGHTNING_MIN)
      }

      if (ltActive) {
        const elapsed = t - (ltFadeStart - 180)
        // Flash
        if (t < ltFadeStart) {
          ctx.fillStyle = `rgba(200,215,240,${ltFlash})`
          ctx.fillRect(0, 0, w, h)
        } else {
          const fp = (t - ltFadeStart) / 220
          if (fp < 1) {
            ctx.fillStyle = `rgba(200,215,240,${ltFlash * 0.25 * (1 - fp)})`
            ctx.fillRect(0, 0, w, h)
          }
        }
        // Bolts
        const fade = elapsed < 180 ? 1 : Math.max(0, 1 - (t - ltFadeStart) / 600)
        if (fade > 0) {
          for (const s of ltBolts) {
            const a = s.m ? fade * (0.85 + Math.random() * 0.15) : fade * (0.4 + Math.random() * 0.25)
            // Glow
            ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2)
            ctx.strokeStyle = `rgba(140,170,255,${a * 0.25})`; ctx.lineWidth = s.w * 8; ctx.stroke()
            // Mid
            ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2)
            ctx.strokeStyle = `rgba(190,205,255,${a * 0.55})`; ctx.lineWidth = s.w * 3.5; ctx.stroke()
            // Core
            ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2)
            ctx.strokeStyle = `rgba(235,240,255,${a})`; ctx.lineWidth = s.w; ctx.stroke()
          }
        }
        if (t > ltFadeStart + 600) { ltActive = false; ltBolts = [] }
      }

      animId = requestAnimationFrame(frame)
    }

    animId = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)

    return () => {
      running = false
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
    />
  )
}
