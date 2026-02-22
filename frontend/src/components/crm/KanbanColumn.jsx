import { useState } from 'react'
import LeadCard from './LeadCard'

export default function KanbanColumn({ stage, leads, onLeadClick, onDragOver, onDrop, onDragStart }) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
    if (onDragOver) onDragOver(e)
  }

  function handleDragLeave(e) {
    // Only trigger if we're actually leaving this column, not entering a child
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    if (onDrop) onDrop(e, stage.id)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-[260px] min-w-[260px] flex-shrink-0 flex flex-col
        bg-bg-elevated/50 rounded-xl border transition-all duration-200
        ${isDragOver
          ? 'border-gold shadow-[0_0_30px_-10px_rgba(201,169,110,0.35)] scale-[1.01]'
          : 'border-gold-dim/[0.1]'
        }
      `}
    >
      {/* Column Header - wood-post feel with gold top border */}
      <div className="px-3 py-3 flex items-center justify-between border-b border-gold-dim/[0.1] border-t-2 border-t-gold/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${stage.color.replace('text-', 'bg-')}`} />
          <h3 className={`font-heading text-sm font-semibold tracking-wide ${stage.color}`}>
            {stage.label}
          </h3>
        </div>
        <span className="text-[11px] font-mono font-medium text-text-muted bg-bg/60 px-2 py-0.5 rounded-full min-w-[22px] text-center">
          {leads.length}
        </span>
      </div>

      {/* Card List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[100px]">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={onLeadClick}
            onDragStart={onDragStart}
          />
        ))}

        {/* Empty state */}
        {leads.length === 0 && (
          <div className={`
            flex items-center justify-center h-20 rounded-lg border border-dashed
            transition-colors duration-200
            ${isDragOver ? 'border-gold/40 bg-gold/5' : 'border-gold-dim/[0.1]'}
          `}>
            <span className="text-[11px] text-text-muted font-heading tracking-wide">
              {isDragOver ? 'Drop here' : 'No leads'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
