import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

// Brand glow gradient — consistent across all cards
const C1 = '#7F00FF' // purple
const C2 = '#00C6FF' // electric cyan

export default function ToolCard({ icon: Icon, image, label, description, to, delay = 0, index = 0 }) {
  const navigate = useNavigate()
  // Alternate direction per card for subtle variety without clashing
  const [c1, c2] = index % 2 === 0 ? [C1, C2] : [C2, C1]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <motion.div
        whileHover={{
          y: -4,
          boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${c1}30, 0 0 32px -8px ${c1}55`,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        onClick={() => navigate(to)}
        className="group relative cursor-pointer rounded-xl border border-[rgba(255,255,255,0.07)] bg-[#0d0d1a] elevation-2 washi-texture overflow-visible"
      >
        {/* Left accent bar — gradient c1→c2 */}
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${c1} 30%, ${c2} 70%, transparent 100%)`,
            opacity: 0.85,
          }}
        />

        <div className="flex items-center gap-4 p-5">
          {/* Icon container */}
          <div
            className="relative flex shrink-0 items-center justify-center rounded-2xl"
            style={{
              width: 60,
              height: 60,
              background: `linear-gradient(135deg, ${c1}1A 0%, ${c2}0D 100%)`,
              border: `1px solid ${c1}40`,
              boxShadow: `0 0 16px ${c1}25, 0 0 32px ${c2}15, 0 4px 12px rgba(0,0,0,0.4)`,
            }}
          >
            {/* Inner diagonal highlight */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `linear-gradient(135deg, ${c1}18 0%, ${c2}10 50%, transparent 100%)`,
              }}
            />
            <Icon
              style={{
                width: 28,
                height: 28,
                color: '#ffffff',
                filter: `drop-shadow(0 0 6px ${c1}) drop-shadow(0 0 12px ${c2}) drop-shadow(0 0 20px ${c1}99)`,
                strokeWidth: 1.75,
              }}
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
            background: `linear-gradient(90deg, transparent, ${c1}66, ${c2}88, transparent)`,
          }}
        />
      </motion.div>
    </motion.div>
  )
}
