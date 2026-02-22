import { useEffect, useRef } from 'react';

// ─── Shared draw-on animation ────────────────────────────────────────────────
// Injects the @keyframes once into <head> so every icon can reference it.
let styleInjected = false;
function injectDrawOnKeyframes() {
  if (styleInjected) return;
  if (typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes drawOn {
      from { stroke-dashoffset: 200; }
      to   { stroke-dashoffset: 0; }
    }
    .icon-draw-on path,
    .icon-draw-on line,
    .icon-draw-on circle,
    .icon-draw-on polyline,
    .icon-draw-on polygon,
    .icon-draw-on rect,
    .icon-draw-on ellipse {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: drawOn 1s ease forwards;
    }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

// Shared default SVG props builder
function useSvgProps({ size = 48, className = '', animate = false, ...rest }) {
  const injected = useRef(false);
  useEffect(() => {
    if (animate && !injected.current) {
      injectDrawOnKeyframes();
      injected.current = true;
    }
  }, [animate]);

  return {
    width: size,
    height: size,
    viewBox: '0 0 48 48',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: `${animate ? 'icon-draw-on ' : ''}${className}`.trim(),
    ...rest,
  };
}

// Shared brush-stroke defaults
const B = {
  stroke: 'currentColor',
  strokeWidth: 2.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

const GOLD = '#d4a853';

// ─── 1. KatanaIcon ───────────────────────────────────────────────────────────
export function KatanaIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Blade — slightly curved arc */}
      <path
        d="M12 38 Q14 28 16 20 Q18 12 22 6 L24 5"
        {...B}
        strokeWidth={3}
      />
      {/* Blade edge highlight */}
      <path
        d="M24 5 Q25 6 23 12 Q21 18 19 26 Q17 32 15.5 36"
        {...B}
        strokeWidth={1.5}
        opacity={0.4}
      />
      {/* Guard (tsuba) */}
      <ellipse
        cx="13"
        cy="36"
        rx="4"
        ry="1.8"
        {...B}
        strokeWidth={2.5}
      />
      {/* Handle */}
      <path
        d="M12 38 L8 46"
        {...B}
        strokeWidth={3}
      />
      {/* Gold accent — handle wrapping (diamond pattern) */}
      <path
        d="M11.2 40 L10 41 L11 42 M10.2 42.5 L9 43.5 L10 44.5"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── 2. ScrollIcon ───────────────────────────────────────────────────────────
export function ScrollIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Scroll body */}
      <path
        d="M10 10 L10 38 Q10 40 12 40 L36 40 Q38 40 38 38 L38 14"
        {...B}
        strokeWidth={2.8}
      />
      {/* Top roll */}
      <path
        d="M10 10 Q10 7 14 7 L34 7 Q38 7 38 10 Q38 13 34 13 L14 13 Q10 13 10 10Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Text lines on scroll */}
      <line x1="16" y1="20" x2="32" y2="20" {...B} strokeWidth={1.5} opacity={0.35} />
      <line x1="16" y1="25" x2="30" y2="25" {...B} strokeWidth={1.5} opacity={0.35} />
      <line x1="16" y1="30" x2="28" y2="30" {...B} strokeWidth={1.5} opacity={0.35} />
      {/* Gold accent — wax seal */}
      <circle
        cx="34"
        cy="36"
        r="3.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="34" cy="36" r="1" fill={GOLD} />
      {/* Seal ribbon */}
      <path
        d="M34 39.5 L32 44 M34 39.5 L36 44"
        stroke={GOLD}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ─── 3. ShurikenIcon ─────────────────────────────────────────────────────────
export function ShurikenIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Four blades — slightly offset for hand-drawn feel */}
      <path
        d="M24 4 L26.5 18 L24 22 L21.5 18 Z"
        {...B}
        strokeWidth={2.5}
      />
      <path
        d="M44 24 L30 21.5 L26 24 L30 26.5 Z"
        {...B}
        strokeWidth={2.5}
      />
      <path
        d="M24 44 L21.5 30 L24 26 L26.5 30 Z"
        {...B}
        strokeWidth={2.5}
      />
      <path
        d="M4 24 L18 26.5 L22 24 L18 21.5 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Curved edges connecting blades for throwing star silhouette */}
      <path
        d="M21.5 18 Q20 20 18 21.5"
        {...B}
        strokeWidth={2}
      />
      <path
        d="M30 21.5 Q28 20 26.5 18"
        {...B}
        strokeWidth={2}
      />
      <path
        d="M26.5 30 Q28 28 30 26.5"
        {...B}
        strokeWidth={2}
      />
      <path
        d="M18 26.5 Q20 28 21.5 30"
        {...B}
        strokeWidth={2}
      />
      {/* Gold accent — center circle */}
      <circle
        cx="24"
        cy="24"
        r="3.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="24" cy="24" r="1.2" fill={GOLD} />
    </svg>
  );
}

