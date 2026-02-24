import { motion } from 'framer-motion'
import { X } from 'lucide-react'

export default function UserProfileCard({ name, email, onClose }) {
  const initials = (name || 'G')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute z-40 w-56 wood-panel rounded-sm border border-gold-dim/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] p-4"
      style={{ bottom: '100%', left: 0, marginBottom: 8 }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-text-dim/40 hover:text-parchment"
      >
        <X size={14} />
      </button>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full hanko-seal flex items-center justify-center text-sm font-heading font-bold text-parchment">
          {initials}
        </div>
        <div>
          <p className="font-heading text-sm font-semibold text-parchment">{name || 'Guest'}</p>
          <p className="text-[10px] text-gold">Member</p>
        </div>
      </div>
      {email && (
        <p className="text-[10px] text-text-dim/50 truncate">{email}</p>
      )}
    </motion.div>
  )
}
