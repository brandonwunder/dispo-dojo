import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, X, Send, CheckCircle2, MapPin, BedDouble, Bath, Ruler, TrendingUp, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

/* ─── Deal Type Styles ───────────────────────────────────────────────────────── */

const DEAL_TYPE_STYLES = {
  'sub-to': { label: 'Subject-To', bg: 'rgba(127,0,255,0.15)', border: 'rgba(127,0,255,0.4)', color: '#A855F7', glow: 'rgba(127,0,255,0.25)' },
  'cash': { label: 'Cash Deal', bg: 'rgba(0,198,255,0.12)', border: 'rgba(0,198,255,0.35)', color: '#00C6FF', glow: 'rgba(0,198,255,0.25)' },
  'stack': { label: 'Stack Method', bg: 'rgba(246,196,69,0.12)', border: 'rgba(246,196,69,0.35)', color: '#F6C445', glow: 'rgba(246,196,69,0.25)' },
  'seller-finance': { label: 'Seller Finance', bg: 'rgba(246,196,69,0.1)', border: 'rgba(246,196,69,0.3)', color: '#F6C445', glow: 'rgba(246,196,69,0.2)' },
}

function DealTypeBadge({ type, size = 'sm' }) {
  const s = DEAL_TYPE_STYLES[type] || DEAL_TYPE_STYLES['cash']
  const cls = size === 'lg'
    ? 'px-3.5 py-1 text-xs'
    : 'px-2.5 py-0.5 text-[11px]'
  return (
    <span
      className={`inline-flex items-center rounded-full font-heading tracking-wider uppercase shrink-0 ${cls}`}
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, boxShadow: `0 0 12px ${s.glow}` }}
    >
      {s.label}
    </span>
  )
}

function fmt(n) {
  if (!n) return '—'
  return '$' + Number(n).toLocaleString()
}

/* ─── 3 Example Deals ────────────────────────────────────────────────────────── */

const SAMPLE_DEALS = [
  {
    id: 'sample-subto',
    address: '4217 Magnolia Creek Dr',
    city: 'San Antonio',
    state: 'TX',
    zip: '78245',
    dealType: 'sub-to',
    assignmentFee: 12000,
    arv: 285000,
    purchasePrice: 215000,
    beds: 4,
    baths: 2,
    sqft: 1850,
    yearBuilt: 2018,
    status: 'active',
    image: 'https://placehold.co/600x400/1a2332/334155?text=4217+Magnolia+Creek+Dr',
    pitch: 'Assumable VA loan at 2.75% — seller is relocating for work and needs a fast, clean exit. Property is in great condition with a new roof (2024) and updated kitchen.',
    highlights: [
      'Assumable VA loan at 2.75% fixed rate',
      'New roof installed 2024',
      'Updated kitchen with granite counters',
      'Seller motivated — relocating out of state',
    ],
  },
  {
    id: 'sample-cash',
    address: '1903 Ridgewood Ln',
    city: 'Tampa',
    state: 'FL',
    zip: '33612',
    dealType: 'cash',
    assignmentFee: 8500,
    arv: 210000,
    purchasePrice: 145000,
    beds: 3,
    baths: 2,
    sqft: 1320,
    yearBuilt: 1994,
    status: 'active',
    image: 'https://placehold.co/600x400/1a2332/334155?text=1903+Ridgewood+Ln',
    pitch: 'Probate property — estate is motivated. Needs cosmetic rehab (~$15K). Strong rental area with $1,800/mo market rent. Perfect for a buy-and-hold investor.',
    highlights: [
      'Probate sale — estate motivated to close fast',
      'Cosmetic rehab only (~$15K estimated)',
      'Market rent $1,800/mo in this area',
      'Close in 14 days — no financing contingencies',
    ],
  },
  {
    id: 'sample-stack',
    address: '762 Birchwood Ave',
    city: 'Phoenix',
    state: 'AZ',
    zip: '85041',
    dealType: 'stack',
    assignmentFee: 15000,
    arv: 315000,
    purchasePrice: 238000,
    beds: 3,
    baths: 2.5,
    sqft: 1640,
    yearBuilt: 2012,
    status: 'active',
    image: 'https://placehold.co/600x400/1a2332/334155?text=762+Birchwood+Ave',
    pitch: 'Layered equity + DOM + price reduction signals. Seller has been on market 90+ days with two price drops. Open to creative structure — Sub-To with seller carry on the gap.',
    highlights: [
      '90+ days on market with 2 price reductions',
      'Stacked signals: equity + DOM + price drops',
      'Open to creative terms — hybrid structure',
      'Strong neighborhood with rising values',
    ],
  },
]

/* ─── Detail Modal ───────────────────────────────────────────────────────────── */

