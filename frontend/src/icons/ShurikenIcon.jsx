export default function ShurikenIcon({ size = 24, className = '' }) {
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
      {/* Four-pointed shuriken */}
      <path
        d="M12 2l-2 6 -6-2 6 2 -2 6 2-6 6 2 -6-2 2-6z"
        fill="currentColor"
        opacity="0.1"
      />
      <path d="M12 2l2 8-8-2 8 2 2 8-2-8 8 2-8-2-2-8z" />
      {/* Center hole */}
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.2" />
      {/* Blade edges */}
      <path d="M12 2l-1 4" opacity="0.4" />
      <path d="M22 12l-4-1" opacity="0.4" />
      <path d="M12 22l1-4" opacity="0.4" />
      <path d="M2 12l4 1" opacity="0.4" />
    </svg>
  )
}
