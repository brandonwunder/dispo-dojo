import { useState } from 'react'
import { Star } from 'lucide-react'

// ─── StarRating ─────────────────────────────────────────────────────────────
// Interactive and read-only star rating component.
// Supports half-star display for averages in read-only mode.

export default function StarRating({ value = 0, onChange, size = 16, readOnly = false }) {
  const [hoverValue, setHoverValue] = useState(0)
  const displayValue = readOnly ? value : (hoverValue || value)

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        // Determine fill level for this star
        let fillPct = 0
        if (star <= Math.floor(displayValue)) {
          fillPct = 100
        } else if (star === Math.floor(displayValue) + 1 && readOnly) {
          // Partial fill for fractional values in read-only mode
          fillPct = Math.round((displayValue % 1) * 100)
        }

        const isFilled = fillPct >= 100
        const isPartial = fillPct > 0 && fillPct < 100

        // Unique clip id for partial stars
        const clipId = `star-clip-${star}-${size}-${Math.round(displayValue * 10)}`

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHoverValue(star)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            className={
              readOnly
                ? 'cursor-default p-0 bg-transparent border-none'
                : 'cursor-pointer p-0 bg-transparent border-none hover:scale-110 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40 rounded-sm'
            }
            style={{ lineHeight: 0 }}
          >
            {isPartial ? (
              // Partial star using SVG clip
              <svg width={size} height={size} viewBox="0 0 24 24">
                <defs>
                  <clipPath id={clipId}>
                    <rect x="0" y="0" width={24 * (fillPct / 100)} height="24" />
                  </clipPath>
                </defs>
                {/* Empty star background */}
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="transparent"
                  stroke="rgba(200,209,218,0.3)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
                {/* Filled portion clipped */}
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill="#F6C445"
                  stroke="#F6C445"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  clipPath={`url(#${clipId})`}
                />
              </svg>
            ) : (
              <Star
                size={size}
                fill={isFilled ? '#F6C445' : 'transparent'}
                stroke={isFilled ? '#F6C445' : 'rgba(200,209,218,0.3)'}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
