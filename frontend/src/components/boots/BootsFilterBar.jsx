import { Search } from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'photos', label: 'Photos' },
  { id: 'walkthrough', label: 'Walkthrough' },
  { id: 'lockbox', label: 'Lockbox' },
  { id: 'sign', label: 'Signs' },
  { id: 'occupant', label: 'Occupant' },
  { id: 'hoa', label: 'HOA' },
  { id: 'other', label: 'Other' },
]

const BADGE_COLORS = {
  photos: '#00C6FF',
  walkthrough: '#A855F7',
  lockbox: '#F6C445',
  sign: '#10b981',
  occupant: '#f97316',
  hoa: '#84cc16',
  other: '#C8D1DA',
}

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

// ─── Filter Bar Component ────────────────────────────────────────────────────

export default function BootsFilterBar({
  searchText,
  onSearchChange,
  taskTypeFilter,
  onTaskTypeChange,
  availabilityFilter,
  onAvailabilityChange,
  searchPlaceholder = 'Search operators...',
}) {
  const showAvailability = availabilityFilter !== undefined && onAvailabilityChange !== undefined

  return (
    <div className="flex flex-col gap-3 mb-5">
      {/* Search input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: '#C8D1DA' }}
        />
        <input
          type="text"
          className={inputCls + ' pl-8'}
          placeholder={searchPlaceholder}
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Task type pills + Availability toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Task type filter pills */}
        {TASK_TYPES.map(({ id, label }) => {
          const isActive = taskTypeFilter === id
          const color = BADGE_COLORS[id] || '#C8D1DA'
          return (
            <button
              key={id}
              onClick={() => onTaskTypeChange(isActive ? '' : id)}
              className="px-2 py-1 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/30"
              style={{
                backgroundColor: isActive ? `${color}20` : 'transparent',
                borderColor: isActive ? `${color}55` : 'rgba(255,255,255,0.07)',
                color: isActive ? color : '#C8D1DA',
              }}
            >
              {label}
            </button>
          )
        })}

        {/* Availability filter (only shown when props are provided) */}
        {showAvailability && (
          <>
            {/* Separator */}
            <div className="w-px h-5 bg-white/10 mx-1" />

            {[
              { id: 'all', label: 'All' },
              { id: 'available', label: 'Available Only' },
            ].map(({ id, label }) => {
              const isActive = availabilityFilter === id
              return (
                <button
                  key={id}
                  onClick={() => onAvailabilityChange(id)}
                  className="px-2 py-1 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/30"
                  style={{
                    backgroundColor: isActive ? 'rgba(0,198,255,0.15)' : 'transparent',
                    borderColor: isActive ? 'rgba(0,198,255,0.4)' : 'rgba(255,255,255,0.07)',
                    color: isActive ? '#00C6FF' : '#C8D1DA',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
