export default function WarFanIcon({ size = 24, className = '' }) {
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
      {/* Fan ribs radiating from pivot */}
      <path d="M12 20L4 6" opacity="0.4" />
      <path d="M12 20L7 4" opacity="0.4" />
      <path d="M12 20L12 3" opacity="0.4" />
      <path d="M12 20L17 4" opacity="0.4" />
      <path d="M12 20L20 6" opacity="0.4" />
      {/* Fan surface — arc */}
      <path d="M4 6c1-2 3.5-3 8-3s7 1 8 3" fill="currentColor" opacity="0.1" />
      <path d="M4 6c1-2 3.5-3 8-3s7 1 8 3" />
      {/* Outer decorative edge */}
      <path d="M3.5 7c1.5-3 4.5-5 8.5-5s7 2 8.5 5" opacity="0.3" />
      {/* Pivot point */}
      <circle cx="12" cy="20" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="12" cy="20" r="1.5" />
    </svg>
  )
}
