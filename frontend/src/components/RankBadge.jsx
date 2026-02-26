import { RANK_BADGE_COLOR } from '../lib/rankImages'

const RANK_LABELS = {
  initiate: 'Initiate', scout: 'Scout', shinobi: 'Shinobi',
  shadow: 'Shadow', blade: 'Blade', jonin: 'Jonin',
  'shadow-master': 'Shadow Master', kage: 'Kage',
}

export default function RankBadge({ rank = 'initiate', size = 'sm' }) {
  const color = RANK_BADGE_COLOR[rank] || '#9ca3af'
  const label = RANK_LABELS[rank] || rank
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold tracking-wider uppercase ${px}`}
      style={{
        color,
        background: `${color}18`,
        border: `1px solid ${color}40`,
        boxShadow: `0 0 6px ${color}20`,
      }}
    >
      {label}
    </span>
  )
}