// ─── 4. ToriiIcon ────────────────────────────────────────────────────────────
export function ToriiIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Left pillar */}
      <path
        d="M12 18 L11 44"
        {...B}
        strokeWidth={3.2}
      />
      {/* Right pillar */}
      <path
        d="M36 18 L37 44"
        {...B}
        strokeWidth={3.2}
      />
      {/* Pillar bases — slight flare */}
      <path d="M9 44 L13 44" {...B} strokeWidth={2.8} />
      <path d="M35 44 L39 44" {...B} strokeWidth={2.8} />
      {/* Lower crossbeam (nuki) */}
      <path
        d="M10 22 L38 22"
        {...B}
        strokeWidth={2.8}
      />
      {/* Gold accent — top beam (kasagi) with upswept ends */}
      <path
        d="M6 16 Q8 13 12 14 L36 14 Q40 13 42 16"
        stroke={GOLD}
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Top beam underside */}
      <path
        d="M8 18 L40 18"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
    </svg>
  );
}

// ─── 5. CompassIcon ──────────────────────────────────────────────────────────
export function CompassIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Outer ring */}
      <circle
        cx="24"
        cy="24"
        r="18"
        {...B}
        strokeWidth={2.8}
      />
      {/* Inner ring */}
      <circle
        cx="24"
        cy="24"
        r="13"
        {...B}
        strokeWidth={1.5}
        opacity={0.3}
      />
      {/* Cardinal tick marks */}
      <line x1="24" y1="6" x2="24" y2="10" {...B} strokeWidth={2} />
      <line x1="24" y1="38" x2="24" y2="42" {...B} strokeWidth={2} />
      <line x1="6" y1="24" x2="10" y2="24" {...B} strokeWidth={2} />
      <line x1="38" y1="24" x2="42" y2="24" {...B} strokeWidth={2} />
      {/* Needle — north half (gold accent) */}
      <path
        d="M24 10 L26.5 23 L24 24 L21.5 23 Z"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={GOLD}
        opacity={0.85}
      />
      {/* Needle — south half */}
      <path
        d="M24 38 L21.5 25 L24 24 L26.5 25 Z"
        {...B}
        strokeWidth={2}
        opacity={0.5}
      />
      {/* Center pin */}
      <circle cx="24" cy="24" r="2" {...B} strokeWidth={2} />
    </svg>
  );
}

// ─── 6. ForgeHammerIcon ──────────────────────────────────────────────────────
export function ForgeHammerIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Hammer handle — thick, slightly curved */}
      <path
        d="M20 28 L10 42"
        {...B}
        strokeWidth={3}
      />
      {/* Hammer head — heavy rectangular block */}
      <path
        d="M16 18 L32 18 Q34 18 34 20 L34 26 Q34 28 32 28 L16 28 Q14 28 14 26 L14 20 Q14 18 16 18 Z"
        {...B}
        strokeWidth={2.8}
      />
      {/* Anvil */}
      <path
        d="M26 40 L42 40 Q44 40 44 38 L42 34 L28 34 L26 38 Q24 40 26 40 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Anvil base */}
      <line x1="30" y1="40" x2="30" y2="44" {...B} strokeWidth={2.5} />
      <line x1="38" y1="40" x2="38" y2="44" {...B} strokeWidth={2.5} />
      {/* Gold accent — sparks */}
      <path
        d="M36 30 L38 28"
        stroke={GOLD}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M40 28 L42 25"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M38 32 L41 31"
        stroke={GOLD}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="43" cy="24" r="1" fill={GOLD} />
      <circle cx="39" cy="27" r="0.8" fill={GOLD} />
    </svg>
  );
}

