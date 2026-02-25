import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Info, Download, History, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { jsPDF } from 'jspdf'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import GlassPanel from '../components/GlassPanel'

const API = import.meta.env.VITE_API_URL || 'http://localhost:9000'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const inputCls =
  'w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-xs font-heading text-text-dim tracking-widest uppercase mb-1.5'

function fmt(n) {
  if (n == null || n === '') return '—'
  return '$' + Number(n).toLocaleString()
}

function pct(n) {
  return n != null ? `${n.toFixed(1)}%` : '—'
}

// ─── Address Autocomplete ─────────────────────────────────────────────────────
function useAddressAutocomplete(query_) {
  const [suggestions, setSuggestions] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!query_ || query_.length < 4) { setSuggestions([]); return }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            new URLSearchParams({ q: query_, format: 'json', addressdetails: 1, limit: 5, countrycodes: 'us' }),
          { headers: { 'Accept-Language': 'en-US' } }
        )
        const data = await resp.json()
        setSuggestions(
          data
            .filter((r) => r.address?.road || r.address?.house_number)
            .map((r) => {
              const a = r.address
              return [
                a.house_number && a.road ? `${a.house_number} ${a.road}` : a.road,
                a.city || a.town || a.village || a.county,
                a.state,
                a.postcode,
              ].filter(Boolean).join(', ')
            })
        )
      } catch { setSuggestions([]) }
    }, 350)
    return () => clearTimeout(timerRef.current)
  }, [query_])

  return suggestions
}

// ─── PDF Generator ────────────────────────────────────────────────────────────
function generatePDF(address, inputs, comps, results) {
  const doc = new jsPDF()
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  doc.setFontSize(18)
  doc.text('OFFER COMPARISON', 105, 20, { align: 'center' })
  doc.setFontSize(10)
  doc.text(`Property: ${address}`, 20, 32)
  doc.text(`Generated: ${today}`, 20, 38)
  doc.text('Dispo Dojo — Use this tool when needed.', 20, 44)

  let y = 55
  doc.setFontSize(12)
  doc.text('Side-by-Side Comparison', 20, y); y += 8
  doc.setFontSize(9)

  const rows = [
    ['', 'Our Offer', 'Traditional Sale'],
    ['Gross', fmt(inputs.purchasePrice), fmt(results.listEst)],
    ['Agent Commissions', '$0', `-6% (${fmt(results.agentComm)})`],
    ['Seller Closing Costs', '$0', `-2% (${fmt(results.closingCosts)})`],
    ['Buyer Concessions', '$0', `-1.5% (${fmt(results.concessions)})`],
    ['Inspection Credits', '$0', `-0.75% (${fmt(results.inspectionCredits)})`],
    ['Estimated Net', fmt(inputs.purchasePrice), `${fmt(results.tradNetLow)} – ${fmt(results.tradNetHigh)}`],
    ['Timeline', `${inputs.closeTimeline || 14} days`, `${results.tradTimeline} days`],
    ['Certainty', 'Guaranteed close', 'Contingent'],
  ]

  rows.forEach((row) => {
    doc.text(row[0], 20, y)
    doc.text(row[1], 90, y)
    doc.text(row[2], 145, y)
    y += 6
  })

  if (comps.length > 0) {
    y += 6
    doc.setFontSize(12)
    doc.text('Market Comps', 20, y); y += 8
    doc.setFontSize(9)
    doc.text(['Address', 'List', 'Sold', '% Under', 'DOM'].join('   '), 20, y); y += 6
    comps.forEach((c) => {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.text([
        (c.address || '').slice(0, 28),
        fmt(c.listPrice),
        fmt(c.soldPrice),
        pct(c.pctUnderList),
        String(c.dom),
      ].join('   '), 20, y)
      y += 6
    })
    y += 4
    doc.text(`Avg % Under List: ${pct(results.avgPctUnderList)}   Avg DOM: ${results.avgDom} days`, 20, y)
  }

  y += 12
  doc.setFontSize(8)
  doc.text(
    'Disclaimer: This comparison is a support tool. Results vary based on market conditions, deal structure, and seller goals.',
    20, y, { maxWidth: 170 }
  )

  doc.save(`offer-comparison-${address.replace(/[^a-z0-9]/gi, '-').slice(0, 30)}.pdf`)
}

