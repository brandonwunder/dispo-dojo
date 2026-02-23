export default function InkLandscape({ children }) {
  return (
    <div className="relative h-[240px] rounded-sm overflow-hidden mb-8">
      {/* Sky gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1a 40%, #12100c 100%)',
        }}
      />

      {/* Far mountain range — organic SVG bezier curves */}
      <svg className="absolute bottom-0 left-0 w-full h-[65%]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0,200 L0,150 C40,140 80,100 140,120 C200,140 230,70 310,95 C390,120 420,50 500,80 C580,110 610,40 700,65 C790,90 830,45 900,70 C970,95 1010,55 1080,80 C1130,95 1160,70 1200,90 L1200,200 Z"
          fill="rgba(26,21,16,0.25)"
        />
      </svg>

      {/* Mid mountain range */}
      <svg className="absolute bottom-0 left-0 w-full h-[55%]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0,200 L0,140 C60,125 100,75 180,100 C260,125 300,55 400,85 C500,115 530,35 620,65 C710,95 750,25 840,55 C930,85 960,40 1050,70 C1110,90 1150,55 1200,80 L1200,200 Z"
          fill="rgba(26,21,16,0.4)"
        />
      </svg>

      {/* Near-mid mountain range */}
      <svg className="absolute bottom-0 left-0 w-full h-[42%]" viewBox="0 0 1200 200" preserveAspectRatio="none">
        <path
          d="M0,200 L0,130 C70,115 120,80 200,105 C280,130 340,65 430,90 C520,115 560,50 650,75 C740,100 790,45 870,70 C950,95 1000,55 1080,80 C1140,95 1170,75 1200,90 L1200,200 Z"
          fill="rgba(18,16,12,0.55)"
        />
      </svg>

      {/* Torii gate silhouette — larger, with glow */}
      <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 opacity-35">
        <div className="absolute inset-0 blur-[8px]" style={{ background: 'radial-gradient(ellipse, rgba(212,168,83,0.15) 0%, transparent 70%)', width: 100, height: 80, left: -20, top: -15 }} />
        <svg width="72" height="60" viewBox="0 0 60 50" fill="none">
          <rect x="8" y="0" width="44" height="4" rx="1" fill="#d4a853" />
          <rect x="5" y="4" width="50" height="3" rx="1" fill="#d4a853" opacity="0.8" />
          <rect x="12" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="44" y="7" width="4" height="43" fill="#d4a853" opacity="0.7" />
          <rect x="12" y="14" width="36" height="2.5" rx="1" fill="#d4a853" opacity="0.5" />
        </svg>
      </div>

      {/* Near ground layer — organic */}
      <svg className="absolute bottom-0 left-0 w-full h-[25%]" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path
          d="M0,100 L0,50 C80,40 160,55 250,35 C340,15 420,45 520,30 C620,15 700,40 800,25 C900,10 980,35 1080,20 C1140,12 1170,30 1200,25 L1200,100 Z"
          fill="#0c0a07"
        />
      </svg>

      {/* Drifting mist layer */}
      <div
        className="absolute bottom-[15%] left-0 h-[30%] opacity-[0.15] pointer-events-none"
        style={{
          width: '200%',
          background: 'repeating-linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.3) 10%, transparent 20%)',
          filter: 'blur(30px)',
          animation: 'mistScroll 60s linear infinite',
        }}
      />

      {/* Gradient fade to page background */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-bg via-bg/60 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        {children}
      </div>
    </div>
  )
}
