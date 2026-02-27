import { useState, useCallback } from 'react'
import { getRankImage, RANK_BADGE_COLOR, RANK_LABELS, PLACEHOLDER } from '../lib/rankImages'

/**
 * NinjaCard — collectible-style profile card with subtle 3D tilt.
 *
 * Sizes:
 *   'full' — 320x448 hero card with stats, name plate, 3D tilt
 *   'md'   — 64px circular avatar thumbnail
 *   'sm'   — 48px circular avatar thumbnail
 *   'xs'   — 36px circular avatar thumbnail
 */

const SIZE_MAP = {
  md: 64,
  sm: 48,
  xs: 36,
}

export default function NinjaCard({
  rank = 'initiate',
  name = 'Ninja',
  username = '',
  market = '',
  stats = {},
  size = 'full',
  interactive = true,
  className = '',
}) {
  // ── Small sizes — circular avatar only ──────────────────────────
  if (size !== 'full') {
    const px = SIZE_MAP[size] || SIZE_MAP.md
    const borderColor = RANK_BADGE_COLOR[rank] || RANK_BADGE_COLOR.initiate

    return (
      <div
        className={className}
        style={{
          width: px,
          height: px,
          minWidth: px,
          minHeight: px,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `2px solid ${borderColor}`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B0F14',
        }}
      >
        <img
          src={getRankImage(rank)}
          alt={`${RANK_LABELS[rank] || 'Initiate'} avatar`}
          onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    )
  }

  // ── Full hero card ──────────────────────────────────────────────
  return (
    <FullCard
      rank={rank}
      name={name}
      username={username}
      market={market}
      stats={stats}
      interactive={interactive}
      className={className}
    />
  )
}

/* ────────────────────────────────────────────────────────────────────
   Full-size hero card (split into its own component so hooks are
   never called conditionally).
   ──────────────────────────────────────────────────────────────── */

function FullCard({ rank, name, username, market, stats, interactive, className }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = useCallback((e) => {
    if (!interactive) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -15, y: x * 15 })
  }, [interactive])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
  }, [])

  const badgeColor = RANK_BADGE_COLOR[rank] || RANK_BADGE_COLOR.initiate
  const rankLabel = RANK_LABELS[rank] || 'Initiate'
  const { underwrites = 0, lois = 0, dealsClosed = 0 } = stats

  return (
    <div
      className={className}
      style={{
        width: 320,
        height: 448,
        perspective: 1000,
        position: 'relative',
        flexShrink: 0,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Card border — subtle rank-colored gradient */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 14,
          padding: 3,
          background: `linear-gradient(135deg, ${badgeColor}40, ${badgeColor}15, ${badgeColor}40)`,
          willChange: 'transform',
        }}
      >
        {/* 3D tilt container */}
        <div
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: tilt.x === 0 && tilt.y === 0
              ? 'transform 0.6s cubic-bezier(0.03, 0.98, 0.52, 0.99)'
              : 'none',
            width: '100%',
            height: '100%',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0B0F14',
            }}
          >
            {/* Rank image */}
            <img
              src={getRankImage(rank)}
              alt={`${rankLabel} — ${name}`}
              onError={(e) => { e.currentTarget.src = PLACEHOLDER }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
              draggable={false}
            />

            {/* Bottom gradient overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '50%',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 40%, transparent 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Rank badge — top-left */}
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 12,
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: 9999,
                backgroundColor: `${badgeColor}22`,
                border: `1px solid ${badgeColor}44`,
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
              }}
            >
              <span
                className="font-heading"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: badgeColor,
                  lineHeight: 1,
                }}
              >
                {rankLabel}
              </span>
            </div>

            {/* Name plate — bottom area */}
            <div
              style={{
                position: 'absolute',
                bottom: 44,
                left: 16,
                right: 16,
                pointerEvents: 'none',
              }}
            >
              <div
                className="font-heading"
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: '#F4F7FA',
                  lineHeight: 1.2,
                  marginBottom: 2,
                }}
              >
                {name}
              </div>
              {(username || market) && (
                <div
                  className="font-body"
                  style={{
                    fontSize: 12,
                    color: 'rgba(200,209,218,0.7)',
                    lineHeight: 1.3,
                  }}
                >
                  {username && <span>@{username}</span>}
                  {username && market && <span style={{ margin: '0 4px' }}>&middot;</span>}
                  {market && <span>{market}</span>}
                </div>
              )}
            </div>

            {/* Stat bar — very bottom */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                padding: '8px 12px',
                backgroundColor: 'rgba(0,0,0,0.5)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              {[
                { label: 'Underwrites Sent', value: underwrites },
                { label: "LOI's Sent", value: lois },
                { label: 'Deals Closed', value: dealsClosed },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <span
                    className="font-heading"
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: badgeColor,
                      lineHeight: 1,
                    }}
                  >
                    {value}
                  </span>
                  <span
                    className="font-heading"
                    style={{
                      fontSize: 8,
                      fontWeight: 600,
                      color: 'rgba(200,209,218,0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      lineHeight: 1,
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
