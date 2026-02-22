export default function LanternIcon({ size = 24, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Hook */}
      <path d="M12 2v3" />
      {/* Top bar */}
      <path d="M9 5h6" />
      {/* Lantern body — rounded rectangle shape */}
      <path d="M8 5c-1 2-1.5 4-1.5 6s.5 4 1.5 6h8c1-2 1.5-4 1.5-6s-.5-4-1.5-6" />
      {/* Middle band */}
      <path d="M8 11h8" />
      {/* Bottom bar */}
      <path d="M9 17h6" />
      {/* Tassel */}
      <path d="M12 17v4" />
      <path d="M10 21h4" />
      {/* Inner glow flame */}
      <circle cx="12" cy="11" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  )
}
