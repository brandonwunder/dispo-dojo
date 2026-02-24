import { Award } from 'lucide-react'

const BADGE_META = {
  'active-voice':     { label: 'Active Voice',     color: '#00C6FF' },
  'community-pillar': { label: 'Community Pillar',  color: '#7F00FF' },
  'deal-hunter':      { label: 'Deal Hunter',       color: '#F6C445' },
  'ink-slinger':      { label: 'Ink Slinger',       color: '#E53935' },
  'first-blood':      { label: 'First Blood',       color: '#E53935' },
  'closer':           { label: 'Closer',            color: '#10b981' },
  'top-closer':       { label: 'Top Closer',        color: '#F6C445' },
  'bird-dog':         { label: 'Bird Dog',          color: '#f97316' },
  'boots':            { label: 'Boots on Ground',   color: '#84cc16' },
}

export default function ActivityBadge({ id, size = 'sm' }) {
  const meta = BADGE_META[id]
  if (!meta) return null
  const iconSize = size === 'sm' ? 10 : 12
  const px = size === 'sm' ? 'px-1.5 py-0.5 text-[9px] gap-1' : 'px-2 py-1 text-[11px] gap-1.5'
  return (
    <span
      className={`inline-flex items-center rounded-sm font-heading font-semibold tracking-wide uppercase ${px}`}
      style={{
        color: meta.color,
        background: `${meta.color}15`,
        border: `1px solid ${meta.color}35`,
      }}
    >
      <Award size={iconSize} />
      {meta.label}
    </span>
  )
}
