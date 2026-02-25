import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Target, CheckCircle2 } from 'lucide-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import GlassPanel from '../components/GlassPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const PROPERTY_TYPES = ['SFR', 'Duplex', 'Triplex', 'Multi', 'Land', 'Commercial']
const DEAL_TYPES = ['Sub-To', 'Seller Finance', 'Cash', 'Creative', 'Novation']

const inputCls =
  'w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'
const labelCls = 'block text-xs font-heading text-text-dim tracking-widest uppercase mb-1.5'

export default function BuyBoxes() {
  const { user } = useAuth()
  const [saved, setSaved] = useState(null)
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [markets, setMarkets] = useState('')
  const [propertyTypes, setPropertyTypes] = useState([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [dealTypes, setDealTypes] = useState([])
  const [closeTimeline, setCloseTimeline] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (!user?.firebaseUid) return
    getDoc(doc(db, 'users', user.firebaseUid)).then((snap) => {
      if (snap.exists() && snap.data().buyBox) {
        const bb = snap.data().buyBox
        setSaved(bb)
        setMarkets(bb.markets?.join(', ') || '')
        setPropertyTypes(bb.propertyTypes || [])
        setMinPrice(bb.minPrice || '')
        setMaxPrice(bb.maxPrice || '')
        setDealTypes(bb.dealTypes || [])
        setCloseTimeline(bb.closeTimeline || '')
        setNotes(bb.notes || '')
      }
    })
  }, [user?.firebaseUid])

  function toggleItem(list, setList, item) {
    setList((prev) => prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item])
  }

  async function handleSubmit() {
    if (!user?.firebaseUid) return
    setSaving(true)
    const buyBox = {
      markets: markets.split(',').map((s) => s.trim()).filter(Boolean),
      propertyTypes,
      minPrice: Number(minPrice) || 0,
      maxPrice: Number(maxPrice) || 0,
      dealTypes,
      closeTimeline,
      notes,
      updatedAt: new Date().toISOString(),
    }
    await updateDoc(doc(db, 'users', user.firebaseUid), { buyBox })
    setSaved(buyBox)
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 3000)
  }

  return (
    <>
    {/* Background Image */}
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/buybox-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 30%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.7) 55%, rgba(11,15,20,0.92) 100%),
          linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.6) 40%, rgba(11,15,20,0.9) 100%)
        `,
      }} />
    </div>

    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[900px] mx-auto relative z-10 px-6 py-16"
    >
      {/* Hero header */}
      <motion.div variants={itemVariants}>
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <Target size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              Buy Boxes
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            Submit your criteria and we'll match you to deals that fit
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left -- Form */}
        <motion.div variants={itemVariants}>
          <GlassPanel className="overflow-hidden">
            {/* Header bar */}
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Your Buy Box Criteria</span>
            </div>
            <div className="p-5">
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Markets / States</label>
                  <input
                    className={inputCls}
                    value={markets}
                    onChange={(e) => setMarkets(e.target.value)}
                    placeholder="TX, FL, Phoenix AZ, Nashville TN"
                  />
                  <p className="text-text-muted text-xs mt-1 font-body">Comma-separated states or metro areas</p>
                </div>

                <div>
                  <label className={labelCls}>Property Types</label>
                  <div className="flex flex-wrap gap-2">
                    {PROPERTY_TYPES.map((pt) => (
                      <button
                        key={pt}
                        onClick={() => toggleItem(propertyTypes, setPropertyTypes, pt)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-heading tracking-wide transition-colors duration-150 ${
                          propertyTypes.includes(pt)
                            ? 'border text-gold'
                            : 'bg-white/5 border border-white/10 text-text-dim hover:border-white/20'
                        }`}
                        style={propertyTypes.includes(pt) ? {
                          background: 'rgba(246,196,69,0.12)',
                          borderColor: 'rgba(246,196,69,0.35)',
                        } : undefined}
                      >
                        {pt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Min Price</label>
                    <input className={inputCls} type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="50000" />
                  </div>
                  <div>
                    <label className={labelCls}>Max Price</label>
                    <input className={inputCls} type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="300000" />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Deal Types</label>
                  <div className="flex flex-wrap gap-2">
                    {DEAL_TYPES.map((dt) => (
                      <button
                        key={dt}
                        onClick={() => toggleItem(dealTypes, setDealTypes, dt)}
                        className={`px-3 py-1.5 rounded-sm text-xs font-heading tracking-wide transition-colors duration-150 ${
                          dealTypes.includes(dt)
                            ? 'border text-cyan'
                            : 'bg-white/5 border border-white/10 text-text-dim hover:border-white/20'
                        }`}
                        style={dealTypes.includes(dt) ? {
                          background: 'rgba(0,198,255,0.1)',
                          borderColor: 'rgba(0,198,255,0.35)',
                        } : undefined}
                      >
                        {dt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Preferred Close Timeline</label>
                  <input className={inputCls} value={closeTimeline} onChange={(e) => setCloseTimeline(e.target.value)} placeholder="14-30 days" />
                </div>

                <div>
                  <label className={labelCls}>Additional Notes</label>
                  <textarea
                    className={inputCls + ' resize-none'}
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any other criteria, deal preferences, or deal-breakers..."
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <motion.div
                      className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : justSaved ? (
                    <><CheckCircle2 size={16} /> Saved!</>
                  ) : (
                    'Save My Buy Box'
                  )}
                </button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Right -- Saved summary */}
        <motion.div variants={itemVariants}>
          {saved ? (
            <GlassPanel className="overflow-hidden">
              {/* Header bar */}
              <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>Your Criteria on File</span>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  {saved.markets?.length > 0 && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Markets</span>
                      <p className="text-parchment text-sm font-body mt-0.5">{saved.markets.join(', ')}</p>
                    </div>
                  )}
                  {saved.propertyTypes?.length > 0 && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Property Types</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {saved.propertyTypes.map((pt) => (
                          <span
                            key={pt}
                            className="px-2 py-0.5 rounded-full text-[11px] font-heading text-gold"
                            style={{
                              background: 'rgba(246,196,69,0.1)',
                              border: '1px solid rgba(246,196,69,0.25)',
                            }}
                          >
                            {pt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(saved.minPrice || saved.maxPrice) && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Price Range</span>
                      <p className="text-parchment text-sm font-body mt-0.5">
                        ${Number(saved.minPrice || 0).toLocaleString()} – ${Number(saved.maxPrice || 0).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {saved.dealTypes?.length > 0 && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Deal Types</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {saved.dealTypes.map((dt) => (
                          <span
                            key={dt}
                            className="px-2 py-0.5 rounded-full text-[11px] font-heading text-cyan"
                            style={{
                              background: 'rgba(0,198,255,0.1)',
                              border: '1px solid rgba(0,198,255,0.25)',
                            }}
                          >
                            {dt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {saved.closeTimeline && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Close Timeline</span>
                      <p className="text-parchment text-sm font-body mt-0.5">{saved.closeTimeline}</p>
                    </div>
                  )}
                  {saved.notes && (
                    <div>
                      <span className="text-xs font-heading text-text-dim tracking-widest uppercase">Notes</span>
                      <p className="text-text-dim text-sm leading-relaxed font-body mt-0.5">{saved.notes}</p>
                    </div>
                  )}
                  {saved.updatedAt && (
                    <p className="text-text-muted text-xs font-body mt-4">
                      Last updated {new Date(saved.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel className="overflow-hidden">
              <div className="p-5">
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold-dim/25 flex items-center justify-center mx-auto mb-4">
                    <Target size={24} style={{ color: '#F6C445' }} />
                  </div>
                  <h3 className="font-heading text-base tracking-wide mb-2" style={{ color: '#F6C445' }}>No Buy Box on File</h3>
                  <p className="text-text-dim text-xs font-body leading-relaxed">
                    Fill out the form and save your criteria. We'll notify you when a deal matches.
                  </p>
                </div>
              </div>
            </GlassPanel>
          )}
        </motion.div>
      </div>
    </motion.div>
    </>
  )
}
