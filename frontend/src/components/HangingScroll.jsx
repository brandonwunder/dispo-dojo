import { motion } from 'framer-motion'
import CountUp from 'react-countup'

export default function HangingScroll({
  kanji,
  label,
  value,
  prefix = '',
  suffix = '',
  delay = 0,
}) {
  return (
    <motion.div
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.02, y: -4 }}
    >
      {/* Rope ties */}
      <div className="flex justify-between w-full px-6 mb-0">
        <div className="scroll-rope" />
        <div className="scroll-rope" />
      </div>

      {/* Top dowel */}
      <div className="scroll-dowel w-full z-10" />

      {/* Parchment body */}
      <div
        className="scroll-parchment w-[calc(100%-16px)] py-8 px-4 text-center relative"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 1px 6px rgba(0,0,0,0.2)',
        }}
      >
        {/* Kanji watermark */}
        {kanji && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-display pointer-events-none select-none"
            style={{ color: 'rgba(166, 124, 46, 0.08)' }}
          >
            {kanji}
          </span>
        )}

        {/* Stat value */}
        <div className="relative z-10">
          <p className="font-display text-4xl font-bold tracking-wide"
            style={{ color: '#1a1510' }}
          >
            {prefix}
            <CountUp end={typeof value === 'number' ? value : 0} duration={2} separator="," />
            {suffix}
          </p>
          <p className="font-heading text-xs tracking-[0.2em] uppercase mt-2"
            style={{ color: '#6b5a42' }}
          >
            {label}
          </p>
        </div>

        {/* Hanko seal */}
        <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full hanko-seal flex items-center justify-center">
          <span className="text-[8px] font-bold text-parchment font-heading">
            {kanji}
          </span>
        </div>
      </div>

      {/* Bottom dowel */}
      <div className="scroll-dowel w-full z-10" />
    </motion.div>
  )
}
