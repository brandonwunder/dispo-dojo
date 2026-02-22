export default function ForgeHammerIcon({ size = 24, className = '' }) {
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
      {/* Hammer head */}
      <rect x="3" y="3" width="10" height="6" rx="1" fill="currentColor" opacity="0.15" />
      <rect x="3" y="3" width="10" height="6" rx="1" />
      {/* Hammer handle */}
      <path d="M8 9v12" strokeWidth="2" />
      {/* Anvil base */}
      <path d="M2 21h18" />
      <path d="M4 18h12l2 3H2l2-3z" fill="currentColor" opacity="0.1" />
      <path d="M4 18h12l2 3H2l2-3z" />
      {/* Sparks */}
      <path d="M15 7l2-2" opacity="0.5" />
      <path d="M16 10l2-1" opacity="0.4" />
      <path d="M17 5l2 0" opacity="0.3" />
    </svg>
  )
}
