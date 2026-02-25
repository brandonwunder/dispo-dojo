export default function NinjaIcon({ size = 24, className = '' }) {
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
      {/* Head shape */}
      <ellipse cx="12" cy="11" rx="7.5" ry="8.5" />
      {/* Mask covering lower face */}
      <path d="M4.5 12.5 C4.5 17 8 20 12 20 C16 20 19.5 17 19.5 12.5" fill="currentColor" opacity="0.12" />
      <path d="M4.5 12.5 C4.5 17 8 20 12 20 C16 20 19.5 17 19.5 12.5" />
      {/* Headband */}
      <path d="M4.5 9 L19.5 9" strokeWidth="2.5" />
      {/* Headband tails */}
      <path d="M19.5 8.5 Q21 8 21.5 9.5 Q22 11 21 12" strokeWidth="1.5" />
      <path d="M19.5 9.5 Q20.5 9 21 10.5 Q21.3 12 20.5 13" strokeWidth="1" opacity="0.5" />
      {/* Eyes */}
      <ellipse cx="9" cy="11" rx="1.8" ry="1.2" fill="currentColor" opacity="0.9" />
      <ellipse cx="15" cy="11" rx="1.8" ry="1.2" fill="currentColor" opacity="0.9" />
      {/* Eye shine */}
      <circle cx="9.7" cy="10.5" r="0.4" fill="currentColor" opacity="0.15" />
      <circle cx="15.7" cy="10.5" r="0.4" fill="currentColor" opacity="0.15" />
    </svg>
  )
}
