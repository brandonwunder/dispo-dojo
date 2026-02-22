import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Download,
  Mail,
  Upload,
  Lock,
  CheckCircle,
  FileText,
  Pencil,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import WoodPanel from '../components/WoodPanel'
import Button from '../components/Button'

const inputClass =
  'bg-bg-card border-b border-gold-dim/20 border-t-0 border-x-0 rounded-none px-4 py-3 text-parchment placeholder:text-text-muted font-body text-sm focus:outline-none focus:border-gold/50 transition-colors w-full'

const labelClass =
  'block font-heading text-gold-dim tracking-wide text-xs uppercase font-semibold mb-1.5'

const STEPS = [
  { num: 1, label: 'Info' },
  { num: 2, label: 'Preview' },
  { num: 3, label: 'Send' },
]

const mockHistory = [
  {
    id: 1,
    date: 'Feb 20, 2026',
    property: '789 Oak St, Phoenix AZ',
    agent: 'John Smith',
    status: 'Sent',
  },
  {
    id: 2,
    date: 'Feb 18, 2026',
    property: '456 Pine Ave, Mesa AZ',
    agent: 'Sarah Lee',
    status: 'Draft',
  },
  {
    id: 3,
    date: 'Feb 15, 2026',
    property: '123 Main St, Tempe AZ',
    agent: 'Bob Jones',
    status: 'Sent',
  },
]

const pageVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

