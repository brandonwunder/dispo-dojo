/**
 * TorchLight — fixed-position radial cool glows simulating ambient light.
 * Uses the .torch-glow CSS class (torchFlicker animation) from our theme.
 */

const defaultPositions = [
  { top: '10%', left: '5%' },
  { top: '80%', right: '5%' },
]

export default function TorchLight({
  positions = defaultPositions,
  intensity = 0.7,
  color = 'rgba(0, 198, 255, ',
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="torch-glow"
          style={{
            position: 'absolute',
            ...pos,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}${(intensity * 0.35).toFixed(2)}) 0%, ${color}${(intensity * 0.12).toFixed(2)}) 40%, transparent 70%)`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  )
}
