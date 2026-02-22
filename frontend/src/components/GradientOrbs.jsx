export default function GradientOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Gold orb */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-[orbFloat1_20s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(201,169,110,0.4) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
        }}
      />
      {/* Purple orb */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px] animate-[orbFloat2_25s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(120,80,200,0.35) 0%, transparent 70%)',
          bottom: '-10%',
          left: '-5%',
        }}
      />
      {/* Blue orb */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full opacity-15 blur-[100px] animate-[orbFloat3_22s_ease-in-out_infinite]"
        style={{
          background: 'radial-gradient(circle, rgba(70,130,220,0.3) 0%, transparent 70%)',
          top: '40%',
          left: '30%',
        }}
      />

      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.05); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.08); }
          66% { transform: translate(-25px, 25px) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-35px, -25px) scale(1.03); }
          66% { transform: translate(30px, 35px) scale(0.97); }
        }
      `}</style>
    </div>
  )
}
