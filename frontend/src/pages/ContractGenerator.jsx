import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FilePen,
  Check,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Mail,
  Pen,
  Type,
  RotateCcw,
} from 'lucide-react'
import ShojiCard from '../components/ShojiCard'
import Button from '../components/Button'

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const STEPS = ['Deal Info', 'Review', 'Sign', 'Export']

const INPUT_CLASS =
  'bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted input-calligraphy focus:outline-none transition-colors w-full font-body text-sm'

const LABEL_CLASS = 'block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-1.5'

const MOCK_HISTORY = [
  {
    id: 1,
    date: 'Feb 21, 2026',
    property: '789 Oak St',
    buyer: 'John Smith',
    seller: 'Jane Doe',
    status: 'Signed',
  },
  {
    id: 2,
    date: 'Feb 19, 2026',
    property: '456 Pine Ave',
    buyer: 'Mike Brown',
    seller: 'Lisa Chen',
    status: 'Draft',
  },
  {
    id: 3,
    date: 'Feb 14, 2026',
    property: '123 Main St',
    buyer: 'Bob Jones',
    seller: 'Amy Wu',
    status: 'Signed',
  },
]

const INITIAL_FORM = {
  buyerName: '',
  sellerName: '',
  buyerEmail: '',
  sellerEmail: '',
  buyerPhone: '',
  sellerPhone: '',
  propertyAddress: '',
  city: '',
  state: '',
  zip: '',
  purchasePrice: '',
  earnestMoney: '',
  inspectionDays: '8',
  closingDate: '',
  contingencies: '',
  specialTerms: '',
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(value) {
  if (!value) return '$0'
  const num = parseFloat(value.replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return '$0'
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '_______________'
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

/* ------------------------------------------------------------------ */
/*  Step Indicator — Mountain path pattern                            */
/* ------------------------------------------------------------------ */

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((stepLabel, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div className="w-8 katana-line" />}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center text-[9px] font-bold ${
              currentStep > i ? 'bg-gold text-bg shadow-[0_0_8px_rgba(212,168,83,0.4)]'
              : currentStep === i ? 'bg-gold/20 border border-gold text-gold'
              : 'bg-border text-text-muted'
            }`}>
              {i + 1}
            </div>
            <span className="font-heading text-[9px] tracking-[0.1em] uppercase text-text-muted">{stepLabel}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 1: Deal Info                                                 */
/* ------------------------------------------------------------------ */

function StepDealInfo({ form, setForm, onNext }) {
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <ShojiCard hover={false} className="p-6 sm:p-8">
      {/* Section: Parties */}
      <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-5">Parties</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={LABEL_CLASS}>Buyer Name</label>
          <input className={INPUT_CLASS} placeholder="John Smith" value={form.buyerName} onChange={update('buyerName')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Seller Name</label>
          <input className={INPUT_CLASS} placeholder="Jane Doe" value={form.sellerName} onChange={update('sellerName')} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={LABEL_CLASS}>Buyer Email</label>
          <input type="email" className={INPUT_CLASS} placeholder="buyer@email.com" value={form.buyerEmail} onChange={update('buyerEmail')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Seller Email</label>
          <input type="email" className={INPUT_CLASS} placeholder="seller@email.com" value={form.sellerEmail} onChange={update('sellerEmail')} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div>
          <label className={LABEL_CLASS}>Buyer Phone</label>
          <input type="tel" className={INPUT_CLASS} placeholder="(555) 123-4567" value={form.buyerPhone} onChange={update('buyerPhone')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Seller Phone</label>
          <input type="tel" className={INPUT_CLASS} placeholder="(555) 987-6543" value={form.sellerPhone} onChange={update('sellerPhone')} />
        </div>
      </div>

      {/* Divider */}
      <div className="katana-line my-6" />

      {/* Section: Property */}
      <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-5">Property</h3>
      <div className="mb-4">
        <label className={LABEL_CLASS}>Property Address</label>
        <input className={INPUT_CLASS} placeholder="123 Main Street" value={form.propertyAddress} onChange={update('propertyAddress')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className={LABEL_CLASS}>City</label>
          <input className={INPUT_CLASS} placeholder="Austin" value={form.city} onChange={update('city')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>State</label>
          <input className={INPUT_CLASS} placeholder="TX" value={form.state} onChange={update('state')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>ZIP</label>
          <input className={INPUT_CLASS} placeholder="78701" value={form.zip} onChange={update('zip')} />
        </div>
      </div>

      {/* Divider */}
      <div className="katana-line my-6" />

      {/* Section: Terms */}
      <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-5">Terms</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={LABEL_CLASS}>Purchase Price ($)</label>
          <input type="text" className={INPUT_CLASS} placeholder="250,000" value={form.purchasePrice} onChange={update('purchasePrice')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Earnest Money Deposit ($)</label>
          <input type="text" className={INPUT_CLASS} placeholder="5,000" value={form.earnestMoney} onChange={update('earnestMoney')} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className={LABEL_CLASS}>Inspection Period (days)</label>
          <input type="number" className={INPUT_CLASS} placeholder="8" value={form.inspectionDays} onChange={update('inspectionDays')} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Closing Date</label>
          <input type="date" className={INPUT_CLASS} value={form.closingDate} onChange={update('closingDate')} />
        </div>
      </div>
      <div className="mb-4">
        <label className={LABEL_CLASS}>Contingencies</label>
        <textarea rows={3} className={INPUT_CLASS + ' resize-none'} placeholder="e.g., Financing contingency, appraisal contingency..." value={form.contingencies} onChange={update('contingencies')} />
      </div>
      <div className="mb-8">
        <label className={LABEL_CLASS}>Special Terms</label>
        <textarea rows={3} className={INPUT_CLASS + ' resize-none'} placeholder="e.g., Seller to leave all appliances..." value={form.specialTerms} onChange={update('specialTerms')} />
      </div>

      <div className="flex justify-end">
        <Button variant="gold" onClick={onNext}>
          <span className="flex items-center gap-2">
            Next: Review Contract <ArrowRight size={16} />
          </span>
        </Button>
      </div>
    </ShojiCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 2: Review                                                    */
/* ------------------------------------------------------------------ */

function StepReview({ form, onNext, onBack }) {
  const fullAddress = [form.propertyAddress, form.city, form.state, form.zip]
    .filter(Boolean)
    .join(', ')

  const today = formatDisplayDate(todayString())

  return (
    <ShojiCard hover={false} className="p-6 sm:p-8">
      <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-5">Contract Preview</h3>

      {/* Document preview — light background like printed paper */}
      <div className="bg-white text-gray-900 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-lg font-serif text-sm leading-relaxed">
        <h2 className="text-center text-lg font-bold tracking-wide mb-6 uppercase">
          Purchase and Sale Agreement
        </h2>

        <p className="mb-4">
          This Agreement is made on <strong>{today}</strong> between:
        </p>

        <div className="mb-4 pl-4 border-l-2 border-gray-300">
          <p className="mb-1">
            <strong>BUYER:</strong> {form.buyerName || '_______________'}
          </p>
          <p className="text-gray-600 text-xs mb-3">
            {form.buyerEmail || '_______________'} | {form.buyerPhone || '_______________'}
          </p>
          <p className="mb-1">
            <strong>SELLER:</strong> {form.sellerName || '_______________'}
          </p>
          <p className="text-gray-600 text-xs">
            {form.sellerEmail || '_______________'} | {form.sellerPhone || '_______________'}
          </p>
        </div>

        <p className="mb-6">
          <strong>PROPERTY:</strong> {fullAddress || '_______________'}
        </p>

        <h3 className="font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 mb-4">
          Terms and Conditions
        </h3>

        <div className="space-y-4">
          <p>
            <strong>1. PURCHASE PRICE:</strong> {formatCurrency(form.purchasePrice)}
          </p>

          <p>
            <strong>2. EARNEST MONEY:</strong> Buyer shall deposit{' '}
            {formatCurrency(form.earnestMoney)} as earnest money within 3 business days of mutual
            execution.
          </p>

          <p>
            <strong>3. INSPECTION PERIOD:</strong> Buyer shall have{' '}
            {form.inspectionDays || '8'} business days from the date of mutual execution to
            conduct inspections.
          </p>

          <p>
            <strong>4. CLOSING:</strong> Closing shall occur on or before{' '}
            {formatDisplayDate(form.closingDate)}.
          </p>

          <div>
            <p className="font-bold">5. CONTINGENCIES:</p>
            <p className="pl-4 whitespace-pre-wrap">{form.contingencies || 'None'}</p>
          </div>

          <div>
            <p className="font-bold">6. SPECIAL TERMS:</p>
            <p className="pl-4 whitespace-pre-wrap">{form.specialTerms || 'None'}</p>
          </div>

          <p>
            <strong>7.</strong> This agreement is subject to the terms and conditions outlined herein.
          </p>
        </div>

        {/* Signature lines */}
        <div className="mt-10 grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Buyer Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Date</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-8">
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Seller Signature</p>
          </div>
          <div>
            <div className="border-b border-gray-400 mb-1 h-8" />
            <p className="text-xs text-gray-500">Date</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <span className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </span>
        </Button>
        <Button variant="gold" onClick={onNext}>
          <span className="flex items-center gap-2">
            Next: Sign <ArrowRight size={16} />
          </span>
        </Button>
      </div>
    </ShojiCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 3: Signature                                                 */
/* ------------------------------------------------------------------ */

function StepSign({ onNext, onBack, signatureData, setSignatureData }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [sigMode, setSigMode] = useState('draw') // 'draw' | 'type'
  const [typedName, setTypedName] = useState('')
  const [signDate, setSignDate] = useState(todayString())

  /* -- Canvas drawing handlers -- */
  const getPos = useCallback((e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const startDrawing = useCallback(
    (e) => {
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      setIsDrawing(true)
    },
    [getPos]
  )

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return
      e.preventDefault()
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      const pos = getPos(e)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#c9a96e'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    },
    [isDrawing, getPos]
  )

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }, [])

  const handleFinalize = () => {
    if (sigMode === 'draw') {
      const canvas = canvasRef.current
      if (canvas) {
        setSignatureData({ type: 'draw', data: canvas.toDataURL(), date: signDate })
      }
    } else {
      setSignatureData({ type: 'type', data: typedName, date: signDate })
    }
    onNext()
  }

  return (
    <ShojiCard hover={false} className="p-6 sm:p-8">
      <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-6">Your Signature</h3>

      {/* Mode toggle tabs */}
      <div className="flex gap-1 mb-6 bg-bg-elevated rounded-xl p-1 w-fit">
        <button
          onClick={() => setSigMode('draw')}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-heading font-medium tracking-[0.05em] transition-all duration-200
            ${sigMode === 'draw'
              ? 'bg-gold/15 text-gold border border-gold/30'
              : 'text-text-dim hover:text-text-primary'
            }
          `}
        >
          <Pen size={15} /> Draw
        </button>
        <button
          onClick={() => setSigMode('type')}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-heading font-medium tracking-[0.05em] transition-all duration-200
            ${sigMode === 'type'
              ? 'bg-gold/15 text-gold border border-gold/30'
              : 'text-text-dim hover:text-text-primary'
            }
          `}
        >
          <Type size={15} /> Type
        </button>
      </div>

      <AnimatePresence mode="wait">
        {sigMode === 'draw' ? (
          <motion.div
            key="draw"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full max-w-[400px] h-[150px] border border-gold-dim/[0.15] rounded-xl bg-bg-elevated cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <p className="text-xs text-text-muted mt-2">
                Draw your signature above using your mouse or touchscreen
              </p>
            </div>

            {/* Clear button */}
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <span className="flex items-center gap-1.5">
                  <RotateCcw size={14} /> Clear
                </span>
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="type"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <label className={LABEL_CLASS}>Type your full name</label>
              <input
                className={INPUT_CLASS + ' max-w-md'}
                placeholder="John Smith"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
              />
            </div>

            {/* Live preview */}
            {typedName && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-5 px-6 py-4 bg-bg-elevated rounded-xl border border-gold-dim/[0.15] max-w-md"
              >
                <p className="text-xs font-heading font-semibold text-text-muted tracking-[0.08em] uppercase mb-2">Signature Preview</p>
                <p className="text-3xl text-gold font-display">
                  {typedName}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date */}
      <div className="mt-8">
        <div className="katana-line my-4" />
        <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-4">Date</h3>
        <input
          type="date"
          className={INPUT_CLASS + ' max-w-xs'}
          value={signDate}
          onChange={(e) => setSignDate(e.target.value)}
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          <span className="flex items-center gap-2">
            <ArrowLeft size={16} /> Back
          </span>
        </Button>
        <Button variant="gold" onClick={handleFinalize}>
          <span className="flex items-center gap-2">
            <Pen size={16} /> Sign & Finalize
          </span>
        </Button>
      </div>
    </ShojiCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Step 4: Export                                                     */
/* ------------------------------------------------------------------ */

function StepExport({ form, signatureData, onReset }) {
  const fullAddress = [form.propertyAddress, form.city, form.state, form.zip]
    .filter(Boolean)
    .join(', ')

  const today = formatDisplayDate(todayString())

  return (
    <div className="space-y-8">
      {/* Success banner */}
      <ShojiCard hover={false} glow className="p-8 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.15 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4"
        >
          <CheckCircle size={48} className="text-success" />
        </motion.div>
        <h2 className="font-display text-2xl text-text-primary mb-2">
          Contract Signed Successfully!
        </h2>
        <p className="text-text-dim text-sm max-w-lg mx-auto">
          Purchase agreement for <span className="text-gold">{fullAddress || 'the property'}</span>{' '}
          has been signed and is ready to send.
        </p>
      </ShojiCard>

      {/* Signed contract preview */}
      <ShojiCard hover={false} className="p-6 sm:p-8">
        <h3 className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-4">Signed Contract</h3>

        <div className="bg-white text-gray-900 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto shadow-lg font-serif text-sm leading-relaxed">
          <h2 className="text-center text-lg font-bold tracking-wide mb-6 uppercase">
            Purchase and Sale Agreement
          </h2>

          <p className="mb-4">
            This Agreement is made on <strong>{today}</strong> between:
          </p>

          <div className="mb-4 pl-4 border-l-2 border-gray-300">
            <p className="mb-1">
              <strong>BUYER:</strong> {form.buyerName || '_______________'}
            </p>
            <p className="text-gray-600 text-xs mb-3">
              {form.buyerEmail || '_______________'} | {form.buyerPhone || '_______________'}
            </p>
            <p className="mb-1">
              <strong>SELLER:</strong> {form.sellerName || '_______________'}
            </p>
            <p className="text-gray-600 text-xs">
              {form.sellerEmail || '_______________'} | {form.sellerPhone || '_______________'}
            </p>
          </div>

          <p className="mb-6">
            <strong>PROPERTY:</strong> {fullAddress || '_______________'}
          </p>

          <h3 className="font-bold text-sm uppercase tracking-wide border-b border-gray-300 pb-1 mb-4">
            Terms and Conditions
          </h3>

          <div className="space-y-4">
            <p>
              <strong>1. PURCHASE PRICE:</strong> {formatCurrency(form.purchasePrice)}
            </p>
            <p>
              <strong>2. EARNEST MONEY:</strong> Buyer shall deposit{' '}
              {formatCurrency(form.earnestMoney)} as earnest money within 3 business days of mutual execution.
            </p>
            <p>
              <strong>3. INSPECTION PERIOD:</strong> Buyer shall have{' '}
              {form.inspectionDays || '8'} business days from the date of mutual execution to conduct inspections.
            </p>
            <p>
              <strong>4. CLOSING:</strong> Closing shall occur on or before{' '}
              {formatDisplayDate(form.closingDate)}.
            </p>
            <div>
              <p className="font-bold">5. CONTINGENCIES:</p>
              <p className="pl-4 whitespace-pre-wrap">{form.contingencies || 'None'}</p>
            </div>
            <div>
              <p className="font-bold">6. SPECIAL TERMS:</p>
              <p className="pl-4 whitespace-pre-wrap">{form.specialTerms || 'None'}</p>
            </div>
            <p>
              <strong>7.</strong> This agreement is subject to the terms and conditions outlined herein.
            </p>
          </div>

          {/* Signed signature lines */}
          <div className="mt-10 grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 mb-1 h-10 flex items-end pb-1">
                {signatureData?.type === 'draw' && signatureData.data ? (
                  <img src={signatureData.data} alt="Buyer Signature" className="h-10 object-contain" />
                ) : signatureData?.type === 'type' && signatureData.data ? (
                  <span className="text-2xl text-gray-800 font-display">
                    {signatureData.data}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-gray-500">Buyer Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-1 h-10 flex items-end pb-1">
                <span className="text-sm text-gray-700">
                  {signatureData?.date ? formatDisplayDate(signatureData.date) : ''}
                </span>
              </div>
              <p className="text-xs text-gray-500">Date</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-8">
            <div>
              <div className="border-b border-gray-400 mb-1 h-10" />
              <p className="text-xs text-gray-500">Seller Signature</p>
            </div>
            <div>
              <div className="border-b border-gray-400 mb-1 h-10" />
              <p className="text-xs text-gray-500">Date</p>
            </div>
          </div>
        </div>
      </ShojiCard>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button variant="gold">
          <span className="flex items-center gap-2">
            <Download size={16} /> Download as PDF
          </span>
        </Button>
        <div className="flex flex-col items-center">
          <Button variant="outline">
            <span className="flex items-center gap-2">
              <Mail size={16} /> Send via Email
            </span>
          </Button>
          <span className="text-xs text-text-muted mt-1">(Gmail integration coming soon)</span>
        </div>
        <Button variant="outline" onClick={onReset}>
          <span className="flex items-center gap-2">
            <RotateCcw size={16} /> Generate Another
          </span>
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Contract History Table                                            */
/* ------------------------------------------------------------------ */

function ContractHistory() {
  return (
    <div className="mt-12">
      <h2 className="font-display text-xl text-text-primary mb-5">Recent <span className="brush-underline">Contracts</span></h2>
      <ShojiCard hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gold-dim/[0.15]">
                <th className="text-left px-5 py-3.5 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                  Date
                </th>
                <th className="text-left px-5 py-3.5 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                  Property
                </th>
                <th className="text-left px-5 py-3.5 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                  Buyer / Seller
                </th>
                <th className="text-left px-5 py-3.5 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 font-heading text-xs font-semibold tracking-[0.1em] uppercase text-text-dim">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-gold-dim/[0.08] last:border-0 hover:bg-gold/[0.03] transition-colors"
                >
                  <td className="px-5 py-4 font-mono text-text-dim whitespace-nowrap">{row.date}</td>
                  <td className="px-5 py-4 text-text-primary font-medium">{row.property}</td>
                  <td className="px-5 py-4 text-text-dim">
                    {row.buyer} / {row.seller}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${row.status === 'Signed'
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-warning/10 text-warning border border-warning/20'
                        }
                      `}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-text-dim hover:text-gold transition-colors" title="Download">
                        <Download size={15} />
                      </button>
                      {row.status === 'Draft' && (
                        <button className="text-text-dim hover:text-gold transition-colors" title="Edit">
                          <Pen size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ShojiCard>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

const pageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.2, ease: 'easeIn' } },
}

export default function ContractGenerator() {
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState(INITIAL_FORM)
  const [signatureData, setSignatureData] = useState(null)

  const goNext = () => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))
  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0))
  const handleReset = () => {
    setCurrentStep(0)
    setForm(INITIAL_FORM)
    setSignatureData(null)
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1200px] mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FilePen size={28} className="text-gold" />
          <h1 className="font-display text-3xl text-text-primary">Contract <span className="brush-underline">Generator</span></h1>
        </div>
        <p className="text-text-dim text-base max-w-2xl">
          Build, sign, and send purchase agreements in minutes. A complete contract workflow from deal info to export.
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator currentStep={currentStep} />

      {/* Step content */}
      <AnimatePresence mode="wait">
        {currentStep === 0 && (
          <motion.div key="step-0" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepDealInfo form={form} setForm={setForm} onNext={goNext} />
          </motion.div>
        )}
        {currentStep === 1 && (
          <motion.div key="step-1" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepReview form={form} onNext={goNext} onBack={goBack} />
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div key="step-2" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepSign onNext={goNext} onBack={goBack} signatureData={signatureData} setSignatureData={setSignatureData} />
          </motion.div>
        )}
        {currentStep === 3 && (
          <motion.div key="step-3" variants={stepVariants} initial="enter" animate="center" exit="exit">
            <StepExport form={form} signatureData={signatureData} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contract History — always visible */}
      <ContractHistory />
    </motion.div>
  )
}
