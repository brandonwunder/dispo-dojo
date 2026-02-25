import { Search } from 'lucide-react'
import GlassPanel from '../GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const BIRD_DOG_METHODS = [
  'Driving for Dollars',
  'Door-Knocking',
  'Cold Calling',
  'Skip Tracing',
  'Referral Network',
  'Other',
]

const JOB_TASK_TYPES = [
  'Driving for Dollars',
  'Door-Knocking',
  'Cold Calling',
  'Skip Trace Verification',
  'General Scouting',
  'Other',
]

const URGENCY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'ASAP']

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

// ─── Filter Chip ─────────────────────────────────────────────────────────────

function FilterChip({ label, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
      style={{
        backgroundColor: selected ? 'rgba(0,198,255,0.15)' : 'transparent',
        borderColor: selected ? 'rgba(0,198,255,0.45)' : 'rgba(255,255,255,0.07)',
        color: selected ? '#00C6FF' : '#C8D1DA',
      }}
    >
      {label}
    </button>
  )
}

// ─── FilterBar ───────────────────────────────────────────────────────────────

export default function FilterBar({ type, filters, onFilterChange }) {
  function setFilter(key, value) {
    onFilterChange({ ...filters, [key]: value })
  }

  function toggleMethod(method) {
    const current = filters.methods || []
    if (current.includes(method)) {
      setFilter('methods', current.filter((m) => m !== method))
    } else {
      setFilter('methods', [...current, method])
    }
  }

  if (type === 'bird_dog') {
    return (
      <GlassPanel className="p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/40 pointer-events-none" />
            <input
              type="text"
              className={inputCls + ' !pl-9 !py-2'}
              placeholder="Search by location..."
              value={filters.location || ''}
              onChange={(e) => setFilter('location', e.target.value)}
            />
          </div>

          {/* Method chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {BIRD_DOG_METHODS.map((method) => (
              <FilterChip
                key={method}
                label={method}
                selected={(filters.methods || []).includes(method)}
                onClick={() => toggleMethod(method)}
              />
            ))}
          </div>

          {/* Availability toggle */}
          <div className="flex items-center gap-1.5">
            {['All', 'Available Only'].map((opt) => {
              const isAvailOnly = opt === 'Available Only'
              const isSelected = isAvailOnly
                ? filters.availableOnly === true
                : filters.availableOnly !== true
              return (
                <FilterChip
                  key={opt}
                  label={opt}
                  selected={isSelected}
                  onClick={() => setFilter('availableOnly', isAvailOnly)}
                />
              )
            })}
          </div>
        </div>
      </GlassPanel>
    )
  }

  // ─── Job type filters ──────────────────────────────────────────────────────

  return (
    <GlassPanel className="p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim/40 pointer-events-none" />
          <input
            type="text"
            className={inputCls + ' !pl-9 !py-2'}
            placeholder="Search by location..."
            value={filters.location || ''}
            onChange={(e) => setFilter('location', e.target.value)}
          />
        </div>

        {/* Task type dropdown */}
        <select
          className={inputCls + ' !w-auto !py-2 cursor-pointer min-w-[160px]'}
          value={filters.taskType || ''}
          onChange={(e) => setFilter('taskType', e.target.value)}
        >
          <option value="">All Task Types</option>
          {JOB_TASK_TYPES.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0B0F14]">{opt}</option>
          ))}
        </select>

        {/* Urgency chips */}
        <div className="flex items-center gap-1.5">
          {URGENCY_OPTIONS.map((opt) => {
            const isSelected = opt === 'All'
              ? !filters.urgency
              : filters.urgency === opt
            return (
              <FilterChip
                key={opt}
                label={opt}
                selected={isSelected}
                onClick={() => setFilter('urgency', opt === 'All' ? '' : opt)}
              />
            )
          })}
        </div>
      </div>
    </GlassPanel>
  )
}
