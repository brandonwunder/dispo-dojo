import KanbanColumn from './KanbanColumn'

export default function KanbanBoard({ stages, leads, onLeadClick, onLeadDrop }) {
  function handleDragStart(e, leadId) {
    e.dataTransfer.setData('text/plain', leadId)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight opacity to the dragged element
    e.currentTarget.style.opacity = '0.5'
  }

  function handleDrop(e, newStageId) {
    const leadId = e.dataTransfer.getData('text/plain')
    if (leadId && onLeadDrop) {
      onLeadDrop(leadId, newStageId)
    }
  }

  // Restore opacity after drag ends (global listener)
  function handleDragEnd(e) {
    e.currentTarget.style.opacity = '1'
  }

  return (
    <div
      className="overflow-x-auto flex gap-4 pb-4 min-h-[500px]"
      onDragEnd={handleDragEnd}
    >
      {stages.map((stage) => {
        const stageLeads = leads.filter((lead) => lead.status === stage.id)
        return (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            leads={stageLeads}
            onLeadClick={onLeadClick}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
          />
        )
      })}
    </div>
  )
}
