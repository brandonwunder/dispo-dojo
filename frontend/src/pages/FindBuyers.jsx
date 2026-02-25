import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Crown, Rocket, Globe, Zap, Target, TrendingUp, ShieldCheck,
  Building2, Hotel, Home, Landmark, Lock, FileText, CheckCircle2, Upload, X,
} from 'lucide-react'
import jsPDF from 'jspdf'
import GlassShell from '../components/GlassShell'
import GlassPanel from '../components/GlassPanel'

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

// ─── Fake Buyer Data ─────────────────────────────────────────────────────────

const FAKE_BUYERS = [
  { name: 'J. Martinez', state: 'TX', buyBox: '$80k–$150k', types: 'SFR/Duplex', lastActive: '2 days ago' },
  { name: 'R. Thompson', state: 'FL', buyBox: '$120k–$250k', types: 'SFR/Triplex', lastActive: '1 day ago' },
  { name: 'A. Patel', state: 'GA', buyBox: '$60k–$110k', types: 'SFR', lastActive: '5 hours ago' },
  { name: 'M. Williams', state: 'OH', buyBox: '$40k–$90k', types: 'SFR/Multi', lastActive: '3 days ago' },
  { name: 'S. Chen', state: 'CA', buyBox: '$200k–$400k', types: 'Multi/Commercial', lastActive: '1 day ago' },
  { name: 'D. Johnson', state: 'NC', buyBox: '$90k–$180k', types: 'SFR/Land', lastActive: '12 hours ago' },
  { name: 'K. Brown', state: 'TN', buyBox: '$70k–$130k', types: 'SFR/Duplex', lastActive: '4 days ago' },
  { name: 'L. Davis', state: 'AZ', buyBox: '$100k–$200k', types: 'SFR', lastActive: '6 hours ago' },
  { name: 'T. Wilson', state: 'MI', buyBox: '$30k–$75k', types: 'SFR/Multi', lastActive: '2 days ago' },
  { name: 'N. Garcia', state: 'IL', buyBox: '$50k–$120k', types: 'SFR/Duplex', lastActive: '1 day ago' },
  { name: 'P. Anderson', state: 'PA', buyBox: '$80k–$160k', types: 'SFR', lastActive: '8 hours ago' },
  { name: 'C. Taylor', state: 'IN', buyBox: '$45k–$95k', types: 'SFR/Land', lastActive: '3 days ago' },
  { name: 'B. Jackson', state: 'MO', buyBox: '$55k–$110k', types: 'SFR/Multi', lastActive: '2 days ago' },
  { name: 'E. White', state: 'SC', buyBox: '$70k–$140k', types: 'SFR', lastActive: '5 days ago' },
  { name: 'W. Harris', state: 'AL', buyBox: '$40k–$85k', types: 'SFR/Duplex', lastActive: '1 day ago' },
]

// ─── Platform Data ───────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    icon: Rocket,
    name: 'InvestorLift',
    tagline: 'Nationwide verified buyer network',
    desc: '#1 disposition platform for wholesalers. Verified, active buyers matched to your deal instantly.',
    accent: '#00C6FF',
  },
  {
    icon: Users,
    name: 'InvestorBase',
    tagline: 'Curated investor database',
    desc: 'A curated database of active investors with verified proof-of-funds and recent transaction history.',
    accent: '#A855F7',
  },
  {
    icon: Globe,
    name: 'CreativeListing.com',
    tagline: 'Creative finance marketplace',
    desc: 'The marketplace for Sub-To, seller finance, wraps, and other creative deal structures.',
    accent: '#F6C445',
  },
  {
    icon: Crown,
    name: 'Private Buyer Lists & Groups',
    tagline: 'Exclusive proprietary lists',
    desc: 'Hand-curated lists + private buyer groups built from years of closed deals and repeat buyers.',
    accent: '#E53935',
  },
]

// ─── Buyer Type Data ─────────────────────────────────────────────────────────

const CONVENTIONAL_BUYERS = [
  { icon: Building2, name: 'Section 8 Investors', desc: 'Government-subsidized rental investors seeking stable, guaranteed monthly income.' },
  { icon: Hotel, name: 'Short-Term Rental', desc: 'Airbnb/VRBO operators looking for high cash-flow properties in tourist and metro markets.' },
  { icon: Home, name: 'Mid-Term Rental', desc: 'Traveling nurses, corporate housing, and 30-90 day furnished rental operators.' },
  { icon: Landmark, name: 'Long-Term Rental', desc: 'Buy-and-hold investors focused on 12+ month leases and steady appreciation.' },
]

