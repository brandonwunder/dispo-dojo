export default function MapIcon({ size = 24, className = '' }) {
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
      {/* Scroll map — unfurled */}
      <path d="M3 6c0-1 .5-2 1.5-2S6 5 6 6v12c0 1-.5 2-1.5 2S3 19 3 18V6z" />
      <path d="M6 4l6 3 6-3" />
      <path d="M6 18l6 3 6-3" />
      <path d="M18 4c0-1 .5-2 1.5-2S21 3 21 4v12c0 1-.5 2-1.5 2S18 17 18 16V4z" />
      <path d="M12 7v14" />
      {/* Path marker */}
      <path d="M9 10l2 2 4-3" opacity="0.5" />
      {/* Location dot */}
      <circle cx="15" cy="12" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  )
}