// ─── Comparison Calculator ───────────────────────────────────────────────────
function calcResults(inputs, compData) {
  const purchase = Number(inputs.purchasePrice) || 0
  const avgPct = compData?.avgPctUnderList || 0
  const avgDom = compData?.avgDom || 45

  // Estimate list price based on purchase price + market spread
  const listEst = purchase > 0 ? Math.round(purchase / (1 - avgPct / 100)) : 0

  const agentComm = Math.round(listEst * 0.06)
  const closingCosts = Math.round(listEst * 0.02)
  const concessions = Math.round(listEst * 0.015)
  const inspectionCredits = Math.round(listEst * 0.0075)

  const tradNetBase = listEst - agentComm - closingCosts - concessions - inspectionCredits
  const tradNetLow = Math.round(tradNetBase * 0.98)
  const tradNetHigh = Math.round(tradNetBase * 1.01)

  const tradTimeline = avgDom + 45

  return { listEst, agentComm, closingCosts, concessions, inspectionCredits, tradNetLow, tradNetHigh, tradTimeline, avgPctUnderList: avgPct, avgDom }
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function OfferComparison() {
  const { user } = useAuth()
  const firebaseUid = user?.firebaseUid

  // Form state
  const [address, setAddress] = useState('')
  const [addressQuery, setAddressQuery] = useState('')
  const suggestions = useAddressAutocomplete(addressQuery)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [purchasePrice, setPurchasePrice] = useState('')
  const [cashToSeller, setCashToSeller] = useState('')
  const [closeTimeline, setCloseTimeline] = useState('14')
  const [skipInspection, setSkipInspection] = useState(true)
  const [skipAppraisal, setSkipAppraisal] = useState(true)
  const [noRenegotiation, setNoRenegotiation] = useState(true)

  // Comp + results state
  const [comps, setComps] = useState(null)
  const [compError, setCompError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  // History
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  // Load history from Firestore
  useEffect(() => {
    if (!firebaseUid) return
    const q = query(
      collection(db, 'users', firebaseUid, 'comparisons'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [firebaseUid])

  async function handleRun() {
    if (!address || !purchasePrice) return
    setLoading(true)
    setComps(null)
    setResults(null)
    setCompError(null)

    try {
      let compData = null
      try {
        const resp = await fetch(`${API}/api/comps?address=${encodeURIComponent(address)}`)
        if (resp.ok) {
          compData = await resp.json()
          setComps(compData)
        } else {
          setCompError('Could not fetch comps. Comparison will use market estimates.')
        }
      } catch {
        setCompError('Comp pull failed — running comparison without market data.')
      }

      const res = calcResults(inputs, compData)
      setResults(res)

      // Save to Firestore history
      if (firebaseUid) {
        try {
          await addDoc(collection(db, 'users', firebaseUid, 'comparisons'), {
            address,
            inputs,
            comps: compData?.comps || [],
            results: res,
            createdAt: serverTimestamp(),
          })
        } catch (e) {
          console.warn('Could not save comparison history', e)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  function loadHistoryItem(item) {
    setAddress(item.address)
    setAddressQuery(item.address)
    setPurchasePrice(item.inputs?.purchasePrice || '')
    setCashToSeller(item.inputs?.cashToSeller || '')
    setCloseTimeline(item.inputs?.closeTimeline || '14')
    setSkipInspection(item.inputs?.skipInspection ?? true)
    setSkipAppraisal(item.inputs?.skipAppraisal ?? true)
    setNoRenegotiation(item.inputs?.noRenegotiation ?? true)
    setComps(item.comps?.length ? { comps: item.comps, avgPctUnderList: item.results?.avgPctUnderList, avgDom: item.results?.avgDom } : null)
    setResults(item.results || null)
    setShowHistory(false)
  }

  const inputs = { purchasePrice, cashToSeller, closeTimeline, skipInspection, skipAppraisal, noRenegotiation }
  const canRun = address && purchasePrice

  return (
    <>
    {/* Background Image */}
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/offer-comparison-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.3) 0%, rgba(11,15,20,0.6) 55%, rgba(11,15,20,0.88) 100%),
          linear-gradient(180deg, rgba(11,15,20,0.25) 0%, rgba(11,15,20,0.5) 40%, rgba(11,15,20,0.85) 100%)
        `,
      }} />
    </div>

    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1000px] mx-auto relative z-10 px-6 py-16"
    >
      {/* Hero header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <BarChart3 size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              Offer Comparison
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            Our offer vs. the traditional sale — numbers don't lie
          </p>
        </div>
        {history.length > 0 && (
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="flex items-center gap-2 px-4 py-2 rounded-sm font-heading text-xs tracking-widest uppercase text-text-dim border border-[rgba(255,255,255,0.07)] hover:text-parchment hover:border-[rgba(255,255,255,0.14)] transition-colors"
            >
              <History size={14} /> History {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}
      </motion.div>

      {/* Disclaimer Banner */}
      <motion.div variants={itemVariants} className="mb-6">
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-sm border"
          style={{ background: 'rgba(246,196,69,0.05)', borderColor: 'rgba(246,196,69,0.2)' }}
        >
          <Info size={18} className="text-gold shrink-0 mt-0.5" />
          <div>
            <p className="text-parchment text-sm font-heading tracking-wide mb-1">Use this tool when needed.</p>
            <p className="text-text-dim text-xs leading-relaxed font-body">
              This comparison depends on the seller's goals and deal structure. It's a strong support tool for agents to take back to sellers — showing a realistic traditional net vs. a guaranteed, clean close with us.
            </p>
          </div>
        </div>
      </motion.div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <GlassPanel className="overflow-hidden">
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Past Comparisons</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto p-5">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left flex items-center justify-between gap-4 px-3 py-2.5 rounded-sm hover:bg-white/5 transition-colors"
                  >
                    <span className="font-body text-sm text-parchment truncate">{item.address}</span>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-gold font-heading">{fmt(item.inputs?.purchasePrice)} offer</div>
                      <div className="text-xs text-text-muted font-body">
                        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : '—'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <motion.div variants={itemVariants} className="mb-6">
        <GlassPanel className="overflow-hidden">
          <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Deal Details</span>
          </div>
          <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Address with autocomplete */}
            <div className="sm:col-span-2 relative">
              <label className={labelCls}>Property Address</label>
              <input
                className={inputCls}
                value={addressQuery}
                onChange={(e) => { setAddressQuery(e.target.value); setAddress(e.target.value); setShowSuggestions(true) }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="123 Main St, Austin TX 78701"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-sm border shadow-xl overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(11,15,20,0.9)' }}>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => { setAddress(s); setAddressQuery(s); setShowSuggestions(false) }}
                      className="w-full text-left px-3 py-2.5 text-sm text-parchment hover:bg-white/5 transition-colors font-body border-b border-[rgba(255,255,255,0.05)] last:border-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Our Purchase Price</label>
              <input className={inputCls} type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="185000" />
            </div>
            <div>
              <label className={labelCls}>Cash to Seller</label>
              <input className={inputCls} type="number" value={cashToSeller} onChange={(e) => setCashToSeller(e.target.value)} placeholder="10000" />
            </div>
            <div>
              <label className={labelCls}>Close Timeline (days)</label>
              <input className={inputCls} type="number" value={closeTimeline} onChange={(e) => setCloseTimeline(e.target.value)} placeholder="14" />
            </div>

            {/* Checkboxes */}
            <div className="sm:col-span-2">
              <label className={labelCls}>Our Offer Includes</label>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: 'Skip Inspection', state: skipInspection, set: setSkipInspection },
                  { label: 'Skip Appraisal', state: skipAppraisal, set: setSkipAppraisal },
                  { label: 'No Mid-Process Renegotiation', state: noRenegotiation, set: setNoRenegotiation },
                ].map(({ label, state, set }) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={state}
                      onChange={(e) => set(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan"
                    />
                    <span className="text-sm font-body text-text-dim">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleRun}
              disabled={!canRun || loading}
              className="w-full sm:w-auto px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Running Comparison...
                </>
              ) : (
                'Run Comparison'
              )}
            </button>
          </div>
          </div>
        </GlassPanel>
      </motion.div>

      {/* Comp Warning */}
      {compError && (
        <motion.div
          variants={itemVariants}
          className="mb-4 flex items-start gap-2 px-4 py-3 rounded-sm border"
          style={{ background: 'rgba(229,57,53,0.06)', borderColor: 'rgba(229,57,53,0.2)' }}
        >
          <AlertCircle size={15} className="text-crimson shrink-0 mt-0.5" />
          <p className="text-text-dim text-xs font-body">{compError}</p>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Side-by-side comparison */}
            <GlassPanel className="overflow-hidden" style={{ boxShadow: '0 0 30px rgba(0,198,255,0.08)' }}>
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Side-by-Side Comparison</span>
              </div>
              <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <th className="text-left py-2 pr-4 font-heading text-xs text-text-dim tracking-widest uppercase w-1/3"></th>
                      <th className="text-center py-2 px-3 font-heading text-xs tracking-widest uppercase" style={{ color: '#00C6FF' }}>Our Offer</th>
                      <th className="text-center py-2 px-3 font-heading text-xs text-text-dim tracking-widest uppercase">Traditional Sale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                    {[
                      { label: 'Gross', our: fmt(purchasePrice), trad: fmt(results.listEst) + ' (est. list)' },
                      { label: 'Agent Commissions', our: '$0', trad: `−6%  (${fmt(results.agentComm)})` },
                      { label: 'Seller Closing Costs', our: '$0', trad: `−2%  (${fmt(results.closingCosts)})` },
                      { label: 'Buyer Concessions', our: '$0', trad: `−1.5%  (${fmt(results.concessions)})` },
                      { label: 'Inspection Credits', our: '$0', trad: `−0.75%  (${fmt(results.inspectionCredits)})` },
                      { label: 'Appraisal Risk', our: 'None', trad: 'Possible deal fallthrough' },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">{row.label}</td>
                        <td className="py-2.5 px-3 text-center text-parchment font-body text-xs">{row.our}</td>
                        <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">{row.trad}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[rgba(255,255,255,0.07)]">
                      <td className="py-3 pr-4 font-heading text-sm text-parchment tracking-wide">Estimated Net</td>
                      <td className="py-3 px-3 text-center font-heading text-gold text-base">{fmt(purchasePrice)}</td>
                      <td className="py-3 px-3 text-center font-heading text-text-dim text-sm">{fmt(results.tradNetLow)} – {fmt(results.tradNetHigh)}</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">Timeline</td>
                      <td className="py-2.5 px-3 text-center text-cyan font-body text-xs">{closeTimeline || 14} days</td>
                      <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">{results.tradTimeline}+ days</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-4 text-text-dim text-xs font-heading tracking-wide">Certainty</td>
                      <td className="py-2.5 px-3 text-center font-body text-xs">
                        <span className="inline-flex items-center gap-1 text-bamboo"><CheckCircle2 size={12} /> Guaranteed close</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-text-dim font-body text-xs">Contingent</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              </div>
            </GlassPanel>

            {/* Comps table */}
            {comps?.comps?.length > 0 && (
              <GlassPanel className="overflow-hidden">
                <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Market Comps</span>
                </div>
                <div className="p-5">
                <p className="text-text-dim text-xs font-body mb-3">
                  Sold comps near <span className="text-parchment">{address}</span> — avg <span className="text-gold font-heading">{pct(results.avgPctUnderList)}</span> under list, <span className="text-gold font-heading">{results.avgDom} days</span> on market
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Address', 'List Price', 'Sold Price', '% Under List', 'DOM'].map((h) => (
                          <th key={h} className="text-left py-2 pr-4 font-heading text-text-dim tracking-widest uppercase text-[10px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                      {comps.comps.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 pr-4 text-parchment font-body">{c.address || '—'}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{fmt(c.listPrice)}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{fmt(c.soldPrice)}</td>
                          <td className="py-2 pr-4 font-heading" style={{ color: c.pctUnderList > 3 ? '#E53935' : '#F6C445' }}>{pct(c.pctUnderList)}</td>
                          <td className="py-2 pr-4 text-text-dim font-body">{c.dom ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </div>
              </GlassPanel>
            )}

            {/* Download button */}
            <div className="flex justify-end">
              <button
                onClick={() => generatePDF(address, inputs, comps?.comps || [], results)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-gold border border-gold-dim/30 hover:bg-gold/10 hover:border-gold-dim/50 transition-colors duration-200"
              >
                <Download size={15} /> Download PDF
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
    </>
  )
}
