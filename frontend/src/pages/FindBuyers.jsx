import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Crown, Rocket, Globe, Zap, Target, TrendingUp, ShieldCheck,
  Building2, Hotel, Home, Landmark, Lock, FileText, CheckCircle2, Upload, X,
} from 'lucide-react'
import WoodPanel from '../components/WoodPanel'

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
  },
  {
    icon: Users,
    name: 'InvestorBase',
    tagline: 'Curated investor database',
    desc: 'A curated database of active investors with verified proof-of-funds and recent transaction history.',
  },
  {
    icon: Globe,
    name: 'CreativeListing.com',
    tagline: 'Creative finance marketplace',
    desc: 'The marketplace for Sub-To, seller finance, wraps, and other creative deal structures.',
  },
  {
    icon: Crown,
    name: 'Private Buyer Lists & Groups',
    tagline: 'Exclusive proprietary lists',
    desc: 'Hand-curated lists + private buyer groups built from years of closed deals and repeat buyers.',
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
    // Placeholder: Discord webhook + file upload will be wired in next task
    console.log('[JV Modal] Submit deal — Discord webhook placeholder', { sigName, contractFile })
    await new Promise((r) => setTimeout(r, 1500))
    setSubmitting(false)
    setSubmitted(true)
  }

  function handleDownloadPDF() {
    // Placeholder: PDF generation will be wired in next task
    console.log('[JV Modal] Download signed JV agreement PDF — placeholder', { sigName, date: today })
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

        {/* Modal Card */}
        <motion.div
          className="relative z-10 w-full max-w-lg wood-panel rounded-sm border border-gold-dim/30 elevation-4 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header bar */}
          <div className="lacquer-bar px-5 py-3 flex items-center justify-between">
            <span className="font-heading text-gold text-sm tracking-widest uppercase">JV Agreement</span>
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
                  <div className="w-14 h-14 rounded-full hanko-seal flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-parchment" />
                  </div>
                  <h3 className="font-heading text-xl text-gold mb-3 tracking-wide">
                    Joint Venture Agreement Required
                  </h3>
                  <p className="text-text-dim text-sm leading-relaxed mb-6">
                    To work with our buyers, we require a JV agreement to be signed prior to reaching out to our buyers.
                    This protects both parties and ensures a smooth transaction process.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
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
                        <p>{clause.text}</p>
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
                        className="w-full px-3 py-2.5 rounded-sm bg-black/30 border border-gold-dim/20 text-parchment text-sm placeholder:text-text-muted input-calligraphy focus:outline-none transition-all duration-200"
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
                        className="w-full px-3 py-2.5 rounded-sm bg-black/20 border border-gold-dim/10 text-text-dim text-sm cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(3)}
                    disabled={!sigName.trim()}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
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
                    <div className="w-14 h-14 rounded-full bg-bamboo/20 border border-bamboo/30 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={28} className="text-bamboo" />
                    </div>
                    <h3 className="font-heading text-lg text-gold tracking-wide">
                      JV Agreement Signed
                    </h3>
                    <p className="text-text-dim text-xs mt-1">Signed by {sigName} on {today}</p>
                  </div>

                  {/* Download PDF button */}
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full py-2.5 mb-5 rounded-sm font-heading text-xs tracking-wider uppercase text-gold border border-gold-dim/30 hover:bg-gold/10 transition-all duration-200"
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
                      className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all duration-200 ${
                        contractFile
                          ? 'border-bamboo/40 bg-bamboo/5'
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
                          <CheckCircle2 size={20} className="text-bamboo mx-auto mb-2" />
                          <p className="text-parchment text-sm">{contractFile.name}</p>
                          <p className="text-text-muted text-xs mt-1">Click or drag to replace</p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={20} className="text-text-dim mx-auto mb-2" />
                          <p className="text-text-dim text-sm">Drop your contract here or click to browse</p>
                          <p className="text-text-muted text-xs mt-1">Accepts PDF, PNG, JPG</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    onClick={handleSubmitDeal}
                    disabled={!contractFile || submitting}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
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
                  <div className="w-16 h-16 rounded-full bg-bamboo/20 border border-bamboo/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={32} className="text-bamboo" />
                  </div>
                  <h3 className="font-heading text-xl text-gold tracking-wide mb-3">
                    Deal Submitted
                  </h3>
                  <p className="text-text-dim text-sm leading-relaxed mb-2">
                    We're reviewing your contract and will reach out with next steps.
                  </p>
                  <p className="text-gold/80 text-sm leading-relaxed mb-6 font-heading">
                    We're getting this out to all of our buyers and getting this sold for you.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment border border-gold-dim/30 hover:bg-gold/10 transition-all duration-200"
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

// ─── Icon Circle Helper ──────────────────────────────────────────────────────

function HankoIcon({ icon: Icon, size = 20, className = '' }) {
  return (
    <div className={`w-10 h-10 rounded-full hanko-seal flex items-center justify-center shrink-0 ${className}`}>
      <Icon size={size} className="text-parchment" />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FindBuyers() {
  const [showJVModal, setShowJVModal] = useState(false)

  return (
    <>
      <motion.div
        className="max-w-[1000px] mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="parchment-texture rounded-sm border border-gold-dim/20 px-6 sm:px-10 py-10">

          {/* ═══ 1. Hero Header ═══ */}
          <motion.div
            className="text-center mb-10"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="w-16 h-16 rounded-full hanko-seal flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-parchment" />
            </div>
            <h1 className="font-display text-4xl text-gold mb-3 tracking-tight">
              Our Buyers Network
            </h1>
            <p className="text-text-dim text-base leading-relaxed max-w-xl mx-auto">
              You bring the contract. We activate every channel we have.{' '}
              <span className="text-gold font-heading font-semibold">This is what we do.</span>
            </p>
          </motion.div>

          {/* ═══ 2. Advantage Banner ═══ */}
          <motion.div
            className="mb-8"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <WoodPanel glow headerBar="Our Edge">
              <div className="flex items-start gap-4">
                <HankoIcon icon={Crown} size={22} className="mt-0.5" />
                <div>
                  <h2 className="font-heading text-lg text-gold tracking-wide mb-2">
                    Dispo Is What We're Known For
                  </h2>
                  <p className="text-text-dim text-sm leading-relaxed">
                    We don't post and pray. When you bring us a deal under contract, we activate InvestorLift, InvestorBase, CreativeListing, our private buyer lists, and our private buyer groups — all at once. Your deal gets maximum exposure to qualified, ready-to-close buyers.
                  </p>
                </div>
              </div>
            </WoodPanel>
          </motion.div>

          {/* ═══ Katana Line ═══ */}
          <div className="katana-line my-8" />

          {/* ═══ 3. Platform Engine Cards ═══ */}
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="font-heading text-lg text-gold tracking-wide mb-5 text-center uppercase">
              Our Disposition Engine
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PLATFORMS.map((platform) => (
                <motion.div key={platform.name} variants={cardVariants}>
                  <WoodPanel className="h-full">
                    <div className="flex items-start gap-3">
                      <HankoIcon icon={platform.icon} size={18} />
                      <div className="min-w-0">
                        <h3 className="font-heading text-base text-gold tracking-wide">{platform.name}</h3>
                        <p className="text-cyan text-xs font-heading tracking-wide mb-1.5">{platform.tagline}</p>
                        <p className="text-text-dim text-xs leading-relaxed">{platform.desc}</p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══ Katana Line ═══ */}
          <div className="katana-line my-8" />

          {/* ═══ 4. Buyer Types Grid ═══ */}
          <motion.div
            className="mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Conventional */}
            <h2 className="font-heading text-lg text-gold tracking-wide mb-1 text-center uppercase">
              Buyer Types We Work With
            </h2>
            <p className="text-text-dim text-xs text-center mb-5">Conventional & Non-Conventional</p>

            <h3 className="font-heading text-sm text-text-dim tracking-wider uppercase mb-3">Conventional</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {CONVENTIONAL_BUYERS.map((buyer) => (
                <motion.div key={buyer.name} variants={cardVariants}>
                  <WoodPanel className="h-full">
                    <div className="flex items-start gap-3">
                      <HankoIcon icon={buyer.icon} size={16} />
                      <div className="min-w-0">
                        <h4 className="font-heading text-sm text-parchment tracking-wide">{buyer.name}</h4>
                        <p className="text-text-dim text-xs leading-relaxed mt-0.5">{buyer.desc}</p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </div>

            {/* Non-Conventional */}
            <h3 className="font-heading text-sm text-gold tracking-wider uppercase mb-3 flex items-center gap-2">
              Non-Conventional
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading tracking-wider uppercase bg-gold/15 text-gold border border-gold-dim/20">
                Our advantage
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {NON_CONVENTIONAL_BUYERS.map((buyer) => (
                <motion.div key={buyer.name} variants={cardVariants}>
                  <WoodPanel glow className="h-full">
                    <div className="flex items-start gap-3">
                      <HankoIcon icon={buyer.icon} size={16} />
                      <div className="min-w-0">
                        <h4 className="font-heading text-sm text-gold tracking-wide">{buyer.name}</h4>
                        <p className="text-text-dim text-xs leading-relaxed mt-0.5">{buyer.desc}</p>
                      </div>
                    </div>
                  </WoodPanel>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ═══ Katana Line ═══ */}
          <div className="katana-line my-8" />

          {/* ═══ 5. Blurred Buyer Data Table ═══ */}
          <motion.div
            className="mb-8"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <h2 className="font-heading text-lg text-gold tracking-wide mb-5 text-center uppercase">
              Active Buyer Database
            </h2>

            <div className="relative rounded-sm overflow-hidden border border-gold-dim/15">
              {/* Blurred table */}
              <div className="blur-[6px] pointer-events-none select-none">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-black/30 border-b border-gold-dim/15">
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
                        <td className="px-3 py-2 text-parchment">{buyer.name}</td>
                        <td className="px-3 py-2 text-text-dim">{buyer.state}</td>
                        <td className="px-3 py-2 text-gold">{buyer.buyBox}</td>
                        <td className="px-3 py-2 text-text-dim hidden sm:table-cell">{buyer.types}</td>
                        <td className="px-3 py-2 text-text-dim hidden sm:table-cell">{buyer.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Lock overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <div className="w-14 h-14 rounded-full bg-black/60 border border-gold-dim/30 flex items-center justify-center mb-4">
                  <Lock size={24} className="text-gold" />
                </div>
                <h3 className="font-heading text-base text-gold tracking-wide mb-2 text-center px-4">
                  Buyer List Access Requires a Signed JV Agreement
                </h3>
                <p className="text-text-dim text-xs mb-5 text-center px-4">
                  Submit a deal under contract to unlock our full buyer network
                </p>
                <button
                  onClick={() => setShowJVModal(true)}
                  className="px-6 py-2.5 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
                >
                  Submit a Deal
                </button>
              </div>
            </div>
          </motion.div>

          {/* ═══ Katana Line ═══ */}
          <div className="katana-line my-8" />

          {/* ═══ 6. Bottom CTA ═══ */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <WoodPanel glow>
              <div className="text-center py-4">
                <h2 className="font-heading text-2xl text-gold tracking-wide mb-3">
                  Ready to Move a Deal?
                </h2>
                <p className="text-text-dim text-sm leading-relaxed max-w-md mx-auto mb-6">
                  You're looking for buyers? Perfect. This is what we do. Bring the contract and we'll go to work.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setShowJVModal(true)}
                    className="px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-all duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)] hover:shadow-[0_0_30px_rgba(229,57,53,0.5)]"
                  >
                    Submit a Deal
                  </button>
                  <a
                    href="mailto:dispo@dispodojo.com"
                    className="px-8 py-3 rounded-sm font-heading text-sm tracking-wider uppercase text-cyan border border-cyan/30 hover:bg-cyan/10 hover:border-cyan/50 transition-all duration-200"
                  >
                    Contact Dispo Team
                  </a>
                </div>
              </div>
            </WoodPanel>
          </motion.div>

        </div>
      </motion.div>

      {/* JV Modal */}
      <JVModal show={showJVModal} onClose={() => setShowJVModal(false)} />
    </>
  )
}
