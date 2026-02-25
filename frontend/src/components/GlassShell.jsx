import { motion } from 'framer-motion'

const ORB_PRESETS = {
  default: [
    { bg: 'rgba(14,90,136,0.1)',  blur: 80, size: 360, top: '-10%', left: '-8%',  dur: 14, dx: 22, dy: -34 },
    { bg: 'rgba(229,57,53,0.07)', blur: 60, size: 280, bottom: '-8%', right: '5%', dur: 18, dx: -28, dy: 18 },
    { bg: 'rgba(127,0,255,0.05)', blur: 50, size: 200, top: '40%', right: '25%',  dur: 11, dx: 14, dy: 28 },
  ],
  gold: [
    { bg: 'rgba(246,196,69,0.08)', blur: 80, size: 360, top: '-10%', left: '-8%',  dur: 14, dx: 22, dy: -34 },
    { bg: 'rgba(14,90,136,0.06)',  blur: 60, size: 280, bottom: '-8%', right: '5%', dur: 18, dx: -28, dy: 18 },
    { bg: 'rgba(229,57,53,0.04)', blur: 50, size: 200, top: '40%', right: '25%',  dur: 11, dx: 14, dy: 28 },
  ],
  purple: [
    { bg: 'rgba(127,0,255,0.08)', blur: 80, size: 360, top: '-10%', left: '-8%',  dur: 14, dx: 22, dy: -34 },
    { bg: 'rgba(0,198,255,0.06)', blur: 60, size: 280, bottom: '-8%', right: '5%', dur: 18, dx: -28, dy: 18 },
    { bg: 'rgba(246,196,69,0.04)', blur: 50, size: 200, top: '40%', right: '25%', dur: 11, dx: 14, dy: 28 },
  ],
  emerald: [
    { bg: 'rgba(16,185,129,0.08)', blur: 80, size: 360, top: '-10%', left: '-8%',  dur: 14, dx: 22, dy: -34 },
    { bg: 'rgba(0,198,255,0.06)',  blur: 60, size: 280, bottom: '-8%', right: '5%', dur: 18, dx: -28, dy: 18 },
    { bg: 'rgba(127,0,255,0.04)', blur: 50, size: 200, top: '40%', right: '25%',  dur: 11, dx: 14, dy: 28 },
  ],
}

export default function GlassShell({ children, className = '', orbColors = 'default', maxWidth = 'max-w-5xl' }) {
  const orbs = ORB_PRESETS[orbColors] || ORB_PRESETS.default

  return (
    <>
      <style>{`
        @keyframes gs-float-a { 0%,100%{transform:translate(0,0)} 50%{transform:translate(${orbs[0].dx}px,${orbs[0].dy}px)} }
        @keyframes gs-float-b { 0%,100%{transform:translate(0,0)} 50%{transform:translate(${orbs[1].dx}px,${orbs[1].dy}px)} }
        @keyframes gs-float-c { 0%,100%{transform:translate(0,0)} 50%{transform:translate(${orbs[2].dx}px,${orbs[2].dy}px)} }
      `}</style>

      <div className={`relative rounded-3xl p-px overflow-hidden mb-8 ${maxWidth} mx-auto`}>
        {/* Rotating conic-gradient border */}
        <motion.div
          className="absolute pointer-events-none"
          style={{
            width: '400%', height: '400%',
            top: '-150%', left: '-150%',
            background: 'conic-gradient(from 0deg, transparent 15%, rgba(0,198,255,0.45) 32%, transparent 48%, rgba(229,57,53,0.25) 68%, transparent 83%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Inner card */}
        <div
          className={`relative rounded-[calc(1.5rem-1px)] overflow-hidden p-6 md:p-8 ${className}`}
          style={{
            background: 'rgba(11,15,20,0.58)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
          }}
        >
          {/* Ambient orbs */}
          <div className="pointer-events-none absolute inset-0">
            {orbs.map((orb, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: orb.size,
                  height: orb.size,
                  borderRadius: '50%',
                  background: orb.bg,
                  filter: `blur(${orb.blur}px)`,
                  top: orb.top, left: orb.left, bottom: orb.bottom, right: orb.right,
                  animation: `gs-float-${['a','b','c'][i]} ${orb.dur}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative">{children}</div>
        </div>
      </div>
    </>
  )
}
