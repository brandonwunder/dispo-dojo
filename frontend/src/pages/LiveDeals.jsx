import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, X, Send, CheckCircle2, MapPin } from 'lucide-react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const DEAL_TYPE_STYLES = {
  'sub-to': { label: 'Sub-To', bg: 'rgba(127,0,255,0.12)', border: 'rgba(127,0,255,0.35)', color: '#A855F7' },
  'seller-finance': { label: 'Seller Finance', bg: 'rgba(246,196,69,0.1)', border: 'rgba(246,196,69,0.3)', color: '#F6C445' },
  'cash': { label: 'Cash', bg: 'rgba(0,198,255,0.08)', border: 'rgba(0,198,255,0.25)', color: '#00C6FF' },
}

function DealTypeBadge({ type }) {
  const s = DEAL_TYPE_STYLES[type] || DEAL_TYPE_STYLES['cash']
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-heading tracking-wider uppercase shrink-0"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
    >
      {s.label}
    </span>
  )
}

function fmt(n) {
  if (!n) return '—'
  return '$' + Number(n).toLocaleString()
}

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
            content: `**Deal Inquiry**\n**Deal:** ${deal.address}, ${deal.city}, ${deal.state}\n**Type:** ${deal.dealType}\n**Assignment Fee:** ${fmt(deal.assignmentFee)}\n**From:** ${name} (${email})\n**Message:** ${message || '(no message)'}`,
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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative z-10 w-full max-w-md wood-panel rounded-sm border border-gold-dim/30 elevation-4 overflow-hidden"
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
    </AnimatePresence>
  )
}

export default function LiveDeals() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'liveDeals'), where('status', '==', 'active'))
    const unsub = onSnapshot(q, (snap) => {
      setDeals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1000px] mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex items-center gap-4 mb-3">
            <div className="hanko-seal w-12 h-12 rounded-full flex items-center justify-center">
              <Briefcase size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl tracking-[0.08em] text-parchment brush-underline">
                Live Deals
              </h1>
              <p className="text-text-dim text-base mt-1 font-body">
                Deals currently under contract — ready to move
              </p>
            </div>
          </div>
        </motion.div>

        <div className="katana-line my-4" />

        {loading ? (
          <div className="text-center py-20 text-text-dim font-heading tracking-wide">Loading deals...</div>
        ) : deals.length === 0 ? (
          <motion.div variants={itemVariants}>
            <WoodPanel>
              <div className="text-center py-12">
                <div className="hanko-seal w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase size={28} className="text-white" />
                </div>
                <h3 className="font-heading text-xl text-gold tracking-wide mb-2">No Active Deals Right Now</h3>
                <p className="text-text-dim text-sm font-body">Check back soon — deals are added as we go under contract.</p>
              </div>
            </WoodPanel>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {deals.map((deal) => (
              <motion.div key={deal.id} variants={itemVariants}>
                <WoodPanel glow className="h-full flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin size={13} className="text-text-dim shrink-0" />
                        <span className="font-heading text-sm text-parchment tracking-wide truncate">{deal.address}</span>
                      </div>
                      <span className="text-text-dim text-xs font-body">{deal.city}, {deal.state}</span>
                    </div>
                    <DealTypeBadge type={deal.dealType} />
                  </div>

                  <div className="mb-3">
                    <span className="text-xs font-heading text-text-dim uppercase tracking-wider">Assignment Fee</span>
                    <div className="font-heading text-2xl text-gold">{fmt(deal.assignmentFee)}</div>
                  </div>

                  <div className="flex gap-4 mb-3 text-xs font-heading text-text-dim tracking-wide">
                    {deal.beds > 0 && <span>{deal.beds} bd</span>}
                    {deal.baths > 0 && <span>{deal.baths} ba</span>}
                    {deal.sqft > 0 && <span>{Number(deal.sqft).toLocaleString()} sqft</span>}
                    {deal.arv > 0 && <span>ARV {fmt(deal.arv)}</span>}
                  </div>

                  {deal.pitch && (
                    <p className="text-text-dim text-xs leading-relaxed font-body mb-4 flex-1">{deal.pitch}</p>
                  )}

                  <button
                    onClick={() => setSelectedDeal(deal)}
                    className="w-full py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_16px_rgba(229,57,53,0.25)] mt-auto"
                  >
                    Inquire About This Deal
                  </button>
                </WoodPanel>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {selectedDeal && (
        <InquiryModal deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </>
  )
}
