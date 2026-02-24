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

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  pending:   { label: 'Pending Review', color: '#F6C445' },
  qualified: { label: 'Qualified',      color: '#00C6FF' },
  working:   { label: 'In Progress',    color: '#7F00FF' },
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
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-[rgba(200,209,218,0.3)] focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-[rgba(200,209,218,0.5)] mb-1'

const cardCls =
  'bg-[#111B24] rounded-sm border border-[rgba(246,196,69,0.1)] p-5'

const EMPTY_FORM = {
  address: '',
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  howFound: '',
  summary: '',
}

// ─── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionDivider() {
  return (
    <div className="my-4 h-px bg-gradient-to-r from-transparent via-[rgba(246,196,69,0.2)] to-transparent" />
  )
}

function LeftColumn() {
  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      {/* Card 1 — What is a Bird Dog */}
      <motion.div className={cardCls} variants={fadeUp}>
        <h2 className="font-heading font-semibold text-base tracking-wider text-[#F6C445] mb-3">
          What is a Bird Dog?
        </h2>
        <p className="text-sm text-[#C8D1DA] leading-relaxed">
          A bird dog is someone who scouts properties and brings leads to experienced investors.
          You do the legwork — finding motivated sellers who aren't listed anywhere — and we handle
          the deal. When it closes, you get paid.
        </p>
        <p className="text-sm text-[#C8D1DA] leading-relaxed mt-2">
          No license needed. No capital required. Just a good lead and we take it from there.
        </p>

        <SectionDivider />

        <p className={labelCls}>Valid Lead Criteria</p>
        <ul className="flex flex-col gap-2.5 mt-2">
          {VALID_CRITERIA.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <CheckCircle
                size={15}
                className="mt-0.5 shrink-0"
                style={{ color: '#00C6FF' }}
              />
              <span className="text-xs text-[#C8D1DA] leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Card 2 — How Payouts Work */}
      <motion.div className={cardCls} variants={fadeUp}>
        <h2 className="font-heading font-semibold text-base tracking-wider text-[#F6C445] mb-4">
          How Payouts Work
        </h2>
        <ol className="flex flex-col gap-3">
          {PAYOUT_STEPS.map((step) => (
            <li key={step.num} className="flex items-start gap-3">
              <span
                className="font-heading font-bold text-xs tracking-widest shrink-0 mt-0.5"
                style={{ color: '#F6C445' }}
              >
                {step.num}
              </span>
              <span className="text-sm text-[#C8D1DA] leading-snug">{step.text}</span>
            </li>
          ))}
        </ol>
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
      className={cardCls}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h2 className="font-heading font-semibold text-base tracking-wider text-[#F6C445] mb-4">
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
            className="mb-4 px-4 py-3 rounded-sm border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.08)] text-sm text-[#10b981] flex items-center gap-2"
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
          <label className={labelCls}>Owner Email <span className="normal-case text-[rgba(200,209,218,0.3)]">(optional)</span></label>
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
            <option value="" disabled>Select a method…</option>
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
            placeholder="Describe the seller's situation, why they're motivated, condition of the property, asking price or ARV estimate…"
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
                    ? 'border-[#F6C445] bg-[rgba(246,196,69,0.15)]'
                    : 'border-[rgba(246,196,69,0.2)] bg-transparent',
                  'group-hover:border-[rgba(246,196,69,0.5)]',
                ].join(' ')}
              >
                {agreed && (
                  <CheckCircle size={10} style={{ color: '#F6C445' }} />
                )}
              </div>
            </div>
            <span className="text-xs text-[#C8D1DA] leading-snug">
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
            'bg-[#E53935] border border-[rgba(229,57,53,0.4)]',
            'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
            'active:scale-[0.98]',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
          ].join(' ')}
        >
          <Send size={14} />
          {loading ? 'Submitting…' : 'Submit Lead'}
        </button>
      </form>
    </motion.div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-heading font-semibold tracking-widest"
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
      className={cardCls + ' flex flex-col gap-3'}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <h2 className="font-heading font-semibold text-base tracking-wider text-[#F6C445]">
        My Submissions
      </h2>

      <SectionDivider />

      {loading && (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(246,196,69,0.4)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {!loading && leads.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Clock size={24} style={{ color: 'rgba(200,209,218,0.25)' }} />
          <p className="text-xs text-[rgba(200,209,218,0.4)] font-body">No submissions yet</p>
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
                className="p-3 rounded-sm bg-black/30 border border-[rgba(246,196,69,0.08)] hover:border-[rgba(246,196,69,0.18)] transition-colors"
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
                <p className="text-[11px] text-[rgba(200,209,218,0.5)] truncate">
                  {lead.ownerName}
                  {lead.howFound ? ` · ${lead.howFound}` : ''}
                </p>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BirdDog() {
  const { user, profile, firebaseReady } = useAuth()
  const firebaseUid = user?.firebaseUid

  return (
    <div className="min-h-screen bg-bg px-4 py-8 md:px-8">
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="flex items-center gap-3 mb-2">
          <MapPin size={28} style={{ color: '#F6C445' }} />
          <h1
            className="font-display text-3xl tracking-wider neon-shimmer-text"
            style={{ lineHeight: 1.2 }}
          >
            Bird Dog Network
          </h1>
        </div>
        <p className="text-sm text-[#C8D1DA] ml-11 font-body">
          Find motivated sellers. Earn on every deal that closes.
        </p>

        <div className="mt-5 h-px bg-gradient-to-r from-[rgba(246,196,69,0.3)] via-[rgba(0,198,255,0.15)] to-transparent" />
      </motion.div>

      {/* ── 3-column grid ──────────────────────────────── */}
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
            <div className={cardCls + ' flex items-center justify-center py-12'}>
              <div className="text-center">
                <div
                  className="w-6 h-6 rounded-full border-2 animate-spin mx-auto mb-3"
                  style={{ borderColor: 'rgba(246,196,69,0.3)', borderTopColor: '#F6C445' }}
                />
                <p className="text-xs text-[rgba(200,209,218,0.4)]">Connecting…</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — submissions */}
        <div className="lg:col-span-1">
          <MySubmissions firebaseUid={firebaseUid} />
        </div>
      </div>
    </div>
  )
}
