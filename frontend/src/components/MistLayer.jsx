export default function MistLayer() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Mist patch 1 — large, slow drift right */}
      <div
        className="absolute w-[800px] h-[400px] opacity-[0.04] blur-[80px] animate-[mistDrift1_30s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(212,168,83,0.3) 0%, transparent 70%)',
          top: '10%',
          left: '-10%',
        }}
      />

      {/* Mist patch 2 — medium, drift left */}
      <div
        className="absolute w-[600px] h-[350px] opacity-[0.035] blur-[70px] animate-[mistDrift2_25s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(180,170,200,0.25) 0%, transparent 70%)',
          bottom: '5%',
          right: '-5%',
        }}
      />

      {/* Mist patch 3 — subtle center drift */}
      <div
        className="absolute w-[500px] h-[300px] opacity-[0.025] blur-[60px] animate-[mistDrift3_35s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(ellipse, rgba(200,190,170,0.2) 0%, transparent 70%)',
          top: '45%',
          left: '25%',
        }}
      />

      <style>{`
        @keyframes mistDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -20px) scale(1.05); }
          66% { transform: translate(-30px, 15px) scale(0.95); }
        }
        @keyframes mistDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 25px) scale(1.08); }
          66% { transform: translate(40px, -30px) scale(0.92); }
        }
        @keyframes mistDrift3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -15px) scale(1.03); }
        }
      `}</style>
    </div>
  )
}
