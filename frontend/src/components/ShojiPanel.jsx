import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function ShojiPanel({ icon: Icon, label, description, to, delay = 0 }) {
  return (
    <Link to={to} className="block">
      <motion.div
        className="shoji-frame rounded-sm p-2 relative overflow-hidden group cursor-pointer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ boxShadow: '0 8px 32px rgba(212,168,83,0.15), 0 2px 8px rgba(0,0,0,0.3)' }}
      >
        {/* Inner paper area */}
        <div className="shoji-paper rounded-[2px] relative overflow-hidden h-[160px]">
          {/* Lattice grid overlay */}
          <div className="shoji-lattice" />

          {/* Backlight glow */}
          <div className="shoji-backlight transition-opacity duration-500 opacity-60 group-hover:opacity-100" />

          {/* Default content — icon + label (slides left on hover) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-x-full z-10">
            {Icon && <Icon size={44} className="text-gold/60" />}
            <span className="font-heading text-sm tracking-widest uppercase text-parchment/80">
              {label}
            </span>
          </div>

          {/* Revealed content — description (slides in from right) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 gap-3 translate-x-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 z-10">
            <p className="text-parchment/90 text-sm text-center leading-relaxed font-body">
              {description}
            </p>
            <span className="font-heading text-xs tracking-[0.3em] uppercase text-gold/70 mt-1">
              Enter
            </span>
          </div>

          {/* Warm light flood on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-amber-400/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </motion.div>
    </Link>
  )
}
