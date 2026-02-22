export default function BannerIcon({ size = 24, className = '' }) {
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
      {/* Pole */}
      <path d="M6 2v20" strokeWidth="2" />
      {/* Banner fabric */}
      <path d="M6 3h12c0 2-1 3-2 4s-2 2-2 4h-8" fill="currentColor" opacity="0.12" />
      <path d="M6 3h12c0 2-1 3-2 4s-2 2-2 4h-8" />
      {/* Banner bottom edge — swallowtail */}
      <path d="M6 11h8l-2-2" />
      {/* Mon (crest) on banner */}
      <circle cx="11" cy="7" r="2" opacity="0.4" />
      <circle cx="11" cy="7" r="0.8" fill="currentColor" opacity="0.3" />
      {/* Pole cap */}
      <circle cx="6" cy="2" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  )
}
