/**
 * MistLayer — 4 warm-toned mist patches with organic drift animations.
 * Visible warm gold/amber mist creating atmospheric depth.
 */

const patches = [
  {
    // Large gold — upper left drift
    width: 900,
    height: 700,
    top: '5%',
    left: '-8%',
    opacity: 0.18,
    color: 'rgba(212, 168, 83, 0.3)',
    animation: 'mistDrift1',
    duration: '38s',
    delay: '0s',
  },
  {
    // Amber — right side
    width: 750,
    height: 600,
    top: '60%',
    left: '65%',
    opacity: 0.14,
    color: 'rgba(232, 160, 60, 0.25)',
    animation: 'mistDrift2',
    duration: '44s',
    delay: '3s',
  },
  {
    // Warm brown — center
    width: 800,
    height: 650,
    top: '35%',
    left: '20%',
    opacity: 0.12,
    color: 'rgba(180, 130, 80, 0.2)',
    animation: 'mistDrift3',
    duration: '50s',
    delay: '7s',
  },
  {
    // Deep gold — bottom left
    width: 700,
    height: 600,
    top: '75%',
    left: '-5%',
    opacity: 0.16,
    color: 'rgba(200, 155, 60, 0.25)',
    animation: 'mistDrift4',
    duration: '35s',
    delay: '12s',
  },
]

export default function MistLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {patches.map((p, i) => (
        <div
          key={i}
          className={`absolute blur-[50px]`}
          style={{
            width: p.width,
            height: p.height,
            top: p.top,
            left: p.left,
            opacity: p.opacity,
            background: `radial-gradient(ellipse, ${p.color} 0%, transparent 70%)`,
            animation: `${p.animation} ${p.duration} ease-in-out ${p.delay} infinite`,
          }}
        />
      ))}

      <style>{`
        @keyframes mistDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(70px, -25px) scale(1.06); }
          50% { transform: translate(40px, 20px) scale(0.97); }
          75% { transform: translate(-30px, -10px) scale(1.03); }
        }
        @keyframes mistDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(-60px, 30px) scale(1.04); }
          50% { transform: translate(-90px, -20px) scale(0.94); }
          80% { transform: translate(20px, 15px) scale(1.07); }
        }
        @keyframes mistDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          30% { transform: translate(50px, -35px) scale(1.08); }
          60% { transform: translate(-40px, 25px) scale(0.96); }
          85% { transform: translate(20px, -15px) scale(1.02); }
        }
        @keyframes mistDrift4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(80px, -15px) scale(0.95); }
          55% { transform: translate(30px, 35px) scale(1.06); }
          80% { transform: translate(-50px, 10px) scale(1.01); }
        }
      `}</style>
    </div>
  )
}
