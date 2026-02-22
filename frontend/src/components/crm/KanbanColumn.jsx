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

  // Extract the base color for the wax seal from stage.color (e.g. "text-info" -> "info")
  const colorBase = stage.color.replace('text-', '')

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-[260px] min-w-[260px] flex-shrink-0 flex flex-col
        wood-panel rounded-xl border transition-all duration-200
        ${isDragOver
          ? 'border-gold shadow-[0_0_15px_rgba(212,168,83,0.15)] scale-[1.01]'
          : 'border-gold-dim/20'
        }
      `}
    >
      {/* Column Header - lacquer bar with wax seal dot */}
      <div className="lacquer-bar px-3 py-3 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          {/* Wax seal dot */}
          <span
            className={`w-3 h-3 rounded-full bg-${colorBase} shadow-[inset_0_-1px_2px_rgba(0,0,0,0.4),0_0_6px_rgba(0,0,0,0.2)]`}
            style={{
              background: `radial-gradient(circle at 35% 35%, var(--color-${colorBase === 'info' ? 'steel' : colorBase === 'success' ? 'bamboo' : colorBase === 'warning' ? 'gold' : colorBase === 'error' ? 'crimson' : 'gold'}) 0%, var(--color-${colorBase === 'info' ? 'steel' : colorBase === 'success' ? 'bamboo' : colorBase === 'warning' ? 'gold-dim' : colorBase === 'error' ? 'crimson' : 'gold-dim'}) 100%)`,
            }}
          />
          <h3 className="font-heading text-gold tracking-widest uppercase text-xs font-semibold">
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
            ${isDragOver ? 'border-gold/40 bg-gold/5' : 'border-gold-dim/15'}
          `}>
            <span className="text-[11px] text-text-muted font-heading tracking-widest uppercase">
              {isDragOver ? 'Drop here' : 'No leads'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
