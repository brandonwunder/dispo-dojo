import React from 'react'

// --------------------------------------------------------------------------
// Rank-driven color maps
// --------------------------------------------------------------------------

export const RANK_BELT = {
  initiate:       '#e8e8e8',
  scout:          '#00C6FF',
  shinobi:        '#7F00FF',
  shadow:         '#555577',
  blade:          '#3b82f6',
  jonin:          '#E53935',
  'shadow-master':'#0B0F14',
  kage:           '#F6C445',
}

export const RANK_BADGE_COLOR = {
  initiate:       '#9ca3af',
  scout:          '#00C6FF',
  shinobi:        '#7F00FF',
  shadow:         '#6b7280',
  blade:          '#3b82f6',
  jonin:          '#E53935',
  'shadow-master':'#374151',
  kage:           '#F6C445',
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/**
 * Returns the belt color for the given rank key, falling back to initiate.
 */
function beltColor(rank) {
  return RANK_BELT[rank] ?? RANK_BELT.initiate
}

/**
 * True if the gear array includes the given item key.
 */
function hasGear(gear, key) {
  return Array.isArray(gear) && gear.includes(key)
}

/**
 * True if the effects array includes the given item key.
 */
function hasEffect(effects, key) {
  return Array.isArray(effects) && effects.includes(key)
}

// --------------------------------------------------------------------------
// NinjaAvatar
// --------------------------------------------------------------------------

/**
 * NinjaAvatar — a layered SVG character renderer for the Dispo Dojo platform.
 *
 * Props:
 *   config        — avatarConfig object { base, maskColor, headbandColor, eyeColor, gear[], effects[] }
 *   size          — number in px (default 64)
 *   rank          — rank string; controls belt color via RANK_BELT map
 *   showAura      — boolean; when true adds full-aura outer glow (default false)
 */
export default function NinjaAvatar({
  config = {},
  size = 64,
  rank = 'initiate',
  showAura = false,
}) {
  const {
    base          = '#1a1f2b',   // skin / outfit base
    maskColor     = '#111827',   // lower-face mask
    headbandColor = '#E53935',   // headband cloth
    eyeColor      = '#00C6FF',   // iris color
    gear          = [],
    effects       = [],
  } = config

  const belt        = beltColor(rank)
  const showKatana  = hasGear(gear, 'katana')
  const showSmoke   = hasGear(gear, 'smoke-wisps')
  const glowEyes    = hasGear(gear, 'glow-eyes') || hasEffect(effects, 'glow-eyes')
  const goldenTrim  = hasGear(gear, 'golden-trim')
  const fullAura    = showAura || hasGear(gear, 'full-aura') || hasEffect(effects, 'full-aura')

  // Derived accent/shade colors from base
  const baseLight   = base   // gi body
  const shadow1     = '#0d1117'
  const giLight     = '#232b3a'  // lapel / fold highlights

  // Unique filter IDs scoped to this instance so multiple avatars on a page
  // don't stomp each other's SVG filter definitions.
  const uid = React.useId().replace(/:/g, '')

  return (
    <svg
      width={size}
      height={Math.round(size * 1.2)}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Ninja avatar — rank: ${rank}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* SVG Defs: filters, smoke keyframes                                  */}
      {/* ------------------------------------------------------------------ */}
      <defs>
        {/* Outer glow blur for full-aura effect */}
        {fullAura && (
          <filter id={`${uid}-aura`} x="-30%" y="-20%" width="160%" height="150%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}

        {/* Radial glow behind eyes */}
        {glowEyes && (
          <filter id={`${uid}-eyeglow`} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="glow" />
            <feComposite in="SourceGraphic" in2="glow" operator="over" />
          </filter>
        )}

        {/* Golden trim gradient — used to stroke gi edges */}
        {goldenTrim && (
          <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD97A" />
            <stop offset="100%" stopColor="#F6C445" />
          </linearGradient>
        )}

        {/* Smoke animation keyframes */}
        {showSmoke && (
          <style>{`
            @keyframes ninjaSmoke1-${uid} {
              from { opacity: 0.3; transform: translateY(0); }
              to   { opacity: 0.7; transform: translateY(-8px); }
            }
            @keyframes ninjaSmoke2-${uid} {
              from { opacity: 0.2; transform: translateY(0); }
              to   { opacity: 0.6; transform: translateY(-10px); }
            }
          `}</style>
        )}
      </defs>

      {/* ------------------------------------------------------------------ */}
      {/* Layer 0 — full-aura outer glow (renders behind everything)          */}
      {/* ------------------------------------------------------------------ */}
      {fullAura && (
        <g filter={`url(#${uid}-aura)`}>
          <ellipse
            cx="50" cy="70"
            rx="34" ry="46"
            fill={eyeColor}
            opacity="0.12"
          />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Layer 1 — Katana over left shoulder (behind body so tip pokes up)   */}
      {/* ------------------------------------------------------------------ */}
      {showKatana && (
        <g>
          {/* Blade — tapered from hilt toward tip */}
          <polygon
            points="22,8 26,10 46,68 42,66"
            fill="#c8d1da"
            opacity="0.92"
          />
          {/* Blade edge highlight */}
          <line
            x1="24" y1="9" x2="44" y2="67"
            stroke="#ffffff" strokeWidth="0.7" opacity="0.5"
          />
          {/* Tsuba (guard disc) */}
          <ellipse
            cx="44" cy="68"
            rx="5" ry="3"
            fill="#888"
            transform="rotate(-25,44,68)"
          />
          <ellipse
            cx="44" cy="68"
            rx="5" ry="3"
            fill="none"
            stroke="#aaa" strokeWidth="0.8"
            transform="rotate(-25,44,68)"
          />
          {/* Grip — wrapped handle */}
          <rect
            x="42" y="68"
            width="5" height="14"
            rx="2"
            fill="#2d1810"
            transform="rotate(-25,44,75)"
          />
          {/* Grip wrapping lines */}
          <line x1="41" y1="72" x2="48" y2="70" stroke="#c8a86a" strokeWidth="0.8" opacity="0.7" />
          <line x1="41" y1="76" x2="47" y2="74" stroke="#c8a86a" strokeWidth="0.8" opacity="0.7" />
          <line x1="40" y1="80" x2="46" y2="78" stroke="#c8a86a" strokeWidth="0.8" opacity="0.7" />
        </g>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Layer 2 — Body silhouette: torso + arms                             */}
      {/* ------------------------------------------------------------------ */}
      {/* Torso: widens at shoulders (~x 28-72), waist pinch (~x 33-67),
          flows into lower body / legs hips (~x 30-70) */}
      <path
        d={`
          M 36 55
          C 30 56, 24 60, 20 68
          C 18 74, 18 82, 20 88
          C 24 96, 30 104, 32 112
          L 38 112
          C 37 104, 38 96, 40 90
          C 42 84, 44 80, 50 78
          C 56 80, 58 84, 60 90
          C 62 96, 63 104, 62 112
          L 68 112
          C 70 104, 76 96, 80 88
          C 82 82, 82 74, 80 68
          C 76 60, 70 56, 64 55
          C 60 54, 56 53, 50 53
          C 44 53, 40 54, 36 55
          Z
        `}
        fill={baseLight}
      />

      {/* Left arm: shoulder ~(28,58) curving down to hand at (14,82) */}
      <path
        d="M 30 58 Q 22 64 16 74 Q 14 78 15 83 Q 17 86 21 85 Q 25 84 26 80 Q 28 74 34 67 Q 37 62 36 58 Z"
        fill={baseLight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right arm: shoulder ~(70,58) curving down to hand at (86,82) */}
      <path
        d="M 70 58 Q 78 64 84 74 Q 86 78 85 83 Q 83 86 79 85 Q 75 84 74 80 Q 72 74 66 67 Q 63 62 64 58 Z"
        fill={baseLight}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 3 — Gi (wrap-front uniform) + lapel fold lines                */}
      {/* ------------------------------------------------------------------ */}
      {/* Left lapel panel: wraps from left shoulder across chest */}
      <path
        d={`
          M 36 55
          C 38 56, 42 58, 44 60
          L 48 74
          L 38 74
          C 34 70, 30 62, 32 56
          Z
        `}
        fill={giLight}
        opacity="0.85"
      />

      {/* Right lapel panel */}
      <path
        d={`
          M 64 55
          C 62 56, 58 58, 56 60
          L 52 74
          L 62 74
          C 66 70, 70 62, 68 56
          Z
        `}
        fill={giLight}
        opacity="0.85"
      />

      {/* Center V-fold line on chest (the wrap seam) */}
      <path
        d="M 44 60 L 50 72 L 56 60"
        stroke={shadow1}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
        fill="none"
      />

      {/* Left lapel inner shadow fold line */}
      <path
        d="M 38 58 Q 42 62 43 70"
        stroke={shadow1}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />

      {/* Right lapel inner shadow fold line */}
      <path
        d="M 62 58 Q 58 62 57 70"
        stroke={shadow1}
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
        fill="none"
      />

      {/* Golden-trim: gold stroke on gi lapel edges */}
      {goldenTrim && (
        <>
          <path
            d="M 36 55 C 38 56, 42 58, 44 60 L 48 74 L 38 74 C 34 70, 30 62, 32 56 Z"
            fill="none"
            stroke={`url(#${uid}-gold)`}
            strokeWidth="1.4"
            opacity="0.85"
          />
          <path
            d="M 64 55 C 62 56, 58 58, 56 60 L 52 74 L 62 74 C 66 70, 70 62, 68 56 Z"
            fill="none"
            stroke={`url(#${uid}-gold)`}
            strokeWidth="1.4"
            opacity="0.85"
          />
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Layer 4 — Belt with knot detail                                     */}
      {/* ------------------------------------------------------------------ */}
      {/* Belt band */}
      <rect
        x="30" y="74"
        width="40" height="7"
        rx="1"
        fill={belt}
        opacity={rank === 'shadow-master' ? 1 : 0.92}
      />
      {/* Belt knot — centered square */}
      <rect
        x="44" y="72"
        width="12" height="11"
        rx="2"
        fill={belt}
        opacity="1"
      />
      {/* Knot highlight */}
      <rect
        x="45" y="73"
        width="5" height="4"
        rx="1"
        fill="#ffffff"
        opacity="0.18"
      />
      {/* Knot border to separate it from band */}
      <rect
        x="44" y="72"
        width="12" height="11"
        rx="2"
        fill="none"
        stroke={shadow1}
        strokeWidth="0.8"
        opacity="0.4"
      />
      {/* Belt tail — left drape */}
      <rect
        x="30" y="80"
        width="14" height="3"
        rx="1"
        fill={belt}
        opacity="0.7"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 5 — Head                                                       */}
      {/* ------------------------------------------------------------------ */}
      {/* Head ellipse */}
      <ellipse
        cx="50" cy="30"
        rx="17" ry="20"
        fill={baseLight}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 6 — Mask (lower face covering, below eyes)                    */}
      {/* ------------------------------------------------------------------ */}
      {/* Mask follows head curvature — covers chin + cheeks below mid-face */}
      <path
        d={`
          M 33 32
          Q 33 50, 50 52
          Q 67 50, 67 32
          Q 63 34, 50 35
          Q 37 34, 33 32
          Z
        `}
        fill={maskColor}
        opacity="0.96"
      />

      {/* Stitch line detail — horizontal seam across mask */}
      <path
        d="M 35 38 Q 50 40 65 38"
        stroke="#ffffff"
        strokeWidth="0.6"
        strokeDasharray="2,2"
        opacity="0.2"
        fill="none"
      />
      {/* Second stitch row lower */}
      <path
        d="M 37 44 Q 50 46 63 44"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeDasharray="2,2"
        opacity="0.15"
        fill="none"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 7 — Headband (cloth wrap at forehead with flowing tails)       */}
      {/* ------------------------------------------------------------------ */}
      {/* Headband body rect — wraps around forehead */}
      <rect
        x="33" y="18"
        width="34" height="8"
        rx="2"
        fill={headbandColor}
      />
      {/* Headband highlight (top sheen) */}
      <rect
        x="33" y="18"
        width="34" height="3"
        rx="2"
        fill="#ffffff"
        opacity="0.12"
      />
      {/* Headband border */}
      <rect
        x="33" y="18"
        width="34" height="8"
        rx="2"
        fill="none"
        stroke={shadow1}
        strokeWidth="0.7"
        opacity="0.3"
      />

      {/* Tail 1 — longer, falls toward right side and curves down */}
      <path
        d="M 67 20 Q 76 18 80 22 Q 82 26 78 30"
        stroke={headbandColor}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tail 2 — shorter, overlaps tail 1 slightly */}
      <path
        d="M 67 24 Q 73 22 76 28 Q 77 32 74 36"
        stroke={headbandColor}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 8 — Eyes                                                       */}
      {/* ------------------------------------------------------------------ */}
      {/* Eye glow behind eyes */}
      {glowEyes && (
        <g filter={`url(#${uid}-eyeglow)`}>
          <ellipse cx="41" cy="27" rx="6" ry="4" fill={eyeColor} opacity="0.5" />
          <ellipse cx="59" cy="27" rx="6" ry="4" fill={eyeColor} opacity="0.5" />
        </g>
      )}

      {/* Left eye — white sclera (almond shape) */}
      <ellipse
        cx="41" cy="27"
        rx="5.5" ry="3.5"
        fill="#e8f0f8"
      />
      {/* Left iris */}
      <ellipse
        cx="41" cy="27"
        rx="3.2" ry="3.2"
        fill={eyeColor}
      />
      {/* Left pupil */}
      <ellipse
        cx="41" cy="27"
        rx="1.6" ry="1.6"
        fill="#0a0a0f"
      />
      {/* Left eye-shine dot */}
      <circle cx="42.6" cy="25.6" r="0.9" fill="#ffffff" opacity="0.85" />

      {/* Right eye — white sclera */}
      <ellipse
        cx="59" cy="27"
        rx="5.5" ry="3.5"
        fill="#e8f0f8"
      />
      {/* Right iris */}
      <ellipse
        cx="59" cy="27"
        rx="3.2" ry="3.2"
        fill={eyeColor}
      />
      {/* Right pupil */}
      <ellipse
        cx="59" cy="27"
        rx="1.6" ry="1.6"
        fill="#0a0a0f"
      />
      {/* Right eye-shine dot */}
      <circle cx="60.6" cy="25.6" r="0.9" fill="#ffffff" opacity="0.85" />

      {/* ------------------------------------------------------------------ */}
      {/* Layer 9 — Smoke wisps (animated, floats upward from sides)          */}
      {/* ------------------------------------------------------------------ */}
      {showSmoke && (
        <>
          {/* Wisp 1 — left side */}
          <path
            d="M 28 56 Q 22 48 26 40 Q 30 34 25 28"
            stroke="#a0b0c8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
            style={{
              animation: `ninjaSmoke1-${uid} 1.8s ease-in-out infinite alternate`,
              transformOrigin: '28px 56px',
            }}
          />
          {/* Wisp 2 — right side */}
          <path
            d="M 72 56 Q 78 48 74 40 Q 70 34 75 28"
            stroke="#a0b0c8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.35"
            style={{
              animation: `ninjaSmoke2-${uid} 2.2s ease-in-out infinite alternate`,
              transformOrigin: '72px 56px',
            }}
          />
          {/* Wisp 3 — center top, thinner */}
          <path
            d="M 50 12 Q 54 6 50 2 Q 46 6 50 12"
            stroke="#c8d1da"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.3"
            style={{
              animation: `ninjaSmoke1-${uid} 2.6s ease-in-out infinite alternate`,
              animationDelay: '0.4s',
              transformOrigin: '50px 12px',
            }}
          />
        </>
      )}
    </svg>
  )
}
