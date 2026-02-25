import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Upload, X, FileText, ChevronDown, ChevronLeft, ChevronRight,
  DollarSign, Home, ClipboardList, FolderOpen, CheckCircle2,
  Building2, Landmark, MapPin, BedDouble, Bath, Ruler, Calendar,
  Zap, Droplets, Wrench, ImagePlus, Link
} from 'lucide-react'

/* ─── Animation Variants ───────────────────────────────────────────────────── */

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
}

const stepVariants = {
  enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } }),
}

/* ─── Condition Options ────────────────────────────────────────────────────── */

const conditionOptions = ['Good', 'Fair', 'Needs Repair', 'Major Issues']
const conditionShort = ['Good', 'Fair', 'Needs Repair']

/* ─── Reusable Styles ──────────────────────────────────────────────────────── */

const inputClass =
  'bg-[#0B0F14] border border-gold-dim/20 rounded-sm px-4 py-3 text-parchment placeholder:text-text-muted font-body text-sm focus:outline-none focus:border-cyan/50 transition-colors w-full'

const labelClass =
  'block font-heading text-text-dim tracking-wide uppercase text-xs font-semibold mb-1.5'

/* ─── Glass Card Wrapper ───────────────────────────────────────────────────── */

function GlassCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-sm border border-gold-dim/20 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(180deg, #111B24 0%, #0E1720 100%)' }}
    >
      {children}
    </div>
  )
}

/* ─── Select Input ─────────────────────────────────────────────────────────── */

function SelectInput({ value, onChange, options, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled className="bg-[#0B0F14] text-text-muted">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0B0F14] text-parchment">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  )
}

/* ─── Condition Radio Group ────────────────────────────────────────────────── */

function ConditionRadioGroup({ label, value, onChange, options, icon: Icon }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && <Icon size={14} className="text-cyan" />}
        <label className="font-heading text-text-dim tracking-wide uppercase text-xs font-semibold">
          {label}
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt
          const isRepair = opt === 'Needs Repair' || opt === 'Major Issues'
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`
                px-3.5 py-2 rounded-sm text-xs font-heading tracking-wider uppercase border
                transition-colors duration-200
                ${selected
                  ? isRepair
                    ? 'border-crimson/60 bg-crimson/15 text-crimson-bright'
                    : 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-gold-dim/15 bg-transparent text-text-dim hover:border-gold-dim/30 hover:text-parchment'
                }
              `}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── File Drop Zone ───────────────────────────────────────────────────────── */

