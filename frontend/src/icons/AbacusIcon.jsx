export default function AbacusIcon({ size = 24, className = '' }) {
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
      {/* Frame */}
      <rect x="3" y="3" width="18" height="18" rx="1" />
      {/* Horizontal rods */}
      <line x1="3" y1="8" x2="21" y2="8" opacity="0.3" />
      <line x1="3" y1="12" x2="21" y2="12" opacity="0.3" />
      <line x1="3" y1="16" x2="21" y2="16" opacity="0.3" />
      {/* Beads row 1 */}
      <circle cx="7" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="11" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="15" cy="8" r="1.5" fill="currentColor" opacity="0.3" />
      {/* Beads row 2 */}
      <circle cx="9" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="13" cy="12" r="1.5" fill="currentColor" opacity="0.3" />
      {/* Beads row 3 */}
      <circle cx="7" cy="16" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="11" cy="16" r="1.5" fill="currentColor" opacity="0.3" />
      <circle cx="17" cy="16" r="1.5" fill="currentColor" opacity="0.3" />
    </svg>
  )
}
