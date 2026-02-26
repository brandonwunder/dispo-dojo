import { useState, useEffect, useRef, useCallback } from 'react'
import { getRankImage, RANK_BADGE_COLOR, RANK_LABELS, PLACEHOLDER } from '../lib/rankImages'

/**
 * NinjaCard — collectible-style profile card with holographic border and 3D tilt.
 *
 * Sizes:
 *   'full' — 320x448 hero card with stats, name plate, holographic border, 3D tilt
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
  bio = '',
  badges = [],
  communityBadges = [],
  communityRank = '',
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
      bio={bio}
      badges={badges}
      communityBadges={communityBadges}
      communityRank={communityRank}
    />
  )
}

/* ────────────────────────────────────────────────────────────────────
   Full-size hero card (split into its own component so hooks are
   never called conditionally).
   ──────────────────────────────────────────────────────────────── */
const BACK_STATS = [
  { key: 'underwrites', label: 'UW' },
  { key: 'lois', label: 'LOI' },
  { key: 'contracts', label: 'CTR' },
  { key: 'dealsClosed', label: 'DEAL' },
  { key: 'totalMessages', label: 'MSG' },
  { key: 'birdDogLeads', label: 'BDL' },
  { key: 'bootsTasksCompleted', label: 'BOOT' },
  { key: 'communityXp', label: 'XP' },
]

function FullCard({ rank, name, username, market, stats, interactive, className, bio, badges, communityBadges, communityRank }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [holoAngle, setHoloAngle] = useState(0)
  const [mouseX, setMouseX] = useState(0.5) // 0-1 normalised X for shine
  const [isHovered, setIsHovered] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const animFrameRef = useRef(null)

  // Auto-spin holographic border when not hovered
  useEffect(() => {
    if (isHovered || !interactive) return

    let angle = holoAngle
    let lastTime = performance.now()

    const spin = (now) => {
      const delta = now - lastTime
      lastTime = now
      angle = (angle + delta * 0.06) % 360 // ~21.6 deg/s → one full rotation ~16.7s
      setHoloAngle(angle)
      animFrameRef.current = requestAnimationFrame(spin)
    }

    animFrameRef.current = requestAnimationFrame(spin)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
    // Only re-run when isHovered or interactive changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered, interactive])

  const handleMouseMove = useCallback((e) => {
    if (!interactive || flipped) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -15, y: x * 15 })
    setHoloAngle(Math.atan2(y, x) * (180 / Math.PI) + 180)
    setMouseX(x + 0.5) // normalised 0-1
    setIsHovered(true)
  }, [interactive, flipped])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setMouseX(0.5)
    setIsHovered(false)
  }, [])

  const badgeColor = RANK_BADGE_COLOR[rank] || RANK_BADGE_COLOR.initiate
  const rankLabel = RANK_LABELS[rank] || 'Initiate'
  const { underwrites = 0, lois = 0, dealsClosed = 0 } = stats

  // Shine sweep offset
  const shineTranslate = `translateX(${(mouseX - 0.5) * 200}%)`

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
      {/* Holographic border wrapper */}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 14,
          padding: 4,
          background: `conic-gradient(from ${holoAngle}deg, #00C6FF, #F6C445, #7F00FF, #E53935, #00C6FF)`,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {/* 3D flip container */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped
              ? 'rotateY(180deg)'
              : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition:
              flipped || (tilt.x === 0 && tilt.y === 0)
                ? 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'none',
            width: '100%',
            height: '100%',
          }}
        >
          {/* ── Front face ─────────────────────────────────────────── */}
          <div
            onClick={() => setFlipped(true)}
            style={{
              backfaceVisibility: 'hidden',
              position: 'absolute',
              inset: 0,
              cursor: 'pointer',
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

              {/* Shine sweep overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0.06) 50%, transparent 55%)',
                  transform: shineTranslate,
                  transition: isHovered ? 'none' : 'transform 0.6s ease-out',
                }}
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
                  padding: '8px 16px',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              >
                {[
                  { label: 'UW', value: underwrites },
                  { label: 'LOI', value: lois },
                  { label: 'Deals', value: dealsClosed },
                ].map(({ label, value }) => (
                  <span
                    key={label}
                    className="font-heading"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: badgeColor,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {label}: {value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Back face ──────────────────────────────────────────── */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              position: 'absolute',
              inset: 0,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                backgroundColor: '#0B0F14',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Header bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px 8px',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFlipped(false)
                  }}
                  className="font-body"
                  style={{
                    fontSize: 12,
                    color: 'rgba(200,209,218,0.7)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 4,
                    transition: 'color 0.15s ease, opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F4F7FA' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(200,209,218,0.7)' }}
                >
                  &larr; Flip
                </button>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 9999,
                    backgroundColor: `${badgeColor}22`,
                    border: `1px solid ${badgeColor}44`,
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
              </div>

              {/* Bio section */}
              {bio && (
                <div
                  className="font-body"
                  style={{
                    fontSize: 13,
                    color: 'rgba(200,209,218,0.7)',
                    lineHeight: 1.7,
                    padding: '12px 16px 8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {bio}
                </div>
              )}

              {/* Stats grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 8,
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  flex: '1 0 auto',
                }}
              >
                {BACK_STATS.map(({ key, label }) => (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <span
                      className="font-heading"
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#00C6FF',
                        lineHeight: 1.2,
                      }}
                    >
                      {stats[key] ?? 0}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: 'rgba(200,209,218,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                      }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Badges row */}
              {(badges.length > 0 || communityBadges.length > 0) && (
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    padding: '10px 16px 6px',
                    overflowX: 'auto',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {badges.map((badge, i) => (
                    <span
                      key={`b-${i}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        backgroundColor: '#00C6FF22',
                        border: '1px solid #00C6FF44',
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                      title={badge}
                    >
                      &#x1F3C6;
                    </span>
                  ))}
                  {communityBadges.map((badge, i) => (
                    <span
                      key={`cb-${i}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 9999,
                        backgroundColor: '#7F00FF22',
                        border: '1px solid #7F00FF44',
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                      title={badge}
                    >
                      &#x2B50;
                    </span>
                  ))}
                </div>
              )}

              {/* Community rank line */}
              {communityRank && (
                <div
                  className="font-heading"
                  style={{
                    fontSize: 11,
                    color: 'rgba(200,209,218,0.5)',
                    padding: '6px 16px 12px',
                    marginTop: 'auto',
                  }}
                >
                  Community: {communityRank}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
