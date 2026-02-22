import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Home,
  ChevronDown,
  ChevronUp,
  Info,
  Send,
  Filter,
} from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import ShurikenLoader from '../components/ShurikenLoader'
import Button from '../components/Button'

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
}

const MOCK_RESULTS = [
  {
    id: 1,
    address: '1234 Oak Street, Phoenix, AZ 85001',
    price: 285000,
    owner: 'John Smith',
    phone: '(480) 555-0101',
    email: 'jsmith@email.com',
    source: 'Zillow',
    dom: 14,
    beds: 3,
    baths: 2,
  },
  {
    id: 2,
    address: '567 Pine Avenue, Scottsdale, AZ 85251',
    price: 425000,
    owner: 'Sarah Johnson',
    phone: '(480) 555-0202',
    email: 'sjohnson@email.com',
    source: 'Craigslist',
    dom: 7,
    beds: 4,
    baths: 3,
  },
  {
    id: 3,
    address: '890 Maple Drive, Mesa, AZ 85201',
    price: 195000,
    owner: 'Mike Williams',
    phone: '(602) 555-0303',
    email: 'mwilliams@email.com',
    source: 'FSBO.com',
    dom: 21,
    beds: 2,
    baths: 1,
  },
  {
    id: 4,
    address: '321 Cedar Lane, Tempe, AZ 85281',
    price: 340000,
    owner: 'Lisa Chen',
    phone: '(480) 555-0404',
    email: 'lchen@email.com',
    source: 'Zillow',
    dom: 3,
    beds: 3,
    baths: 2,
  },
  {
    id: 5,
    address: '654 Birch Court, Gilbert, AZ 85233',
    price: 510000,
    owner: 'Robert Brown',
    phone: '(480) 555-0505',
    email: 'rbrown@email.com',
    source: 'Zillow',
    dom: 30,
    beds: 5,
    baths: 3,
  },
]

const SOURCE_STYLES = {
  Zillow: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  Craigslist: 'bg-violet-500/10 text-violet-400 border border-violet-500/20',
  'FSBO.com': 'bg-gold/[0.08] text-gold-dim border border-gold-dim/[0.15]',
}

const inputClasses =
  'bg-bg-card border border-gold-dim/20 rounded-sm px-4 py-3 text-parchment placeholder:text-text-muted font-body focus:outline-none focus:border-gold-dim/40 transition-colors'

const selectClasses =
  'bg-bg-card border border-gold-dim/20 rounded-sm px-3 py-3 text-parchment font-body focus:outline-none focus:border-gold-dim/40 transition-colors text-sm appearance-none cursor-pointer'

function formatPrice(num) {
  return '$' + num.toLocaleString('en-US')
}

