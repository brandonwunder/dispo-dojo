import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle, Send, Clock,
} from 'lucide-react'
import {
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'
import GlassPanel from '../components/GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:   { label: 'Pending Review', color: '#F6C445' },
  qualified: { label: 'Qualified',      color: '#00C6FF' },
  working:   { label: 'In Progress',    color: '#A855F7' },
  closed:    { label: 'Closed',         color: '#10b981' },
  rejected:  { label: 'Not Qualified',  color: '#E53935' },
}

const HOW_FOUND_OPTIONS = [
  'Driving for Dollars',
  'Door-Knocking',
  'Cold Call',
  'Referral',
  'Other',
]

const VALID_CRITERIA = [
  'Owner is motivated / distressed to sell',
  'Property is NOT currently listed on MLS',
  'Owner is open to below-market or creative offer',
  'Owner contact info has been confirmed',
]

const PAYOUT_STEPS = [
  { num: '01', text: 'Submit your lead below' },
  { num: '02', text: 'Our team reviews within 24–48 hours' },
  { num: '03', text: 'If qualified, we work the deal' },
  { num: '04', text: 'You earn $500–$2,000 on close' },
]

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

const EMPTY_FORM = {
  address: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  howFound: '',
  summary: '',
}

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="my-4 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.07)] to-transparent" />
  )
}

function LeftColumn() {
  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Card 1 — What is a Bird Dog */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-5">
          <h2 className="font-heading font-semibold text-base tracking-wider mb-3" style={{ color: '#F6C445' }}>
            What is a Bird Dog?
          </h2>
          <p className="text-sm text-text-dim leading-relaxed font-body">
            A bird dog is someone who scouts properties and brings leads to experienced investors.
            You do the legwork — finding motivated sellers who aren't listed anywhere — and we handle
            the deal. When it closes, you get paid.
          </p>
          <p className="text-sm text-text-dim leading-relaxed font-body mt-2">
            No license needed. No capital required. Just a good lead and we take it from there.
          </p>

          <SectionDivider />

          <p className={labelCls}>Valid Lead Criteria</p>
          <ul className="flex flex-col gap-2.5 mt-2">
            {VALID_CRITERIA.map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <CheckCircle
                  size={15}
                  className="mt-0.5 shrink-0 text-cyan"
                />
                <span className="text-xs text-text-dim leading-snug font-body">{item}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </motion.div>

      {/* Card 2 — How Payouts Work */}
      <motion.div variants={itemVariants}>
        <GlassPanel className="p-5">
          <h2 className="font-heading font-semibold text-base tracking-wider mb-4" style={{ color: '#F6C445' }}>
            How Payouts Work
          </h2>
          <ol className="flex flex-col gap-3">
            {PAYOUT_STEPS.map((step) => (
              <li key={step.num} className="flex items-start gap-3">
                <span className="font-heading font-bold text-xs tracking-widest shrink-0 mt-0.5 text-gold">
                  {step.num}
                </span>
                <span className="text-sm text-text-dim leading-snug font-body">{step.text}</span>
              </li>
            ))}
          </ol>
        </GlassPanel>
      </motion.div>
    </motion.div>
  )
}

