import { useState } from 'react'
import { Star } from 'lucide-react'

// ─── StarRating ──────────────────────────────────────────────────────────────
// Display or interactive star rating component.
// Display mode: shows filled/half/empty stars based on `rating`.
// Interactive mode: hover highlights, click calls `onChange(value)`.

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 14,
  interactive = false,
  onChange,
}) {
  const [hoverValue, setHoverValue] = useState(0)

  const displayValue = interactive && hoverValue > 0 ? hoverValue : rating

  function handleClick(starIndex) {
    if (!interactive || !onChange) return
    onChange(starIndex)
  }

  function handleMouseEnter(starIndex) {
    if (!interactive) return
    setHoverValue(starIndex)
  }

  function handleMouseLeave() {
    if (!interactive) return
    setHoverValue(0)
  }

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starNum = i + 1
        const fillPercent = Math.min(Math.max(displayValue - i, 0), 1)

        // Full, half, or empty
        const isFull = fillPercent >= 0.75
        const isHalf = fillPercent >= 0.25 && fillPercent < 0.75
        const isEmpty = fillPercent < 0.25

        return (
          <span
            key={starNum}
            onClick={() => handleClick(starNum)}
            onMouseEnter={() => handleMouseEnter(starNum)}
            className={interactive ? 'cursor-pointer' : ''}
            style={{ position: 'relative', display: 'inline-flex', lineHeight: 0 }}
          >
            {isFull ? (
              <Star
                size={size}
                fill="#F6C445"
                stroke="#F6C445"
                strokeWidth={1.5}
              />
            ) : isHalf ? (
              /* Half-star: clip-path overlay */
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Star
                  size={size}
                  fill="none"
                  stroke="rgba(246,196,69,0.35)"
                  strokeWidth={1.5}
                />
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: 'inset(0 50% 0 0)',
                  }}
                >
                  <Star
                    size={size}
                    fill="#F6C445"
                    stroke="#F6C445"
                    strokeWidth={1.5}
                  />
                </span>
              </span>
            ) : (
              <Star
                size={size}
                fill="none"
                stroke="rgba(246,196,69,0.35)"
                strokeWidth={1.5}
              />
            )}
          </span>
        )
      })}
    </div>
  )
}
