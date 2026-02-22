export default function SealStampIcon({ size = 24, className = '' }) {
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
      {/* Stamp handle */}
      <path d="M9 3h6v5H9z" />
      <path d="M10 3h4v5h-4z" fill="currentColor" opacity="0.1" />
      {/* Stamp base — wider */}
      <path d="M7 8h10v3H7z" />
      {/* Seal impression — square with rounded corners (hanko style) */}
      <rect x="6" y="13" width="12" height="9" rx="1" fill="currentColor" opacity="0.12" />
      <rect x="6" y="13" width="12" height="9" rx="1" />
      {/* Kanji-like mark inside seal */}
      <path d="M9 16h6" strokeWidth="1.5" />
      <path d="M12 15v4" strokeWidth="1.5" />
      <path d="M9 19h6" strokeWidth="1" opacity="0.5" />
    </svg>
  )
}
