import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, Search, Download, ChevronDown, ChevronUp,
  Trash2, Phone, Mail, ExternalLink, SlidersHorizontal,
} from 'lucide-react'
import SearchableSelect from '../components/SearchableSelect'
import { US_STATES, CITIES_BY_STATE } from '../data/usLocations'

// ─── Constants ────────────────────────────────────────────────────────────────

const SOURCES = [
  { key: 'fsbo.com',           label: 'FSBO.com',        color: '#F6C445' },
  { key: 'forsalebyowner.com', label: 'ForSaleByOwner',  color: '#22C55E' },
  { key: 'zillow_fsbo',        label: 'Zillow',          color: '#00C6FF' },
  { key: 'realtor_fsbo',       label: 'Realtor',         color: '#E53935' },
  { key: 'craigslist',         label: 'Craigslist',      color: '#A78BFA' },
]

const CONTACT_LABEL = {
  full: 'Full Contact', partial: 'Phone + Name', phone_only: 'Phone Only',
  email_only: 'Email Only', none: 'No Contact', anonymous: 'Anonymous',
}
const CONTACT_COLOR = {
  full: '#22C55E', partial: '#F6C445', phone_only: '#F6C445',
  email_only: '#F6C445', none: '#8A9BB0', anonymous: '#8A9BB0',
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GC = {
  background: 'rgba(11,15,20,0.82)',
  backdropFilter: 'blur(20px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
  border: '1px solid rgba(0,198,255,0.12)',
  borderRadius: '16px',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
}

function CyanLine() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.5), transparent)',
    }} />
  )
}