export default function FSBOFinder() {
  const [query, setQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [selected, setSelected] = useState(new Set())

  // Filter state
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [propertyType, setPropertyType] = useState('All')
  const [minBeds, setMinBeds] = useState('Any')
  const [minBaths, setMinBaths] = useState('Any')

  function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setResults(null)
    setSelected(new Set())
    setTimeout(() => {
      setLoading(false)
      setResults(MOCK_RESULTS)
    }, 1800)
  }

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (!results) return
    if (selected.size === results.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(results.map((r) => r.id)))
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1400px] mx-auto"
    >
      {/* ── Forest Background Scene ── */}
      <div className="relative mb-8 rounded-sm overflow-hidden" style={{ minHeight: 220 }}>
        {/* Dark gradient base with forest tones */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #0a120a 0%, #06060f 40%, #06060f 100%)',
          }}
        />

        {/* Moon glow - upper right */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 10,
            right: 40,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220,235,255,0.25) 0%, rgba(180,210,255,0.08) 40%, transparent 70%)',
          }}
        />
        {/* Moon disc */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: 35,
            right: 65,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,245,255,0.9) 0%, rgba(200,220,255,0.5) 60%, transparent 100%)',
            boxShadow: '0 0 40px 10px rgba(200,220,255,0.15)',
          }}
        />

        {/* Tree silhouettes at bottom */}
        <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-4 pointer-events-none" style={{ height: 100 }}>
          {/* Tree 1 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '30px solid transparent',
            borderRight: '30px solid transparent',
            borderBottom: '80px solid #0a1a0a',
            transform: 'rotate(180deg)',
            marginBottom: -2,
          }} />
          {/* Tree 2 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '22px solid transparent',
            borderRight: '22px solid transparent',
            borderBottom: '60px solid #081408',
            transform: 'rotate(180deg)',
            marginBottom: -2,
          }} />
          {/* Tree 3 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '35px solid transparent',
            borderRight: '35px solid transparent',
            borderBottom: '90px solid #0c1c0c',
            transform: 'rotate(180deg)',
            marginBottom: -2,
          }} />
          {/* Tree 4 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderBottom: '55px solid #091509',
            transform: 'rotate(180deg)',
            marginBottom: -2,
          }} />
          {/* Tree 5 */}
          <div style={{
            width: 0, height: 0,
            borderLeft: '28px solid transparent',
            borderRight: '28px solid transparent',
            borderBottom: '75px solid #0a180a',
            transform: 'rotate(180deg)',
            marginBottom: -2,
          }} />
        </div>

        {/* Content overlay on the forest background */}
        <div className="relative z-10 px-6 py-10 text-center">
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
                <Home size={24} className="text-white" />
              </div>
            </div>
            <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
              The Hunting Grounds
            </h1>
            <p className="text-text-dim text-base max-w-2xl mx-auto mt-3 font-body">
              Track For Sale By Owner listings across the land &mdash; powered by free data sources
            </p>
          </motion.div>
        </div>
      </div>

      {/* Info banner */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 px-5 py-3.5 mb-6 rounded-sm border border-gold/25 bg-gold/[0.04] backdrop-blur-sm">
          <Info size={18} className="text-gold shrink-0" />
          <span className="text-sm text-gold font-heading tracking-wide">
            Targets can be sent directly to your CRM pipeline for follow-up
          </span>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div variants={itemVariants}>
        <WoodPanel headerBar="Hunting Grounds — FSBO Tracker" className="mb-6">
          <form onSubmit={handleSearch}>
            {/* Main search row */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Enter city, state or ZIP code..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${inputClasses} w-full pl-11 text-base`}
                />
              </div>
              <button
                type="submit"
                className="gold-shimmer text-ink font-heading font-bold tracking-widest uppercase px-8 py-3 rounded-sm shrink-0 flex items-center gap-2 hover:brightness-110 transition-all"
              >
                <Search size={16} />
                Hunt
              </button>
            </div>

            {/* Filters toggle */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-dim hover:text-gold transition-colors font-heading tracking-wide"
            >
              <Filter size={14} />
              Filters
              {filtersOpen ? (
                <ChevronUp size={14} />
              ) : (
                <ChevronDown size={14} />
              )}
            </button>

            {/* Collapsible filters */}
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="wood-panel-light rounded-sm p-4 mt-3">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {/* Price Min */}
                      <div>
                        <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
                          Min Price
                        </label>
                        <input
                          type="number"
                          placeholder="$0"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className={`${inputClasses} w-full !py-2.5 text-sm`}
                        />
                      </div>

                      {/* Price Max */}
                      <div>
                        <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
                          Max Price
                        </label>
                        <input
                          type="number"
                          placeholder="No max"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className={`${inputClasses} w-full !py-2.5 text-sm`}
                        />
                      </div>

                      {/* Property Type */}
                      <div>
                        <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
                          Property Type
                        </label>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className={`${selectClasses} w-full !py-2.5`}
                        >
                          <option>All</option>
                          <option>Single Family</option>
                          <option>Multi-Family</option>
                          <option>Condo</option>
                          <option>Townhouse</option>
                          <option>Land</option>
                        </select>
                      </div>

                      {/* Beds */}
                      <div>
                        <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
                          Beds (min)
                        </label>
                        <select
                          value={minBeds}
                          onChange={(e) => setMinBeds(e.target.value)}
                          className={`${selectClasses} w-full !py-2.5`}
                        >
                          <option>Any</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4</option>
                          <option>5+</option>
                        </select>
                      </div>

                      {/* Baths */}
                      <div>
                        <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5">
                          Baths (min)
                        </label>
                        <select
                          value={minBaths}
                          onChange={(e) => setMinBaths(e.target.value)}
                          className={`${selectClasses} w-full !py-2.5`}
                        >
                          <option>Any</option>
                          <option>1</option>
                          <option>2</option>
                          <option>3</option>
                          <option>4+</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </WoodPanel>
      </motion.div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <WoodPanel>
              <div className="flex flex-col items-center gap-4 py-8">
                {/* Pulsing progress bar */}
                <div className="w-full max-w-md h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-dim via-gold to-gold-bright"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.2,
                      ease: 'easeInOut',
                    }}
                    style={{ width: '40%' }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <ShurikenLoader size={24} />
                  <span className="text-text-dim text-sm font-heading tracking-wide">
                    Tracking targets...
                  </span>
                </div>
              </div>
            </WoodPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / Default State */}
      {!loading && !results && (
        <motion.div variants={itemVariants}>
          <WoodPanel>
            <div className="flex flex-col items-center justify-center gap-4 text-center py-12">
              <Home size={64} className="text-gold-dim" strokeWidth={1.2} />
              <p className="text-parchment text-lg font-heading tracking-wide max-w-md">
                No targets found in the hunting grounds
              </p>
              <p className="text-text-muted text-sm font-body">
                Enter a city or ZIP code above to begin tracking FSBO listings
              </p>
            </div>
          </WoodPanel>
        </motion.div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {!loading && results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-lg font-semibold tracking-wide text-parchment">
                  {results.length} Targets Located
                </h2>
                <span className="text-sm text-text-muted font-body">
                  <input
                    type="checkbox"
                    checked={
                      results.length > 0 &&
                      selected.size === results.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gold-dim/20 bg-bg-elevated cursor-pointer accent-[#C9A96E] mr-2 align-middle"
                  />
                  Select all
                </span>
                {selected.size > 0 && (
                  <span className="text-sm text-gold font-mono">
                    ({selected.size} selected)
                  </span>
                )}
              </div>
              <button
                onClick={() => {}}
                disabled={selected.size === 0}
                className="gold-shimmer text-ink font-heading font-bold tracking-widest uppercase px-6 py-2 rounded-sm flex items-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Send size={14} />
                Send Selected to CRM
              </button>
            </div>

            {/* Results grid - 2 cols on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((row, i) => (
                <motion.div
                  key={row.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <WoodPanel
                    hover
                    className={`cursor-pointer transition-all duration-200 ${
                      selected.has(row.id)
                        ? 'ring-1 ring-gold/40 shadow-[0_0_16px_rgba(212,168,83,0.12)]'
                        : ''
                    }`}
                    onClick={() => toggleSelect(row.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.has(row.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleSelect(row.id)
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 mt-1 rounded border-gold-dim/20 bg-bg-elevated cursor-pointer accent-[#C9A96E] shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        {/* Address */}
                        <h3 className="font-heading text-parchment text-base font-semibold tracking-wide leading-snug mb-1">
                          {row.address}
                        </h3>

                        {/* Price + Source badge row */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="gold-shimmer-text font-heading text-xl font-bold tracking-wide">
                            {formatPrice(row.price)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_STYLES[row.source]}`}
                          >
                            {row.source}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted font-heading text-xs tracking-wider uppercase">Owner</span>
                            <span className="text-text-primary font-body">{row.owner}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted font-heading text-xs tracking-wider uppercase">DOM</span>
                            <span className="text-text-primary font-mono">{row.dom} days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted font-heading text-xs tracking-wider uppercase">Phone</span>
                            <span className="text-text-dim font-mono text-xs">{row.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-text-muted font-heading text-xs tracking-wider uppercase">Beds/Ba</span>
                            <span className="text-text-primary font-mono">{row.beds}bd / {row.baths}ba</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <span className="text-text-muted font-heading text-xs tracking-wider uppercase">Email</span>
                            <span className="text-text-dim font-body text-xs truncate">{row.email}</span>
                          </div>
                        </div>

                        {/* Individual Send to CRM */}
                        <div className="mt-3 pt-3 border-t border-gold-dim/10 flex justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-heading tracking-wide text-text-dim border border-gold-dim/20 rounded-sm hover:text-gold hover:border-gold/40 transition-colors"
                          >
                            <Send size={12} />
                            Send to CRM
                          </button>
                        </div>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-xs text-text-muted mt-6 font-heading tracking-wide">
              Showing {results.length} targets &mdash; Data sourced from public FSBO platforms
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
