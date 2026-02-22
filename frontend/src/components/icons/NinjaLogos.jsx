import React from "react";

// Shared constants
const DARK = "#1a1a2e";
const GOLD = "#d4a853";

/**
 * 1. NinjaGates — Login page
 * Ninja standing before a torii gate, looking up at it.
 */
export function NinjaGates({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Torii gate */}
      <rect x="20" y="18" width="80" height="6" rx="2" fill={GOLD} />
      <rect x="16" y="14" width="88" height="5" rx="2" fill={GOLD} />
      <rect x="28" y="24" width="64" height="4" fill={GOLD} opacity="0.7" />
      <rect x="30" y="24" width="6" height="76" fill={GOLD} opacity="0.8" />
      <rect x="84" y="24" width="6" height="76" fill={GOLD} opacity="0.8" />
      {/* Ninja body — standing, head tilted up */}
      {/* Head */}
      <circle cx="60" cy="58" r="10" fill={DARK} />
      {/* Hood wrap */}
      <path
        d="M50 58 Q50 48 60 46 Q70 48 70 58"
        fill={DARK}
      />
      {/* Eye slit */}
      <rect x="53" y="55" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      {/* Eyes looking up */}
      <circle cx="56" cy="55.5" r="1.2" fill={DARK} />
      <circle cx="64" cy="55.5" r="1.2" fill={DARK} />
      {/* Body */}
      <path
        d="M52 67 L48 100 L54 100 L57 80 L60 100 L66 100 L63 80 L60 67 Z"
        fill={DARK}
      />
      {/* Torso */}
      <path
        d="M52 67 Q56 65 60 65 Q64 65 68 67 L66 80 L54 80 Z"
        fill={DARK}
      />
      {/* Arms at sides */}
      <path d="M52 69 L42 78 L44 80 L54 73" fill={DARK} />
      <path d="M68 69 L78 78 L76 80 L66 73" fill={DARK} />
      {/* Belt */}
      <rect x="52" y="76" width="16" height="3" rx="1" fill={GOLD} opacity="0.6" />
    </svg>
  );
}

/**
 * 2. NinjaLantern — Dashboard
 * Ninja holding a paper lantern up with one hand, gold glow around lantern.
 */