function formatPrice(p) {
  if (p == null) return '—'
  return '$' + p.toLocaleString()
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FSBOFinder() {
  // Search form
  const [selectedState, setSelectedState] = useState('')
  const [selectedCityZip, setSelectedCityZip] = useState('')
  const [isZipSearch, setIsZipSearch] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [minBeds, setMinBeds] = useState('Any')
  const [minBaths, setMinBaths] = useState('Any')
  const [propertyType, setPropertyType] = useState('All')
  const [maxDom, setMaxDom] = useState('')

  // Search state
  const [phase, setPhase] = useState('idle') // 'idle' | 'loading' | 'complete'
  const [searchId, setSearchId] = useState(null)
  const [searchLabel, setSearchLabel] = useState('')
  const [scrapersStatus, setScrapersStatus] = useState({}) // key → { done, count }
  const [liveCount, setLiveCount] = useState(0)
  const [results, setResults] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')

  // Past searches
  const [pastSearches, setPastSearches] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [expandedResults, setExpandedResults] = useState({}) // id → listings[]

  const esRef = useRef(null)

  // Load past searches on mount
  useEffect(() => { loadPastSearches() }, [])

  async function loadPastSearches() {
    try {
      const r = await fetch('/api/fsbo/searches')
      if (r.ok) {
        const data = await r.json()
        setPastSearches(data.filter(s => s.status === 'complete'))
      }
    } catch {}
  }

  // ── Location helpers ──────────────────────────────────────────────────────

  function handleStateChange(code) {
    setSelectedState(code)
    setSelectedCityZip('')
    setIsZipSearch(false)
  }

  function handleCityZipChange(val) {
    setSelectedCityZip(val)
    setIsZipSearch(/^\d{5}$/.test(val))
  }

  const stateOptions = US_STATES.map(s => ({ value: s.code, label: s.name }))
  const cityOptions = selectedState
    ? (CITIES_BY_STATE[selectedState] || []).map(c => ({ value: c, label: c }))
    : []

  const selectedStateName = US_STATES.find(s => s.code === selectedState)?.name || ''
  const canSearch = Boolean(selectedState && selectedCityZip)

  // ── Search ────────────────────────────────────────────────────────────────

  async function handleSearch() {
    if (!canSearch) return
    if (esRef.current) { esRef.current.close(); esRef.current = null }

    const location = isZipSearch ? selectedCityZip : `${selectedCityZip}, ${selectedState}`
    const location_type = isZipSearch ? 'zip' : 'city_state'
    const label = isZipSearch ? `ZIP ${selectedCityZip}, ${selectedStateName}` : `${selectedCityZip}, ${selectedStateName}`

    setPhase('loading')
    setScrapersStatus({})
    setLiveCount(0)
    setResults([])
    setSearchLabel(label)
    setActiveFilter('all')

    const body = {
      location, location_type,
      state: selectedState,
      city_zip: selectedCityZip,
      min_price: priceMin ? parseInt(priceMin) : null,
      max_price: priceMax ? parseInt(priceMax) : null,
      min_beds: minBeds !== 'Any' ? parseInt(minBeds, 10) : null,
      min_baths: minBaths !== 'Any' ? parseFloat(minBaths) : null,
      property_type: propertyType !== 'All' ? propertyType.toLowerCase().replace(/\s+/g, '_') : null,
      max_days_on_market: maxDom ? parseInt(maxDom) : null,
    }

    try {
      const r = await fetch('/api/fsbo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const { search_id } = await r.json()
      setSearchId(search_id)

      const es = new EventSource(`/api/fsbo/progress/${search_id}`)
      esRef.current = es

      es.onmessage = async (e) => {
        const data = JSON.parse(e.data)
        if (data.type === 'complete' || data.status === 'complete') {
          es.close()
          esRef.current = null
          try {
            const res = await fetch(`/api/fsbo/results/${search_id}?per_page=200`)
            const resData = await res.json()
            setResults(resData.results || [])
          } catch {}
          setPhase('complete')
          loadPastSearches()
        } else {
          if (data.current_source) {
            setScrapersStatus(prev => ({
              ...prev,
              [data.current_source]: { done: true, count: data.source_count ?? 0 },
            }))
          }
          setLiveCount(data.listings_found ?? 0)
        }
      }
      es.onerror = () => {
        es.close()
        esRef.current = null
        setPhase('complete')
        loadPastSearches()
      }
    } catch {
      setPhase('idle')
    }
  }

  // ── Past search expansion ─────────────────────────────────────────────────

  async function toggleExpand(sid) {
    if (expandedId === sid) { setExpandedId(null); return }
    setExpandedId(sid)
    if (!expandedResults[sid]) {
      try {
        const r = await fetch(`/api/fsbo/results/${sid}?per_page=200`)
        const data = await r.json()
        setExpandedResults(prev => ({ ...prev, [sid]: data.results || [] }))
      } catch {
        setExpandedResults(prev => ({ ...prev, [sid]: [] }))
      }
    }
  }

  async function deleteSearch(sid) {
    try {
      await fetch(`/api/fsbo/searches/${sid}`, { method: 'DELETE' })
      setPastSearches(prev => prev.filter(s => s.search_id !== sid))
      if (expandedId === sid) setExpandedId(null)
    } catch {}
  }

  const clearAllSearches = async () => {
    await Promise.allSettled(
      pastSearches.map(s =>
        fetch(`/api/fsbo/searches/${s.search_id}`, { method: 'DELETE' })
      )
    )
    setPastSearches([])
    setResults([])
    setSearchId(null)
  }

  // ── Results filtering ─────────────────────────────────────────────────────

  function applyFilter(list) {
    if (activeFilter === 'phone') return list.filter(r => r.phone)
    if (activeFilter === 'email') return list.filter(r => r.email)
    if (activeFilter === 'contact') return list.filter(r => r.phone || r.email)
    return list
  }

  const filteredResults = applyFilter(results)

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* ── Background layers ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* Layer 0: FSBO background image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/fsbo-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: '82% 30%',
          backgroundRepeat: 'no-repeat',
        }} />
        {/* Layer 1: radial darkening */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 65% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.88) 100%)',
        }} />
        {/* Layer 2: linear fade */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(11,15,20,0.55) 0%, rgba(11,15,20,0.25) 40%, rgba(11,15,20,0.7) 100%)',
        }} />
        {/* Layer 3: left-edge darkening */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(11,15,20,0.75) 0%, transparent 50%)',
        }} />
        {/* Layer 4: bottom fade to page bg */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '200px',
          background: 'linear-gradient(to bottom, transparent, #0B0F14)',
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '720px', margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* ── Hero header ── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'rgba(0,198,255,0.1)',
              border: '1px solid rgba(0,198,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0,198,255,0.2)',
            }}>
              <MapPin
                size={26}
                style={{ color: '#00C6FF', filter: 'drop-shadow(0 0 8px rgba(0,198,255,0.7))' }}
              />
            </div>
          </div>
          <h1 style={{
            fontFamily: 'Onari, serif',
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 400,
            color: '#F4F7FA',
            margin: '0 0 12px',
            textShadow: '0 2px 20px rgba(0,198,255,0.15)',
            letterSpacing: '0.02em',
          }}>
            FSBO Lead Finder
          </h1>
          <p style={{
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            color: '#C8D1DA',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: '480px',
            marginInline: 'auto',
          }}>
            Search For Sale By Owner listings across the US — powered by multiple free data sources.
          </p>
        </div>

        {/* ── Search form ── */}
        <motion.div style={GC} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <CyanLine />

          {/* State + City row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                State
              </label>
              <SearchableSelect
                value={selectedState}
                onChange={handleStateChange}
                options={stateOptions}
                placeholder="Select a state..."
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                City or ZIP
              </label>
              <SearchableSelect
                value={selectedCityZip}
                onChange={handleCityZipChange}
                options={cityOptions}
                placeholder={selectedState ? 'Select city or enter ZIP...' : 'Select state first'}
                disabled={!selectedState}
                zipMode={true}
              />
            </div>
          </div>

          {/* Filters toggle */}
          <button
            type="button"
            onClick={() => setFiltersOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', color: '#8A9BB0',
              fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
              cursor: 'pointer', padding: '4px 0', marginBottom: filtersOpen ? '12px' : '16px',
            }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {filtersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Filters panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid rgba(0,198,255,0.08)',
                  borderRadius: '10px',
                  marginBottom: '16px',
                }}>
                  {[
                    { label: 'Min Price', value: priceMin, set: setPriceMin, type: 'number', placeholder: '200000' },
                    { label: 'Max Price', value: priceMax, set: setPriceMax, type: 'number', placeholder: '600000' },
                    { label: 'Max Days Listed', value: maxDom, set: setMaxDom, type: 'number', placeholder: '90' },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                        {f.label}
                      </label>
                      <input
                        type={f.type}
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        style={{
                          width: '100%', padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,198,255,0.15)',
                          borderRadius: '7px',
                          color: '#F4F7FA',
                          fontSize: '13px',
                          fontFamily: 'DM Sans, sans-serif',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  ))}
                  {[
                    { label: 'Min Beds', value: minBeds, set: setMinBeds, opts: ['Any','1','2','3','4','5+'] },
                    { label: 'Min Baths', value: minBaths, set: setMinBaths, opts: ['Any','1','2','3','4+'] },
                    { label: 'Property Type', value: propertyType, set: setPropertyType, opts: ['All','Single Family','Multi-Family','Condo','Townhouse','Land'] },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ display: 'block', fontFamily: 'Rajdhani, sans-serif', fontSize: '11px', fontWeight: 600, color: '#8A9BB0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>
                        {f.label}
                      </label>
                      <select
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        style={{
                          width: '100%', padding: '8px 10px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(0,198,255,0.15)',
                          borderRadius: '7px',
                          color: '#F4F7FA',
                          fontSize: '13px',
                          fontFamily: 'DM Sans, sans-serif',
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search button */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch || phase === 'loading'}
            className="gold-shimmer"
            style={{
              width: '100%', padding: '12px',
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '15px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              border: 'none', borderRadius: '8px',
              cursor: canSearch && phase !== 'loading' ? 'pointer' : 'not-allowed',
              opacity: canSearch && phase !== 'loading' ? 1 : 0.5,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Search size={15} />
            {phase === 'loading' ? 'Searching...' : 'Search'}
          </button>
        </motion.div>

        {/* ── Loading / progress panel ── */}
        <AnimatePresence>
          {phase === 'loading' && (
            <motion.div
              style={{ ...GC, marginTop: '20px' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <CyanLine />
              <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '13px', color: '#8A9BB0', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '12px', marginTop: 0 }}>
                Searching {searchLabel} across 5 sources...
              </p>

              {/* Shimmer progress bar */}
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '16px' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round((Object.keys(scrapersStatus).length / 5) * 100)}%`,
                  background: 'linear-gradient(110deg, #a67c2e 0%, #d4a853 20%, #fce8a8 40%, #d4a853 60%, #a67c2e 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'progressShimmer 1.4s linear infinite',
                  transition: 'width 0.5s ease',
                  borderRadius: '3px',
                }} />
              </div>

              {/* Live count */}
              <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#C8D1DA', marginBottom: '16px', marginTop: 0 }}>
                <span style={{ color: '#F6C445', fontWeight: 600 }}>{liveCount}</span> listings found so far...
              </p>

              {/* Per-source chips */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
                {SOURCES.map(s => {
                  const st = scrapersStatus[s.key]
                  return (
                    <div key={s.key} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: 'rgba(0,0,0,0.3)',
                      border: `1px solid ${st?.done ? s.color + '40' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '8px',
                      transition: 'border-color 0.3s',
                    }}>
                      <div style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: st?.done ? s.color : 'rgba(255,255,255,0.2)',
                        boxShadow: st?.done ? `0 0 6px ${s.color}` : 'none',
                        flexShrink: 0,
                        animation: !st?.done ? 'spin 1s linear infinite' : 'none',
                      }} />
                      <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '12px', fontWeight: 600, color: '#C8D1DA' }}>{s.label}</span>
                      <span style={{ marginLeft: 'auto', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: st?.done ? s.color : '#8A9BB0' }}>
                        {st?.done ? `${st.count}` : '…'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ── */}
        <AnimatePresence>
          {phase === 'complete' && (
            <motion.div style={{ marginTop: '20px' }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '18px', fontWeight: 700, color: '#F4F7FA', letterSpacing: '0.03em' }}>
                    {results.length} FSBO Listings
                  </span>
                  <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#8A9BB0', marginLeft: '8px' }}>
                    — {searchLabel}
                  </span>
                </div>
                {searchId && (
                  <a
                    href={`/api/fsbo/download/${searchId}?fmt=csv`}
                    download
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 14px',
                      background: 'rgba(0,198,255,0.08)',
                      border: '1px solid rgba(0,198,255,0.25)',
                      borderRadius: '8px',
                      color: '#00C6FF',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    <Download size={13} />
                    Export CSV
                  </a>
                )}
              </div>

              {/* Filter pills */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'phone', label: 'Has Phone' },
                  { key: 'email', label: 'Has Email' },
                  { key: 'contact', label: 'Has Contact' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setActiveFilter(f.key)}
                    style={{
                      padding: '4px 14px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: activeFilter === f.key ? 'rgba(0,198,255,0.5)' : 'rgba(255,255,255,0.1)',
                      background: activeFilter === f.key ? 'rgba(0,198,255,0.15)' : 'rgba(0,0,0,0.2)',
                      color: activeFilter === f.key ? '#00C6FF' : '#C8D1DA',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '12px',
                      cursor: 'pointer',
                      boxShadow: activeFilter === f.key ? '0 0 8px rgba(0,198,255,0.2)' : 'none',
                      transition: 'border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                    }}
                  >
                    {f.label}
                    {f.key === 'all' && ` (${results.length})`}
                  </button>
                ))}
              </div>

              {/* Results grid */}
              {filteredResults.length === 0 ? (
                <div style={{ ...GC, textAlign: 'center', padding: '48px 24px' }}>
                  <CyanLine />
                  <p style={{ color: '#8A9BB0', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', margin: 0 }}>
                    No listings found for this search — try a nearby city or different state.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {filteredResults.map((row, i) => (
                    <ResultCard key={i} row={row} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Past Searches ── */}
        {pastSearches.length > 0 && (
          <motion.div style={{ ...GC, marginTop: '32px' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CyanLine />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', fontWeight: 700, color: '#F4F7FA', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                Past Searches
                <span style={{ marginLeft: '8px', padding: '2px 8px', background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.2)', borderRadius: '12px', color: '#00C6FF', fontSize: '11px' }}>
                  {pastSearches.length}
                </span>
              </h2>
              <button
                onClick={clearAllSearches}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(229,57,53,0.12)',
                  border: '1px solid rgba(229,57,53,0.3)',
                  borderRadius: 8,
                  color: '#E57373',
                  fontSize: 12,
                  fontFamily: 'DM Sans, sans-serif',
                  padding: '4px 12px',
                  cursor: 'pointer',
                }}
              >
                Clear All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pastSearches.map(s => {
                const hasResults = s.total_listings > 0
                const isExpanded = expandedId === s.search_id
                const expRes = expandedResults[s.search_id] || []
                const dateStr = new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

                return (
                  <div key={s.search_id} style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: `1px solid ${isExpanded ? 'rgba(0,198,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px',
                    overflow: 'hidden',
                  }}>
                    {/* Row header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px' }}>
                      <button
                        type="button"
                        onClick={() => toggleExpand(s.search_id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                      >
                        {isExpanded
                          ? <ChevronUp size={14} style={{ color: '#00C6FF', flexShrink: 0 }} />
                          : <ChevronDown size={14} style={{ color: '#8A9BB0', flexShrink: 0 }} />
                        }
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '13px', color: '#F4F7FA' }}>
                          {s.city_zip || s.location}{s.state ? `, ${s.state}` : ''}
                        </span>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A9BB0' }}>{dateStr}</span>
                        <span style={{
                          marginLeft: 'auto',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontFamily: 'Rajdhani, sans-serif',
                          fontWeight: 700,
                          background: hasResults ? 'rgba(74,124,89,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${hasResults ? 'rgba(74,124,89,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: hasResults ? '#4ade80' : '#8A9BB0',
                        }}>
                          {s.total_listings} {s.total_listings === 1 ? 'listing' : 'listings'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSearch(s.search_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#8A9BB0', flexShrink: 0, display: 'flex', alignItems: 'center' }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Expanded results */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            {expRes.length === 0 ? (
                              <p style={{ color: '#8A9BB0', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', marginTop: '12px' }}>No listings stored for this search.</p>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', marginTop: '12px' }}>
                                {expRes.map((row, i) => <ResultCard key={i} row={row} compact />)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes progressShimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

// ─── ResultCard ───────────────────────────────────────────────────────────────

function ResultCard({ row, compact = false }) {
  const source = SOURCES.find(s => s.key === row.source) || { label: row.source || 'Unknown', color: '#8A9BB0' }
  const contactColor = CONTACT_COLOR[row.contact_status] || '#8A9BB0'
  const contactLabel = CONTACT_LABEL[row.contact_status] || row.contact_status || 'Unknown'

  return (
    <div style={{
      background: 'rgba(11,15,20,0.7)',
      border: '1px solid rgba(0,198,255,0.1)',
      borderRadius: '12px',
      padding: compact ? '12px' : '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {/* Address + price */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: compact ? '12px' : '13px', color: '#F4F7FA', fontWeight: 600, lineHeight: 1.4 }}>
          {row.address}
        </span>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: compact ? '14px' : '16px', fontWeight: 700, color: '#F6C445', flexShrink: 0 }}>
          {formatPrice(row.price)}
        </span>
      </div>

      {/* Beds / Baths / DOM */}
      {(row.beds != null || row.baths != null || row.days_on_market != null) && (
        <div style={{ display: 'flex', gap: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#8A9BB0' }}>
          {row.beds != null && <span>{row.beds} bd</span>}
          {row.baths != null && <span>{row.baths} ba</span>}
          {row.days_on_market != null && <span>{row.days_on_market}d listed</span>}
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: source.color + '1A', border: `1px solid ${source.color}40`, color: source.color,
        }}>{source.label}</span>
        <span style={{
          padding: '2px 8px', borderRadius: '12px', fontSize: '10px',
          fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
          background: contactColor + '1A', border: `1px solid ${contactColor}40`, color: contactColor,
        }}>{contactLabel}</span>
      </div>

      {/* Contact info */}
      {(row.phone || row.email) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {row.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C8D1DA' }}>
              <Phone size={11} style={{ color: '#F6C445' }} />
              {row.phone}
            </div>
          )}
          {row.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#C8D1DA' }}>
              <Mail size={11} style={{ color: '#00C6FF' }} />
              {row.email}
            </div>
          )}
        </div>
      )}

      {/* View listing link */}
      {row.listing_url && (
        <a
          href={row.listing_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '12px', color: '#00C6FF',
            textDecoration: 'none', marginTop: '2px',
          }}
        >
          <ExternalLink size={11} />
          View Listing →
        </a>
      )}
    </div>
  )
}
