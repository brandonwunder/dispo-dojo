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
    <>
      <style>{`@keyframes sway { 0%,100% { transform: rotate(-0.5deg); } 50% { transform: rotate(0.5deg); } }`}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        style={{ animation: 'sway 4s ease-in-out infinite' }}
        className={`
          scroll-card wood-panel
          relative overflow-hidden
          p-5
          ${className}
        `}
      >
        {/* Hanko seal icon */}
        {Icon && (
          <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center mb-3 text-gold">
            <Icon size={18} className="text-white" />
          </div>
        )}

        {/* Label */}
        <p className="font-heading text-text-dim tracking-widest uppercase text-xs mb-1">
          {label}
        </p>

        {/* Value */}
        <p className="gold-shimmer-text font-heading text-3xl font-bold tracking-wide">
          {prefix}
          <CountUp end={typeof value === 'number' ? value : 0} duration={1.5} separator="," />
          {suffix}
        </p>

        {/* Blade edge accent */}
        <div className="absolute bottom-0 left-4 right-4 katana-line" />
      </motion.div>
    </>
  )
}
