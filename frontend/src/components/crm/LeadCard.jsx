import { Clock, AlertCircle } from 'lucide-react'

const SOURCE_BADGES = {
  agent_finder: { label: 'Agent Finder', bg: 'bg-info/15', text: 'text-info', border: 'border-info/25' },
  fsbo: { label: 'FSBO', bg: 'bg-success/15', text: 'text-success', border: 'border-success/25' },
  manual: { label: 'Manual', bg: 'bg-gold/15', text: 'text-gold', border: 'border-gold/25' },
}

const MOTIVATION_DOTS = {
  hot: { color: 'bg-error', ring: 'ring-error/30', label: 'Hot' },
  warm: { color: 'bg-warning', ring: 'ring-warning/30', label: 'Warm' },
  cold: { color: 'bg-info', ring: 'ring-info/30', label: 'Cold' },
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
        bg-bg-card/80 border border-gold-dim/[0.1] rounded-lg p-3 cursor-pointer
        hover:border-gold-dim/25 hover:shadow-[0_0_20px_-8px_rgba(201,169,110,0.15)]
        transition-all duration-200 group select-none
      "
    >
      {/* Address */}
      <p className="font-heading font-semibold text-sm text-text-primary truncate leading-tight tracking-wide">
        {lead.address.split(',')[0]}
      </p>
      <p className="text-[11px] text-text-muted truncate mt-0.5">
        {lead.address.split(',').slice(1).join(',').trim()}
      </p>

      {/* Source + Motivation Row */}
      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${source.bg} ${source.text} ${source.border}`}
        >
          {source.label}
        </span>

        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${motivation.color} ring-2 ${motivation.ring}`}
            title={motivation.label}
          />
          <span className="text-[11px] text-text-dim">{lead.seller?.name}</span>
        </div>
      </div>

      {/* Deal Amount */}
      {lead.deal?.offerAmount && (
        <div className="mt-2 flex items-center gap-1">
          <span className="text-xs text-text-muted font-heading tracking-wide">Offer:</span>
          <span className="text-xs font-mono font-semibold text-gold">
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