export function NinjaLantern({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Lantern glow */}
      <circle cx="78" cy="28" r="20" fill={GOLD} opacity="0.15" />
      <circle cx="78" cy="28" r="12" fill={GOLD} opacity="0.25" />
      {/* Lantern body */}
      <rect x="72" y="18" width="12" height="20" rx="4" fill={GOLD} />
      <rect x="74" y="16" width="8" height="3" rx="1" fill={GOLD} opacity="0.8" />
      <rect x="74" y="37" width="8" height="2" rx="1" fill={GOLD} opacity="0.8" />
      {/* Lantern ribs */}
      <line x1="78" y1="19" x2="78" y2="37" stroke={DARK} strokeWidth="0.8" opacity="0.4" />
      <line x1="73" y1="28" x2="83" y2="28" stroke={DARK} strokeWidth="0.8" opacity="0.4" />
      {/* Lantern handle */}
      <path d="M76 16 Q78 12 80 16" stroke={GOLD} strokeWidth="1.5" fill="none" />
      {/* Ninja head */}
      <circle cx="55" cy="52" r="10" fill={DARK} />
      <path d="M45 52 Q45 42 55 40 Q65 42 65 52" fill={DARK} />
      {/* Eye slit */}
      <rect x="48" y="49" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="51" cy="49.8" r="1.2" fill={DARK} />
      <circle cx="59" cy="49.8" r="1.2" fill={DARK} />
      {/* Body */}
      <path
        d="M47 61 Q51 59 55 59 Q59 59 63 61 L61 78 L49 78 Z"
        fill={DARK}
      />
      {/* Right arm raised holding lantern */}
      <path d="M63 63 L74 40 L77 42 L66 64" fill={DARK} />
      {/* Left arm down */}
      <path d="M47 63 L38 76 L41 78 L49 67" fill={DARK} />
      {/* Legs */}
      <path d="M49 78 L46 104 L52 104 L53 85 L55 78" fill={DARK} />
      <path d="M55 78 L57 85 L58 104 L64 104 L61 78" fill={DARK} />
      {/* Belt */}
      <rect x="48" y="73" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 3. NinjaWarTable — CRM
 * Ninja leaning over a table, one hand moving a piece.
 */
export function NinjaWarTable({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Table */}
      <rect x="20" y="72" width="80" height="4" rx="1" fill={GOLD} />
      <rect x="24" y="76" width="4" height="28" fill={GOLD} opacity="0.7" />
      <rect x="92" y="76" width="4" height="28" fill={GOLD} opacity="0.7" />
      {/* Table pieces */}
      <circle cx="50" cy="70" r="3" fill={GOLD} />
      <circle cx="70" cy="70" r="3" fill={GOLD} />
      <rect x="58" y="68" width="4" height="4" rx="1" fill={GOLD} opacity="0.8" />
      <circle cx="40" cy="70" r="2" fill={GOLD} opacity="0.6" />
      {/* Ninja head — leaning forward */}
      <circle cx="60" cy="42" r="10" fill={DARK} />
      <path d="M50 42 Q50 32 60 30 Q70 32 70 42" fill={DARK} />
      {/* Eye slit looking down */}
      <rect x="53" y="40" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="57" cy="41" r="1.2" fill={DARK} />
      <circle cx="63" cy="41" r="1.2" fill={DARK} />
      {/* Torso — leaning forward */}
      <path
        d="M52 51 Q56 49 60 49 Q64 49 68 51 L66 70 L54 70 Z"
        fill={DARK}
      />
      {/* Right arm moving piece */}
      <path d="M66 55 L74 66 L72 69 L64 58" fill={DARK} />
      {/* Hand on piece */}
      <circle cx="72" cy="68" r="2.5" fill={DARK} />
      {/* Left arm on table edge */}
      <path d="M52 55 L40 66 L42 69 L54 58" fill={DARK} />
      {/* Legs */}
      <path d="M54 70 L48 104 L54 104 L57 78" fill={DARK} />
      <path d="M63 78 L66 104 L72 104 L66 70" fill={DARK} />
      {/* Belt */}
      <rect x="53" y="64" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 4. NinjaTelescope — Agent Finder
 * Ninja on a ledge, looking through a spyglass/telescope aimed right.
 */
export function NinjaTelescope({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ledge / cliff */}
      <path d="M0 90 L55 90 L55 120 L0 120 Z" fill={DARK} opacity="0.3" />
      <rect x="0" y="88" width="55" height="4" rx="1" fill={DARK} opacity="0.5" />
      {/* Ninja head */}
      <circle cx="40" cy="52" r="10" fill={DARK} />
      <path d="M30 52 Q30 42 40 40 Q50 42 50 52" fill={DARK} />
      {/* Eye slit */}
      <rect x="33" y="49" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="37" cy="50" r="1.2" fill={DARK} />
      <circle cx="44" cy="50" r="1.2" fill={DARK} />
      {/* Telescope */}
      <rect x="48" y="46" width="46" height="5" rx="2" fill={DARK} />
      <rect x="48" y="45" width="8" height="7" rx="2" fill={DARK} />
      {/* Gold lens */}
      <circle cx="94" cy="48.5" r="4" fill={GOLD} />
      <circle cx="94" cy="48.5" r="2.5" fill={GOLD} opacity="0.6" />
      {/* Lens flare */}
      <circle cx="96" cy="46.5" r="1" fill="#fff" opacity="0.6" />
      {/* Torso */}
      <path
        d="M32 61 Q36 59 40 59 Q44 59 48 61 L46 78 L34 78 Z"
        fill={DARK}
      />
      {/* Arms — both holding telescope */}
      <path d="M48 63 L50 50 L52 52 L49 65" fill={DARK} />
      <path d="M32 63 L36 54 L40 52 L35 65" fill={DARK} />
      {/* Legs — one kneeling on ledge */}
      <path d="M34 78 L30 88 L36 88 L38 82" fill={DARK} />
      <path d="M42 78 L48 86 L52 86 L50 88 L42 88 L44 82" fill={DARK} />
      {/* Belt */}
      <rect x="33" y="73" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 5. NinjaTracker — FSBO Finder
 * Ninja in crouching/tracking pose, one hand touching ground, looking at footprints.
 */
export function NinjaTracker({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Ground line */}
      <rect x="10" y="96" width="100" height="2" rx="1" fill={DARK} opacity="0.2" />
      {/* Gold footprints */}
      <ellipse cx="72" cy="94" rx="4" ry="6" fill={GOLD} opacity="0.7" />
      <ellipse cx="72" cy="86" rx="1.5" ry="2" fill={GOLD} opacity="0.5" />
      <ellipse cx="86" cy="91" rx="4" ry="6" fill={GOLD} opacity="0.55" />
      <ellipse cx="86" cy="83" rx="1.5" ry="2" fill={GOLD} opacity="0.4" />
      <ellipse cx="100" cy="88" rx="3.5" ry="5" fill={GOLD} opacity="0.4" />
      <ellipse cx="100" cy="81" rx="1.2" ry="1.8" fill={GOLD} opacity="0.3" />
      {/* Ninja head — low, looking forward */}
      <circle cx="42" cy="60" r="10" fill={DARK} />
      <path d="M32 60 Q32 50 42 48 Q52 50 52 60" fill={DARK} />
      {/* Eye slit */}
      <rect x="35" y="57" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="39" cy="58" r="1.2" fill={DARK} />
      <circle cx="46" cy="58" r="1.2" fill={DARK} />
      {/* Torso — crouching low */}
      <path
        d="M36 69 Q40 67 44 67 Q48 67 52 69 L56 82 L32 82 Z"
        fill={DARK}
      />
      {/* Right arm touching ground */}
      <path d="M52 72 L62 88 L64 92 L60 94 L58 90 L50 76" fill={DARK} />
      {/* Left arm bent at side */}
      <path d="M36 72 L28 80 L30 82 L38 76" fill={DARK} />
      {/* Legs — crouching */}
      <path d="M34 82 L24 92 L22 96 L30 96 L36 88" fill={DARK} />
      <path d="M50 82 L52 90 L48 96 L56 96 L56 86" fill={DARK} />
      {/* Belt */}
      <rect x="35" y="77" width="18" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 6. NinjaForge — Lead Scrubbing
 * Ninja at an anvil, arm raised with hammer, sparks flying.
 */
export function NinjaForge({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Anvil */}
      <path d="M62 86 L58 82 L54 82 L50 78 L86 78 L82 82 L78 82 L74 86 Z" fill={GOLD} />
      <rect x="56" y="86" width="24" height="8" rx="1" fill={GOLD} opacity="0.7" />
      <rect x="60" y="94" width="16" height="10" rx="1" fill={GOLD} opacity="0.5" />
      {/* Gold sparks */}
      <circle cx="68" cy="68" r="1.5" fill={GOLD} />
      <circle cx="74" cy="62" r="1" fill={GOLD} opacity="0.9" />
      <circle cx="62" cy="64" r="1.2" fill={GOLD} opacity="0.8" />
      <circle cx="78" cy="70" r="1" fill={GOLD} opacity="0.7" />
      <circle cx="58" cy="70" r="0.8" fill={GOLD} opacity="0.6" />
      <circle cx="72" cy="56" r="0.8" fill={GOLD} opacity="0.5" />
      <line x1="68" y1="72" x2="70" y2="64" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
      <line x1="68" y1="72" x2="62" y2="66" stroke={GOLD} strokeWidth="0.8" opacity="0.6" />
      <line x1="68" y1="72" x2="76" y2="66" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
      {/* Ninja head */}
      <circle cx="40" cy="42" r="10" fill={DARK} />
      <path d="M30 42 Q30 32 40 30 Q50 32 50 42" fill={DARK} />
      {/* Eye slit */}
      <rect x="33" y="39" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="37" cy="40" r="1.2" fill={DARK} />
      <circle cx="44" cy="40" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M32 51 Q36 49 40 49 Q44 49 48 51 L46 72 L34 72 Z"
        fill={DARK}
      />
      {/* Right arm raised with hammer */}
      <path d="M48 54 L56 36 L58 38 L50 56" fill={DARK} />
      {/* Hammer */}
      <rect x="52" y="26" width="12" height="8" rx="2" fill={DARK} />
      <rect x="56" y="34" width="3" height="6" fill={DARK} />
      {/* Left arm on anvil */}
      <path d="M32 54 L40 72 L44 76 L40 78 L36 74 L30 58" fill={DARK} />
      {/* Legs */}
      <path d="M34 72 L30 104 L36 104 L38 78" fill={DARK} />
      <path d="M42 78 L46 104 L52 104 L46 72" fill={DARK} />
      {/* Belt */}
      <rect x="33" y="66" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 7. NinjaScroll — Underwriting
 * Ninja sitting cross-legged reading an unrolled scroll, candle nearby.
 */
export function NinjaScroll({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Candle glow */}
      <circle cx="90" cy="56" r="14" fill={GOLD} opacity="0.12" />
      <circle cx="90" cy="56" r="8" fill={GOLD} opacity="0.2" />
      {/* Candle */}
      <rect x="88" y="68" width="5" height="18" rx="1" fill={DARK} opacity="0.5" />
      {/* Candle flame */}
      <path d="M90.5 68 Q88 62 90.5 56 Q93 62 90.5 68" fill={GOLD} />
      <path d="M90.5 66 Q89 63 90.5 59 Q92 63 90.5 66" fill="#fff" opacity="0.4" />
      {/* Scroll unrolled */}
      <path d="M28 72 L72 72 L72 94 L28 94 Z" fill={GOLD} opacity="0.25" />
      {/* Scroll edge accents */}
      <rect x="26" y="70" width="6" height="26" rx="3" fill={GOLD} opacity="0.7" />
      <rect x="70" y="70" width="6" height="26" rx="3" fill={GOLD} opacity="0.7" />
      {/* Scroll text lines */}
      <line x1="34" y1="78" x2="66" y2="78" stroke={DARK} strokeWidth="1" opacity="0.2" />
      <line x1="34" y1="82" x2="62" y2="82" stroke={DARK} strokeWidth="1" opacity="0.2" />
      <line x1="34" y1="86" x2="64" y2="86" stroke={DARK} strokeWidth="1" opacity="0.2" />
      <line x1="34" y1="90" x2="58" y2="90" stroke={DARK} strokeWidth="1" opacity="0.2" />
      {/* Ninja head */}
      <circle cx="50" cy="42" r="10" fill={DARK} />
      <path d="M40 42 Q40 32 50 30 Q60 32 60 42" fill={DARK} />
      {/* Eye slit looking down */}
      <rect x="43" y="40" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="47" cy="41" r="1.2" fill={DARK} />
      <circle cx="54" cy="41" r="1.2" fill={DARK} />
      {/* Torso — sitting */}
      <path
        d="M42 51 Q46 49 50 49 Q54 49 58 51 L56 70 L44 70 Z"
        fill={DARK}
      />
      {/* Arms holding scroll edges */}
      <path d="M42 55 L32 68 L34 72 L44 60" fill={DARK} />
      <path d="M58 55 L68 68 L66 72 L56 60" fill={DARK} />
      {/* Cross-legged legs */}
      <path d="M44 70 L34 78 L38 84 L48 76 L50 70" fill={DARK} />
      <path d="M50 70 L52 76 L62 84 L66 78 L56 70" fill={DARK} />
      {/* Belt */}
      <rect x="43" y="64" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 8. NinjaCalligraphy — LOI Generator
 * Ninja holding a large ink brush, mid-stroke on paper.
 */
export function NinjaCalligraphy({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Paper */}
      <rect x="50" y="60" width="50" height="44" rx="2" fill="#f5f0e6" opacity="0.5" />
      <rect x="50" y="60" width="50" height="44" rx="2" stroke={DARK} strokeWidth="1" opacity="0.2" fill="none" />
      {/* Gold ink stroke on paper */}
      <path
        d="M60 70 Q65 72 70 68 Q78 64 82 74 Q84 80 80 86"
        stroke={GOLD}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M64 80 Q70 76 76 82"
        stroke={GOLD}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Ninja head */}
      <circle cx="40" cy="38" r="10" fill={DARK} />
      <path d="M30 38 Q30 28 40 26 Q50 28 50 38" fill={DARK} />
      {/* Eye slit */}
      <rect x="33" y="35" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="37" cy="36" r="1.2" fill={DARK} />
      <circle cx="44" cy="36" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M32 47 Q36 45 40 45 Q44 45 48 47 L46 70 L34 70 Z"
        fill={DARK}
      />
      {/* Right arm holding brush extended */}
      <path d="M48 50 L60 58 L62 56 L50 48" fill={DARK} />
      {/* Large ink brush */}
      <rect x="56" y="44" width="3" height="26" rx="1" fill={DARK} transform="rotate(25, 56, 44)" />
      {/* Brush tip with gold */}
      <path d="M70 66 L72 74 L68 74 Z" fill={GOLD} />
      {/* Gold ink trailing */}
      <circle cx="70" cy="72" r="2" fill={GOLD} opacity="0.6" />
      {/* Left arm steadying */}
      <path d="M32 50 L24 62 L26 64 L34 54" fill={DARK} />
      {/* Legs */}
      <path d="M34 70 L30 104 L36 104 L38 78" fill={DARK} />
      <path d="M42 78 L46 104 L52 104 L46 70" fill={DARK} />
      {/* Belt */}
      <rect x="33" y="64" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 9. NinjaSeal — Contract Generator
 * Ninja pressing down a large stamp onto a document with both hands.
 */
export function NinjaSeal({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Document */}
      <rect x="35" y="76" width="50" height="30" rx="2" fill="#f5f0e6" opacity="0.5" />
      <rect x="35" y="76" width="50" height="30" rx="2" stroke={DARK} strokeWidth="1" opacity="0.2" fill="none" />
      {/* Document lines */}
      <line x1="40" y1="82" x2="60" y2="82" stroke={DARK} strokeWidth="1" opacity="0.15" />
      <line x1="40" y1="86" x2="55" y2="86" stroke={DARK} strokeWidth="1" opacity="0.15" />
      <line x1="40" y1="90" x2="58" y2="90" stroke={DARK} strokeWidth="1" opacity="0.15" />
      {/* Stamp */}
      <rect x="54" y="66" width="16" height="12" rx="2" fill={DARK} />
      <rect x="56" y="60" width="12" height="8" rx="1" fill={DARK} />
      {/* Gold stamp face glow */}
      <rect x="55" y="76" width="14" height="10" rx="2" fill={GOLD} opacity="0.7" />
      <circle cx="62" cy="81" r="4" fill={GOLD} opacity="0.9" />
      {/* Stamp glow */}
      <circle cx="62" cy="81" r="8" fill={GOLD} opacity="0.15" />
      {/* Ninja head */}
      <circle cx="60" cy="30" r="10" fill={DARK} />
      <path d="M50 30 Q50 20 60 18 Q70 20 70 30" fill={DARK} />
      {/* Eye slit */}
      <rect x="53" y="27" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="57" cy="28" r="1.2" fill={DARK} />
      <circle cx="63" cy="28" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M52 39 Q56 37 60 37 Q64 37 68 39 L66 58 L54 58 Z"
        fill={DARK}
      />
      {/* Both arms pressing down on stamp */}
      <path d="M54 42 L50 56 L54 62 L58 62" fill={DARK} />
      <path d="M66 42 L70 56 L66 62 L62 62" fill={DARK} />
      {/* Legs */}
      <path d="M54 58 L48 104 L54 104 L57 68" fill={DARK} />
      <path d="M63 68 L66 104 L72 104 L66 58" fill={DARK} />
      {/* Belt */}
      <rect x="53" y="52" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 10. NinjaTraining — Scripts
 * Ninja in fighting stance holding a wooden bokken sword horizontally.
 */
export function NinjaTraining({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gold bokken sword held horizontally */}
      <rect x="12" y="58" width="70" height="4" rx="1.5" fill={GOLD} />
      <rect x="12" y="57" width="6" height="6" rx="1" fill={GOLD} opacity="0.8" />
      {/* Bokken handle wrapping */}
      <rect x="68" y="56" width="14" height="8" rx="2" fill={GOLD} opacity="0.6" />
      {/* Tsuba (guard) */}
      <rect x="66" y="55" width="3" height="10" rx="1" fill={GOLD} opacity="0.9" />
      {/* Ninja head */}
      <circle cx="62" cy="32" r="10" fill={DARK} />
      <path d="M52 32 Q52 22 62 20 Q72 22 72 32" fill={DARK} />
      {/* Eye slit */}
      <rect x="55" y="29" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="59" cy="30" r="1.2" fill={DARK} />
      <circle cx="66" cy="30" r="1.2" fill={DARK} />
      {/* Torso — fighting stance, slightly turned */}
      <path
        d="M54 41 Q58 39 62 39 Q66 39 70 41 L68 64 L56 64 Z"
        fill={DARK}
      />
      {/* Right arm extended holding bokken */}
      <path d="M70 44 L80 56 L78 60 L68 48" fill={DARK} />
      {/* Left arm also gripping bokken */}
      <path d="M54 44 L46 56 L48 60 L56 48" fill={DARK} />
      {/* Hands on sword */}
      <circle cx="76" cy="58" r="3" fill={DARK} />
      <circle cx="48" cy="58" r="3" fill={DARK} />
      {/* Legs — wide fighting stance */}
      <path d="M56 64 L40 100 L46 102 L56 72" fill={DARK} />
      <path d="M64 72 L74 102 L80 100 L68 64" fill={DARK} />
      {/* Feet */}
      <rect x="38" y="100" width="10" height="4" rx="2" fill={DARK} />
      <rect x="72" y="100" width="10" height="4" rx="2" fill={DARK} />
      {/* Belt */}
      <rect x="55" y="56" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 11. NinjaHawk — Direct Agent
 * Ninja with arm extended up, hawk launching from forearm.
 */
export function NinjaHawk({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gold hawk silhouette */}
      <path
        d="M62 14 L50 22 L42 20 L48 24 L40 30 L52 26 L58 28 L66 22 L74 18 L70 24 L78 20 L68 26 L62 24 L56 28 L60 22 Z"
        fill={GOLD}
      />
      {/* Hawk body */}
      <path
        d="M56 24 Q58 20 62 18 Q66 20 64 24 Q62 26 58 26 Q56 26 56 24"
        fill={GOLD}
        opacity="0.8"
      />
      {/* Hawk eye */}
      <circle cx="62" cy="20" r="1" fill={DARK} />
      {/* Ninja head */}
      <circle cx="52" cy="50" r="10" fill={DARK} />
      <path d="M42 50 Q42 40 52 38 Q62 40 62 50" fill={DARK} />
      {/* Eye slit */}
      <rect x="45" y="47" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="49" cy="48" r="1.2" fill={DARK} />
      <circle cx="56" cy="48" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M44 59 Q48 57 52 57 Q56 57 60 59 L58 78 L46 78 Z"
        fill={DARK}
      />
      {/* Right arm raised up — hawk launching point */}
      <path d="M60 62 L66 44 L64 32 L68 32 L70 44 L64 62" fill={DARK} />
      {/* Forearm detail */}
      <rect x="64" y="30" width="6" height="4" rx="1" fill={DARK} />
      {/* Left arm down */}
      <path d="M44 62 L34 74 L36 77 L46 66" fill={DARK} />
      {/* Legs */}
      <path d="M46 78 L42 106 L48 106 L50 84" fill={DARK} />
      <path d="M54 84 L56 106 L62 106 L58 78" fill={DARK} />
      {/* Belt */}
      <rect x="45" y="72" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 12. NinjaStrategy — Dispo Process
 * Ninja standing over a laid-out map, pointing at a location.
 */
export function NinjaStrategy({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gold map laid out */}
      <path d="M18 78 L102 78 L98 108 L22 108 Z" fill={GOLD} opacity="0.3" />
      <path d="M18 78 L102 78 L98 108 L22 108 Z" stroke={GOLD} strokeWidth="2" fill="none" opacity="0.7" />
      {/* Map details */}
      <line x1="40" y1="82" x2="80" y2="82" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
      <line x1="35" y1="88" x2="85" y2="88" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
      <line x1="38" y1="94" x2="82" y2="94" stroke={GOLD} strokeWidth="0.8" opacity="0.5" />
      <line x1="50" y1="80" x2="50" y2="106" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
      <line x1="70" y1="80" x2="70" y2="106" stroke={GOLD} strokeWidth="0.8" opacity="0.4" />
      {/* Gold pointer / target on map */}
      <circle cx="66" cy="90" r="4" fill={GOLD} opacity="0.8" />
      <circle cx="66" cy="90" r="2" fill={GOLD} />
      {/* Ninja head */}
      <circle cx="56" cy="36" r="10" fill={DARK} />
      <path d="M46 36 Q46 26 56 24 Q66 26 66 36" fill={DARK} />
      {/* Eye slit looking down */}
      <rect x="49" y="34" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="53" cy="35" r="1.2" fill={DARK} />
      <circle cx="60" cy="35" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M48 45 Q52 43 56 43 Q60 43 64 45 L62 68 L50 68 Z"
        fill={DARK}
      />
      {/* Right arm pointing down at map */}
      <path d="M64 48 L72 68 L70 76 L68 76 L66 68 L60 52" fill={DARK} />
      {/* Pointing finger */}
      <line x1="69" y1="76" x2="66" y2="86" stroke={DARK} strokeWidth="2.5" strokeLinecap="round" />
      {/* Left arm on hip */}
      <path d="M48 48 L38 56 L40 64 L44 62 L42 54 L50 50" fill={DARK} />
      {/* Legs */}
      <path d="M50 68 L44 104 L50 104 L53 76" fill={DARK} />
      <path d="M59 76 L62 104 L68 104 L62 68" fill={DARK} />
      {/* Belt */}
      <rect x="49" y="62" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 13. NinjaBanner — Join Team
 * Ninja holding a tall nobori (vertical banner flag) in one hand.
 */
export function NinjaBanner({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Banner pole */}
      <rect x="74" y="6" width="3" height="104" rx="1" fill={GOLD} opacity="0.7" />
      {/* Gold pole tip */}
      <circle cx="75.5" cy="6" r="3" fill={GOLD} />
      {/* Banner flag / nobori */}
      <path d="M77 10 L100 10 Q98 28 100 46 L77 46 Z" fill={GOLD} opacity="0.8" />
      {/* Banner decoration */}
      <circle cx="88" cy="28" r="6" fill={GOLD} opacity="0.5" />
      <circle cx="88" cy="28" r="3" fill={DARK} opacity="0.3" />
      {/* Banner ripple */}
      <path d="M77 18 Q84 16 90 18" stroke={DARK} strokeWidth="0.5" opacity="0.2" fill="none" />
      <path d="M77 36 Q84 34 90 36" stroke={DARK} strokeWidth="0.5" opacity="0.2" fill="none" />
      {/* Ninja head */}
      <circle cx="48" cy="40" r="10" fill={DARK} />
      <path d="M38 40 Q38 30 48 28 Q58 30 58 40" fill={DARK} />
      {/* Eye slit */}
      <rect x="41" y="37" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="45" cy="38" r="1.2" fill={DARK} />
      <circle cx="52" cy="38" r="1.2" fill={DARK} />
      {/* Torso */}
      <path
        d="M40 49 Q44 47 48 47 Q52 47 56 49 L54 70 L42 70 Z"
        fill={DARK}
      />
      {/* Right arm holding pole high */}
      <path d="M56 52 L68 42 L74 36 L77 38 L72 44 L66 50 L58 56" fill={DARK} />
      {/* Left arm at side */}
      <path d="M40 52 L30 64 L32 67 L42 56" fill={DARK} />
      {/* Legs */}
      <path d="M42 70 L36 106 L42 106 L46 78" fill={DARK} />
      <path d="M50 78 L54 106 L60 106 L54 70" fill={DARK} />
      {/* Belt */}
      <rect x="41" y="64" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 14. NinjaGuide — Website Explainer
 * Ninja in walking pose, one arm extended forward gesturing "this way."
 */
export function NinjaGuide({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Gold gesture lines / path */}
      <path d="M78 52 L90 50 L96 48" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <path d="M78 56 L92 54 L100 52" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M78 60 L88 58 L94 56" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      {/* Gold path on ground */}
      <path d="M70 100 Q80 98 90 96 Q100 94 110 92" stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity="0.4" fill="none" />
      <path d="M80 104 Q90 102 100 100 Q108 98 114 96" stroke={GOLD} strokeWidth="2" strokeLinecap="round" opacity="0.25" fill="none" />
      {/* Ninja head */}
      <circle cx="50" cy="36" r="10" fill={DARK} />
      <path d="M40 36 Q40 26 50 24 Q60 26 60 36" fill={DARK} />
      {/* Eye slit */}
      <rect x="43" y="33" width="14" height="2.5" rx="1" fill="#e8e8e8" />
      <circle cx="47" cy="34" r="1.2" fill={DARK} />
      <circle cx="54" cy="34" r="1.2" fill={DARK} />
      {/* Torso — slight forward lean */}
      <path
        d="M42 45 Q46 43 50 43 Q54 43 58 45 L56 68 L44 68 Z"
        fill={DARK}
      />
      {/* Right arm extended forward gesturing */}
      <path d="M58 48 L72 50 L78 52 L78 58 L72 56 L58 54" fill={DARK} />
      {/* Open hand */}
      <path d="M78 50 L82 48 M78 52 L83 52 M78 55 L82 56" stroke={DARK} strokeWidth="1.5" strokeLinecap="round" />
      {/* Left arm back in walking pose */}
      <path d="M42 48 L32 58 L34 62 L44 54" fill={DARK} />
      {/* Legs — walking stride */}
      <path d="M44 68 L34 100 L40 102 L48 76" fill={DARK} />
      <path d="M52 76 L60 100 L66 98 L56 68" fill={DARK} />
      {/* Feet */}
      <rect x="32" y="100" width="10" height="4" rx="2" fill={DARK} />
      <rect x="58" y="96" width="10" height="4" rx="2" fill={DARK} />
      {/* Belt */}
      <rect x="43" y="60" width="14" height="3" rx="1" fill={GOLD} opacity="0.5" />
    </svg>
  );
}

/**
 * 15. NinjaSensei — Admin Dashboard
 * Ninja on elevated platform, arms crossed, looking down authoritatively.
 */
export function NinjaSensei({ size = 120, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Elevated platform */}
      <path d="M20 88 L100 88 L106 96 L14 96 Z" fill={DARK} opacity="0.3" />
      {/* Gold platform edge */}
      <rect x="20" y="86" width="80" height="4" rx="1" fill={GOLD} />
      {/* Platform base */}
      <path d="M14 96 L106 96 L110 108 L10 108 Z" fill={DARK} opacity="0.2" />
      <rect x="14" y="94" width="92" height="3" fill={GOLD} opacity="0.3" />
      {/* Ninja head — looking slightly down */}
      <circle cx="60" cy="30" r="11" fill={DARK} />
      <path d="M49 30 Q49 19 60 17 Q71 19 71 30" fill={DARK} />
      {/* Eye slit */}
      <rect x="52" y="28" width="16" height="3" rx="1" fill="#e8e8e8" />
      <circle cx="56.5" cy="29" r="1.3" fill={DARK} />
      <circle cx="63.5" cy="29" r="1.3" fill={DARK} />
      {/* Torso — broad, authoritative */}
      <path
        d="M50 40 Q55 38 60 38 Q65 38 70 40 L68 66 L52 66 Z"
        fill={DARK}
      />
      {/* Arms crossed over chest */}
      <path d="M50 44 L46 50 L50 56 L56 52 L60 48 L58 44" fill={DARK} />
      <path d="M70 44 L74 50 L70 56 L64 52 L60 48 L62 44" fill={DARK} />
      {/* Crossed arms overlay */}
      <path d="M50 48 L56 56 L64 56 L70 48 L66 44 L54 44 Z" fill={DARK} />
      {/* Forearm details */}
      <path d="M48 50 L54 54 L52 48" fill={DARK} />
      <path d="M72 50 L66 54 L68 48" fill={DARK} />
      {/* Legs — standing firm */}
      <path d="M52 66 L48 86 L54 86 L56 72" fill={DARK} />
      <path d="M64 72 L66 86 L72 86 L68 66" fill={DARK} />
      {/* Belt */}
      <rect x="51" y="60" width="18" height="3" rx="1" fill={GOLD} opacity="0.6" />
      {/* Shoulder accents */}
      <rect x="48" y="42" width="6" height="3" rx="1" fill={GOLD} opacity="0.4" />
      <rect x="66" y="42" width="6" height="3" rx="1" fill={GOLD} opacity="0.4" />
    </svg>
  );
}
