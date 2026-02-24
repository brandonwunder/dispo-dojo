import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Upload, X, FileText, ChevronDown } from 'lucide-react'
import WoodPanel from '../components/WoodPanel'
import Button from '../components/Button'

const conditionOptions = ['Good', 'Fair', 'Needs Repair', 'Major Issues']
const conditionShort = ['Good', 'Fair', 'Needs Repair']

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
}

/* ---------- reusable styled input ---------- */
const inputClass =
  'bg-bg-card border border-gold-dim/20 rounded-sm px-4 py-3 text-parchment placeholder:text-text-muted font-body text-sm focus:outline-none focus:border-gold/50 transition-colors w-full'

/* ---------- label class ---------- */
const labelClass =
  'block font-heading text-gold-dim tracking-wide uppercase text-xs font-semibold mb-1.5'

function SelectInput({ value, onChange, options, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled className="bg-bg-card text-text-muted">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-bg-card text-parchment">
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

/* ---------- file drop zone ---------- */
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
          wood-panel transition-all duration-200
          ${
            dragging
              ? 'border-gold bg-gold/5'
              : 'border-gold-dim/20 hover:border-gold-dim/40 hover:bg-gold/[0.03]'
          }
        `}
      >
        <Upload size={28} className="mx-auto mb-2 text-gold-dim" />
        <p className="text-sm text-parchment">
          Drop files here or{' '}
          <span className="text-gold font-medium">click to browse</span>
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
              className="flex items-center gap-2 bg-bg-card border border-gold-dim/20 rounded-sm px-3 py-2 text-sm text-parchment"
            >
              <FileText size={14} className="text-gold shrink-0" />
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

/* ---------- wax seal section header ---------- */
function SectionHeader({ children, index, number }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="flex items-center gap-3 mb-5 mt-2"
    >
      {/* Red wax seal circle with section number */}
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hanko-seal">
        <span className="text-parchment font-heading font-bold text-sm leading-none">
          {number}
        </span>
      </div>
      <h3 className="font-heading text-sm font-semibold tracking-widest uppercase text-parchment">
        {children}
      </h3>
    </motion.div>
  )
}

/* ================================================================ */
/*  MAIN COMPONENT                                                  */
/* ================================================================ */
export default function Underwriting() {
  const [dealType, setDealType] = useState('cash') // 'cash' | 'sub2'
  const [agreed, setAgreed] = useState(false)

  // form fields
  const [form, setForm] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
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
  })

  const [disclosures, setDisclosures] = useState([])
  const [mortgageStatement, setMortgageStatement] = useState([])
  const [additionalDocs, setAdditionalDocs] = useState([])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: wire to backend
    alert('Submitted for underwriting!')
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="relative max-w-3xl mx-auto pb-12"
    >
      {/* ---- Candlelight ambient glow ---- */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255, 154, 60, 0.08) 0%, transparent 50%)',
        }}
      />

      {/* ---- Page header ---- */}
      <motion.div variants={fadeUp} custom={0} className="relative z-10 mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-2">
          Free <span className="brush-underline">Underwriting</span>
        </h1>
        <p className="text-text-dim text-base">
          Submit properties for free underwriting analysis
        </p>
      </motion.div>

      {/* ---- Deal type toggle — scroll tube buttons ---- */}
      <motion.div variants={fadeUp} custom={1} className="relative z-10 grid grid-cols-2 gap-3 mb-6">
        <WoodPanel
          withRope
          hover
          onClick={() => setDealType('cash')}
          className={`cursor-pointer text-center transition-all duration-200 ${
            dealType === 'cash' ? 'border-b-2 border-b-gold' : ''
          }`}
        >
          <span
            className={`font-heading text-sm font-semibold tracking-widest uppercase transition-colors ${
              dealType === 'cash'
                ? 'text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Cash Deal
          </span>
        </WoodPanel>
        <WoodPanel
          withRope
          hover
          onClick={() => setDealType('sub2')}
          className={`cursor-pointer text-center transition-all duration-200 ${
            dealType === 'sub2' ? 'border-b-2 border-b-gold' : ''
          }`}
        >
          <span
            className={`font-heading text-sm font-semibold tracking-widest uppercase transition-colors ${
              dealType === 'sub2'
                ? 'text-gold'
                : 'text-text-dim hover:text-parchment'
            }`}
          >
            Subject-To (Sub2)
          </span>
        </WoodPanel>
      </motion.div>

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="relative z-10">
        <motion.div variants={fadeUp} custom={2}>
          <WoodPanel headerBar="Scroll Library — Underwriting Submission" hover={false}>
            <AnimatePresence mode="wait">
              <motion.div
                key={dealType}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={{
                  hidden: { opacity: 0, height: 0 },
                  visible: {
                    opacity: 1,
                    height: 'auto',
                    transition: { staggerChildren: 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }
                  }
                }}
              >
                {/* ===== Property Information ===== */}
                <SectionHeader index={0} number={1}>Property Information</SectionHeader>

                <motion.div variants={fadeUp} custom={1} className="space-y-4 mb-8">
                  <div>
                    <label className={labelClass}>Property Address</label>
                    <input
                      type="text"
                      placeholder="Property Address"
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
                        placeholder="State"
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
                      placeholder="ZIP Code"
                      value={form.zip}
                      onChange={set('zip')}
                      className={`${inputClass} sm:max-w-[200px]`}
                    />
                  </div>
                </motion.div>

                {/* ===== Property Condition (Cash deals only) ===== */}
                {dealType === 'cash' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                <div className="katana-line my-4" />
                <SectionHeader index={2} number={2}>Property Condition</SectionHeader>

                <motion.div variants={fadeUp} custom={3} className="space-y-4 mb-8">
                  {/* Foundation */}
                  <div>
                    <label className={labelClass}>Foundation Condition</label>
                    <SelectInput
                      value={form.foundation}
                      onChange={set('foundation')}
                      options={conditionOptions}
                      placeholder="Foundation Condition"
                    />
                  </div>
                  {(form.foundation === 'Needs Repair' || form.foundation === 'Major Issues') && (
                    <div>
                      <label className={labelClass}>Estimated Repair Cost</label>
                      <input
                        type="text"
                        placeholder="Estimated repair cost (optional)"
                        value={form.foundationRepairCost}
                        onChange={set('foundationRepairCost')}
                        className={`${inputClass} sm:max-w-[300px] ml-0 border-status-warning/40`}
                      />
                    </div>
                  )}

                  {/* Roof */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Roof Condition</label>
                      <SelectInput
                        value={form.roof}
                        onChange={set('roof')}
                        options={conditionOptions}
                        placeholder="Roof Condition"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Roof Age (years)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="Roof Age (years)"
                        value={form.roofAge}
                        onChange={set('roofAge')}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {(form.roof === 'Needs Repair' || form.roof === 'Major Issues') && (
                    <div>
                      <label className={labelClass}>Estimated Repair Cost</label>
                      <input
                        type="text"
                        placeholder="Estimated repair cost (optional)"
                        value={form.roofRepairCost}
                        onChange={set('roofRepairCost')}
                        className={`${inputClass} sm:max-w-[300px] ml-0 border-status-warning/40`}
                      />
                    </div>
                  )}

                  {/* AC / HVAC */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>AC / HVAC Condition</label>
                      <SelectInput
                        value={form.ac}
                        onChange={set('ac')}
                        options={conditionOptions}
                        placeholder="AC / HVAC Condition"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>AC Age (years)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="AC Age (years)"
                        value={form.acAge}
                        onChange={set('acAge')}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  {(form.ac === 'Needs Repair' || form.ac === 'Major Issues') && (
                    <div>
                      <label className={labelClass}>Estimated Repair Cost</label>
                      <input
                        type="text"
                        placeholder="Estimated repair cost (optional)"
                        value={form.acRepairCost}
                        onChange={set('acRepairCost')}
                        className={`${inputClass} sm:max-w-[300px] ml-0 border-status-warning/40`}
                      />
                    </div>
                  )}

                  {/* Electrical */}
                  <div>
                    <label className={labelClass}>Electrical Condition</label>
                    <SelectInput
                      value={form.electrical}
                      onChange={set('electrical')}
                      options={conditionShort}
                      placeholder="Electrical Condition"
                    />
                  </div>
                  {form.electrical === 'Needs Repair' && (
                    <div>
                      <label className={labelClass}>Estimated Repair Cost</label>
                      <input
                        type="text"
                        placeholder="Estimated repair cost (optional)"
                        value={form.electricalRepairCost}
                        onChange={set('electricalRepairCost')}
                        className={`${inputClass} sm:max-w-[300px] ml-0 border-status-warning/40`}
                      />
                    </div>
                  )}

                  {/* Plumbing */}
                  <div>
                    <label className={labelClass}>Plumbing Condition</label>
                    <SelectInput
                      value={form.plumbing}
                      onChange={set('plumbing')}
                      options={conditionShort}
                      placeholder="Plumbing Condition"
                    />
                  </div>
                  {form.plumbing === 'Needs Repair' && (
                    <div>
                      <label className={labelClass}>Estimated Repair Cost</label>
                      <input
                        type="text"
                        placeholder="Estimated repair cost (optional)"
                        value={form.plumbingRepairCost}
                        onChange={set('plumbingRepairCost')}
                        className={`${inputClass} sm:max-w-[300px] ml-0 border-status-warning/40`}
                      />
                    </div>
                  )}
                </motion.div>

                {/* ===== Documents (Seller Disclosures) - Cash deals only ===== */}
                <div className="katana-line my-4" />
                <SectionHeader index={4} number={3}>Documents</SectionHeader>

                <motion.div variants={fadeUp} custom={5} className="mb-8">
                  <FileDropZone
                    label="Seller Disclosures"
                    files={disclosures}
                    setFiles={setDisclosures}
                    accept=".pdf,.doc,.docx,.jpg,.png"
                  />
                </motion.div>
                </motion.div>
                )}

                {/* ===== Sub2 extras ===== */}
                {dealType === 'sub2' && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="katana-line my-4" />
                    <SectionHeader index={6} number={2}>Mortgage Statement</SectionHeader>
                    <motion.div variants={fadeUp} custom={7} className="mb-8">
                      <FileDropZone
                        label="Mortgage Statement"
                        required
                        files={mortgageStatement}
                        setFiles={setMortgageStatement}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                    </motion.div>

                    <div className="katana-line my-4" />
                    <SectionHeader index={8} number={3}>Additional Documents</SectionHeader>
                    <motion.div variants={fadeUp} custom={9} className="mb-8">
                      <FileDropZone
                        label="Additional Documents"
                        note="Solar statements, key lock statements, water softener liens, or any other encumbrances"
                        files={additionalDocs}
                        setFiles={setAdditionalDocs}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </WoodPanel>
        </motion.div>

        {/* ---- Legal agreement ---- */}
        <motion.div variants={fadeUp} custom={10} className="mt-6">
          <WoodPanel hover={false}>
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-sm bg-gold/10 border border-gold-dim/20">
                <Shield size={18} className="text-gold" />
              </div>
              <div className="flex-1">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 shrink-0 w-4 h-4 accent-gold cursor-pointer"
                  />
                  <span className="text-sm text-text-dim leading-relaxed group-hover:text-parchment transition-colors">
                    By checking this box, you agree that if this property goes under contract,
                    Dispo Dojo has first right to locate a buyer and dispo the deal during the
                    inspection period (minimum 8 business days). This grants Dispo Dojo the
                    exclusive ability to market and assign this deal during the inspection window.
                  </span>
                </label>
              </div>
            </div>
          </WoodPanel>
        </motion.div>

        {/* ---- Submit ---- */}
        <motion.div variants={fadeUp} custom={11} className="mt-6">
          <button
            type="submit"
            disabled={!agreed}
            className={`
              w-full py-4 text-base rounded-sm font-heading font-bold tracking-widest uppercase
              flex items-center justify-center gap-2
              transition-all duration-300
              ${
                agreed
                  ? 'gold-shimmer text-ink cursor-pointer hover:shadow-[0_4px_30px_-4px_rgba(212,168,83,0.6)]'
                  : 'bg-bg-card text-text-muted border border-gold-dim/20 cursor-not-allowed opacity-50'
              }
            `}
          >
            <Shield size={18} />
            Submit for Underwriting
          </button>
        </motion.div>
      </form>
    </motion.div>
  )
}
