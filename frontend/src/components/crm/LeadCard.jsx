import { Clock, AlertCircle } from 'lucide-react'

const SOURCE_BADGES = {
  agent_finder: { label: 'Agent Finder', color: 'var(--color-steel)' },
  fsbo: { label: 'FSBO', color: 'var(--color-bamboo)' },
  manual: { label: 'Manual', color: 'var(--color-gold-dim)' },
}

const MOTIVATION_DOTS = {
  hot: { color: 'var(--color-crimson)', ring: 'ring-error/30', label: 'Hot' },
  warm: { color: 'var(--color-gold)', ring: 'ring-warning/30', label: 'Warm' },
  cold: { color: 'var(--color-steel)', ring: 'ring-info/30', label: 'Cold' },
}

function formatCurrency(amount) {
  if (!amount) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  const due = new Date(dateStr)
  const today = new Date('2026-02-22')
  return due < today
}

export default function LeadCard({ lead, onClick, onDragStart }) {
  const source = SOURCE_BADGES[lead.source] || SOURCE_BADGES.manual
  const motivation = MOTIVATION_DOTS[lead.motivation] || MOTIVATION_DOTS.cold
  const overdue = isOverdue(lead.nextActionDue)

  return (
    <div
      draggable="true"
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onClick(lead)}
      className="
        wood-panel-light border border-gold-dim/15 rounded-lg p-3 cursor-pointer
        hover:border-gold-dim/30 hover:shadow-[0_0_20px_-8px_rgba(212,168,83,0.2)]
        transition-all duration-200 group select-none relative
      "
      style={{
        clipPath: 'polygon(0 10%, 50% 0, 100% 10%, 100% 100%, 0 100%)',
      }}
    >
      {/* Ema top edge accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold-dim/40 to-transparent" />

      {/* Address */}
      <p className="font-heading font-bold text-sm text-parchment truncate leading-tight tracking-wide pt-1">
        {lead.address.split(',')[0]}
      </p>
      <p className="text-[11px] text-text-muted truncate mt-0.5">
        {lead.address.split(',').slice(1).join(',').trim()}
      </p>

      {/* Source + Motivation Row */}
      <div className="flex items-center justify-between mt-2">
        {/* Wax seal source badge */}
        <span
          className="text-[10px] px-2.5 py-0.5 rounded-full font-medium text-parchment/90"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${source.color}, color-mix(in srgb, ${source.color} 70%, black))`,
            boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)`,
          }}
        >
          {source.label}
        </span>

        <div className="flex items-center gap-1.5">
          {/* Wax seal motivation dot */}
          <span
            className={`w-2.5 h-2.5 rounded-full ring-2 ${motivation.ring}`}
            style={{
              background: `radial-gradient(circle at 35% 35%, ${motivation.color}, color-mix(in srgb, ${motivation.color} 60%, black))`,
            }}
            title={motivation.label}
          />
          <span className="text-[11px] text-text-dim">{lead.seller?.name}</span>
        </div>
      </div>

      {/* Deal Amount */}
      {lead.deal?.offerAmount && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-text-muted font-heading tracking-wide">Offer:</span>
          <span className="text-xs font-mono font-semibold gold-shimmer-text">
            {formatCurrency(lead.deal.offerAmount)}
          </span>
        </div>
      )}

      {/* Bottom Row: Days in Stage + Next Action */}
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1 shrink-0">
          <Clock size={11} className="text-text-muted" />
          <span className="text-[11px] font-mono text-text-muted">
            {lead.daysInStage}d
          </span>
        </div>

        {lead.nextAction && (
          <div className={`flex items-center gap-1 min-w-0 ${overdue ? 'text-error' : 'text-text-muted'}`}>
            {overdue && <AlertCircle size={11} className="shrink-0" />}
            <span className="text-[11px] truncate">
              {lead.nextAction}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