// ─── 7. InkBrushIcon ─────────────────────────────────────────────────────────
export function InkBrushIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Brush handle — long, tapered */}
      <path
        d="M34 6 L30 8 L14 32 L12 36"
        {...B}
        strokeWidth={3}
      />
      {/* Handle detail */}
      <path
        d="M36 5 L34 6 L30 8 L32 7"
        {...B}
        strokeWidth={2.5}
      />
      {/* Ferrule (metal band) */}
      <path
        d="M15 30 L18 28"
        {...B}
        strokeWidth={2.8}
      />
      {/* Brush tip — thick, splayed bristles */}
      <path
        d="M12 36 Q10 38 9 42 Q8.5 44 10 44 Q12 44 13 42 Q14 40 14 38 Q14 36 12 36 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Ink stroke on surface */}
      <path
        d="M10 44 Q14 44 20 43 Q26 42 30 42"
        {...B}
        strokeWidth={2}
        opacity={0.4}
      />
      {/* Gold accent — ink drop */}
      <ellipse
        cx="8"
        cy="42"
        rx="2.5"
        ry="2"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        fill={GOLD}
        opacity={0.8}
      />
      <circle cx="5" cy="44" r="1.2" fill={GOLD} opacity={0.6} />
    </svg>
  );
}

// ─── 8. WarFanIcon ───────────────────────────────────────────────────────────
export function WarFanIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Fan ribs radiating from pivot */}
      <path d="M14 40 L8 10"  {...B} strokeWidth={2.5} />
      <path d="M14 40 L14 8"  {...B} strokeWidth={2.5} />
      <path d="M14 40 L22 8"  {...B} strokeWidth={2.5} />
      <path d="M14 40 L30 12" {...B} strokeWidth={2.5} />
      <path d="M14 40 L36 18" {...B} strokeWidth={2.5} />
      <path d="M14 40 L40 26" {...B} strokeWidth={2.5} />
      {/* Gold accent — fan outer edge */}
      <path
        d="M8 10 Q10 6 14 8 Q18 5 22 8 Q26 8 30 12 Q34 14 36 18 Q38 22 40 26"
        stroke={GOLD}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Pivot/binding point */}
      <circle
        cx="14"
        cy="40"
        r="2.5"
        stroke={GOLD}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ─── 9. HawkIcon ─────────────────────────────────────────────────────────────
export function HawkIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Left wing — bold swept arc */}
      <path
        d="M4 18 Q8 14 12 16 Q16 12 20 14 L24 20"
        {...B}
        strokeWidth={3}
      />
      {/* Right wing */}
      <path
        d="M44 18 Q40 14 36 16 Q32 12 28 14 L24 20"
        {...B}
        strokeWidth={3}
      />
      {/* Wing underside detail */}
      <path
        d="M8 18 Q12 16 16 17"
        {...B}
        strokeWidth={1.8}
        opacity={0.35}
      />
      <path
        d="M40 18 Q36 16 32 17"
        {...B}
        strokeWidth={1.8}
        opacity={0.35}
      />
      {/* Body */}
      <path
        d="M22 20 Q24 18 26 20 L25 30 Q24 34 23 30 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Tail feathers */}
      <path
        d="M23 30 L20 38 M24 32 L24 40 M25 30 L28 38"
        {...B}
        strokeWidth={2.2}
      />
      {/* Head */}
      <path
        d="M22 20 Q24 17 26 20 Q25 21 24 20 Q23 21 22 20"
        {...B}
        strokeWidth={2.5}
      />
      {/* Gold accent — eye */}
      <circle
        cx="23.5"
        cy="19"
        r="1.2"
        fill={GOLD}
        stroke={GOLD}
        strokeWidth={1}
      />
      {/* Gold accent — beak */}
      <path
        d="M24 20.5 L24.5 23 L23.5 23 Z"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeLinejoin="round"
        fill={GOLD}
      />
    </svg>
  );
}

