import { motion } from 'framer-motion'

export default function ShurikenLoader({ size = 40, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      >
        {/* 4-pointed shuriken */}
        <path
          d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-gold"
        />
        <path
          d="M20 6 L22 16 L34 20 L22 22 L20 34 L18 22 L6 20 L18 18 Z"
          fill="currentColor"
          className="text-gold/40"
        />
        {/* Center circle */}
        <circle cx="20" cy="20" r="3" fill="currentColor" className="text-gold" />
      </motion.svg>
    </div>
  )
}
