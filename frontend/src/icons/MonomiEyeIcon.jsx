export default function MonomiEyeIcon({ size = 24, className = '' }) {
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
      {/* Eye shape — almond/ninja eye */}
      <path d="M2 12c2-4 5.5-7 10-7s8 3 10 7c-2 4-5.5 7-10 7s-8-3-10-7z" />
      <path d="M2 12c2-4 5.5-7 10-7s8 3 10 7c-2 4-5.5 7-10 7s-8-3-10-7z" fill="currentColor" opacity="0.08" />
      {/* Iris */}
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.12" />
      {/* Pupil */}
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.4" />
      {/* Gleam */}
      <circle cx="13.5" cy="10.5" r="0.8" fill="currentColor" opacity="0.2" />
      {/* Dramatic upper lash line */}
      <path d="M2 12c2-4.5 5.5-7.5 10-7.5s8 3 10 7.5" strokeWidth="2" />
    </svg>
  )
}