// ─── 10. BannerIcon ──────────────────────────────────────────────────────────
export function BannerIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Pole */}
      <line
        x1="16"
        y1="4"
        x2="16"
        y2="44"
        {...B}
        strokeWidth={2.8}
      />
      {/* Banner fabric — billowing shape */}
      <path
        d="M16 8 L38 10 Q40 10 40 12 L40 20 Q38 24 36 22 L36 32 Q36 34 34 34 L16 36"
        {...B}
        strokeWidth={2.8}
      />
      {/* Fabric fold detail */}
      <path
        d="M20 12 Q28 14 34 12"
        {...B}
        strokeWidth={1.5}
        opacity={0.3}
      />
      <path
        d="M20 22 Q26 24 32 22"
        {...B}
        strokeWidth={1.5}
        opacity={0.3}
      />
      {/* Mon (crest) on banner */}
      <circle cx="28" cy="22" r="4" {...B} strokeWidth={2} opacity={0.5} />
      {/* Gold accent — pole top ornament (finial) */}
      <circle
        cx="16"
        cy="4"
        r="2.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="4" r="0.8" fill={GOLD} />
    </svg>
  );
}

// ─── 11. LanternIcon ─────────────────────────────────────────────────────────
export function LanternIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Hanging hook */}
      <path
        d="M24 2 L24 6"
        {...B}
        strokeWidth={2.5}
      />
      {/* Top cap */}
      <path
        d="M18 6 L30 6 Q32 6 31 8 L17 8 Q16 6 18 6 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Lantern body — tapered barrel */}
      <path
        d="M17 8 Q14 16 14 24 Q14 32 17 36 L31 36 Q34 32 34 24 Q34 16 31 8"
        {...B}
        strokeWidth={2.8}
      />
      {/* Bottom cap */}
      <path
        d="M17 36 L31 36 Q32 38 30 38 L18 38 Q16 38 17 36 Z"
        {...B}
        strokeWidth={2.5}
      />
      {/* Horizontal ribs */}
      <path d="M15 16 L33 16" {...B} strokeWidth={1.5} opacity={0.3} />
      <path d="M14 24 L34 24" {...B} strokeWidth={1.5} opacity={0.3} />
      <path d="M15 32 L33 32" {...B} strokeWidth={1.5} opacity={0.3} />
      {/* Tassel */}
      <path d="M24 38 L24 44" {...B} strokeWidth={2} />
      {/* Gold accent — inner glow */}
      <ellipse
        cx="24"
        cy="22"
        rx="6"
        ry="8"
        stroke={GOLD}
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        opacity={0.6}
      />
      <ellipse
        cx="24"
        cy="22"
        rx="3"
        ry="4"
        fill={GOLD}
        opacity={0.35}
      />
    </svg>
  );
}

// ─── 12. AbacusIcon ──────────────────────────────────────────────────────────
export function AbacusIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Frame */}
      <path
        d="M8 6 L8 42 L40 42 L40 6 L8 6 Z"
        {...B}
        strokeWidth={3}
      />
      {/* Horizontal rods */}
      <line x1="8" y1="14" x2="40" y2="14" {...B} strokeWidth={2} />
      <line x1="8" y1="22" x2="40" y2="22" {...B} strokeWidth={2} />
      <line x1="8" y1="30" x2="40" y2="30" {...B} strokeWidth={2} />
      <line x1="8" y1="38" x2="40" y2="38" {...B} strokeWidth={2} />
      {/* Row 1 beads */}
      <circle cx="14" cy="14" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="22" cy="14" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="30" cy="14" r="2.5" {...B} strokeWidth={2.2} />
      {/* Row 2 beads */}
      <circle cx="18" cy="22" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="26" cy="22" r="2.5" {...B} strokeWidth={2.2} />
      {/* Row 3 beads */}
      <circle cx="14" cy="30" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="22" cy="30" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="34" cy="30" r="2.5" {...B} strokeWidth={2.2} />
      {/* Row 4 beads */}
      <circle cx="16" cy="38" r="2.5" {...B} strokeWidth={2.2} />
      <circle cx="32" cy="38" r="2.5" {...B} strokeWidth={2.2} />
      {/* Gold accent — select beads */}
      <circle
        cx="30"
        cy="14"
        r="2.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill={GOLD}
        opacity={0.7}
      />
      <circle
        cx="26"
        cy="22"
        r="2.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill={GOLD}
        opacity={0.7}
      />
      <circle
        cx="34"
        cy="30"
        r="2.5"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        fill={GOLD}
        opacity={0.7}
      />
    </svg>
  );
}

