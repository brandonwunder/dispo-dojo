export default function GlassCard({
  children,
  className = '',
  hover = true,
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      className={`
        backdrop-blur-xl bg-glass border border-glass-border rounded-2xl
        ${hover
          ? 'hover:border-glass-border-hover hover:shadow-[0_0_60px_-20px_rgba(201,169,110,0.25)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer'
          : ''
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}
