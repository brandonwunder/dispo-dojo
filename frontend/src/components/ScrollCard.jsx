import { motion } from 'framer-motion'
import { useState } from 'react'

export default function ScrollCard({
  children,
  className = '',
  title,
  defaultOpen = true,
  collapsible = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`
        relative overflow-hidden
        bg-bg-card/60 backdrop-blur-xl
        border-x border-gold-dim/[0.12]
        ${className}
      `}
    >
      {/* Top scroll roll */}
      <div className="h-3 bg-gradient-to-b from-gold-dim/10 to-transparent rounded-t-2xl border-t border-gold-dim/20" />

      {/* Title bar (optional) */}
      {title && (
        <button
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          className={`
            w-full flex items-center justify-between px-6 py-3
            font-heading text-sm font-semibold tracking-[0.08em] uppercase text-gold
            ${collapsible ? 'cursor-pointer hover:text-gold-bright transition-colors' : 'cursor-default'}
          `}
        >
          <span>{title}</span>
          {collapsible && (
            <motion.span
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-gold-dim"
            >
              ▾
            </motion.span>
          )}
        </button>
      )}

      {/* Content with unfurl animation */}
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-5">
          {children}
        </div>
      </motion.div>

      {/* Bottom scroll roll */}
      <div className="h-3 bg-gradient-to-t from-gold-dim/10 to-transparent rounded-b-2xl border-b border-gold-dim/20" />
    </motion.div>
  )
}
