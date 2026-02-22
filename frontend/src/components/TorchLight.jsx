/**
 * TorchLight — fixed-position radial warm glows simulating torch/lantern light.
 * Uses the .torch-glow CSS class (torchFlicker animation) from our theme.
 */

const defaultPositions = [
  { top: '10%', left: '5%' },
  { top: '80%', right: '5%' },
]

export default function TorchLight({
  positions = defaultPositions,
  intensity = 0.7,
  color = 'rgba(255, 154, 60, ',
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
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}${intensity * 0.08}) 0%, ${color}${intensity * 0.02}) 40%, transparent 70%)`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
    </div>
  )
}
