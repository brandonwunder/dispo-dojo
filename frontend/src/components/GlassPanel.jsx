export default function GlassPanel({ children, className = '', style = {} }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{
        background: 'rgba(11,15,20,0.45)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        borderColor: 'rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
