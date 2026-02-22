export default function ScrollIcon({ size = 24, className = '' }) {
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
      {/* Top scroll curl */}
      <path d="M6 3c-1 0-2 1-2 2s1 2 2 2h12c1 0 2-1 2-2s-1-2-2-2" />
      {/* Scroll body */}
      <path d="M6 7v10" />
      <path d="M18 7v10" />
      <rect x="6" y="5" width="12" height="14" fill="currentColor" opacity="0.08" />
      {/* Bottom scroll curl */}
      <path d="M6 17c-1 0-2 1-2 2s1 2 2 2h12c1 0 2-1 2-2s-1-2-2-2" />
      {/* Text lines */}
      <line x1="9" y1="9" x2="15" y2="9" opacity="0.4" />
      <line x1="9" y1="11.5" x2="15" y2="11.5" opacity="0.4" />
      <line x1="9" y1="14" x2="13" y2="14" opacity="0.4" />
    </svg>
  )
}
