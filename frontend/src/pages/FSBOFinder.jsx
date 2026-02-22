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
import ShojiCard from '../components/ShojiCard'
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

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
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
  Zillow: 'bg-gold/[0.08] text-gold-dim border border-gold-dim/[0.15]',
  Craigslist: 'bg-gold/[0.08] text-gold-dim border border-gold-dim/[0.15]',
  'FSBO.com': 'bg-gold/[0.08] text-gold-dim border border-gold-dim/[0.15]',
}

const inputClasses =
  'bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted input-calligraphy focus:outline-none transition-colors font-body'

const selectClasses =
  'bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-3 py-3 text-text-primary input-calligraphy focus:outline-none transition-colors font-body text-sm appearance-none cursor-pointer'

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
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="hanko-seal w-10 h-10 rounded-full flex items-center justify-center">
            <Home size={20} className="text-white" />
          </div>
          <h1 className="font-display text-2xl tracking-[0.06em] text-text-primary brush-underline">
            FSBO Finder
          </h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl mt-3">
          Find For Sale By Owner listings in any city &mdash; powered by free
          data sources
        </p>
      </motion.div>

      <div className="katana-line my-4" />

      {/* Info banner */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 px-5 py-3.5 mb-6 rounded-xl border border-gold/25 bg-gold/[0.04] backdrop-blur-sm">
          <Info size={18} className="text-gold shrink-0" />
          <span className="text-sm text-gold font-heading tracking-wide">
            Results can be sent directly to your CRM pipeline for follow-up
          </span>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div variants={itemVariants}>
        <ShojiCard hover={false} className="p-5 md:p-6 mb-6">
          <form onSubmit={handleSearch}>
            {/* Section label */}
            <p className="font-heading text-[11px] font-semibold tracking-[0.18em] uppercase text-gold-dim mb-3">
              Search Listings
            </p>

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
              <Button
                variant="gold"
                size="md"
                className="shrink-0 gap-2 !px-8"
              >
                <Search size={16} />
                Search
              </Button>
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-gold-dim/[0.15] mt-3">
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
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </ShojiCard>
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
            <ShojiCard hover={false} className="p-8">
              <div className="flex flex-col items-center gap-4">
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
                    Searching listings...
                  </span>
                </div>
              </div>
            </ShojiCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty / Default State */}
      {!loading && !results && (
        <motion.div variants={itemVariants}>
          <ShojiCard hover={false} className="p-16">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <Home size={64} className="text-gold-dim" strokeWidth={1.2} />
              <p className="text-text-dim text-lg font-heading tracking-wide max-w-md">
                The scroll is empty &mdash; enter a city or ZIP code to find FSBO listings
              </p>
              <p className="text-text-muted text-sm font-body">
                We search Zillow, Craigslist, FSBO.com, and more
              </p>
            </div>
          </ShojiCard>
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
                <h2 className="font-heading text-lg font-semibold tracking-wide text-text-primary">
                  {results.length} Results Found
                </h2>
                {selected.size > 0 && (
                  <span className="text-sm text-text-muted font-mono">
                    ({selected.size} selected)
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={selected.size === 0}
                className="gap-2"
              >
                <Send size={14} />
                Send Selected to CRM
              </Button>
            </div>

            {/* Results table */}
            <ShojiCard hover={false} className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-gold-dim/[0.15]">
                      <th className="px-4 py-3.5 text-left">
                        <input
                          type="checkbox"
                          checked={
                            results.length > 0 &&
                            selected.size === results.length
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-gold-dim/[0.15] bg-bg-elevated text-gold focus:ring-gold focus:ring-offset-0 cursor-pointer accent-[#C9A96E]"
                        />
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Address
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Price
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Owner Name
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Phone
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Email
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Source
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        DOM
                      </th>
                      <th className="px-4 py-3.5 text-left font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Beds/Baths
                      </th>
                      <th className="px-4 py-3.5 text-right font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        className={`
                          border-b border-gold-dim/[0.08] transition-colors duration-200
                          hover:bg-gold/[0.03]
                          ${selected.has(row.id) ? 'bg-gold/[0.06]' : ''}
                        `}
                      >
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={selected.has(row.id)}
                            onChange={() => toggleSelect(row.id)}
                            className="w-4 h-4 rounded border-gold-dim/[0.15] bg-bg-elevated text-gold focus:ring-gold focus:ring-offset-0 cursor-pointer accent-[#C9A96E]"
                          />
                        </td>
                        <td className="px-4 py-3.5 text-text-primary font-medium whitespace-nowrap">
                          {row.address}
                        </td>
                        <td className="px-4 py-3.5 text-gold font-mono font-semibold whitespace-nowrap">
                          {formatPrice(row.price)}
                        </td>
                        <td className="px-4 py-3.5 text-text-primary whitespace-nowrap">
                          {row.owner}
                        </td>
                        <td className="px-4 py-3.5 text-text-dim font-mono whitespace-nowrap">
                          {row.phone}
                        </td>
                        <td className="px-4 py-3.5 text-text-dim whitespace-nowrap">
                          {row.email}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SOURCE_STYLES[row.source]}`}
                          >
                            {row.source}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-text-dim font-mono whitespace-nowrap">
                          {row.dom} days
                        </td>
                        <td className="px-4 py-3.5 text-text-dim font-mono whitespace-nowrap">
                          {row.beds}bd / {row.baths}ba
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <Button variant="outline" size="sm" className="gap-1.5 !px-3 !py-1 !text-xs">
                            <Send size={12} />
                            Send to CRM
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ShojiCard>

            {/* Footer note */}
            <p className="text-center text-xs text-text-muted mt-4 font-heading tracking-wide">
              Showing {results.length} listings &mdash; Data sourced from public FSBO platforms
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
