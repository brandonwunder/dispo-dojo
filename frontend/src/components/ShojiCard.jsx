import { motion } from 'framer-motion'

export default function ShojiCard({
  children,
  className = '',
  hover = true,
  onClick,
  glow = false,
  ...props
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      className={`
        relative washi-texture overflow-hidden
        bg-bg-card/80 backdrop-blur-xl
        border border-gold-dim/[0.15] rounded-xl
        ${hover ? 'cursor-pointer transition-all duration-300 hover:border-gold-dim/30 hover:shadow-[0_0_40px_-15px_rgba(212,168,83,0.15)]' : ''}
        ${glow ? 'shadow-[0_0_30px_-10px_rgba(212,168,83,0.2)]' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Corner notch accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold-dim/20 rounded-tl-sm pointer-events-none z-10" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold-dim/20 rounded-tr-sm pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-gold-dim/20 rounded-bl-sm pointer-events-none z-10" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold-dim/20 rounded-br-sm pointer-events-none z-10" />

      {/* Parchment warmth overlay */}
      <div className="absolute inset-0 bg-parchment pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-[2]">
        {children}
      </div>
    </motion.div>
  )
}