function SubmissionForm({ firebaseUid, profile, user }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function validate() {
    const errs = {}
    if (!form.address.trim())    errs.address   = 'Required'
    if (!form.ownerName.trim())  errs.ownerName = 'Required'
    if (!form.ownerPhone.trim()) errs.ownerPhone = 'Required'
    if (!form.howFound)          errs.howFound  = 'Required'
    if (!form.summary.trim())    errs.summary   = 'Required'
    if (!agreed)                 errs.agreed    = 'You must confirm the lead meets the criteria'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'bird_dog_leads'), {
        ...form,
        userId: firebaseUid,
        authorName: profile?.displayName || user?.name || 'Unknown',
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      await incrementStat(firebaseUid, 'birdDogLeads')

      setForm(EMPTY_FORM)
      setAgreed(false)
      setErrors({})
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      console.error('Bird dog submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassPanel className="p-5">
        <h2 className="font-heading font-semibold text-base tracking-wider mb-4" style={{ color: '#F6C445' }}>
          Submit a Lead
        </h2>

        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mb-4 px-4 py-3 rounded-sm border border-emerald-500/30 bg-emerald-500/8 text-sm text-emerald-400 flex items-center gap-2"
            >
              <CheckCircle size={14} />
              Lead submitted! Our team will review within 24–48 hours.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Property Address */}
          <div>
            <label className={labelCls}>Property Address *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="123 Main St, City, State 00000"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
            />
            {errors.address && (
              <p className="mt-1 text-[10px] text-[#E53935]">{errors.address}</p>
            )}
          </div>

          {/* Owner Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Owner Name *</label>
              <input
                type="text"
                className={inputCls}
                placeholder="John Smith"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
              />
              {errors.ownerName && (
                <p className="mt-1 text-[10px] text-[#E53935]">{errors.ownerName}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Owner Phone *</label>
              <input
                type="tel"
                className={inputCls}
                placeholder="(555) 000-0000"
                value={form.ownerPhone}
                onChange={(e) => set('ownerPhone', e.target.value)}
              />
              {errors.ownerPhone && (
                <p className="mt-1 text-[10px] text-[#E53935]">{errors.ownerPhone}</p>
              )}
            </div>
          </div>

          {/* Owner Email */}
          <div>
            <label className={labelCls}>Owner Email <span className="normal-case text-text-muted">(optional)</span></label>
            <input
              type="email"
              className={inputCls}
              placeholder="owner@email.com"
              value={form.ownerEmail}
              onChange={(e) => set('ownerEmail', e.target.value)}
            />
          </div>

          {/* How did you find it */}
          <div>
            <label className={labelCls}>How did you find it? *</label>
            <select
              className={inputCls + ' cursor-pointer'}
              value={form.howFound}
              onChange={(e) => set('howFound', e.target.value)}
            >
              <option value="" disabled>Select a method...</option>
              {HOW_FOUND_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0B0F14]">{opt}</option>
              ))}
            </select>
            {errors.howFound && (
              <p className="mt-1 text-[10px] text-[#E53935]">{errors.howFound}</p>
            )}
          </div>

          {/* Situation Summary */}
          <div>
            <label className={labelCls}>Situation Summary *</label>
            <textarea
              className={inputCls + ' h-24 resize-none'}
              placeholder="Describe the seller's situation, why they're motivated, condition of the property, asking price or ARV estimate..."
              value={form.summary}
              onChange={(e) => set('summary', e.target.value)}
            />
            {errors.summary && (
              <p className="mt-1 text-[10px] text-[#E53935]">{errors.summary}</p>
            )}
          </div>

          {/* Agree checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked)
                    if (errors.agreed) setErrors((prev) => ({ ...prev, agreed: null }))
                  }}
                />
                <div
                  className={[
                    'w-4 h-4 rounded-sm border flex items-center justify-center transition-colors',
                    agreed
                      ? 'border-gold bg-gold/15'
                      : 'border-gold-dim/20 bg-transparent',
                    'group-hover:border-gold/50',
                  ].join(' ')}
                >
                  {agreed && (
                    <CheckCircle size={10} className="text-gold" />
                  )}
                </div>
              </div>
              <span className="text-xs text-text-dim leading-snug font-body">
                I confirm this lead meets the criteria above and the owner has been contacted
              </span>
            </label>
            {errors.agreed && (
              <p className="mt-1 text-[10px] text-[#E53935] ml-7">{errors.agreed}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={[
              'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
              'bg-[#E53935] border border-[#E53935]/40',
              'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
              'active:scale-[0.98]',
              'transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
            ].join(' ')}
          >
            <Send size={14} />
            {loading ? 'Submitting...' : 'Submit Lead'}
          </button>
        </form>
      </GlassPanel>
    </motion.div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span
      className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-widest"
      style={{
        color: s.color,
        backgroundColor: `${s.color}18`,
        border: `1px solid ${s.color}33`,
      }}
    >
      {s.label}
    </span>
  )
}

function MySubmissions({ firebaseUid }) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!firebaseUid) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'bird_dog_leads'),
      where('userId', '==', firebaseUid),
      orderBy('createdAt', 'desc'),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Bird dog listener error:', err)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [firebaseUid])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassPanel className="p-5">
        <h2 className="font-heading font-semibold text-base tracking-wider" style={{ color: '#F6C445' }}>
          My Submissions
        </h2>

        <SectionDivider />

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {!loading && leads.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Clock size={24} className="text-text-dim/25" />
            <p className="text-xs text-text-dim/40 font-body">No submissions yet</p>
          </div>
        )}

        {!loading && leads.length > 0 && (
          <AnimatePresence initial={false}>
            <div className="flex flex-col gap-2.5">
              {leads.map((lead, i) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                  className="p-3 rounded-sm bg-black/30 border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.14)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p
                      className="text-xs font-heading font-semibold text-parchment truncate flex-1 max-w-[calc(100%-100px)]"
                      title={lead.address}
                    >
                      {lead.address || '—'}
                    </p>
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="text-[11px] text-text-dim/50 truncate font-body">
                    {lead.ownerName}
                    {lead.howFound ? ` · ${lead.howFound}` : ''}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </GlassPanel>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BirdDog() {
  const { user, profile, firebaseReady } = useAuth()
  const firebaseUid = user?.firebaseUid

  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 -z-20 bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/bird-dog-bg.png)',
          backgroundSize: '120%',
          backgroundPosition: 'center 20%',
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 30%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.7) 55%, rgba(11,15,20,0.92) 100%),
            linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.6) 40%, rgba(11,15,20,0.9) 100%)
          `,
        }}
      />

      <div className="min-h-screen px-6 py-16 relative z-10">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="text-center mb-8 max-w-[680px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <MapPin size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              Bird Dog Network
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            Find motivated sellers. Earn on every deal that closes.
          </p>
        </div>
      </motion.div>

      {/* ── 3-column grid ──────────────────────────────── */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Left */}
          <div className="lg:col-span-1">
            <LeftColumn />
          </div>

          {/* Center — form */}
          <div className="lg:col-span-1">
            {firebaseReady ? (
              <SubmissionForm
                firebaseUid={firebaseUid}
                profile={profile}
                user={user}
              />
            ) : (
              <GlassPanel className="p-5">
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div
                      className="w-6 h-6 rounded-full border-2 animate-spin mx-auto mb-3"
                      style={{ borderColor: 'rgba(0,198,255,0.3)', borderTopColor: '#00C6FF' }}
                    />
                    <p className="text-xs text-text-dim/40 font-body">Connecting...</p>
                  </div>
                </div>
              </GlassPanel>
            )}
          </div>

          {/* Right — submissions */}
          <div className="lg:col-span-1">
            <MySubmissions firebaseUid={firebaseUid} />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
