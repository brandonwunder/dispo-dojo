export default function HawkIcon({ size = 24, className = '' }) {
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
      {/* Body */}
      <path d="M12 8c-3 0-6 2-8 6 2 2 5 4 8 4s6-2 8-4c-2-4-5-6-8-6z" fill="currentColor" opacity="0.1" />
      {/* Wings spread */}
      <path d="M4 14c-2-3-2-7-1-10 3 1 5 4 6 7" />
      <path d="M20 14c2-3 2-7 1-10-3 1-5 4-6 7" />
      {/* Head */}
      <circle cx="12" cy="8" r="2.5" />
      {/* Eye */}
      <circle cx="12" cy="7.5" r="0.7" fill="currentColor" />
      {/* Beak */}
      <path d="M12 9.5l-1 1.5h2l-1-1.5" fill="currentColor" opacity="0.4" />
      {/* Tail feathers */}
      <path d="M10 18v3" opacity="0.5" />
      <path d="M12 18v3.5" opacity="0.5" />
      <path d="M14 18v3" opacity="0.5" />
    </svg>
  )
}
