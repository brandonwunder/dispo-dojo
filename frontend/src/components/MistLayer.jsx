/**
 * MistLayer — 6 warm-toned mist patches with organic drift animations.
 * All patches use gold, amber, and warm brown tones at very low opacity.
 */

const patches = [
  {
    // Large gold — upper left drift
    width: 900,
    height: 700,
    top: '5%',
    left: '-8%',
    opacity: 0.05,
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
    opacity: 0.04,
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
    opacity: 0.03,
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
    opacity: 0.045,
    color: 'rgba(200, 155, 60, 0.25)',
    animation: 'mistDrift4',
    duration: '35s',
    delay: '12s',
  },
  {
    // Light amber — top right
    width: 650,
    height: 550,
    top: '-5%',
    left: '55%',
    opacity: 0.035,
    color: 'rgba(225, 180, 90, 0.2)',
    animation: 'mistDrift5',
    duration: '42s',
    delay: '5s',
  },
  {
    // Warm sand — lower center
    width: 850,
    height: 700,
    top: '50%',
    left: '35%',
    opacity: 0.06,
    color: 'rgba(195, 160, 100, 0.2)',
    animation: 'mistDrift6',
    duration: '48s',
    delay: '9s',
  },
]

export default function MistLayer() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {patches.map((p, i) => (
        <div
          key={i}
          className={`absolute blur-[80px]`}
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
        @keyframes mistDrift5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          35% { transform: translate(-45px, 40px) scale(1.05); }
          65% { transform: translate(60px, 20px) scale(0.93); }
          90% { transform: translate(-20px, -30px) scale(1.04); }
        }
        @keyframes mistDrift6 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(35px, -45px) scale(1.07); }
          45% { transform: translate(-55px, 15px) scale(0.95); }
          70% { transform: translate(25px, 30px) scale(1.03); }
          90% { transform: translate(-15px, -20px) scale(0.98); }
        }
      `}</style>
    </div>
  )
}