// ─── 13. MonomiEyeIcon ───────────────────────────────────────────────────────
export function MonomiEyeIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Dramatic upper eyelid — thick, angular */}
      <path
        d="M4 24 Q12 10 24 10 Q36 10 44 24"
        {...B}
        strokeWidth={3.2}
      />
      {/* Lower eyelid — sharp, narrowed */}
      <path
        d="M4 24 Q12 34 24 34 Q36 34 44 24"
        {...B}
        strokeWidth={3}
      />
      {/* Inner eye sharp corners (ninja slit) */}
      <path
        d="M6 24 Q8 22 10 24"
        {...B}
        strokeWidth={2}
      />
      <path
        d="M38 24 Q40 22 42 24"
        {...B}
        strokeWidth={2}
      />
      {/* Outer iris ring */}
      <circle
        cx="24"
        cy="23"
        r="7"
        {...B}
        strokeWidth={2.5}
      />
      {/* Pupil — vertical slit */}
      <path
        d="M24 18 Q25.5 22 24 28 Q22.5 22 24 18 Z"
        {...B}
        strokeWidth={2}
      />
      {/* Gold accent — iris */}
      <circle
        cx="24"
        cy="23"
        r="7"
        stroke={GOLD}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
        opacity={0.7}
      />
      <path
        d="M18 22 Q20 20 24 19 Q28 20 30 22"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.5}
      />
      {/* Iris glow */}
      <circle
        cx="22"
        cy="21"
        r="1.5"
        fill={GOLD}
        opacity={0.5}
      />
    </svg>
  );
}

// ─── 14. MapIcon ─────────────────────────────────────────────────────────────
export function MapIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Folded map body */}
      <path
        d="M6 10 L16 8 L28 12 L42 8 L42 38 L28 42 L16 38 L6 40 Z"
        {...B}
        strokeWidth={2.8}
      />
      {/* Fold lines */}
      <line x1="16" y1="8" x2="16" y2="38" {...B} strokeWidth={2} opacity={0.4} />
      <line x1="28" y1="12" x2="28" y2="42" {...B} strokeWidth={2} opacity={0.4} />
      {/* Map trail/path */}
      <path
        d="M10 28 Q14 24 20 26 Q24 28 26 24"
        {...B}
        strokeWidth={1.8}
        opacity={0.35}
      />
      {/* Terrain marks */}
      <path d="M32 20 L34 18 L36 20" {...B} strokeWidth={1.5} opacity={0.25} />
      <path d="M34 24 L36 22 L38 24" {...B} strokeWidth={1.5} opacity={0.25} />
      {/* Gold accent — map pin */}
      <path
        d="M22 16 Q22 12 26 12 Q30 12 30 16 Q30 20 26 24 Q22 20 22 16 Z"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle
        cx="26"
        cy="15.5"
        r="2"
        fill={GOLD}
        opacity={0.7}
      />
    </svg>
  );
}

// ─── 15. SealStampIcon ───────────────────────────────────────────────────────
export function SealStampIcon({ size, className, animate, ...rest }) {
  const svg = useSvgProps({ size, className, animate, ...rest });
  return (
    <svg {...svg}>
      {/* Stamp handle top */}
      <path
        d="M18 6 Q18 4 24 4 Q30 4 30 6 L30 14 L18 14 Z"
        {...B}
        strokeWidth={2.8}
      />
      {/* Stamp handle body */}
      <path
        d="M18 14 L16 18 L32 18 L30 14"
        {...B}
        strokeWidth={2.8}
      />
      {/* Stamp impression — outer circle */}
      <circle
        cx="24"
        cy="32"
        r="12"
        {...B}
        strokeWidth={3}
      />
      {/* Stamp impression — inner ring */}
      <circle
        cx="24"
        cy="32"
        r="8.5"
        {...B}
        strokeWidth={2}
        opacity={0.5}
      />
      {/* Gold accent — stamp face character/mark */}
      <path
        d="M20 28 L28 28 M24 26 L24 38 M20 36 L28 36 M21 32 L27 32"
        stroke={GOLD}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Ink impression glow */}
      <circle
        cx="24"
        cy="32"
        r="12"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
        opacity={0.25}
      />
    </svg>
  );
}
