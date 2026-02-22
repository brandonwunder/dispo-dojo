export default function ToriiIcon({ size = 24, className = '' }) {
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
      {/* Top roof beam — curved kasagi */}
      <path d="M2 5c3-2 6-3 10-3s7 1 10 3" strokeWidth="2" />
      {/* Nuki (tie beam) */}
      <line x1="5" y1="8" x2="19" y2="8" strokeWidth="1.5" />
      {/* Left pillar */}
      <path d="M7 5v17" strokeWidth="2" />
      {/* Right pillar */}
      <path d="M17 5v17" strokeWidth="2" />
      {/* Gakuzuka (central tablet area) */}
      <rect x="10" y="5.5" width="4" height="2.5" rx="0.5" fill="currentColor" opacity="0.15" />
      {/* Ground line */}
      <path d="M4 22h16" opacity="0.3" />
    </svg>
  )
}