const NON_CONVENTIONAL_BUYERS = [
  { icon: Zap, name: 'Fix & Flip', desc: 'Renovate and resell. Experienced flippers with capital ready to close fast.' },
  { icon: Target, name: 'Novation Buyers', desc: 'Novation agreements — buyers who purchase the right to renovate and list on the MLS.' },
  { icon: TrendingUp, name: 'Creative Finance', desc: 'Sub-To, seller finance, wraps, and lease-option buyers who close deals others can\'t.' },
  { icon: ShieldCheck, name: 'Land Trust Investors', desc: 'Asset protection and privacy-focused investors using land trusts and LLCs.' },
]

// ─── JV Agreement Contract Text ──────────────────────────────────────────────

const JV_CONTRACT_CLAUSES = [
  {
    title: '1. Purpose',
    text: 'This Joint Venture Agreement ("Agreement") is entered into between Dispo Dojo LLC ("Company") and the undersigned party ("Partner") for the purpose of collaborating on the disposition of real estate contracts sourced by the Partner.',
  },
  {
    title: '2. Responsibilities',
    text: 'The Partner agrees to provide contracts on properties under their control. The Company agrees to market said contracts to its buyer network, including but not limited to InvestorLift, InvestorBase, CreativeListing.com, and proprietary buyer lists and groups.',
  },
  {
    title: '3. Compensation',
    text: 'The Company shall receive a disposition fee as agreed upon on a deal-by-deal basis, typically structured as a percentage of the assignment fee or a flat rate. All fees are to be paid at closing through the title company.',
  },
  {
    title: '4. Confidentiality',
    text: 'Both parties agree to maintain strict confidentiality regarding buyer lists, deal terms, and proprietary information. Neither party shall disclose or share buyer contacts, internal pricing, or deal specifics with any third party without written consent.',
  },
  {
    title: '5. Term',
    text: 'This Agreement shall remain in effect for a period of twelve (12) months from the date of execution and may be renewed by mutual written agreement. Either party may terminate this Agreement with thirty (30) days written notice.',
  },
  {
    title: '6. Governing Law',
    text: 'This Agreement shall be governed by and construed in accordance with the laws of the state in which the property is located, without regard to its conflict of law provisions.',
  },
]

// ─── JV PDF Generator ────────────────────────────────────────────────────────

function generateJVPdf(name, date) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.text('JOINT VENTURE AGREEMENT', 105, 30, { align: 'center' })
  doc.setFontSize(11)
  const lines = [
    `This Joint Venture Agreement ("Agreement") is entered into as of ${date}.`,
    '',
    '1. Purpose. The parties agree to collaborate on the disposition of real estate',
    '   properties through Dispo Dojo\'s buyer network, platforms, and resources.',
    '',
    '2. Responsibilities. The submitting party ("Deal Partner") will provide properties',
    '   under contract. Dispo Dojo will market the property to its buyer network and',
    '   facilitate the assignment or closing.',
    '',
    '3. Compensation. Assignment fees, JV splits, and closing costs will be agreed upon',
    '   per deal prior to marketing.',
    '',
    '4. Confidentiality. Both parties agree to keep all buyer information, deal details,',
    '   and financial terms strictly confidential.',
    '',
    '5. Term. This agreement remains in effect for the duration of the deal partnership',
    '   and survives closing.',
    '',
    '6. Governing Law. This agreement is governed by the laws of the state in which',
    '   the property is located.',
  ]
  let y = 50
  lines.forEach((line) => { doc.text(line, 20, y); y += 7 })
  y += 15
  doc.setFontSize(12)
  doc.text('Signed:', 20, y)
  y += 10
  doc.setFont(undefined, 'italic')
  doc.text(name, 20, y)
  doc.setFont(undefined, 'normal')
  y += 8
  doc.text(`Date: ${date}`, 20, y)
  doc.save(`JV-Agreement-${name.replace(/\s+/g, '-')}.pdf`)
}

// ─── JV Modal Component ──────────────────────────────────────────────────────

