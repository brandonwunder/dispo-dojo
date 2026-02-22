import { motion } from 'framer-motion'

export default function InkLandscape({ children }) {
  return (
    <div className="relative h-[220px] rounded-sm overflow-hidden mb-8">
      {/* Sky gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1a 40%, #12100c 100%)',
        }}
      />

      {/* Far mountain range */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[55%]"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(26,21,16,0.4) 100%)',
          clipPath: 'polygon(0% 60%, 5% 45%, 12% 55%, 20% 30%, 28% 50%, 35% 25%, 42% 40%, 50% 15%, 58% 35%, 65% 20%, 72% 42%, 80% 28%, 88% 45%, 95% 35%, 100% 50%, 100% 100%, 0% 100%)',
          opacity: 0.3,
        }}
      />

      {/* Mid mountain range */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[45%]"
        style={{
          background: 'linear-gradient(180deg, rgba(26,21,16,0.5) 0%, rgba(26,21,16,0.8) 100%)',
          clipPath: 'polygon(0% 70%, 8% 50%, 15% 60%, 22% 35%, 30% 55%, 38% 30%, 45% 50%, 52% 25%, 60% 45%, 68% 30%, 75% 50%, 82% 38%, 90% 55%, 100% 40%, 100% 100%, 0% 100%)',
          opacity: 0.5,
        }}
      />

      {/* Torii gate silhouette */}
      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 opacity-20">
        <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
          <rect x="8" y="0" width="44" height="4" rx="1" fill="#d4a853" />
          <rect x="5" y="4" width="50" height="3" rx="1" fill="#d4a853" opacity="0.8" />
          <rect x="12" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="44" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="12" y="14" width="36" height="2.5" rx="1" fill="#d4a853" opacity="0.5" />
        </svg>
      </div>

      {/* Near ground layer */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%]"
        style={{
          background: 'linear-gradient(180deg, rgba(12,10,7,0.6) 0%, #0c0a07 100%)',
          clipPath: 'polygon(0% 50%, 10% 40%, 20% 55%, 35% 30%, 50% 45%, 65% 25%, 80% 45%, 90% 35%, 100% 45%, 100% 100%, 0% 100%)',
        }}
      />

      {/* Drifting mist layer */}
      <div
        className="absolute bottom-[15%] left-0 h-[30%] opacity-[0.07] pointer-events-none"
        style={{
          width: '200%',
          background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.3) 10%, transparent 20%)',
          filter: 'blur(30px)',
          animation: 'mistScroll 60s linear infinite',
        }}
      />

      {/* Gradient fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-bg via-bg/60 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {children}
      </div>
    </div>
  )
}
