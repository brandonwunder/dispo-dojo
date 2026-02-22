import { motion } from 'framer-motion'

export default function Button({
  variant = 'gold',
  size = 'md',
  children,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'px-4 py-1.5 text-sm',
    md: 'px-6 py-2.5 text-sm',
  }

  const variantClasses = {
    gold: `
      relative overflow-hidden
      gold-shimmer
      text-bg font-heading tracking-widest uppercase font-semibold
      shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)]
      hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outline: `
      wood-panel border border-gold-dim/20 text-gold
      hover:bg-gold/10
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    danger: `
      bg-crimson text-parchment
      hover:bg-crimson-bright
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    seal: `
      rounded-full w-12 h-12
      bg-crimson text-parchment font-heading
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.95, rotate: -2 }}
      transition={{ duration: 0.1 }}
      className={`
        group relative inline-flex items-center justify-center
        ${variant !== 'seal' ? 'rounded-xl' : ''} font-body font-medium
        transition-all duration-300
        ${sizeClasses[size] || ''}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {variant === 'gold' && (
        <span
          className="
            absolute inset-0 -translate-x-full
            bg-gradient-to-r from-transparent via-white/20 to-transparent
            group-hover:translate-x-full transition-transform duration-700
            pointer-events-none
          "
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
