import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, AlertTriangle, ExternalLink, Download, ChevronDown, ArrowRight, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import ShurikenLoader from '../components/ShurikenLoader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:9000'

const PROPERTY_TYPES = ['SFH', 'Duplex', 'Triplex', 'Quadplex', 'Apartment/Condo', 'Townhouse']

// ─── Styling ────────────────────────────────────────────────────────────────

const inputClass =
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(0,198,255,0.18)] rounded-sm px-4 py-3 ' +
  'text-[#F4F7FA] placeholder:text-[#C8D1DA]/40 font-body text-sm ' +
  'focus:outline-none focus:border-[rgba(0,198,255,0.55)] transition-colors w-full'

const labelClass =
  'block font-heading text-[#F6C445]/80 tracking-widest uppercase text-xs font-semibold mb-1.5'

// ─── Address Autocomplete ────────────────────────────────────────────────────

function useAddressAutocomplete(query) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query || query.length < 4) {
      setSuggestions([])
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({
              q: query,
              format: 'json',
              addressdetails: 1,
              limit: 6,
              countrycodes: 'us',
            }),
          { headers: { 'Accept-Language': 'en-US' } }
        )
        const data = await resp.json()
        // Only show results that look like real street addresses
        const filtered = data
          .filter((r) => r.address?.road || r.address?.house_number)
          .map((r) => {
            const a = r.address
            const parts = [
              a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
              a.city || a.town || a.village || a.county,
              a.state,
              a.postcode,
            ].filter(Boolean)
            return { label: parts.join(', '), display: r.display_name }
          })
        setSuggestions(filtered)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 320)
    return () => clearTimeout(timerRef.current)
  }, [query])

  return { suggestions, loading, clear: () => setSuggestions([]) }
}

function AddressAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef(null)
  const { suggestions, loading, clear } = useAddressAutocomplete(focused ? value : '')

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    setOpen(suggestions.length > 0)
  }, [suggestions])

  const handleSelect = (label) => {
    onChange({ target: { value: label } })
    setOpen(false)
    clear()
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#00C6FF]/50 pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="123 Main St, Atlanta, GA 30318"
          className={
            'bg-[rgba(255,255,255,0.04)] border border-[rgba(0,198,255,0.18)] rounded-sm pl-9 pr-4 py-3 ' +
            'text-[#F4F7FA] placeholder:text-[#C8D1DA]/40 font-body text-sm ' +
            'focus:outline-none focus:border-[rgba(0,198,255,0.55)] transition-colors w-full'
          }
          required
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div
              className="w-3.5 h-3.5 rounded-full border-2 border-[#00C6FF]/30 border-t-[#00C6FF] animate-spin"
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 left-0 right-0 mt-1 rounded-sm border border-[rgba(0,198,255,0.18)] overflow-hidden"
            style={{ background: 'rgba(11,15,22,0.97)', backdropFilter: 'blur(16px)' }}
          >
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(s.label)}
                  className="w-full text-left px-4 py-2.5 flex items-start gap-2.5 hover:bg-[rgba(0,198,255,0.08)] transition-colors group"
                >
                  <MapPin
                    size={13}
                    className="text-[#00C6FF]/50 mt-0.5 shrink-0 group-hover:text-[#00C6FF]"
                  />
                  <span className="text-sm text-[#F4F7FA] font-body leading-snug">{s.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SelectInput({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
      >
        {placeholder && (
          <option value="" disabled className="bg-[#0B0F14] text-[#C8D1DA]/60">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0B0F14] text-[#F4F7FA]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#C8D1DA]/50"
      />
    </div>
  )
}

function GlassSection({ title, subtitle, color = '#00C6FF', children, index = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-sm border p-5 mb-4"
      style={{
        background: 'rgba(11,15,20,0.82)',
        backdropFilter: 'blur(12px)',
        borderColor: `${color}22`,
        boxShadow: `0 2px 24px ${color}0D`,
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-1 h-6 rounded-full shrink-0"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}55)` }}
        />
        <div>
          <h3
            className="font-heading text-sm font-bold tracking-widest uppercase"
            style={{ color }}
          >
            {title}
          </h3>
          {subtitle && <p className="text-[#C8D1DA]/55 text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </motion.div>
  )
}

function MoneyCard({ label, monthly, annual, color }) {
  return (
    <div
      className="rounded-sm p-4 flex flex-col gap-1"
      style={{ background: `${color}0D`, border: `1px solid ${color}22` }}
    >
      <p className="font-heading text-xs tracking-widest uppercase" style={{ color: `${color}88` }}>
        {label}
      </p>
      <p className="font-heading text-2xl font-bold" style={{ color }}>
        ${monthly?.toLocaleString() ?? '—'}
        <span className="text-sm font-normal opacity-60">/mo</span>
      </p>
      {annual != null && (
        <p className="text-xs" style={{ color: `${color}70` }}>
          ${annual.toLocaleString()}/yr
        </p>
      )}
    </div>
  )
}

function CompCard({ comp, index }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="rounded-sm border border-[rgba(0,198,255,0.12)] p-4"
      style={{ background: 'rgba(14,90,136,0.10)', backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-heading text-xs text-[#F4F7FA] tracking-wide leading-tight">
          {comp.address || 'Address not available'}
        </p>
        <span className="shrink-0 text-xs text-[#00C6FF] font-heading">{comp.distance_miles}mi</span>
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-[#C8D1DA]/70">
        <span>{comp.beds}bd / {comp.baths}ba</span>
        {comp.sqft > 0 && <span>{comp.sqft.toLocaleString()} sqft</span>}
        {comp.rent_per_sqft > 0 && <span>${comp.rent_per_sqft}/sqft</span>}
        {comp.days_on_market != null && <span>{comp.days_on_market} DOM</span>}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-[#00C6FF]">
          ${comp.monthly_rent.toLocaleString()}<span className="text-sm opacity-60">/mo</span>
        </p>
        {comp.listing_url && (
          <a
            href={comp.listing_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-[#C8D1DA]/50 hover:text-[#00C6FF] transition-colors"
          >
            View <ExternalLink size={10} />
          </a>
        )}
      </div>
    </motion.div>
  )
}

// ─── PDF Generation ──────────────────────────────────────────────────────────

function generatePDF(report, formData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const M = 18
  let y = 20

  const nl = (extra = 4) => { y += extra }

  const hd = (text, size = 14, color = [0, 198, 255]) => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    doc.text(text, M, y)
    nl(size * 0.44 + 2)
  }

  const bd = (text, size = 9, color = [196, 209, 218]) => {
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, W - M * 2)
    doc.text(lines, M, y)
    nl(lines.length * size * 0.4 + 2)
  }

  const kv = (label, value) => {
    doc.setFontSize(8)
    doc.setTextColor(246, 196, 69)
    doc.text(label.toUpperCase() + ':', M, y)
    doc.setTextColor(244, 247, 250)
    doc.text(String(value), M + 42, y)
    nl(6)
  }

  const divider = () => {
    doc.setDrawColor(0, 198, 255, 25)
    doc.line(M, y, W - M, y)
    nl(5)
  }

  // Header
  doc.setFillColor(11, 15, 20)
  doc.rect(0, 0, W, 34, 'F')
  doc.setFontSize(20)
  doc.setTextColor(0, 198, 255)
  doc.text('DISPO DOJO', M, 13)
  doc.setFontSize(11)
  doc.setTextColor(246, 196, 69)
  doc.text('Rent Comps Report', M, 21)
  doc.setFontSize(8)
  doc.setTextColor(200, 209, 218)
  doc.text(report.subject.address, M, 29)
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, W - M, 29, { align: 'right' })
  y = 44

  const e = report.estimates

  // Property
  hd('Property Details', 12, [246, 196, 69])
  divider()
  kv('Address', report.subject.address)
  kv('Beds', formData.beds || '—')
  kv('Baths', formData.baths || '—')
  if (formData.sqft) kv('Sqft', Number(formData.sqft).toLocaleString())
  if (formData.year_built) kv('Year Built', formData.year_built)
  kv('Type', formData.property_type)
  kv('ZIP', report.subject.zip || '—')
  nl(2)

  // Executive Summary
  hd('Executive Summary', 12, [246, 196, 69])
  divider()
  const rows = [
    ['Long-Term Rental', e.ltr_monthly, e.ltr_annual],
    ['Section 8', e.section8_payment_standard, e.section8_annual],
    ['Midterm Rental', e.mtr_monthly, e.mtr_annual],
    ['Short-Term Rental', e.str_monthly_gross, e.str_annual_gross],
  ]
  rows.forEach(([name, monthly, annual]) => {
    doc.setFontSize(9)
    doc.setTextColor(244, 247, 250)
    doc.text(name, M, y)
    doc.setTextColor(0, 198, 255)
    doc.text(monthly ? `$${monthly.toLocaleString()}/mo  ($${annual?.toLocaleString()}/yr)` : '—', M + 52, y)
    nl(6)
  })
  bd(`Recommended Strategy: ${report.recommended_strategy}`, 9, [246, 196, 69])
  nl(2)

  // Comps
  hd('Rental Comps Found', 12, [246, 196, 69])
  divider()
  if (report.comps.length === 0) {
    bd('No comps found within 0.5-mile radius matching your filter criteria.', 9, [200, 150, 100])
  } else {
    report.comps.forEach((c, i) => {
      if (y > 255) { doc.addPage(); y = 20 }
      doc.setFontSize(8)
      doc.setTextColor(244, 247, 250)
      doc.text(`${i + 1}. ${c.address || 'N/A'}`, M, y)
      nl(5)
      doc.setTextColor(0, 198, 255)
      doc.text(`$${c.monthly_rent.toLocaleString()}/mo`, M + 4, y)
      doc.setTextColor(200, 209, 218)
      doc.text(
        `${c.beds}bd/${c.baths}ba  ${c.sqft ? c.sqft.toLocaleString() + ' sqft' : ''}  ${c.distance_miles}mi`,
        M + 32, y
      )
      nl(7)
    })
  }
  nl(2)

  if (y > 220) { doc.addPage(); y = 20 }

  // Section 8
  hd('Section 8 Analysis', 12, [246, 196, 69])
  divider()
  kv('HUD FMR Estimate', `$${e.section8_fmr?.toLocaleString() || '—'}/mo`)
  kv('Payment Standard', `$${e.section8_payment_standard?.toLocaleString() || '—'}/mo`)
  kv('Annual Gross', `$${e.section8_annual?.toLocaleString() || '—'}/yr`)
  if (!report.meta.hud_available) {
    bd('Note: Set HUDUSER_API_TOKEN in .env for exact HUD FMR data (free at huduser.gov).', 8, [200, 150, 100])
  }
  nl(2)

  // MTR
  hd('Midterm Rental (MTR)', 12, [246, 196, 69])
  divider()
  kv('Est. Monthly', `$${e.mtr_monthly?.toLocaleString() || '—'}/mo`)
  kv('Premium vs LTR', `+${e.mtr_premium_pct}%`)
  kv('Annual Gross', `$${e.mtr_annual?.toLocaleString() || '—'}/yr`)
  bd('Targets: Traveling nurses, corporate relocations, construction crews (30–89 day stays).', 8)
  nl(2)

  if (y > 230) { doc.addPage(); y = 20 }

  // STR
  hd('Short-Term Rental (STR)', 12, [246, 196, 69])
  divider()
  kv('Est. Daily Rate', `$${e.str_daily_rate?.toLocaleString() || '—'}/night`)
  kv('Occupancy Assumed', `${Math.round((e.str_occupancy_assumed || 0.72) * 100)}%`)
  kv('Est. Monthly Gross', `$${e.str_monthly_gross?.toLocaleString() || '—'}/mo`)
  kv('Annual Gross', `$${e.str_annual_gross?.toLocaleString() || '—'}/yr`)
  bd('STR figures are formula-derived. Cross-verify with AirDNA or Rabbu for your market.', 8, [200, 150, 100])
  nl(4)

  // Disclaimer footer
  if (y > 250) { doc.addPage(); y = 20 }
  doc.setFillColor(16, 22, 30)
  doc.rect(M, y, W - M * 2, 24, 'F')
  y += 5
  bd('⚠ Free estimation tool. Data sourced from public listings and government APIs.', 8, [246, 196, 69])
  bd('Always cross-verify rental estimates before making investment decisions.', 8, [200, 209, 218])
  bd('Free professional underwriting: dispodojo.com/underwriting', 8, [0, 198, 255])

  doc.save(`rent-comps-${report.subject.zip || 'report'}-${Date.now()}.pdf`)
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function RentComps() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    address: '',
    beds: '3',
    baths: '2',
    sqft: '',
    year_built: '',
    property_type: 'SFH',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.address.trim()) { setError('Please enter a property address.'); return }
    setError('')
    setLoading(true)
    setReport(null)

    const params = new URLSearchParams({
      address: form.address.trim(),
      beds: form.beds || '3',
      baths: form.baths || '2',
      property_type: form.property_type,
    })
    if (form.sqft) params.set('sqft', form.sqft)
    if (form.year_built) params.set('year_built', form.year_built)

    try {
      const resp = await fetch(`${API}/api/rent-comps?${params}`)
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${resp.status}`)
      }
      setReport(await resp.json())
    } catch (err) {
      setError(err.message || 'Failed to fetch comps. Check your address and try again.')
    } finally {
      setLoading(false)
    }
  }

  const e = report?.estimates || {}
  const strategies = report
    ? [
        { label: 'Long-Term Rental',   color: '#00C6FF', monthly: e.ltr_monthly,               annual: e.ltr_annual },
        { label: 'Section 8',          color: '#F6C445', monthly: e.section8_payment_standard,  annual: e.section8_annual },
        { label: 'Midterm Rental',     color: '#7F00FF', monthly: e.mtr_monthly,                annual: e.mtr_annual },
        { label: 'Short-Term Rental',  color: '#E53935', monthly: e.str_monthly_gross,          annual: e.str_annual_gross },
      ]
    : []

  return (
    <div className="relative min-h-screen">

      {/* ── Background image ── */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/rent-comps-bg.png)',
          backgroundSize: '130%',
          backgroundPosition: '60% 35%',
        }}
      />

      {/* ── Premium fade overlay — dark vignette + bottom pull-up ── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% 20%, rgba(6,6,15,0.10) 0%, rgba(6,6,15,0.40) 55%, rgba(6,6,15,0.72) 100%),
            linear-gradient(180deg, rgba(6,6,15,0.08) 0%, rgba(6,6,15,0.30) 35%, rgba(6,6,15,0.68) 70%, rgba(11,15,20,0.92) 100%)
          `,
        }}
      />

      {/* ── Page content ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[860px] mx-auto px-4 pb-16 pt-2"
      >
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0E5A88, rgba(0,198,255,0.25))',
                boxShadow: '0 0 22px rgba(0,198,255,0.28)',
              }}
            >
              <BarChart3 size={20} className="text-[#00C6FF]" />
            </div>
            <div>
              <h1 className="font-display text-4xl text-[#00C6FF]">Rent Comps</h1>
              <p className="text-[#C8D1DA]/60 text-sm font-body">
                Free rental analysis · Section 8 · LTR · MTR · STR
              </p>
            </div>
          </div>
        </div>

        <div className="katana-line mb-6" />

        {/* Disclaimer Banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="rounded-sm border border-[rgba(246,196,69,0.25)] p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3"
          style={{ background: 'rgba(246,196,69,0.06)', backdropFilter: 'blur(10px)' }}
        >
          <AlertTriangle size={17} className="text-[#F6C445] shrink-0" />
          <div className="flex-1 text-sm font-body text-[#C8D1DA]">
            <strong className="text-[#F6C445]">Free estimation tool</strong> — uses scraped public
            rental listings and government APIs. Always cross-verify before investing.
          </div>
          <button
            onClick={() => navigate('/underwriting')}
            className="shrink-0 flex items-center gap-1.5 text-sm font-heading text-[#00C6FF] hover:text-white transition-colors"
          >
            Free Underwriting <ArrowRight size={13} />
          </button>
        </motion.div>

        {/* Input Form */}
        <motion.form
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={1}
          onSubmit={handleSubmit}
          className="rounded-sm border border-[rgba(0,198,255,0.15)] p-6 mb-6"
          style={{ background: 'rgba(11,15,20,0.78)', backdropFilter: 'blur(14px)' }}
        >
          <h2 className="font-heading text-xs tracking-widest uppercase text-[#F6C445]/70 mb-5">
            Property Details
          </h2>

          <div className="mb-4">
            <label className={labelClass}>Property Address *</label>
            <AddressAutocomplete value={form.address} onChange={set('address')} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label className={labelClass}>Bedrooms *</label>
              <input type="number" min="0" max="10" value={form.beds} onChange={set('beds')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bathrooms</label>
              <input type="number" min="0" max="10" step="0.5" value={form.baths} onChange={set('baths')} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Property Type</label>
              <SelectInput value={form.property_type} onChange={set('property_type')} options={PROPERTY_TYPES} />
            </div>
            <div>
              <label className={labelClass}>Sq Footage</label>
              <input type="number" min="0" value={form.sqft} onChange={set('sqft')} placeholder="1,400" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Year Built</label>
              <input type="number" min="1800" max="2030" value={form.year_built} onChange={set('year_built')} placeholder="1995" className={inputClass} />
            </div>
          </div>

          {error && <p className="text-sm text-[#E53935] mb-4 font-body">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-sm font-heading text-sm tracking-widest uppercase text-white transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
            style={{
              background: loading
                ? 'rgba(229,57,53,0.35)'
                : 'linear-gradient(135deg, #E53935, #B3261E)',
              boxShadow: loading ? 'none' : '0 4px 22px rgba(229,57,53,0.32)',
            }}
          >
            {loading ? 'Searching Comps…' : 'Generate Rent Comps Report'}
          </button>
        </motion.form>

        {/* Loading */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-12"
            >
              <ShurikenLoader size={48} />
              <p className="font-heading text-[#C8D1DA] tracking-widest text-sm uppercase">
                Pulling rental comps…
              </p>
              <p className="text-[#C8D1DA]/40 text-xs text-center max-w-xs font-body">
                Searching HomeHarvest listings, checking neighborhood boundaries, fetching Section 8 data…
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Output */}
        <AnimatePresence>
          {report && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Executive Summary */}
              <GlassSection
                title="Executive Summary"
                subtitle={`${report.comps.length} comp${report.comps.length !== 1 ? 's' : ''} found · Confidence: ${e.ltr_confidence || 'low'}`}
                color="#F6C445"
                index={0}
              >
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {strategies.map((s) => (
                    <MoneyCard key={s.label} label={s.label} monthly={s.monthly} annual={s.annual} color={s.color} />
                  ))}
                </div>
                <div
                  className="rounded-sm px-4 py-3 flex items-center gap-2"
                  style={{ background: 'rgba(246,196,69,0.07)', border: '1px solid rgba(246,196,69,0.18)' }}
                >
                  <span className="text-[#F6C445] text-base">★</span>
                  <span className="font-heading text-sm text-[#F4F7FA]">
                    Recommended: <strong className="text-[#F6C445]">{report.recommended_strategy}</strong>
                  </span>
                </div>
              </GlassSection>

              {/* Rental Comps */}
              <GlassSection
                title="Rental Comps"
                subtitle="0.5mi radius · same neighborhood · active within 90 days"
                color="#00C6FF"
                index={1}
              >
                {report.comps.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-[#C8D1DA]/55 text-sm font-body">
                      No comps found within 0.5-mile radius matching your criteria.
                    </p>
                    <p className="text-[#C8D1DA]/35 text-xs mt-1">
                      Try a broader address or relax the sqft / year-built filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {report.comps.map((c, i) => <CompCard key={i} comp={c} index={i} />)}
                  </div>
                )}
              </GlassSection>

              {/* Section 8 */}
              <GlassSection title="Section 8 Analysis" subtitle="HUD Fair Market Rents" color="#F6C445" index={2}>
                {!report.meta.hud_available && (
                  <p className="text-xs text-[#F6C445]/55 mb-3 font-body">
                    Tip: Set <code className="text-[#00C6FF]">HUDUSER_API_TOKEN</code> in your .env for exact HUD data (free at huduser.gov).
                    Showing market-based estimate.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <MoneyCard label="FMR Estimate" monthly={e.section8_fmr} annual={null} color="#F6C445" />
                  <MoneyCard label="Payment Standard" monthly={e.section8_payment_standard} annual={e.section8_annual} color="#F6C445" />
                </div>
                {report.hud && <p className="text-xs text-[#C8D1DA]/50 font-body">Area: {report.hud.area_name}</p>}
                <div className="mt-3 space-y-1 text-xs text-[#C8D1DA]/65 font-body">
                  <p>✓ Guaranteed monthly rent from housing authority</p>
                  <p>✓ Long-term tenants, lower turnover costs</p>
                  <p>✗ Property must pass HQS inspection annually</p>
                  <p>✗ Below-market rate in some high-demand areas</p>
                </div>
              </GlassSection>

              {/* MTR */}
              <GlassSection title="Midterm Rental (MTR)" subtitle="30–89 day furnished stays" color="#7F00FF" index={3}>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <MoneyCard label="Est. Monthly" monthly={e.mtr_monthly} annual={e.mtr_annual} color="#7F00FF" />
                  <div
                    className="rounded-sm p-4 flex flex-col gap-1"
                    style={{ background: 'rgba(127,0,255,0.06)', border: '1px solid rgba(127,0,255,0.18)' }}
                  >
                    <p className="font-heading text-xs tracking-widest uppercase text-[#7F00FF]/65">Premium vs LTR</p>
                    <p className="font-heading text-2xl font-bold text-[#7F00FF]">+{e.mtr_premium_pct}%</p>
                  </div>
                </div>
                <p className="text-xs text-[#C8D1DA]/60 font-body">
                  Target tenants: Traveling nurses · Corporate relocations · Construction crews
                </p>
                <p className="text-xs text-[#C8D1DA]/40 font-body mt-1">
                  Platforms: Furnished Finder · CHBO · Airbnb Monthly Stays
                </p>
              </GlassSection>

              {/* STR */}
              <GlassSection title="Short-Term Rental (STR)" subtitle="Nightly · Formula-derived estimate" color="#E53935" index={4}>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  <MoneyCard label="Est. Daily Rate" monthly={e.str_daily_rate} annual={null} color="#E53935" />
                  <MoneyCard label="Monthly Gross" monthly={e.str_monthly_gross} annual={null} color="#E53935" />
                  <div
                    className="rounded-sm p-4 flex flex-col gap-1"
                    style={{ background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.18)' }}
                  >
                    <p className="font-heading text-xs tracking-widest uppercase text-[#E53935]/65">Occupancy</p>
                    <p className="font-heading text-2xl font-bold text-[#E53935]">
                      {Math.round((e.str_occupancy_assumed || 0.72) * 100)}%
                    </p>
                    <p className="text-xs text-[#E53935]/50">assumed avg</p>
                  </div>
                </div>
                <p className="text-xs text-[#E53935]/65 font-body">
                  ⚠ STR figures are formula-derived — no free Airbnb API exists. Cross-verify
                  with AirDNA, Rabbu, or Inside Airbnb.
                </p>
              </GlassSection>

              {/* Strategy Comparison */}
              <GlassSection title="Strategy Comparison" subtitle="Side-by-side overview" color="#00C6FF" index={5}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-body">
                    <thead>
                      <tr className="border-b border-[rgba(0,198,255,0.1)]">
                        {['Strategy', 'Monthly', 'Annual', 'Risk'].map((h, i) => (
                          <th
                            key={h}
                            className={`py-2 font-heading text-xs uppercase tracking-widest text-[#C8D1DA]/50 ${i === 0 ? 'text-left pr-4' : i === 3 ? 'text-right' : 'text-right pr-4'}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'Long-Term Rental',  monthly: e.ltr_monthly,              annual: e.ltr_annual,          risk: 'Low',  color: '#00C6FF' },
                        { name: 'Section 8',         monthly: e.section8_payment_standard, annual: e.section8_annual,     risk: 'Low',  color: '#F6C445' },
                        { name: 'Midterm Rental',    monthly: e.mtr_monthly,              annual: e.mtr_annual,          risk: 'Med',  color: '#7F00FF' },
                        { name: 'Short-Term Rental', monthly: e.str_monthly_gross,        annual: e.str_annual_gross,    risk: 'High', color: '#E53935' },
                      ].map((row) => (
                        <tr
                          key={row.name}
                          className={`border-b border-[rgba(0,198,255,0.06)] ${row.name === report.recommended_strategy ? 'bg-[rgba(246,196,69,0.04)]' : ''}`}
                        >
                          <td className="py-2.5 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                              <span className="text-[#F4F7FA]">{row.name}</span>
                              {row.name === report.recommended_strategy && (
                                <span className="text-[10px] text-[#F6C445]">★ Best</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 pr-4 text-right font-heading" style={{ color: row.color }}>
                            ${row.monthly?.toLocaleString() ?? '—'}
                          </td>
                          <td className="py-2.5 pr-4 text-right text-[#C8D1DA]/60">
                            ${row.annual?.toLocaleString() ?? '—'}
                          </td>
                          <td className={`py-2.5 text-right text-xs font-heading ${
                            row.risk === 'Low' ? 'text-green-400' : row.risk === 'Med' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {row.risk}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassSection>

              {/* Underwriting CTA */}
              <motion.div
                variants={fadeUp}
                custom={6}
                className="rounded-sm border border-[rgba(0,198,255,0.18)] p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ background: 'rgba(14,90,136,0.10)', backdropFilter: 'blur(12px)' }}
              >
                <div className="flex-1">
                  <p className="font-heading text-sm text-[#F4F7FA] mb-1">Want a full professional analysis?</p>
                  <p className="text-xs text-[#C8D1DA]/55 font-body">
                    Our free underwriting service covers ARV, repair costs, deal structure, and expert review.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/underwriting')}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-sm font-heading text-sm tracking-wide text-white transition-all hover:opacity-90"
                  style={{
                    background: 'linear-gradient(135deg, #E53935, #B3261E)',
                    boxShadow: '0 4px 18px rgba(229,57,53,0.28)',
                  }}
                >
                  Free Underwriting <ArrowRight size={14} />
                </button>
              </motion.div>

              {/* Download PDF */}
              <motion.button
                variants={fadeUp}
                custom={7}
                initial="hidden"
                animate="visible"
                onClick={() => generatePDF(report, form)}
                className="w-full py-4 rounded-sm font-heading text-sm tracking-widest uppercase flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, #F6C445, #D4A017)',
                  color: '#0B0F14',
                  boxShadow: '0 4px 22px rgba(246,196,69,0.32)',
                }}
              >
                <Download size={16} />
                Download PDF Report
              </motion.button>

              <p className="text-center text-xs text-[#C8D1DA]/25 font-body mt-4">
                Data: HomeHarvest (Realtor.com) · HUD FMR API · OpenStreetMap
                {' · '}Generated {new Date().toLocaleDateString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
