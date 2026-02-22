export default function CompassIcon({ size = 24, className = '' }) {
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
      {/* Outer circle */}
      <circle cx="12" cy="12" r="10" />
      {/* Inner circle */}
      <circle cx="12" cy="12" r="3" />
      {/* Compass needle — diamond shape */}
      <polygon points="12,2.5 13.5,12 12,14 10.5,12" fill="currentColor" opacity="0.25" />
      <polygon points="12,21.5 13.5,12 12,10 10.5,12" fill="currentColor" opacity="0.15" />
      {/* Cardinal marks */}
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
    </svg>
  )
}
