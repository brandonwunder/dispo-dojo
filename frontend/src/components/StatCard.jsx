import { motion } from 'framer-motion'
import CountUp from 'react-countup'

export default function StatCard({
  icon: Icon,
  label,
  value,
  suffix = '',
  prefix = '',
  className = '',
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`
        relative overflow-hidden
        bg-bg-card/80 backdrop-blur-xl
        border border-gold-dim/[0.15] rounded-xl
        p-5
        ${className}
      `}
    >
      {/* Hanko seal icon */}
      {Icon && (
        <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center mb-3">
          <Icon size={18} className="text-white" />
        </div>
      )}

      {/* Label */}
      <p className="font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim mb-1">
        {label}
      </p>

      {/* Value */}
      <p className="font-display text-3xl text-text-primary tracking-wide">
        {prefix}
        <CountUp end={typeof value === 'number' ? value : 0} duration={1.5} separator="," />
        {suffix}
      </p>

      {/* Blade edge accent */}
      <div className="absolute bottom-0 left-4 right-4 katana-line" />
    </motion.div>
  )
}
