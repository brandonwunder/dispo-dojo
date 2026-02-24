const RANK_COLORS = {
  'Academy Student': { bg: 'rgba(156,163,175,0.15)', text: '#9CA3AF' },
  'Genin':           { bg: 'rgba(34,197,94,0.15)',    text: '#22C55E' },
  'Chunin':          { bg: 'rgba(0,198,255,0.15)',    text: '#00C6FF' },
  'Jonin':           { bg: 'rgba(127,0,255,0.15)',    text: '#7F00FF' },
  'ANBU':            { bg: 'rgba(229,57,53,0.15)',    text: '#E53935' },
  'Kage':            { bg: 'rgba(246,196,69,0.15)',   text: '#F6C445' },
}

export default function RankBadge({ rankName, size = 'sm' }) {
  if (!rankName) return null
  const colors = RANK_COLORS[rankName] || RANK_COLORS['Academy Student']
  const sizeClasses = size === 'sm'
    ? 'text-[8px] px-1 py-[1px]'
    : 'text-[10px] px-1.5 py-0.5'

  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold leading-none ${sizeClasses}`}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {rankName}
    </span>
  )
}