function FileDropZone({ label, required, note, files, setFiles, accept }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (incoming) => {
    const list = Array.from(incoming)
    setFiles((prev) => [...prev, ...list])
  }

  const remove = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-crimson-bright ml-1">*</span>}
      </label>
      {note && <p className="text-xs text-text-dim mb-2">{note}</p>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        className={`
          relative cursor-pointer rounded-sm border-2 border-dashed px-6 py-10 text-center
          transition-colors duration-200
          ${
            dragging
              ? 'border-cyan bg-cyan/5'
              : 'border-gold-dim/20 hover:border-gold-dim/40 hover:bg-white/[0.02]'
          }
        `}
        style={{ background: dragging ? undefined : 'rgba(11,15,20,0.5)' }}
      >
        <Upload size={28} className="mx-auto mb-2 text-text-dim" />
        <p className="text-sm text-parchment">
          Drop files here or{' '}
          <span className="text-cyan font-medium">click to browse</span>
        </p>
        <p className="text-xs text-text-muted mt-1">
          Accepts {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-[#0B0F14] border border-gold-dim/20 rounded-sm px-3 py-2 text-sm text-parchment"
            >
              <FileText size={14} className="text-cyan shrink-0" />
              <span className="truncate flex-1">{f.name}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-text-muted hover:text-crimson-bright transition-colors"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Progress Bar ─────────────────────────────────────────────────────────── */

function ProgressBar({ currentStep, totalSteps, stepLabels }) {
  return (
    <div className="px-6 pt-5 pb-2">
      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-white/5">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: i < currentStep ? '100%' : i === currentStep ? '50%' : '0%',
              }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                background: i < currentStep
                  ? 'linear-gradient(90deg, #00C6FF, #A855F7)'
                  : i === currentStep
                  ? 'linear-gradient(90deg, #00C6FF, #00C6FF)'
                  : 'transparent',
              }}
            />
          </div>
        ))}
      </div>
      {/* Step label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-heading text-text-dim tracking-widest uppercase">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-[10px] font-heading text-cyan tracking-widest uppercase">
          {stepLabels[currentStep]}
        </span>
      </div>
    </div>
  )
}

/* ─── Review Summary Row ───────────────────────────────────────────────────── */

function ReviewRow({ label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between py-2 border-b border-gold-dim/10 last:border-0">
      <span className="text-xs font-heading text-text-dim tracking-wide uppercase shrink-0 mr-4">{label}</span>
      <span className="text-sm text-parchment font-body text-right">{value}</span>
    </div>
  )
}

/* ================================================================ */
/*  WIZARD MODAL                                                      */
/* ================================================================ */

function WizardModal({ dealType, onClose }) {
  const isSub2 = dealType === 'sub2'
  const totalSteps = 5
  const stepLabels = ['Property Address', 'Property Details', 'Property Condition', 'Documents & Notes', 'Review & Submit']

  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [agreed, setAgreed] = useState(false)

  // Form state — all original fields preserved + new detail fields
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    beds: '',
    baths: '',
    sqft: '',
    yearBuilt: '',
    lotSize: '',
    // Sub-To specific
    loanBalance: '',
    interestRate: '',
    monthlyPayment: '',
    loanType: '',
    // Condition
    foundation: '',
    foundationRepairCost: '',
    roof: '',
    roofAge: '',
    roofRepairCost: '',
    ac: '',
    acAge: '',
    acRepairCost: '',
    electrical: '',
    electricalRepairCost: '',
    plumbing: '',
    plumbingRepairCost: '',
    // Notes
    notes: '',
  })

  const [disclosures, setDisclosures] = useState([])
  const [mortgageStatement, setMortgageStatement] = useState([])
  const [additionalDocs, setAdditionalDocs] = useState([])
  const [propertyPhotos, setPropertyPhotos] = useState([])
  const [googleDriveLink, setGoogleDriveLink] = useState('')

  const set = useCallback((key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value })), [])
  const setDirect = useCallback((key, val) => setForm((f) => ({ ...f, [key]: val })), [])

  const goNext = () => {
    if (step < totalSteps - 1) {
      setDirection(1)
      setStep((s) => s + 1)
    }
  }

  const goBack = () => {
    if (step > 0) {
      setDirection(-1)
      setStep((s) => s - 1)
    }
  }

  const handleSubmit = () => {
    const payload = {
      dealType: isSub2 ? 'sub2' : 'cash',
      ...form,
      propertyPhotos: propertyPhotos.map((f) => f.name),
      googleDriveLink,
      disclosures: disclosures.map((f) => f.name),
      mortgageStatement: mortgageStatement.map((f) => f.name),
      additionalDocs: additionalDocs.map((f) => f.name),
      agreed,
    }
    console.log('Underwriting submission:', payload)
    alert('Submitted for underwriting!')
    onClose()
  }

  /* ── Step Content Renderers ── */

  const renderStep0 = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Property Address</label>
        <input
          type="text"
          placeholder="123 Main Street"
          value={form.address}
          onChange={set('address')}
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>City</label>
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={set('city')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>State</label>
          <input
            type="text"
            placeholder="TX"
            value={form.state}
            onChange={set('state')}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>ZIP Code</label>
        <input
          type="text"
          placeholder="78201"
          value={form.zip}
          onChange={set('zip')}
          className={`${inputClass} sm:max-w-[200px]`}
        />
      </div>
    </div>
  )

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Beds</label>
          <input
            type="number"
            min="0"
            placeholder="3"
            value={form.beds}
            onChange={set('beds')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Baths</label>
          <input
            type="number"
            min="0"
            step="0.5"
            placeholder="2"
            value={form.baths}
            onChange={set('baths')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Sqft</label>
          <input
            type="number"
            min="0"
            placeholder="1,500"
            value={form.sqft}
            onChange={set('sqft')}
            className={inputClass}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Year Built</label>
          <input
            type="number"
            min="1800"
            max="2030"
            placeholder="2005"
            value={form.yearBuilt}
            onChange={set('yearBuilt')}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Lot Size</label>
          <input
            type="text"
            placeholder="0.25 acres"
            value={form.lotSize}
            onChange={set('lotSize')}
            className={inputClass}
          />
        </div>
      </div>

      {/* Sub-To loan fields */}
      {isSub2 && (
        <>
          <div className="katana-line my-5" />
          <div className="flex items-center gap-2 mb-3">
            <Landmark size={14} className="text-purple-400" />
            <span className="text-xs font-heading text-purple-400 tracking-widest uppercase font-semibold">
              Existing Loan Details
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Loan Balance</label>
              <input
                type="text"
                placeholder="$185,000"
                value={form.loanBalance}
                onChange={set('loanBalance')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Interest Rate</label>
              <input
                type="text"
                placeholder="3.25%"
                value={form.interestRate}
                onChange={set('interestRate')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Monthly Payment</label>
              <input
                type="text"
                placeholder="$1,250"
                value={form.monthlyPayment}
                onChange={set('monthlyPayment')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Loan Type</label>
              <SelectInput
                value={form.loanType}
                onChange={set('loanType')}
                options={['FHA', 'VA', 'Conventional', 'USDA', 'Other']}
                placeholder="Select loan type"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-5">
      {/* Foundation */}
      <ConditionRadioGroup
        label="Foundation"
        icon={Building2}
        value={form.foundation}
        onChange={(val) => setDirect('foundation', val)}
        options={conditionOptions}
      />
      {(form.foundation === 'Needs Repair' || form.foundation === 'Major Issues') && (
        <div className="ml-6">
          <label className={labelClass}>Est. Repair Cost</label>
          <input
            type="text"
            placeholder="$5,000"
            value={form.foundationRepairCost}
            onChange={set('foundationRepairCost')}
            className={`${inputClass} sm:max-w-[280px] border-crimson/30`}
          />
        </div>
      )}

      <div className="border-t border-gold-dim/10" />

      {/* Roof */}
      <ConditionRadioGroup
        label="Roof"
        icon={Home}
        value={form.roof}
        onChange={(val) => setDirect('roof', val)}
        options={conditionOptions}
      />
      <div className="ml-6">
        <label className={labelClass}>Roof Age (years)</label>
        <input
          type="number"
          min="0"
          placeholder="8"
          value={form.roofAge}
          onChange={set('roofAge')}
          className={`${inputClass} sm:max-w-[160px]`}
        />
      </div>
      {(form.roof === 'Needs Repair' || form.roof === 'Major Issues') && (
        <div className="ml-6">
          <label className={labelClass}>Est. Repair Cost</label>
          <input
            type="text"
            placeholder="$8,000"
            value={form.roofRepairCost}
            onChange={set('roofRepairCost')}
            className={`${inputClass} sm:max-w-[280px] border-crimson/30`}
          />
        </div>
      )}

      <div className="border-t border-gold-dim/10" />

      {/* AC / HVAC */}
      <ConditionRadioGroup
        label="AC / HVAC"
        icon={Zap}
        value={form.ac}
        onChange={(val) => setDirect('ac', val)}
        options={conditionOptions}
      />
      <div className="ml-6">
        <label className={labelClass}>AC Age (years)</label>
        <input
          type="number"
          min="0"
          placeholder="5"
          value={form.acAge}
          onChange={set('acAge')}
          className={`${inputClass} sm:max-w-[160px]`}
        />
      </div>
      {(form.ac === 'Needs Repair' || form.ac === 'Major Issues') && (
        <div className="ml-6">
          <label className={labelClass}>Est. Repair Cost</label>
          <input
            type="text"
            placeholder="$4,000"
            value={form.acRepairCost}
            onChange={set('acRepairCost')}
            className={`${inputClass} sm:max-w-[280px] border-crimson/30`}
          />
        </div>
      )}

      <div className="border-t border-gold-dim/10" />

      {/* Electrical */}
      <ConditionRadioGroup
        label="Electrical"
        icon={Zap}
        value={form.electrical}
        onChange={(val) => setDirect('electrical', val)}
        options={conditionShort}
      />
      {form.electrical === 'Needs Repair' && (
        <div className="ml-6">
          <label className={labelClass}>Est. Repair Cost</label>
          <input
            type="text"
            placeholder="$3,000"
            value={form.electricalRepairCost}
            onChange={set('electricalRepairCost')}
            className={`${inputClass} sm:max-w-[280px] border-crimson/30`}
          />
        </div>
      )}

      <div className="border-t border-gold-dim/10" />

      {/* Plumbing */}
      <ConditionRadioGroup
        label="Plumbing"
        icon={Droplets}
        value={form.plumbing}
        onChange={(val) => setDirect('plumbing', val)}
        options={conditionShort}
      />
      {form.plumbing === 'Needs Repair' && (
        <div className="ml-6">
          <label className={labelClass}>Est. Repair Cost</label>
          <input
            type="text"
            placeholder="$2,500"
            value={form.plumbingRepairCost}
            onChange={set('plumbingRepairCost')}
            className={`${inputClass} sm:max-w-[280px] border-crimson/30`}
          />
        </div>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* ── Property Photos (REQUIRED) ── */}
      <div>
        <div
          className="rounded-sm border px-4 py-3 mb-4 flex items-start gap-3"
          style={{
            borderColor: 'rgba(229,57,53,0.4)',
            background: 'linear-gradient(135deg, rgba(229,57,53,0.08) 0%, rgba(246,196,69,0.06) 100%)',
          }}
        >
          <div className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-sm bg-crimson/15 border border-crimson/30">
            <ImagePlus size={16} className="text-crimson-bright" />
          </div>
          <div>
            <p className="text-sm font-heading text-crimson-bright tracking-wide uppercase font-semibold">
              Property Photos Required
            </p>
            <p className="text-xs text-text-dim mt-1 leading-relaxed">
              We cannot underwrite a deal without property photos. Upload images below or provide a Google Drive link.
            </p>
          </div>
        </div>

        <FileDropZone
          label="Property Photos"
          required
          note="Upload photos of the property exterior, interior, and any areas of concern"
          files={propertyPhotos}
          setFiles={setPropertyPhotos}
          accept=".jpg,.jpeg,.png,.heic,.webp"
        />

        {/* OR divider */}
        <div className="flex items-center gap-4 my-5">
          <div className="flex-1 h-px bg-gold-dim/20" />
          <span className="text-xs font-heading text-text-dim tracking-widest uppercase">or</span>
          <div className="flex-1 h-px bg-gold-dim/20" />
        </div>

        {/* Google Drive Link */}
        <div>
          <label className={labelClass}>
            <span className="flex items-center gap-1.5">
              <Link size={12} className="text-cyan" />
              Google Drive Link
            </span>
          </label>
          <input
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={googleDriveLink}
            onChange={(e) => setGoogleDriveLink(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-text-muted mt-1.5">
            Paste a shared Google Drive folder link with your property photos
          </p>
        </div>
      </div>

      <div className="border-t border-gold-dim/10" />

      {/* Disclosures */}
      <FileDropZone
        label="Seller Disclosures"
        files={disclosures}
        setFiles={setDisclosures}
        accept=".pdf,.doc,.docx,.jpg,.png"
      />

      {/* Mortgage Statement (Sub-To) */}
      {isSub2 && (
        <FileDropZone
          label="Mortgage Statement"
          required
          files={mortgageStatement}
          setFiles={setMortgageStatement}
          accept=".pdf,.doc,.docx,.jpg,.png"
        />
      )}

      {/* Additional Documents (Sub-To) */}
      {isSub2 && (
        <FileDropZone
          label="Additional Documents"
          note="Solar statements, key lock statements, water softener liens, or any other encumbrances"
          files={additionalDocs}
          setFiles={setAdditionalDocs}
          accept=".pdf,.doc,.docx,.jpg,.png"
        />
      )}

      {/* Notes */}
      <div>
        <label className={labelClass}>Additional Notes</label>
        <textarea
          value={form.notes}
          onChange={set('notes')}
          placeholder="Any additional information about the property, seller motivation, timeline, etc."
          rows={4}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Legal Agreement */}
      <div
        className="rounded-sm border border-gold-dim/15 px-4 py-4"
        style={{ background: 'rgba(11,15,20,0.5)' }}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-sm bg-gold/10 border border-gold-dim/20">
            <Shield size={16} className="text-gold" />
          </div>
          <label className="flex items-start gap-3 cursor-pointer group flex-1">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 shrink-0 w-4 h-4 accent-gold cursor-pointer"
            />
            <span className="text-xs text-text-dim leading-relaxed group-hover:text-parchment transition-colors">
              By checking this box, you agree that if this property goes under contract,
              Dispo Dojo has first right to locate a buyer and dispo the deal during the
              inspection period (minimum 8 business days). This grants Dispo Dojo the
              exclusive ability to market and assign this deal during the inspection window.
            </span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => {
    const conditionLabel = (val) => val || '—'
    return (
      <div className="space-y-5">
        {/* Address Section */}
        <div>
          <h4 className="text-xs font-heading text-cyan tracking-widest uppercase mb-3 flex items-center gap-2">
            <MapPin size={12} /> Property Address
          </h4>
          <GlassCard className="px-4 py-3">
            <ReviewRow label="Address" value={form.address} />
            <ReviewRow label="City" value={form.city} />
            <ReviewRow label="State" value={form.state} />
            <ReviewRow label="ZIP" value={form.zip} />
          </GlassCard>
        </div>

        {/* Details Section */}
        <div>
          <h4 className="text-xs font-heading text-cyan tracking-widest uppercase mb-3 flex items-center gap-2">
            <Home size={12} /> Property Details
          </h4>
          <GlassCard className="px-4 py-3">
            <ReviewRow label="Beds" value={form.beds} />
            <ReviewRow label="Baths" value={form.baths} />
            <ReviewRow label="Sqft" value={form.sqft} />
            <ReviewRow label="Year Built" value={form.yearBuilt} />
            <ReviewRow label="Lot Size" value={form.lotSize} />
            {isSub2 && (
              <>
                <ReviewRow label="Loan Balance" value={form.loanBalance} />
                <ReviewRow label="Interest Rate" value={form.interestRate} />
                <ReviewRow label="Monthly Payment" value={form.monthlyPayment} />
                <ReviewRow label="Loan Type" value={form.loanType} />
              </>
            )}
          </GlassCard>
        </div>

        {/* Condition Section */}
        <div>
          <h4 className="text-xs font-heading text-cyan tracking-widest uppercase mb-3 flex items-center gap-2">
            <Wrench size={12} /> Property Condition
          </h4>
          <GlassCard className="px-4 py-3">
            <ReviewRow label="Foundation" value={conditionLabel(form.foundation)} />
            {form.foundationRepairCost && <ReviewRow label="  Repair Cost" value={form.foundationRepairCost} />}
            <ReviewRow label="Roof" value={`${conditionLabel(form.roof)}${form.roofAge ? ` (${form.roofAge} yrs)` : ''}`} />
            {form.roofRepairCost && <ReviewRow label="  Repair Cost" value={form.roofRepairCost} />}
            <ReviewRow label="AC / HVAC" value={`${conditionLabel(form.ac)}${form.acAge ? ` (${form.acAge} yrs)` : ''}`} />
            {form.acRepairCost && <ReviewRow label="  Repair Cost" value={form.acRepairCost} />}
            <ReviewRow label="Electrical" value={conditionLabel(form.electrical)} />
            {form.electricalRepairCost && <ReviewRow label="  Repair Cost" value={form.electricalRepairCost} />}
            <ReviewRow label="Plumbing" value={conditionLabel(form.plumbing)} />
            {form.plumbingRepairCost && <ReviewRow label="  Repair Cost" value={form.plumbingRepairCost} />}
          </GlassCard>
        </div>

        {/* Documents Section */}
        <div>
          <h4 className="text-xs font-heading text-cyan tracking-widest uppercase mb-3 flex items-center gap-2">
            <FolderOpen size={12} /> Documents & Notes
          </h4>
          <GlassCard className="px-4 py-3">
            <ReviewRow
              label="Property Photos"
              value={
                propertyPhotos.length > 0
                  ? `${propertyPhotos.length} photo${propertyPhotos.length !== 1 ? 's' : ''} uploaded`
                  : 'None uploaded'
              }
            />
            {googleDriveLink.trim() && (
              <ReviewRow label="Drive Link" value={googleDriveLink.trim()} />
            )}
            <ReviewRow
              label="Disclosures"
              value={disclosures.length > 0 ? disclosures.map((f) => f.name).join(', ') : 'None'}
            />
            {isSub2 && (
              <>
                <ReviewRow
                  label="Mortgage Statement"
                  value={mortgageStatement.length > 0 ? mortgageStatement.map((f) => f.name).join(', ') : 'None'}
                />
                <ReviewRow
                  label="Additional Docs"
                  value={additionalDocs.length > 0 ? additionalDocs.map((f) => f.name).join(', ') : 'None'}
                />
              </>
            )}
            <ReviewRow label="Notes" value={form.notes || 'None'} />
            <ReviewRow label="Agreement" value={agreed ? 'Accepted' : 'Not accepted'} />
          </GlassCard>
        </div>
      </div>
    )
  }

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        className="relative z-10 w-full max-w-xl max-h-[90vh] flex flex-col rounded-sm border border-gold-dim/25 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #111B24 0%, #0B0F14 100%)' }}
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: isSub2 ? 'rgba(127,0,255,0.15)' : 'rgba(0,198,255,0.12)',
                border: `1px solid ${isSub2 ? 'rgba(127,0,255,0.4)' : 'rgba(0,198,255,0.35)'}`,
              }}
            >
              {isSub2 ? (
                <Landmark size={14} className="text-purple-400" />
              ) : (
                <DollarSign size={14} className="text-cyan" />
              )}
            </div>
            <div>
              <h2 className="font-heading text-base text-parchment tracking-wide">
                {isSub2 ? 'Subject-To' : 'Cash Deal'} Underwriting
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-text-dim hover:text-parchment hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress Bar */}
        <ProgressBar currentStep={step} totalSteps={totalSteps} stepLabels={stepLabels} />

        {/* Step Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              {stepRenderers[step]()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Buttons */}
        <div className="px-6 py-4 border-t border-gold-dim/10 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm font-heading text-xs tracking-wider uppercase text-text-dim border border-gold-dim/20 hover:border-gold-dim/40 hover:text-parchment transition-colors duration-200"
            >
              <ChevronLeft size={14} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-sm font-heading text-xs tracking-wider uppercase text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson transition-colors duration-200 shadow-[0_0_20px_rgba(229,57,53,0.3)]"
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!agreed || (propertyPhotos.length === 0 && !googleDriveLink.trim())}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-sm font-heading text-xs tracking-wider uppercase
                transition-colors duration-200
                ${
                  agreed && (propertyPhotos.length > 0 || googleDriveLink.trim())
                    ? 'text-parchment bg-gradient-to-r from-crimson to-[#B3261E] hover:from-crimson-bright hover:to-crimson shadow-[0_0_24px_rgba(229,57,53,0.35)]'
                    : 'text-text-muted bg-white/5 border border-gold-dim/15 cursor-not-allowed opacity-50'
                }
              `}
            >
              <Shield size={14} /> Submit for Underwriting
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ================================================================ */
/*  MAIN PAGE COMPONENT                                               */
/* ================================================================ */

export default function Underwriting() {
  const [wizardOpen, setWizardOpen] = useState(null) // null | 'cash' | 'sub2'

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <img
          src="/underwriting-bg.png"
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
        className="max-w-[900px] mx-auto relative z-10"
      >
        {/* Hero header */}
        <motion.div variants={itemVariants}>
          <div className="text-center mb-8 max-w-[680px] mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div style={{ filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.7))' }}>
                <Shield size={36} style={{ color: '#00C6FF' }} />
              </div>
              <h1
                className="font-display text-4xl"
                style={{
                  color: '#F4F7FA',
                  textShadow: '0 2px 16px rgba(0,0,0,0.9), 0 0 40px rgba(11,15,20,0.8)',
                }}
              >
                Free Underwriting
              </h1>
            </div>
            <p className="text-sm mt-2" style={{ color: '#C8D1DA', maxWidth: '480px', lineHeight: 1.6, textAlign: 'center', margin: '8px auto 0' }}>
              Submit properties for free underwriting analysis
            </p>
          </div>
        </motion.div>

        {/* ── Info Banner ── */}
        <motion.div variants={itemVariants}>
          <GlassCard className="px-5 py-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-cyan animate-pulse shrink-0" />
              <p className="text-sm text-text-dim font-body">
                Choose your deal type to get started. Each wizard walks you through the submission step-by-step.
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Deal Type Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Cash Deal Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="cursor-pointer group"
            onClick={() => setWizardOpen('cash')}
          >
            <GlassCard className="p-6 h-full flex flex-col group-hover:border-cyan/40 transition-colors duration-200">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'rgba(0,198,255,0.1)',
                  border: '1px solid rgba(0,198,255,0.3)',
                  boxShadow: '0 0 24px rgba(0,198,255,0.15)',
                }}
              >
                <DollarSign size={24} className="text-cyan" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-lg text-parchment tracking-wide mb-2">
                Cash Deal
              </h3>
              <p className="text-sm text-text-dim font-body leading-relaxed mb-5 flex-1">
                Standard cash purchase underwriting. Submit property details, condition assessments,
                and seller disclosures for a full analysis.
              </p>

              {/* Bullet features */}
              <div className="space-y-2 mb-6">
                {['Property & condition review', 'Repair cost estimates', 'Document uploads'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-cyan shrink-0" />
                    <span className="text-xs text-text-dim font-body">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className="w-full py-3 rounded-sm font-heading text-xs tracking-widest uppercase flex items-center justify-center gap-2 border transition-colors duration-200"
                style={{
                  borderColor: 'rgba(0,198,255,0.3)',
                  color: '#00C6FF',
                  background: 'rgba(0,198,255,0.08)',
                }}
              >
                Start Cash Underwriting
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </GlassCard>
          </motion.div>

          {/* Subject-To Card */}
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="cursor-pointer group"
            onClick={() => setWizardOpen('sub2')}
          >
            <GlassCard className="p-6 h-full flex flex-col group-hover:border-purple-glow/40 transition-colors duration-200">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{
                  background: 'rgba(127,0,255,0.12)',
                  border: '1px solid rgba(127,0,255,0.35)',
                  boxShadow: '0 0 24px rgba(127,0,255,0.15)',
                }}
              >
                <Landmark size={24} className="text-purple-400" />
              </div>

              {/* Content */}
              <h3 className="font-heading text-lg text-parchment tracking-wide mb-2">
                Subject-To (Sub2)
              </h3>
              <p className="text-sm text-text-dim font-body leading-relaxed mb-5 flex-1">
                Subject-to existing financing. Includes loan details, mortgage statement upload,
                and additional encumbrance documents.
              </p>

              {/* Bullet features */}
              <div className="space-y-2 mb-6">
                {['Existing loan analysis', 'Mortgage statement review', 'Encumbrance documentation'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-purple-400 shrink-0" />
                    <span className="text-xs text-text-dim font-body">{item}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button
                className="w-full py-3 rounded-sm font-heading text-xs tracking-widest uppercase flex items-center justify-center gap-2 border transition-colors duration-200"
                style={{
                  borderColor: 'rgba(127,0,255,0.3)',
                  color: '#A855F7',
                  background: 'rgba(127,0,255,0.08)',
                }}
              >
                Start Sub-To Underwriting
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </GlassCard>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Wizard Modal ── */}
      <AnimatePresence>
        {wizardOpen && (
          <WizardModal
            dealType={wizardOpen}
            onClose={() => setWizardOpen(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
