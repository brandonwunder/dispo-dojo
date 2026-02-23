import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const ACCENTS = [
  '#0E5A88', // ninja blue
  '#E53935', // headband red
  '#00C6FF', // electric cyan
  '#F6C445', // gold glow
]

export default function ToolCard({ icon: Icon, image, label, description, to, delay = 0, index = 0 }) {
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
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,198,255,0.2), 0 0 32px -8px ${accent}44`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={() => navigate(to)}
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-[rgba(0,198,255,0.13)] bg-[#0d0d1a] elevation-2 washi-texture"
      >
        {/* Left accent bar */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${accent} 30%, ${accent} 70%, transparent 100%)`,
            opacity: 0.7,
          }}
        />

        <div className="flex items-center gap-4 p-5">
          {/* Icon container */}
          <div
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl"
            style={{
              background: image ? 'transparent' : `radial-gradient(circle at 30% 30%, ${accent}22 0%, ${accent}0d 60%, transparent 100%)`,
              border: image ? 'none' : `1px solid ${accent}26`,
              '--glow-base': `inset 0 1px 0 ${accent}1a, 0 0 8px ${accent}40`,
              '--glow-peak': `inset 0 1px 0 ${accent}1a, 0 0 16px ${accent}60`,
              animation: image ? 'none' : 'glowPulse 2.5s ease-in-out infinite',
            }}
          >
            {image ? (
              <img
                src={image}
                alt={label}
                className="h-[52px] w-[52px] object-contain"
                style={{ filter: `drop-shadow(0 0 8px ${accent}50)` }}
              />
            ) : (
              <Icon
                className="h-6 w-6"
                style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}60)` }}
              />
            )}
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
            className="shrink-0 text-[#00C6FF] hover:text-[#FFD97A] hover:bg-[rgba(0,198,255,0.08)] font-heading text-[13px] tracking-wide transition-[color,background-color] duration-150"
            onClick={(e) => {
              e.stopPropagation()
              navigate(to)
            }}
          >
            Open
          </Button>
        </div>

        {/* Bottom accent micro-line */}
        <div
          className="absolute bottom-0 left-4 right-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}66, #00C6FF88, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
