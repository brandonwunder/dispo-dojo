import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle, Send, Clock, ChevronDown, ChevronUp,
  Home, AlertTriangle, DollarSign, TrendingUp, Users, FileText,
} from 'lucide-react'
import {
  collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import { incrementStat } from '../lib/userProfile'
import GlassPanel from '../components/GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  submitted:              { label: 'Submitted',              color: '#9CA3AF' },
  under_review:           { label: 'Under Review',           color: '#00C6FF' },
  contacting_seller:      { label: 'Contacting Seller',      color: '#0E5A88' },
  seller_interested:      { label: 'Seller Interested',      color: '#00D9FF' },
  underwriting:           { label: 'Underwriting',           color: '#F6C445' },
  offer_made:             { label: 'Offer Made',             color: '#FF9500' },
  under_contract:         { label: 'Under Contract',         color: '#7F00FF' },
  closed_paid:            { label: 'Closed / Paid',          color: '#10B981' },
  seller_not_interested:  { label: 'Seller Not Interested',  color: '#E53935' },
  seller_declined_offer:  { label: 'Seller Declined Offer',  color: '#E53935' },
}

const CONDITION_OPTIONS = [
  'Distressed',
  'Vacant',
  'Pre-Foreclosure',
  'Probate',
  'Tired Landlord',
  'Other',
]

const EMPTY_LEAD_FORM = {
  propertyAddress: '',
  ownerName: '',
  ownerContact: '',
  propertyCondition: '',
  askingPrice: '',
  dealReason: '',
}

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Home,
    title: 'Find a Deal',
    desc: 'Spot distressed, vacant, or off-market properties in your area.',
  },
  {
    step: 2,
    icon: Send,
    title: 'Submit the Lead',
    desc: 'Fill out our quick form with the property details and owner info.',
  },
  {
    step: 3,
    icon: DollarSign,
    title: 'Get Paid',
    desc: 'If we close the deal, you earn a bird-dog fee. Simple as that.',
  },
]

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── HeroExplainer ───────────────────────────────────────────────────────────

