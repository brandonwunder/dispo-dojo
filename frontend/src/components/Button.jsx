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
      bg-gradient-to-r from-gold-dim via-gold to-gold-bright
      text-bg font-semibold
      shadow-[0_4px_20px_-4px_rgba(212,168,83,0.4)]
      hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outline: `
      border border-gold-dim/[0.2] text-text-primary
      hover:border-gold hover:text-gold
      hover:shadow-[0_0_20px_-8px_rgba(212,168,83,0.2)]
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    danger: `
      bg-crimson/10 border border-crimson/20 text-crimson-bright
      hover:bg-crimson/20 hover:border-crimson/40
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.1 }}
      className={`
        group relative inline-flex items-center justify-center
        rounded-xl font-body font-medium
        transition-all duration-300
        ${sizeClasses[size]}
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
