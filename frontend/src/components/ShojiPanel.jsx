import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function ShojiPanel({ icon: Icon, label, description, to, delay = 0 }) {
  return (
    <Link to={to} className="block">
      <motion.div
        className="shoji-frame rounded-sm p-2 relative overflow-hidden group cursor-pointer elevation-2 glow-on-hover"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4), 0 0 24px rgba(212,168,83,0.1)' }}
      >
        {/* Inner paper area */}
        <div className="shoji-paper rounded-[2px] relative overflow-hidden min-h-[120px] p-5 flex flex-col justify-between">
          {/* Lattice grid overlay */}
          <div className="shoji-lattice" />

          {/* Backlight glow */}
          <div className="shoji-backlight transition-opacity duration-500 opacity-40 group-hover:opacity-100" />

          {/* Content — always visible */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              {Icon && <Icon size={28} className="text-gold/70 group-hover:text-gold transition-colors duration-300" />}
              <span className="font-heading text-sm tracking-widest uppercase text-parchment/90">
                {label}
              </span>
            </div>
            <p className="text-parchment/50 text-sm leading-relaxed font-body group-hover:text-parchment/70 transition-colors duration-300">
              {description}
            </p>
          </div>

          {/* Enter indicator — fades in on hover */}
          <div className="relative z-10 flex justify-end mt-3">
            <span className="font-heading text-[10px] tracking-[0.3em] uppercase text-gold/0 group-hover:text-gold/60 transition-colors duration-300">
              Enter →
            </span>
          </div>

          {/* Warm light flood on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-amber-400/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </motion.div>
    </Link>
  )
}
