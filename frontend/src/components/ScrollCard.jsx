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
        scroll-card wood-panel
        relative overflow-hidden
        ${className}
      `}
    >
      {/* Title bar (optional) */}
      {title && (
        <button
          onClick={collapsible ? () => setIsOpen(!isOpen) : undefined}
          className={`
            lacquer-bar
            w-full flex items-center justify-between px-6 py-3
            font-heading text-gold tracking-widest uppercase text-sm
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
        className="overflow-hidden parchment-texture"
      >
        <div className="px-6 pb-5">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}