function JVModal({ show, onClose }) {
  const [step, setStep] = useState(1)
  const [sigName, setSigName] = useState('')
  const [contractFile, setContractFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef(null)

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  function handleClose() {
    setStep(1)
    setSigName('')
    setContractFile(null)
    setSubmitting(false)
    setSubmitted(false)
    onClose()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (file) setContractFile(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) setContractFile(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
  }

  async function handleSubmitDeal() {
    setSubmitting(true)
    const webhookUrl = import.meta.env.VITE_DISCORD_JV_WEBHOOK
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `**New JV Deal Submitted**\n**Signed by:** ${sigName}\n**Date:** ${today}\n**Contract uploaded:** ${contractFile.name}`,
          }),
        })
      } catch (err) {
        console.error('Discord webhook failed:', err)
      }
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  function handleDownloadPDF() {
    generateJVPdf(sigName, today)
  }

  if (!show) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

        {/* Modal Card — glass */}
        <motion.div
          className="relative z-10 w-full max-w-lg rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(11,15,20,0.85)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.1)' }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header bar */}
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="font-heading text-sm tracking-widest uppercase" style={{ color: '#00C6FF' }}>JV Agreement</span>
            <button
              onClick={handleClose}
              className="text-text-dim hover:text-parchment transition-colors duration-200"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-2 px-5 pt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  s <= step ? 'bg-gold' : 'bg-white/10'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-5 py-6">
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: Agreement Notice ─── */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#E53935]/15 border border-[#E53935]/25 flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-parchment" />
                  </div>
                  <h3 className="font-heading text-xl text-gold mb-3 tracking-wide">
                    Joint Venture Agreement Required
                  </h3>
                  <p className="text-text-dim text-sm leading-relaxed mb-6 font-body">
                    To work with our buyers, we require a JV agreement to be signed prior to reaching out to our buyers.
                    This protects both parties and ensures a smooth transaction process.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
                  >
                    I Agree, Continue
                  </button>
                </motion.div>
              )}

              {/* ─── STEP 2: Sign Agreement ─── */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3 className="font-heading text-lg text-gold mb-3 tracking-wide">
                    Joint Venture Agreement
                  </h3>

                  {/* Scrollable contract */}
                  <div className="max-h-48 overflow-y-auto mb-5 pr-2 space-y-4 text-xs text-text-dim leading-relaxed border border-gold-dim/10 rounded-sm p-4 bg-black/20">
                    {JV_CONTRACT_CLAUSES.map((clause) => (
                      <div key={clause.title}>
                        <p className="font-heading text-parchment text-xs tracking-wide mb-1">{clause.title}</p>
                        <p className="font-body">{clause.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Signature fields */}
                  <div className="space-y-3 mb-5">
                    <div>
                      <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={sigName}
                        onChange={(e) => setSigName(e.target.value)}
                        placeholder="Enter your full legal name"
                        className="w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors duration-200 font-body"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-heading text-text-dim tracking-wide mb-1 uppercase">
                        Date
                      </label>
                      <input
                        type="text"
                        value={today}
                        readOnly
                        className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed font-body"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!sigName.trim()}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Sign Agreement
                  </button>
                </motion.div>
              )}

              {/* ─── STEP 3: Confirmation + Upload ─── */}
              {step === 3 && !submitted && (
                <motion.div
                  key="step3a"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="text-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={28} className="text-emerald-400" />
                    </div>
                    <h3 className="font-heading text-lg text-gold tracking-wide">
                      JV Agreement Signed
                    </h3>
                    <p className="text-text-dim text-xs mt-1 font-body">Signed by {sigName} on {today}</p>
                  </div>

                  {/* Download PDF button */}
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full py-2.5 mb-5 rounded-sm font-heading text-xs tracking-wider uppercase text-gold border border-gold-dim/30 hover:bg-gold/10 transition-colors duration-200"
                  >
                    Download Signed JV Agreement (PDF)
                  </button>

                  {/* File upload zone */}
                  <div className="mb-5">
                    <label className="block text-xs font-heading text-text-dim tracking-wide mb-2 uppercase">
                      Upload Your Contract
                    </label>
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-colors duration-200 ${
                        contractFile
                          ? 'border-emerald-500/40 bg-emerald-500/5'
                          : 'border-gold-dim/20 hover:border-gold-dim/40 bg-black/10'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      {contractFile ? (
                        <div>
                          <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
                          <p className="text-parchment text-sm font-body">{contractFile.name}</p>
                          <p className="text-text-muted text-xs mt-1 font-body">Click or drag to replace</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={20} className="text-text-dim mx-auto mb-2" />
                          <p className="text-text-dim text-sm font-body">Drop your contract here or click to browse</p>
                          <p className="text-text-muted text-xs mt-1 font-body">Accepts PDF, PNG, JPG</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitDeal}
                    disabled={!contractFile || submitting}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-parchment/30 border-t-parchment rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Submitting...
                      </>
                    ) : (
                      'Submit Deal'
                    )}
                  </button>
                </motion.div>
              )}

              {/* ─── STEP 3b: Final Confirmation ─── */}
              {step === 3 && submitted && (
                <motion.div
                  key="step3b"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                  </div>
                  <h3 className="font-heading text-xl text-gold tracking-wide mb-3">
                    Deal Submitted
                  </h3>
                  <p className="text-text-dim text-sm leading-relaxed mb-2 font-body">
                    We're reviewing your contract and will reach out with next steps.
                  </p>
                  <p className="text-gold/80 text-sm leading-relaxed mb-6 font-heading">
                    We're getting this out to all of our buyers and getting this sold for you.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment border border-gold-dim/30 hover:bg-gold/10 transition-colors duration-200"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FindBuyers() {
  const [showJVModal, setShowJVModal] = useState(false)

  return (
    <>
      <motion.div
        className="max-w-[1000px] mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ═══ 1. Hero Header ═══ */}
        <motion.div
          className="text-center mb-8 max-w-[680px] mx-auto"
          variants={cardVariants}
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
              <Users size={36} style={{ color: '#00C6FF' }} />
            </div>
            <h1
              className="font-display text-4xl"
              style={{
                color: '#F4F7FA',
                textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
              }}
            >
              Our Buyers Network
            </h1>
          </div>
          <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
            You bring the contract. We activate every channel we have.{' '}
            <span className="text-gold font-heading font-semibold">This is what we do.</span>
          </p>
        </motion.div>

        <GlassShell orbColors="default" maxWidth="max-w-[1000px]">
        {/* ═══ 2. Advantage Banner ═══ */}
        <motion.div className="mb-8" variants={cardVariants}>
          <GlassPanel className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(0,198,255,0.1)', border: '1px solid rgba(0,198,255,0.3)' }}>
                <Crown size={22} style={{ color: '#00C6FF' }} />
              </div>
              <div>
                <h2 className="font-heading text-lg tracking-wide mb-2" style={{ color: '#F6C445' }}>
                  Dispo Is What We're Known For
                </h2>
                <p className="text-text-dim text-sm leading-relaxed font-body">
                  We don't post and pray. When you bring us a deal under contract, we activate InvestorLift, InvestorBase, CreativeListing, our private buyer lists, and our private buyer groups — all at once. Your deal gets maximum exposure to qualified, ready-to-close buyers.
                </p>
              </div>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ═══ Divider ═══ */}
        <div className="h-[1px] my-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)' }} />

        {/* ═══ 3. Platform Engine Cards ═══ */}
        <motion.div className="mb-8" variants={containerVariants}>
          <h2 className="font-heading text-lg tracking-wide mb-5 text-center uppercase" style={{ color: '#F6C445' }}>
            Our Disposition Engine
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PLATFORMS.map((platform) => (
              <motion.div key={platform.name} variants={cardVariants}>
                <GlassPanel className="p-5 h-full">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                      style={{
                        background: `${platform.accent}12`,
                        borderColor: `${platform.accent}30`,
                      }}
                    >
                      <platform.icon size={18} style={{ color: platform.accent }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-base text-parchment tracking-wide">{platform.name}</h3>
                      <p className="text-xs font-heading tracking-wide mb-1.5" style={{ color: platform.accent }}>{platform.tagline}</p>
                      <p className="text-text-dim text-xs leading-relaxed font-body">{platform.desc}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Divider ═══ */}
        <div className="h-[1px] my-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)' }} />

        {/* ═══ 4. Buyer Types Grid ═══ */}
        <motion.div className="mb-8" variants={containerVariants}>
          {/* Conventional */}
          <h2 className="font-heading text-lg tracking-wide mb-1 text-center uppercase" style={{ color: '#F6C445' }}>
            Buyer Types We Work With
          </h2>
          <p className="text-text-dim text-xs text-center mb-5 font-body">Conventional & Non-Conventional</p>

          <h3 className="font-heading text-sm text-text-dim tracking-wider uppercase mb-3">Conventional</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {CONVENTIONAL_BUYERS.map((buyer) => (
              <motion.div key={buyer.name} variants={cardVariants}>
                <GlassPanel className="p-5 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-cyan/10 border border-cyan/20">
                      <buyer.icon size={16} className="text-cyan" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm text-parchment tracking-wide">{buyer.name}</h4>
                      <p className="text-text-dim text-xs leading-relaxed mt-0.5 font-body">{buyer.desc}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>

          {/* Non-Conventional */}
          <h3 className="font-heading text-sm tracking-wider uppercase mb-3 flex items-center gap-2" style={{ color: '#F6C445' }}>
            Non-Conventional
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase"
              style={{
                background: 'rgba(246,196,69,0.1)',
                border: '1px solid rgba(246,196,69,0.25)',
                color: '#F6C445',
              }}
            >
              Our advantage
            </span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {NON_CONVENTIONAL_BUYERS.map((buyer) => (
              <motion.div key={buyer.name} variants={cardVariants}>
                <GlassPanel className="p-5 h-full">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-gold/10 border border-gold-dim/25">
                      <buyer.icon size={16} className="text-gold" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-heading text-sm text-gold tracking-wide">{buyer.name}</h4>
                      <p className="text-text-dim text-xs leading-relaxed mt-0.5 font-body">{buyer.desc}</p>
                    </div>
                  </div>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ═══ Divider ═══ */}
        <div className="h-[1px] my-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)' }} />

        {/* ═══ 5. Blurred Buyer Data Table ═══ */}
        <motion.div className="mb-8" variants={cardVariants}>
          <h2 className="font-heading text-lg tracking-wide mb-5 text-center uppercase" style={{ color: '#F6C445' }}>
            Active Buyer Database
          </h2>

          <GlassPanel className="overflow-hidden relative">
            {/* Blurred table */}
            <div className="blur-[6px] pointer-events-none select-none">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gold-dim/15" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <th className="px-3 py-2.5 text-left font-heading text-text-dim tracking-wider uppercase">Name</th>
                    <th className="px-3 py-2.5 text-left font-heading text-text-dim tracking-wider uppercase">State</th>
                    <th className="px-3 py-2.5 text-left font-heading text-text-dim tracking-wider uppercase">Buy Box</th>
                    <th className="px-3 py-2.5 text-left font-heading text-text-dim tracking-wider uppercase hidden sm:table-cell">Property Types</th>
                    <th className="px-3 py-2.5 text-left font-heading text-text-dim tracking-wider uppercase hidden sm:table-cell">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {FAKE_BUYERS.map((buyer, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gold-dim/8 ${i % 2 === 0 ? 'bg-black/10' : 'bg-black/5'}`}
                    >
                      <td className="px-3 py-2 text-parchment font-body">{buyer.name}</td>
                      <td className="px-3 py-2 text-text-dim font-body">{buyer.state}</td>
                      <td className="px-3 py-2 text-gold font-body">{buyer.buyBox}</td>
                      <td className="px-3 py-2 text-text-dim hidden sm:table-cell font-body">{buyer.types}</td>
                      <td className="px-3 py-2 text-text-dim hidden sm:table-cell font-body">{buyer.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(11,15,20,0.55)' }}>
              <div className="w-14 h-14 rounded-full bg-black/60 border border-gold-dim/30 flex items-center justify-center mb-4">
                <Lock size={24} className="text-gold" />
              </div>
              <h3 className="font-heading text-base tracking-wide mb-2 text-center px-4" style={{ color: '#F6C445' }}>
                Buyer List Access Requires a Signed JV Agreement
              </h3>
              <p className="text-text-dim text-xs mb-5 text-center px-4 font-body">
                Submit a deal under contract to unlock our full buyer network
              </p>
              <button
                onClick={() => setShowJVModal(true)}
                className="px-6 py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
              >
                Submit a Deal
              </button>
            </div>
          </GlassPanel>
        </motion.div>

        {/* ═══ Divider ═══ */}
        <div className="h-[1px] my-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.15), transparent)' }} />

        {/* ═══ 6. Bottom CTA ═══ */}
        <motion.div variants={cardVariants}>
          <GlassPanel className="p-5">
            <div className="text-center py-4">
              <h2 className="font-heading text-2xl tracking-wide mb-3" style={{ color: '#F6C445' }}>
                Ready to Move a Deal?
              </h2>
              <p className="text-text-dim text-sm leading-relaxed max-w-md mx-auto mb-6 font-body">
                You're looking for buyers? Perfect. This is what we do. Bring the contract and we'll go to work.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowJVModal(true)}
                  className="px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
                >
                  Submit a Deal
                </button>
                <a
                  href="mailto:dispo@dispodojo.com"
                  className="px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-cyan border border-cyan/30 hover:bg-cyan/10 hover:border-cyan/50 transition-colors duration-200"
                >
                  Contact Dispo Team
                </a>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
        </GlassShell>
      </motion.div>

      {/* JV Modal */}
      <JVModal show={showJVModal} onClose={() => setShowJVModal(false)} />
    </>
  )
}
