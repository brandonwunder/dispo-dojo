import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const ACCENTS = [
  '#d4a853', // gold
  '#4a6fa5', // steel
  '#4a7c59', // bamboo
  '#8b0000', // crimson
  '#d4a853', // gold
  '#4a6fa5', // steel
  '#e8652e', // ember
  '#4a7c59', // bamboo
]

export default function ToolCard({ icon: Icon, label, description, to, delay = 0, index = 0 }) {
  const navigate = useNavigate()
  const accent = ACCENTS[index % ACCENTS.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        whileHover={{
          y: -4,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(212,168,83,0.22), 0 0 28px -8px ${accent}33`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={() => navigate(to)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-[rgba(212,168,83,0.13)] bg-[#0d0d1a] elevation-2 washi-texture"
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
            opacity: 0.5,
          }}
        />

        <div className="flex items-center gap-4 p-5">
          {/* Icon container */}
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${accent}22 0%, ${accent}0d 60%, transparent 100%)`,
              border: `1px solid ${accent}26`,
              boxShadow: `inset 0 1px 0 ${accent}1a, 0 0 12px -4px ${accent}40`,
            }}
          >
            <Icon
              className="h-6 w-6"
              style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}60)` }}
            />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[15px] font-semibold text-[#ede9e3] tracking-wide mb-0.5">
              {label}
            </p>
            <p className="font-body text-[12px] text-[#8a8578] leading-relaxed line-clamp-1">
              {description}
            </p>
          </div>

          {/* Open button */}
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-[#d4a853] hover:text-[#f5d078] hover:bg-[rgba(212,168,83,0.08)] font-heading text-[13px] tracking-wide transition-[color,background-color] duration-150"
            onClick={(e) => {
              e.stopPropagation()
              navigate(to)
            }}
          >
            Open
          </Button>
        </div>

        {/* Bottom katana micro-line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}33, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