function DetailModal({ deal, onClose, onInquire }) {
  const s = DEAL_TYPE_STYLES[deal.dealType] || DEAL_TYPE_STYLES['cash']

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm border border-gold-dim/25"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0B0F14 100%)' }}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Image Header */}
        <div className="relative h-52 overflow-hidden">
          <img
            src={deal.image || `https://placehold.co/600x400/1a2332/334155?text=${encodeURIComponent(deal.address)}`}
            alt={deal.address}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-[#0B0F14]/40 to-transparent" />
          <div className="absolute inset-0 mix-blend-multiply" style={{ background: `linear-gradient(135deg, ${s.color}22, transparent 60%)` }} />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border border-white/10 flex items-center justify-center text-text-dim hover:text-parchment hover:bg-black/70 transition-colors"
          >
            <X size={16} />
          </button>

          {/* Badge + Address overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <DealTypeBadge type={deal.dealType} size="lg" />
            <h2 className="font-heading text-xl text-parchment tracking-wide mt-2">{deal.address}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-text-dim" />
              <span className="text-text-dim text-sm font-body">{deal.city}, {deal.state} {deal.zip || ''}</span>
            </div>
          </div>
        </div>

        {/* Entry Fee Banner */}
        <div
          className="mx-5 -mt-1 rounded-sm border px-4 py-3 flex items-center justify-between"
          style={{ background: s.bg, borderColor: s.border }}
        >
          <div>
            <span className="text-[10px] font-heading tracking-widest uppercase" style={{ color: s.color }}>Total Entry Fee</span>
            <div className="font-heading text-2xl text-parchment" style={{ textShadow: `0 0 20px ${s.glow}` }}>
              {fmt(deal.assignmentFee)}
            </div>
          </div>
          <DollarSign size={28} style={{ color: s.color, opacity: 0.3 }} />
        </div>

        {/* Property Stats */}
        <div className="px-5 mt-5">
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { icon: BedDouble, label: 'Beds', value: deal.beds || '—' },
              { icon: Bath, label: 'Baths', value: deal.baths || '—' },
              { icon: Ruler, label: 'Sqft', value: deal.sqft ? Number(deal.sqft).toLocaleString() : '—' },
              { icon: TrendingUp, label: 'ARV', value: deal.arv ? `$${(deal.arv / 1000).toFixed(0)}K` : '—' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center py-3 rounded-sm border border-gold-dim/10"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <stat.icon size={16} className="text-text-dim mx-auto mb-1.5" />
                <div className="font-heading text-sm text-parchment tracking-wide">{stat.value}</div>
                <div className="text-[10px] font-heading text-text-dim tracking-widest uppercase mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Additional Stats Row */}
          <div className="flex items-center gap-4 mb-5 text-xs">
            {deal.purchasePrice > 0 && (
              <div className="flex items-center gap-1.5">
                <DollarSign size={12} className="text-text-dim" />
                <span className="text-text-dim font-body">Purchase: <span className="text-parchment font-heading">{fmt(deal.purchasePrice)}</span></span>
              </div>
            )}
            {deal.yearBuilt > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-text-dim" />
                <span className="text-text-dim font-body">Built: <span className="text-parchment font-heading">{deal.yearBuilt}</span></span>
              </div>
            )}
          </div>

          <div className="katana-line my-4" />

          {/* Pitch */}
          {deal.pitch && (
            <div className="mb-5">
              <h3 className="text-xs font-heading text-text-dim tracking-widest uppercase mb-2">Deal Overview</h3>
              <p className="text-text-dim text-sm leading-relaxed font-body">{deal.pitch}</p>
            </div>
          )}

          {/* Highlights */}
          {deal.highlights?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-heading text-text-dim tracking-widest uppercase mb-3">Key Highlights</h3>
              <div className="space-y-2">
                {deal.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="shrink-0 mt-0.5" style={{ color: s.color }} />
                    <span className="text-text-dim text-sm font-body leading-relaxed">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={() => onInquire(deal)}
            className="w-full py-3.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_24px_rgba(229,57,53,0.35)] flex items-center justify-center gap-2 mb-5"
          >
            <Send size={14} /> Inquire About This Deal
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Inquiry Modal ──────────────────────────────────────────────────────────── */

function InquiryModal({ deal, onClose }) {
  const { user, profile } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const name = profile?.displayName || user?.name || ''
  const email = user?.email || ''

  async function handleSend() {
    setSending(true)
    const webhookUrl = import.meta.env.VITE_DISCORD_DEALS_WEBHOOK
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**Deal Inquiry**\n**Deal:** ${deal.address}, ${deal.city}, ${deal.state}\n**Type:** ${deal.dealType}\n**Entry Fee:** ${fmt(deal.assignmentFee)}\n**From:** ${name} (${email})\n**Message:** ${message || '(no message)'}`,
          }),
        })
      } catch (err) {
        console.error('Webhook failed:', err)
      }
    }
    setSending(false)
    setSent(true)
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-sm border border-gold-dim/30 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0B0F14 100%)' }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
      >
        <div className="lacquer-bar px-5 py-3 flex items-center justify-between">
          <span className="font-heading text-gold text-sm tracking-widest uppercase">Inquire About Deal</span>
          <button onClick={onClose} className="text-text-dim hover:text-parchment transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6">
          {!sent ? (
            <>
              <p className="text-text-dim text-sm mb-1 font-body">
                <span className="text-parchment font-heading">{deal.address}</span>
              </p>
              <div className="flex items-center gap-2 mb-5">
                <p className="text-text-dim text-xs font-body">{deal.city}, {deal.state}</p>
                <DealTypeBadge type={deal.dealType} />
              </div>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Your Name</label>
                  <input
                    type="text"
                    value={name}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Your Email</label>
                  <input
                    type="text"
                    value={email}
                    readOnly
                    className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">Message (optional)</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any questions or details about your interest..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <><Send size={14} /> Send Inquiry</>
                )}
              </button>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-bamboo/20 border border-bamboo/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={28} className="text-bamboo" />
              </div>
              <h3 className="font-heading text-lg text-gold tracking-wide mb-2">Inquiry Sent</h3>
              <p className="text-text-dim text-sm leading-relaxed mb-5">
                We'll be in touch shortly. Keep an eye on your inbox.
              </p>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment border border-gold-dim/30 hover:bg-gold/10 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Deal Card ──────────────────────────────────────────────────────────────── */

function DealCard({ deal, onClick }) {
  const s = DEAL_TYPE_STYLES[deal.dealType] || DEAL_TYPE_STYLES['cash']

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <div
        className="rounded-sm border border-gold-dim/20 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0E1720 100%)' }}
      >
        {/* Property Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={deal.image || `https://placehold.co/600x400/1a2332/334155?text=${encodeURIComponent(deal.address)}`}
            alt={deal.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0E1720] via-transparent to-transparent" />
          <div className="absolute inset-0 mix-blend-multiply" style={{ background: `linear-gradient(135deg, ${s.color}15, transparent 50%)` }} />

          {/* Deal Type Badge — top left */}
          <div className="absolute top-3 left-3">
            <DealTypeBadge type={deal.dealType} size="lg" />
          </div>

          {/* Address overlay — bottom */}
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-white/70 shrink-0" />
              <span className="font-heading text-sm text-white tracking-wide truncate">{deal.address}</span>
            </div>
            <span className="text-white/50 text-xs font-body ml-[22px]">{deal.city}, {deal.state}</span>
          </div>
        </div>

        {/* Card Body */}
        <div className="px-4 py-4">
          {/* Entry Fee — the main number */}
          <div className="mb-3">
            <span className="text-[10px] font-heading text-text-dim tracking-widest uppercase">Total Entry Fee</span>
            <div className="font-heading text-2xl text-gold mt-0.5" style={{ textShadow: '0 0 20px rgba(246,196,69,0.2)' }}>
              {fmt(deal.assignmentFee)}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 text-xs text-text-dim font-heading tracking-wide mb-4">
            {deal.beds > 0 && <span>{deal.beds} bd</span>}
            {deal.baths > 0 && <span>{deal.baths} ba</span>}
            {deal.sqft > 0 && <span>{Number(deal.sqft).toLocaleString()} sqft</span>}
          </div>

          {/* CTA */}
          <button
            className="w-full py-2.5 rounded-sm font-heading text-xs tracking-widest uppercase flex items-center justify-center gap-2 border transition-colors duration-200"
            style={{
              borderColor: s.border,
              color: s.color,
              background: s.bg,
            }}
          >
            More Details <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */

export default function LiveDeals() {
  const [firestoreDeals, setFirestoreDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailDeal, setDetailDeal] = useState(null)
  const [inquiryDeal, setInquiryDeal] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'liveDeals'), where('status', '==', 'active'))
    const unsub = onSnapshot(q, (snap) => {
      setFirestoreDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  // Merge sample deals with any Firestore deals
  const allDeals = [...SAMPLE_DEALS, ...firestoreDeals]

  function handleInquireFromDetail(deal) {
    setDetailDeal(null)
    setTimeout(() => setInquiryDeal(deal), 200)
  }

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <img
          src="/live-deals-bg.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.15 }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,15,20,0.92) 0%, rgba(11,15,20,0.97) 100%)' }} />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1000px] mx-auto relative z-10"
      >
        {/* Hero header */}
        <motion.div variants={itemVariants}>
          <div className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <Briefcase size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                Live Deals
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              Active deals under contract — click any card for full details
            </p>
          </div>
        </motion.div>

        {/* Active count */}
        <motion.div variants={itemVariants} className="mb-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-bamboo animate-pulse" />
          <span className="text-xs font-heading text-text-dim tracking-widest uppercase">
            {allDeals.length} Active Deal{allDeals.length !== 1 ? 's' : ''}
          </span>
        </motion.div>

        {/* Deal Cards Grid */}
        {loading && firestoreDeals.length === 0 && SAMPLE_DEALS.length === 0 ? (
          <div className="text-center py-20 text-text-dim font-heading tracking-wide">Loading deals...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onClick={() => setDetailDeal(deal)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailDeal && (
          <DetailModal
            deal={detailDeal}
            onClose={() => setDetailDeal(null)}
            onInquire={handleInquireFromDetail}
          />
        )}
      </AnimatePresence>

      {/* Inquiry Modal */}
      <AnimatePresence>
        {inquiryDeal && (
          <InquiryModal deal={inquiryDeal} onClose={() => setInquiryDeal(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
