export default function InkBrushIcon({ size = 24, className = '' }) {
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
      {/* Brush handle */}
      <path d="M18 2l-8 8" strokeWidth="2" />
      {/* Ferrule (metal band) */}
      <path d="M10 10l-1 1 1 1 1-1-1-1z" fill="currentColor" opacity="0.3" />
      {/* Brush tip — flowing ink shape */}
      <path d="M9 11c-2 2-4 5-5 7 0 1 1 3 3 3 2-1 5-3 7-5" fill="currentColor" opacity="0.15" />
      <path d="M9 11c-2 2-4 5-5 7 0 1 1 3 3 3 2-1 5-3 7-5" />
      {/* Ink splatter */}
      <circle cx="5" cy="19" r="0.5" fill="currentColor" opacity="0.4" />
      <circle cx="3" cy="17" r="0.3" fill="currentColor" opacity="0.3" />
      {/* Brush body taper */}
      <path d="M14 6l4-4" strokeWidth="3" opacity="0.4" />
    </svg>
  )
}
