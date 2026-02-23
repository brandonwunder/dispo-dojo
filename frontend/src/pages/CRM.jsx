import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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
    <div className="stone-texture space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl tracking-[0.06em] brush-underline text-parchment">The War Room</h1>
          <div className="wood-panel mt-2 inline-flex items-center gap-3 rounded-lg px-4 py-2 border border-gold-dim/20">
            <span className="font-heading font-semibold tracking-wide text-gold">{totalLeads}</span>
            <span className="text-sm text-text-dim">leads</span>
            <span className="text-gold-dim/40">&middot;</span>
            <span className="font-mono text-gold">{formatCurrency(totalValue)}</span>
            <span className="text-sm text-text-dim">in offers</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-gold-dim/20 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 transition-colors border-r border-gold-dim/20 ${
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

      {/* Pipeline Toggle Banners */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => setActivePipeline('acquisitions')}
          animate={activePipeline === 'acquisitions' ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`
            px-6 py-3 rounded-lg font-heading font-semibold text-sm tracking-widest uppercase transition-all duration-300 border
            ${activePipeline === 'acquisitions'
              ? 'gold-shimmer text-bg border-gold/40 shadow-[0_0_25px_-8px_rgba(212,168,83,0.4)]'
              : 'wood-panel text-text-dim border-gold-dim/15 hover:text-text-primary hover:border-gold-dim/30'
            }
          `}
        >
          Acquisitions
        </motion.button>
        <motion.button
          onClick={() => setActivePipeline('disposition')}
          animate={activePipeline === 'disposition' ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`
            px-6 py-3 rounded-lg font-heading font-semibold text-sm tracking-widest uppercase transition-all duration-300 border
            ${activePipeline === 'disposition'
              ? 'gold-shimmer text-bg border-gold/40 shadow-[0_0_25px_-8px_rgba(212,168,83,0.4)]'
              : 'wood-panel text-text-dim border-gold-dim/15 hover:text-text-primary hover:border-gold-dim/30'
            }
          `}
        >
          Disposition
        </motion.button>
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
