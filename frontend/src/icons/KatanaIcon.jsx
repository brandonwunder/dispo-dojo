export default function KatanaIcon({ size = 24, className = '' }) {
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
      {/* Blade — curved */}
      <path d="M5 2c0 0 1 3 1 8s-1 8-1 8" strokeWidth="1" />
      <path d="M5 2c0 0 3 3 3 8s-3 8-3 8" fill="currentColor" opacity="0.1" />
      {/* Tsuba (guard) — oval */}
      <ellipse cx="5.5" cy="18" rx="3.5" ry="1" />
      {/* Tsuka (handle) — wrapped */}
      <path d="M5 19v4" strokeWidth="2" />
      <path d="M4 20h2" opacity="0.5" />
      <path d="M4 21.5h2" opacity="0.5" />
      {/* Blade edge gleam */}
      <path d="M6 5v8" opacity="0.3" strokeWidth="0.5" />
      {/* Second katana crossed */}
      <path d="M19 2c0 0-1 3-1 8s1 8 1 8" strokeWidth="1" />
      <path d="M19 2c0 0-3 3-3 8s3 8 3 8" fill="currentColor" opacity="0.1" />
      <ellipse cx="18.5" cy="18" rx="3.5" ry="1" />
      <path d="M19 19v4" strokeWidth="2" />
    </svg>
  )
}