export default function LOIGenerator() {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    address: '',
    agentName: '',
    agentEmail: '',
    agentPhone: '',
    brokerageName: '',
    offerPrice: '',
    earnestMoney: '',
    inspectionPeriod: '8',
    closingDate: '',
    terms: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }))
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!form.address.trim()) newErrors.address = true
    if (!form.agentName.trim()) newErrors.agentName = true
    if (!form.agentEmail.trim()) newErrors.agentEmail = true
    if (!form.offerPrice) newErrors.offerPrice = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const goNext = () => {
    if (currentStep === 1 && !validateStep1()) return
    setDirection(1)
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const goBack = () => {
    setDirection(-1)
    setCurrentStep((s) => Math.max(s - 1, 1))
  }

  const handleGenerate = () => {
    setShowSuccess(true)
  }

  const handleReset = () => {
    setForm({
      address: '',
      agentName: '',
      agentEmail: '',
      agentPhone: '',
      brokerageName: '',
      offerPrice: '',
      earnestMoney: '',
      inspectionPeriod: '8',
      closingDate: '',
      terms: '',
    })
    setCurrentStep(1)
    setDirection(-1)
    setShowSuccess(false)
    setErrors({})
  }

  const formatCurrency = (val) => {
    if (!val) return '$0'
    return '$' + Number(val).toLocaleString()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBD'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const userName = user?.name
    ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
    : 'Investor'

  /* Step index for the indicator (0-based) */
  const stepIndex = currentStep - 1

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1200px] mx-auto"
    >
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl text-text-primary mb-2">
          LOI <span className="brush-underline">Generator</span>
        </h1>
        <p className="text-text-dim text-base">
          Create, preview, and send professional Letters of Intent in minutes.
        </p>
      </div>

      {/* Step Indicator — Brush-stroke circles connected by gold line */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map((step, i) => (
          <React.Fragment key={i}>
            {i > 0 && (
              <div
                className={`w-12 h-[2px] transition-all duration-300 ${
                  stepIndex >= i ? 'bg-gold' : 'bg-gold-dim/30'
                }`}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-heading font-bold ${
                  stepIndex > i
                    ? 'bg-gold text-ink shadow-[0_0_12px_rgba(212,168,83,0.4)]'
                    : stepIndex === i
                    ? 'bg-gold text-white shadow-[0_0_12px_rgba(212,168,83,0.4)]'
                    : 'bg-transparent border-2 border-gold-dim/40 text-gold-dim'
                }`}
              >
                {stepIndex > i ? <Check size={14} /> : i + 1}
              </div>
              <span
                className={`font-heading text-[10px] tracking-widest uppercase transition-colors ${
                  stepIndex >= i ? 'text-gold' : 'text-text-muted'
                }`}
              >
                {step.label}
              </span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {!showSuccess ? (
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Step1
                form={form}
                errors={errors}
                onChange={handleChange}
                onNext={goNext}
              />
            </motion.div>
          )}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Step2
                form={form}
                userName={userName}
                todayFormatted={todayFormatted}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onBack={goBack}
                onNext={goNext}
              />
            </motion.div>
          )}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Step3 onBack={goBack} onGenerate={handleGenerate} />
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <SuccessCard address={form.address} onReset={handleReset} />
        </motion.div>
      )}

      {/* LOI History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-14"
      >
        <WoodPanel headerBar="Dispatched Scrolls" hover={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="lacquer-bar">
                  <th className="px-6 py-3 font-heading text-xs font-semibold tracking-widest uppercase text-gold">
                    Date
                  </th>
                  <th className="px-6 py-3 font-heading text-xs font-semibold tracking-widest uppercase text-gold">
                    Property
                  </th>
                  <th className="px-6 py-3 font-heading text-xs font-semibold tracking-widest uppercase text-gold">
                    Agent
                  </th>
                  <th className="px-6 py-3 font-heading text-xs font-semibold tracking-widest uppercase text-gold">
                    Status
                  </th>
                  <th className="px-6 py-3 font-heading text-xs font-semibold tracking-widest uppercase text-gold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {mockHistory.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gold-dim/[0.08] last:border-0 hover:bg-gold/[0.03] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-body text-parchment whitespace-nowrap">
                      {row.date}
                    </td>
                    <td className="px-6 py-4 text-sm font-body text-parchment whitespace-nowrap">
                      {row.property}
                    </td>
                    <td className="px-6 py-4 text-sm font-body text-parchment whitespace-nowrap">
                      {row.agent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                          ${row.status === 'Sent' ? 'bg-status-success/10 text-status-success' : ''}
                          ${row.status === 'Draft' ? 'bg-status-warning/10 text-status-warning' : ''}
                        `}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-sm text-text-dim hover:text-gold hover:bg-gold/[0.08] transition-colors">
                          <Download size={16} />
                        </button>
                        {row.status === 'Draft' && (
                          <button className="p-1.5 rounded-sm text-text-dim hover:text-gold hover:bg-gold/[0.08] transition-colors">
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WoodPanel>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Deal Information                                         */
/* ------------------------------------------------------------------ */
function Step1({ form, errors, onChange, onNext }) {
  const errorBorder = 'border-b-crimson-bright focus:border-b-crimson-bright'

  return (
    <WoodPanel headerBar="Calligraphy Room — Letter of Intent" hover={false}>
      {/* Section: Property & Contact */}
      <div className="mb-8">
        <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-gold mb-5 flex items-center gap-2">
          <FileText size={20} className="text-gold-dim" />
          Property & Contact
        </h3>

        <div className="space-y-4">
          {/* Property Address */}
          <div>
            <label className={labelClass}>
              Property Address <span className="text-crimson-bright">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={onChange}
              placeholder="123 Main St, Phoenix, AZ 85001"
              className={`${inputClass} ${errors.address ? errorBorder : ''}`}
            />
          </div>

          {/* Row: Agent Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Agent / Seller Name <span className="text-crimson-bright">*</span>
              </label>
              <input
                type="text"
                name="agentName"
                value={form.agentName}
                onChange={onChange}
                placeholder="John Smith"
                className={`${inputClass} ${errors.agentName ? errorBorder : ''}`}
              />
            </div>
            <div>
              <label className={labelClass}>
                Agent / Seller Email <span className="text-crimson-bright">*</span>
              </label>
              <input
                type="email"
                name="agentEmail"
                value={form.agentEmail}
                onChange={onChange}
                placeholder="john@brokerage.com"
                className={`${inputClass} ${errors.agentEmail ? errorBorder : ''}`}
              />
            </div>
          </div>

          {/* Row: Phone + Brokerage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Agent Phone
              </label>
              <input
                type="tel"
                name="agentPhone"
                value={form.agentPhone}
                onChange={onChange}
                placeholder="(555) 123-4567"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Brokerage Name
              </label>
              <input
                type="text"
                name="brokerageName"
                value={form.brokerageName}
                onChange={onChange}
                placeholder="RE/MAX, Keller Williams, etc."
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="katana-line my-6" />

      {/* Section: Offer Terms */}
      <div className="mb-8">
        <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-gold mb-5 flex items-center gap-2">
          <FileText size={20} className="text-gold-dim" />
          Offer Terms
        </h3>

        <div className="space-y-4">
          {/* Row: Offer Price + Earnest Money */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Offer Price <span className="text-crimson-bright">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  $
                </span>
                <input
                  type="number"
                  name="offerPrice"
                  value={form.offerPrice}
                  onChange={onChange}
                  placeholder="250,000"
                  className={`${inputClass} pl-8 ${errors.offerPrice ? errorBorder : ''}`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Earnest Money
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">
                  $
                </span>
                <input
                  type="number"
                  name="earnestMoney"
                  value={form.earnestMoney}
                  onChange={onChange}
                  placeholder="5,000"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          </div>

          {/* Row: Inspection Period + Closing Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Inspection Period (days)
              </label>
              <input
                type="number"
                name="inspectionPeriod"
                value={form.inspectionPeriod}
                onChange={onChange}
                placeholder="8"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                Closing Date
              </label>
              <input
                type="date"
                name="closingDate"
                value={form.closingDate}
                onChange={onChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Terms / Contingencies */}
          <div>
            <label className={labelClass}>
              Terms / Contingencies
            </label>
            <textarea
              name="terms"
              value={form.terms}
              onChange={onChange}
              rows={3}
              placeholder="Any additional terms or contingencies..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end">
        <Button variant="gold" onClick={onNext}>
          <span className="flex items-center gap-2">
            Next: Preview
            <ChevronRight size={16} />
          </span>
        </Button>
      </div>
    </WoodPanel>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Preview                                                  */
/* ------------------------------------------------------------------ */
function Step2({
  form,
  userName,
  todayFormatted,
  formatCurrency,
  formatDate,
  onBack,
  onNext,
}) {
  return (
    <div>
      <WoodPanel hover={false}>
        {/* Scroll card with wooden rollers top/bottom */}
        <div className="scroll-card">
          <div className="parchment-texture rounded-sm p-8 max-w-2xl mx-auto">
            <h2 className="text-center text-2xl font-bold tracking-wide mb-8 text-ink/80 font-heading">
              LETTER OF INTENT
            </h2>

            <p className="mb-6 text-sm text-ink/60">
              Date: {todayFormatted}
            </p>

            <div className="mb-6 text-sm text-ink leading-relaxed">
              <p>To: {form.agentName}</p>
              {form.brokerageName && (
                <p className="ml-6">{form.brokerageName}</p>
              )}
            </div>

            <p className="mb-6 text-sm text-ink">
              Re: Property at {form.address}
            </p>

            <p className="mb-6 text-sm text-ink leading-relaxed">
              Dear {form.agentName},
            </p>

            <p className="mb-6 text-sm text-ink leading-relaxed">
              This letter serves as a formal expression of interest to purchase
              the property located at {form.address} under the following terms:
            </p>

            <div className="mb-6 space-y-2 text-sm text-ink">
              <p>
                <span className="font-semibold">Purchase Price:</span>{' '}
                {formatCurrency(form.offerPrice)}
              </p>
              <p>
                <span className="font-semibold">Earnest Money Deposit:</span>{' '}
                {formatCurrency(form.earnestMoney)}
              </p>
              <p>
                <span className="font-semibold">Inspection Period:</span>{' '}
                {form.inspectionPeriod || '8'} business days
              </p>
              <p>
                <span className="font-semibold">Proposed Closing Date:</span>{' '}
                {formatDate(form.closingDate)}
              </p>
            </div>

            <div className="mb-6 text-sm text-ink leading-relaxed">
              <p className="font-semibold mb-1">Additional Terms:</p>
              <p>{form.terms || 'Standard terms apply'}</p>
            </div>

            <p className="mb-6 text-sm text-ink leading-relaxed">
              This Letter of Intent is non-binding and is intended to serve as
              the basis for further negotiations and the preparation of a formal
              purchase agreement.
            </p>

            <p className="mb-8 text-sm text-ink leading-relaxed">
              We look forward to your response.
            </p>

            <div className="text-sm text-ink">
              <p>Sincerely,</p>
              <p className="mt-1 font-semibold">{userName}</p>
            </div>
          </div>
        </div>
      </WoodPanel>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <span className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Back to Edit
          </span>
        </Button>
        <Button variant="gold" onClick={onNext}>
          <span className="flex items-center gap-2">
            Next: Send Options
            <ChevronRight size={16} />
          </span>
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Send Options                                             */
/* ------------------------------------------------------------------ */
function Step3({ onBack, onGenerate }) {
  return (
    <div>
      <WoodPanel hover={false} className="space-y-6">
        {/* Download Section */}
        <WoodPanel variant="elevated" hover={false}>
          <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-gold mb-3 flex items-center gap-2">
            <Download size={18} className="text-gold-dim" />
            Download
          </h3>
          <button
            onClick={() => {}}
            className="gold-shimmer text-ink font-heading font-bold tracking-widest uppercase px-6 py-2.5 text-sm rounded-sm flex items-center gap-2 transition-all duration-300 hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]"
          >
            <Download size={16} />
            Download as PDF
          </button>
          <p className="text-xs text-text-muted mt-2">
            (PDF generation coming soon -- currently saves as formatted
            document)
          </p>
        </WoodPanel>

        {/* Send via Email */}
        <WoodPanel variant="elevated" hover={false}>
          <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-parchment mb-3 flex items-center gap-2">
            <Mail size={18} className="text-gold-dim" />
            Send via Email
            <Lock size={14} className="text-text-muted" />
          </h3>
          <Button variant="outline" disabled className="opacity-50">
            <span className="flex items-center gap-2">
              <Mail size={16} />
              Connect Gmail
            </span>
          </Button>
          <p className="text-xs text-text-muted mt-2">
            Gmail integration coming soon -- connect your account to send LOIs
            directly
          </p>
        </WoodPanel>

        {/* Batch Mode */}
        <WoodPanel variant="elevated" hover={false}>
          <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-parchment mb-3 flex items-center gap-2">
            <Upload size={18} className="text-gold-dim" />
            Batch Mode
            <Lock size={14} className="text-text-muted" />
          </h3>
          <div className="bg-status-info/5 border border-status-info/20 rounded-sm p-3 mb-3">
            <p className="text-sm text-status-info">
              Upload a spreadsheet of properties to generate and send up to 100
              LOIs per day
            </p>
          </div>
          <Button variant="outline" disabled className="opacity-50">
            <span className="flex items-center gap-2">
              <Upload size={16} />
              Upload Batch File
            </span>
          </Button>
          <p className="text-xs text-text-muted mt-2">
            Batch mode coming soon
          </p>
        </WoodPanel>
      </WoodPanel>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          <span className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Back
          </span>
        </Button>
        <Button variant="gold" onClick={onGenerate}>
          <span className="flex items-center gap-2">
            <FileText size={16} />
            Generate LOI
          </span>
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Success Card                                                      */
/* ------------------------------------------------------------------ */
function SuccessCard({ address, onReset }) {
  return (
    <WoodPanel hover={false} glow className="text-center max-w-lg mx-auto">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 rounded-full bg-gold/15 flex items-center justify-center shadow-[0_0_20px_rgba(212,168,83,0.3)]">
          <CheckCircle size={48} className="text-gold" />
        </div>
      </div>
      <h2 className="font-display text-2xl text-parchment mb-2">
        Scroll Dispatched!
      </h2>
      <p className="text-text-dim mb-8">
        Your Letter of Intent for{' '}
        <span className="text-parchment font-medium">{address}</span> has
        been created.
      </p>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={onReset}>
          Generate Another
        </Button>
        <Button variant="gold" onClick={() => {}}>
          View History
        </Button>
      </div>
    </WoodPanel>
  )
}
