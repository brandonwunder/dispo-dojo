import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Plus, LayoutGrid, List } from 'lucide-react'
import Button from '../components/Button'
import KanbanBoard from '../components/crm/KanbanBoard'
import LeadDetail from '../components/crm/LeadDetail'
import { ACQUISITION_STAGES, DISPOSITION_STAGES, MOCK_LEADS } from '../components/crm/mockData'

export default function CRM() {
  const [leads, setLeads] = useState(MOCK_LEADS)
  const [selectedLead, setSelectedLead] = useState(null)
  const [activePipeline, setActivePipeline] = useState('acquisitions')
  const [viewMode, setViewMode] = useState('kanban')

  const stages = activePipeline === 'acquisitions' ? ACQUISITION_STAGES : DISPOSITION_STAGES
  const filteredLeads = leads.filter((l) => l.pipeline === activePipeline)

  // Pipeline stats
  const totalLeads = filteredLeads.length
  const totalValue = filteredLeads.reduce((sum, l) => sum + (l.deal?.offerAmount || 0), 0)

  const handleLeadClick = useCallback((lead) => {
    setSelectedLead(lead)
  }, [])

  const handleLeadDrop = useCallback((leadId, newStageId) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId
          ? { ...lead, status: newStageId, daysInStage: 0 }
          : lead
      )
    )
    // Also update selected lead if it's the one being dragged
    setSelectedLead((prev) =>
      prev && prev.id === leadId
        ? { ...prev, status: newStageId, daysInStage: 0 }
        : prev
    )
  }, [])

  const handleLeadUpdate = useCallback((updatedLead) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === updatedLead.id ? updatedLead : lead
      )
    )
    setSelectedLead(updatedLead)
  }, [])

  const handleCloseDetail = useCallback(() => {
    setSelectedLead(null)
  }, [])

  function formatCurrency(amount) {
    if (!amount) return '$0'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl tracking-[0.06em] brush-underline text-text-primary">CRM Pipeline</h1>
          <p className="text-sm text-text-dim mt-1">
            <span className="font-heading font-semibold tracking-wide">{totalLeads}</span> leads &middot;{' '}
            <span className="font-mono text-gold">{formatCurrency(totalValue)}</span> in offers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-gold-dim/[0.15] rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 transition-colors border-r border-gold-dim/[0.15] ${
                viewMode === 'kanban'
                  ? 'bg-gold/[0.08] text-gold'
                  : 'text-text-muted hover:text-gold-dim'
              }`}
              title="Kanban View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-gold/[0.08] text-gold'
                  : 'text-text-muted hover:text-gold-dim'
              }`}
              title="List View (coming soon)"
              disabled
            >
              <List size={16} />
            </button>
          </div>

          {/* New Lead Button */}
          <Button variant="gold" size="md">
            <span className="flex items-center gap-2">
              <Plus size={16} />
              New Lead
            </span>
          </Button>
        </div>
      </div>

      {/* Pipeline Toggle Tabs */}
      <div className="flex border-b border-gold-dim/[0.1] w-fit">
        <button
          onClick={() => setActivePipeline('acquisitions')}
          className={`
            px-5 py-2.5 text-sm font-heading font-medium tracking-wide transition-all duration-200 border-b-2
            ${activePipeline === 'acquisitions'
              ? 'bg-gold/[0.08] text-gold border-gold'
              : 'text-text-dim hover:text-gold-dim border-transparent'
            }
          `}
        >
          Acquisitions
        </button>
        <button
          onClick={() => setActivePipeline('disposition')}
          className={`
            px-5 py-2.5 text-sm font-heading font-medium tracking-wide transition-all duration-200 border-b-2
            ${activePipeline === 'disposition'
              ? 'bg-gold/[0.08] text-gold border-gold'
              : 'text-text-dim hover:text-gold-dim border-transparent'
            }
          `}
        >
          Disposition
        </button>
      </div>

      {/* Kanban Board */}
      <KanbanBoard
        stages={stages}
        leads={filteredLeads}
        onLeadClick={handleLeadClick}
        onLeadDrop={handleLeadDrop}
      />

      {/* Lead Detail Slide-Out */}
      <AnimatePresence>
        {selectedLead && (
          <LeadDetail
            key={selectedLead.id}
            lead={selectedLead}
            onClose={handleCloseDetail}
            onUpdate={handleLeadUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