function HeroExplainer({ showCta, onCtaClick }) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <MapPin
              size={48}
              className="text-cyan"
              style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.5))' }}
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-4xl md:text-5xl text-parchment mb-3"
          style={{ letterSpacing: '-0.03em' }}
        >
          Bird Dog for Dispo Dojo
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-heading text-lg md:text-xl text-text-dim mb-10 tracking-wide"
        >
          Find deals. Submit leads. Get paid.
        </motion.p>

        {/* What is Bird Dogging? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <GlassPanel className="p-6 md:p-8 text-left max-w-2xl mx-auto">
            <h2 className="font-heading text-lg font-semibold text-gold mb-3 tracking-wide uppercase">
              What is Bird Dogging?
            </h2>
            <p className="font-body text-sm text-text-dim leading-relaxed" style={{ lineHeight: '1.7' }}>
              A bird dog is someone who finds potential real estate deals and passes them along to
              investors. You don't need a license, capital, or experience — just sharp eyes and local
              knowledge. When you spot a distressed, vacant, or off-market property, submit it here.
              If our team closes the deal, you earn a bird-dog fee. It's the easiest way to break into
              real estate and start getting paid for your hustle.
            </p>
          </GlassPanel>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-10"
        >
          <GlassPanel className="p-6 md:p-8 max-w-3xl mx-auto">
            <h2 className="font-heading text-lg font-semibold text-gold mb-6 tracking-wide uppercase text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.step} className="flex flex-col items-center text-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                      style={{
                        background: 'rgba(0,198,255,0.1)',
                        border: '1px solid rgba(0,198,255,0.2)',
                      }}
                    >
                      <Icon size={24} className="text-cyan" />
                    </div>
                    <div
                      className="font-heading text-xs font-bold tracking-widest uppercase text-cyan mb-1"
                    >
                      Step {item.step}
                    </div>
                    <h3 className="font-heading text-base font-semibold text-parchment mb-1">
                      {item.title}
                    </h3>
                    <p className="font-body text-xs text-text-dim leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </GlassPanel>
        </motion.div>

        {/* CTA */}
        {showCta && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-heading font-bold text-base uppercase tracking-wider text-white cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
              style={{
                background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
                boxShadow: '0 0 30px rgba(229,57,53,0.4), 0 0 60px rgba(229,57,53,0.15)',
              }}
            >
              <MapPin size={18} />
              Become a Bird Dog
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

// ─── SignupForm ───────────────────────────────────────────────────────────────

function SignupForm({ onComplete, user }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: '',
    email: user?.email || '',
    market: '',
    experienceLevel: 'beginner',
    pitch: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.phone.trim()) e.phone = 'Required'
    if (!form.email.trim()) e.email = 'Required'
    if (!form.market.trim()) e.market = 'Required'
    if (!form.pitch.trim()) e.pitch = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onComplete({
        registered: true,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        market: form.market.trim(),
        experienceLevel: form.experienceLevel,
        pitch: form.pitch.trim(),
        registeredAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Signup failed:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const expLevels = ['beginner', 'intermediate', 'pro']

  return (
    <motion.div
      id="signup-form"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-xl mx-auto px-4 py-10"
    >
      <GlassPanel className="p-6 md:p-8">
        <h2 className="font-heading text-xl font-bold text-gold mb-1 tracking-wide uppercase text-center">
          Sign Up as a Bird Dog
        </h2>
        <p className="font-body text-xs text-text-dim text-center mb-6">
          Fill out the form below to start submitting leads and earning fees.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className={labelCls}>Full Name *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="Your full name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
            {errors.name && <p className="text-crimson text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className={labelCls}>Phone Number *</label>
            <input
              type="tel"
              className={inputCls}
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
            {errors.phone && <p className="text-crimson text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={labelCls}>Email *</label>
            <input
              type="email"
              className={inputCls}
              placeholder="you@email.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
            {errors.email && <p className="text-crimson text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Market */}
          <div>
            <label className={labelCls}>Your Market / Area *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Dallas-Fort Worth, TX"
              value={form.market}
              onChange={(e) => set('market', e.target.value)}
            />
            {errors.market && <p className="text-crimson text-xs mt-1">{errors.market}</p>}
          </div>

          {/* Experience Level */}
          <div>
            <label className={labelCls}>Experience Level</label>
            <div className="flex gap-2 mt-1">
              {expLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => set('experienceLevel', lvl)}
                  className={`px-4 py-2 rounded-sm text-xs font-heading font-semibold uppercase tracking-wider cursor-pointer transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${
                    form.experienceLevel === lvl
                      ? 'bg-cyan/20 text-cyan border border-cyan/40'
                      : 'bg-black/20 text-text-muted border border-gold-dim/10 hover:border-gold-dim/30'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Pitch */}
          <div>
            <label className={labelCls}>Why do you want to bird dog? *</label>
            <textarea
              className={`${inputCls} resize-none h-24`}
              placeholder="Tell us about yourself and why you'd be a great bird dog..."
              maxLength={280}
              value={form.pitch}
              onChange={(e) => set('pitch', e.target.value)}
            />
            <div className="flex justify-between mt-1">
              {errors.pitch && <p className="text-crimson text-xs">{errors.pitch}</p>}
              <span className="text-[10px] text-text-muted ml-auto">
                {form.pitch.length}/280
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-heading font-bold text-sm uppercase tracking-wider text-white cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            style={{
              background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
              boxShadow: '0 0 24px rgba(229,57,53,0.3)',
            }}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle size={16} />
                Register & Start Submitting
              </>
            )}
          </button>
        </form>
      </GlassPanel>
    </motion.div>
  )
}

// ─── StatsBar ────────────────────────────────────────────────────────────────

function StatsBar({ leads }) {
  const total = leads.length
  const rejectedStatuses = ['seller_not_interested', 'seller_declined_offer']
  const active = leads.filter(
    (l) => !rejectedStatuses.includes(l.status) && l.status !== 'closed_paid'
  ).length
  const closed = leads.filter((l) => l.status === 'closed_paid').length
  const decidedLeads = leads.filter(
    (l) => l.status === 'closed_paid' || rejectedStatuses.includes(l.status)
  )
  const rate = decidedLeads.length > 0 ? Math.round((closed / decidedLeads.length) * 100) : 0

  const stats = [
    { label: 'Total Leads', value: total, color: '#00C6FF', icon: FileText },
    { label: 'In Pipeline', value: active, color: '#F6C445', icon: TrendingUp },
    { label: 'Closed Deals', value: closed, color: '#10B981', icon: DollarSign },
    { label: 'Acceptance Rate', value: `${rate}%`, color: '#7F00FF', icon: Users },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
    >
      {stats.map((s) => {
        const Icon = s.icon
        return (
          <motion.div key={s.label} variants={itemVariants}>
            <GlassPanel className="p-4 text-center">
              <Icon
                size={20}
                className="mx-auto mb-2"
                style={{ color: s.color, filter: `drop-shadow(0 0 6px ${s.color}40)` }}
              />
              <div
                className="font-heading text-2xl font-bold"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              <div className="font-body text-[10px] text-text-muted uppercase tracking-wider mt-0.5">
                {s.label}
              </div>
            </GlassPanel>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── SubmitLeadForm ──────────────────────────────────────────────────────────

function SubmitLeadForm({ firebaseUid, profile, user }) {
  const [form, setForm] = useState({ ...EMPTY_LEAD_FORM })
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.propertyAddress.trim()) e.propertyAddress = 'Required'
    if (!form.ownerName.trim()) e.ownerName = 'Required'
    if (!form.ownerContact.trim()) e.ownerContact = 'Required'
    if (!form.propertyCondition) e.propertyCondition = 'Required'
    if (!form.dealReason.trim()) e.dealReason = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const displayName = profile?.birdDogProfile?.name || user?.name || 'Unknown'
      await addDoc(collection(db, 'bird_dog_leads'), {
        userId: firebaseUid,
        userName: displayName,
        propertyAddress: form.propertyAddress.trim(),
        ownerName: form.ownerName.trim(),
        ownerContact: form.ownerContact.trim(),
        propertyCondition: form.propertyCondition,
        askingPrice: form.askingPrice ? Number(form.askingPrice) : null,
        dealReason: form.dealReason.trim(),
        status: 'submitted',
        payout: null,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      await incrementStat(firebaseUid, 'birdDogLeads')
      setForm({ ...EMPTY_LEAD_FORM })
      setErrors({})
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (err) {
      console.error('Lead submission failed:', err)
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-8"
    >
      <GlassPanel className="p-6 md:p-8">
        <h2 className="font-heading text-lg font-bold text-gold mb-1 tracking-wide uppercase">
          Submit a Lead
        </h2>
        <p className="font-body text-xs text-text-dim mb-5">
          Found a potential deal? Fill out the details below.
        </p>

        {/* Success toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5"
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
              }}
            >
              <CheckCircle size={16} className="text-green-400" />
              <span className="font-body text-sm text-green-300">
                Lead submitted successfully! We'll review it shortly.
              </span>
            </motion.div>
          )}
          {submitError && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex items-center gap-2 px-4 py-3 rounded-lg mb-5"
              style={{
                background: 'rgba(229,57,53,0.15)',
                border: '1px solid rgba(229,57,53,0.3)',
              }}
            >
              <AlertTriangle size={16} className="text-crimson" />
              <span className="font-body text-sm text-crimson">{submitError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Property Address */}
          <div>
            <label className={labelCls}>Property Address *</label>
            <input
              type="text"
              className={inputCls}
              placeholder="123 Main St, City, State ZIP"
              value={form.propertyAddress}
              onChange={(e) => set('propertyAddress', e.target.value)}
            />
            {errors.propertyAddress && (
              <p className="text-crimson text-xs mt-1">{errors.propertyAddress}</p>
            )}
          </div>

          {/* Owner Name + Owner Contact (side by side on md) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Owner Name *</label>
              <input
                type="text"
                className={inputCls}
                placeholder="John Doe"
                value={form.ownerName}
                onChange={(e) => set('ownerName', e.target.value)}
              />
              {errors.ownerName && (
                <p className="text-crimson text-xs mt-1">{errors.ownerName}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Owner Contact (Phone / Email) *</label>
              <input
                type="text"
                className={inputCls}
                placeholder="(555) 987-6543 or email"
                value={form.ownerContact}
                onChange={(e) => set('ownerContact', e.target.value)}
              />
              {errors.ownerContact && (
                <p className="text-crimson text-xs mt-1">{errors.ownerContact}</p>
              )}
            </div>
          </div>

          {/* Condition + Asking Price (side by side on md) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Property Condition *</label>
              <select
                className={`${inputCls} cursor-pointer`}
                value={form.propertyCondition}
                onChange={(e) => set('propertyCondition', e.target.value)}
              >
                <option value="">Select condition...</option>
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.propertyCondition && (
                <p className="text-crimson text-xs mt-1">{errors.propertyCondition}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Asking Price (optional)</label>
              <input
                type="number"
                className={inputCls}
                placeholder="e.g. 150000"
                value={form.askingPrice}
                onChange={(e) => set('askingPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Deal Reason */}
          <div>
            <label className={labelCls}>Why is this a good deal? *</label>
            <textarea
              className={`${inputCls} resize-none h-20`}
              placeholder="Owner is motivated, property needs work, below market value, etc."
              value={form.dealReason}
              onChange={(e) => set('dealReason', e.target.value)}
            />
            {errors.dealReason && (
              <p className="text-crimson text-xs mt-1">{errors.dealReason}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-heading font-bold text-sm uppercase tracking-wider text-white cursor-pointer transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
            style={{
              background: 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)',
              boxShadow: '0 0 24px rgba(229,57,53,0.3)',
            }}
          >
            {submitting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={16} />
                Submit Lead
              </>
            )}
          </button>
        </form>
      </GlassPanel>
    </motion.div>
  )
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { label: status, color: '#9CA3AF' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{
        color: style.color,
        background: `${style.color}18`,
        border: `1px solid ${style.color}30`,
      }}
    >
      {style.label}
    </span>
  )
}

// ─── LeadsPipeline ───────────────────────────────────────────────────────────

function LeadsPipeline({ leads, loading }) {
  const [expandedId, setExpandedId] = useState(null)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="inline-block w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <GlassPanel className="p-8 text-center">
        <Clock size={32} className="mx-auto mb-3 text-text-muted" />
        <p className="font-heading text-sm text-text-dim">
          No leads submitted yet. Use the form above to submit your first lead!
        </p>
      </GlassPanel>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      <h2 className="font-heading text-lg font-bold text-gold mb-3 tracking-wide uppercase">
        Your Leads
      </h2>
      {leads.map((lead) => {
        const isExpanded = expandedId === lead.id
        const date = lead.submittedAt?.toDate
          ? lead.submittedAt.toDate().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : '—'

        return (
          <motion.div key={lead.id} variants={itemVariants}>
            <GlassPanel className="overflow-hidden">
              {/* Main row — clickable */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-white/[0.03] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan"
              >
                <Home size={16} className="text-cyan shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-heading text-sm font-semibold text-parchment truncate">
                    {lead.propertyAddress}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-body text-xs text-text-muted truncate">
                      {lead.ownerName}
                    </span>
                    <span className="text-text-muted/40">·</span>
                    <span className="font-body text-xs text-text-muted">
                      {lead.propertyCondition}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-body text-[10px] text-text-muted hidden sm:inline">
                    {date}
                  </span>
                  <StatusBadge status={lead.status} />
                  {isExpanded ? (
                    <ChevronUp size={14} className="text-text-muted" />
                  ) : (
                    <ChevronDown size={14} className="text-text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div
                      className="px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <div>
                        <span className={labelCls}>Owner Contact</span>
                        <p className="font-body text-sm text-parchment">
                          {lead.ownerContact || '—'}
                        </p>
                      </div>
                      <div>
                        <span className={labelCls}>Asking Price</span>
                        <p className="font-body text-sm text-parchment">
                          {lead.askingPrice
                            ? `$${Number(lead.askingPrice).toLocaleString()}`
                            : 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <span className={labelCls}>Submitted</span>
                        <p className="font-body text-sm text-parchment">{date}</p>
                      </div>
                      <div className="sm:col-span-3">
                        <span className={labelCls}>Deal Reason</span>
                        <p className="font-body text-sm text-text-dim leading-relaxed">
                          {lead.dealReason || '—'}
                        </p>
                      </div>
                      {lead.payout != null && (
                        <div className="sm:col-span-3">
                          <span className={labelCls}>Payout</span>
                          <p className="font-heading text-lg font-bold text-green-400">
                            ${Number(lead.payout).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function BirdDog() {
  const { user, profile, firebaseReady, updateProfile } = useAuth()
  const signupRef = useRef(null)
  const [leads, setLeads] = useState([])
  const [leadsLoading, setLeadsLoading] = useState(true)

  const isRegistered = profile?.birdDogProfile?.registered === true
  const firebaseUid = user?.firebaseUid

  // Real-time leads listener
  useEffect(() => {
    if (!firebaseUid || !isRegistered) {
      setLeads([])
      setLeadsLoading(false)
      return
    }

    const q = query(
      collection(db, 'bird_dog_leads'),
      where('userId', '==', firebaseUid),
      orderBy('submittedAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setLeads(items)
        setLeadsLoading(false)
      },
      (err) => {
        console.error('Leads listener error:', err)
        setLeadsLoading(false)
      }
    )

    return unsub
  }, [firebaseUid, isRegistered])

  const scrollToSignup = () => {
    signupRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSignup = async (profileData) => {
    await updateProfile({ birdDogProfile: profileData })
  }

  return (
    <main className="relative min-h-screen">
      {/* Background image layer */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bird-dog-bg.png')" }}
      />
      {/* Gradient overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-bg/60 via-bg/85 to-bg" />

      {/* Hero — always visible */}
      <HeroExplainer
        showCta={firebaseReady && !isRegistered}
        onCtaClick={scrollToSignup}
      />

      {/* Content below hero */}
      <div className="relative">
        {/* Loading state */}
        {!firebaseReady && (
          <div className="flex justify-center py-20">
            <span className="inline-block w-8 h-8 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" />
          </div>
        )}

        {/* Signup form — if not registered */}
        {firebaseReady && !isRegistered && (
          <div ref={signupRef}>
            <SignupForm onComplete={handleSignup} user={user} />
          </div>
        )}

        {/* Dashboard — if registered */}
        {firebaseReady && isRegistered && (
          <div className="max-w-3xl mx-auto px-4 pb-20 pt-4">
            <StatsBar leads={leads} />
            <SubmitLeadForm
              firebaseUid={firebaseUid}
              profile={profile}
              user={user}
            />
            <LeadsPipeline leads={leads} loading={leadsLoading} />
          </div>
        )}
      </div>
    </main>
  )
}
