import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Shield, Upload, X, FileText, ChevronDown } from 'lucide-react'
import ShojiCard from '../components/ShojiCard'
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
  'bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted input-calligraphy focus:outline-none transition-colors w-full font-body text-sm'

function SelectInput({ value, onChange, options, placeholder, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className={`${inputClass} appearance-none pr-10 cursor-pointer`}
      >
        <option value="" disabled className="bg-bg-elevated text-text-muted">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-bg-elevated text-text-primary">
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
      <label className="block text-xs font-heading font-semibold text-text-dim tracking-[0.08em] uppercase mb-2">
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
          relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center
          transition-all duration-200
          ${
            dragging
              ? 'border-gold bg-gold-glow'
              : 'border-gold-dim/20 bg-bg-elevated/50 hover:border-gold-dim/40 hover:bg-gold-glow'
          }
        `}
      >
        <Upload size={28} className="mx-auto mb-2 text-text-muted" />
        <p className="text-sm text-text-dim">
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
              className="flex items-center gap-2 bg-bg-elevated border border-gold-dim/[0.15] rounded-lg px-3 py-2 text-sm text-text-primary"
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

/* ---------- section header ---------- */
function SectionHeader({ children, index }) {
  return (
    <motion.h3
      variants={fadeUp}
      custom={index}
      className="font-heading text-sm font-semibold tracking-[0.1em] uppercase text-gold mb-4 mt-2"
    >
      {children}
    </motion.h3>
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
      className="max-w-3xl mx-auto pb-12"
    >
      {/* ---- Page header ---- */}
      <motion.div variants={fadeUp} custom={0} className="mb-8">
        <h1 className="font-display text-4xl text-text-primary mb-2">
          Free <span className="brush-underline">Underwriting</span>
        </h1>
        <p className="text-text-dim text-base">
          Submit properties for free underwriting analysis
        </p>
      </motion.div>

      {/* ---- Deal type toggle ---- */}
      <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 gap-3 mb-6">
        <ShojiCard
          hover
          glow={dealType === 'cash'}
          onClick={() => setDealType('cash')}
          className={`p-4 text-center cursor-pointer transition-all duration-200 ${
            dealType === 'cash'
              ? 'border-gold/30'
              : ''
          }`}
        >
          <span className={`font-heading text-sm font-semibold tracking-[0.08em] uppercase transition-colors ${
            dealType === 'cash' ? 'text-gold' : 'text-text-dim'
          }`}>
            Cash Deal
          </span>
        </ShojiCard>
        <ShojiCard
          hover
          glow={dealType === 'sub2'}
          onClick={() => setDealType('sub2')}
          className={`p-4 text-center cursor-pointer transition-all duration-200 ${
            dealType === 'sub2'
              ? 'border-gold/30'
              : ''
          }`}
        >
          <span className={`font-heading text-sm font-semibold tracking-[0.08em] uppercase transition-colors ${
            dealType === 'sub2' ? 'text-gold' : 'text-text-dim'
          }`}>
            Subject-To (Sub2)
          </span>
        </ShojiCard>
      </motion.div>

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit}>
        <motion.div variants={fadeUp} custom={2}>
          <ShojiCard hover={false} className="p-6 md:p-8">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {/* ===== Property Information ===== */}
              <SectionHeader index={0}>Property Information</SectionHeader>

              <motion.div variants={fadeUp} custom={1} className="space-y-4 mb-8">
                <input
                  type="text"
                  placeholder="Property Address"
                  value={form.address}
                  onChange={set('address')}
                  className={inputClass}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={form.city}
                    onChange={set('city')}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={form.state}
                    onChange={set('state')}
                    className={inputClass}
                  />
                </div>
                <input
                  type="text"
                  placeholder="ZIP Code"
                  value={form.zip}
                  onChange={set('zip')}
                  className={`${inputClass} sm:max-w-[200px]`}
                />
              </motion.div>

              {/* ===== Property Condition (Cash deals only) ===== */}
              {dealType === 'cash' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
              <div className="katana-line my-4" />
              <SectionHeader index={2}>Property Condition</SectionHeader>

              <motion.div variants={fadeUp} custom={3} className="space-y-4 mb-8">
                {/* Foundation */}
                <SelectInput
                  value={form.foundation}
                  onChange={set('foundation')}
                  options={conditionOptions}
                  placeholder="Foundation Condition"
                />
                {(form.foundation === 'Needs Repair' || form.foundation === 'Major Issues') && (
                  <input
                    type="text"
                    placeholder="Estimated repair cost (optional)"
                    value={form.foundationRepairCost}
                    onChange={set('foundationRepairCost')}
                    className={`${inputClass} sm:max-w-[300px] ml-0 border-warning/40`}
                  />
                )}

                {/* Roof */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectInput
                    value={form.roof}
                    onChange={set('roof')}
                    options={conditionOptions}
                    placeholder="Roof Condition"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Roof Age (years)"
                    value={form.roofAge}
                    onChange={set('roofAge')}
                    className={inputClass}
                  />
                </div>
                {(form.roof === 'Needs Repair' || form.roof === 'Major Issues') && (
                  <input
                    type="text"
                    placeholder="Estimated repair cost (optional)"
                    value={form.roofRepairCost}
                    onChange={set('roofRepairCost')}
                    className={`${inputClass} sm:max-w-[300px] ml-0 border-warning/40`}
                  />
                )}

                {/* AC / HVAC */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectInput
                    value={form.ac}
                    onChange={set('ac')}
                    options={conditionOptions}
                    placeholder="AC / HVAC Condition"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="AC Age (years)"
                    value={form.acAge}
                    onChange={set('acAge')}
                    className={inputClass}
                  />
                </div>
                {(form.ac === 'Needs Repair' || form.ac === 'Major Issues') && (
                  <input
                    type="text"
                    placeholder="Estimated repair cost (optional)"
                    value={form.acRepairCost}
                    onChange={set('acRepairCost')}
                    className={`${inputClass} sm:max-w-[300px] ml-0 border-warning/40`}
                  />
                )}

                {/* Electrical */}
                <SelectInput
                  value={form.electrical}
                  onChange={set('electrical')}
                  options={conditionShort}
                  placeholder="Electrical Condition"
                />
                {form.electrical === 'Needs Repair' && (
                  <input
                    type="text"
                    placeholder="Estimated repair cost (optional)"
                    value={form.electricalRepairCost}
                    onChange={set('electricalRepairCost')}
                    className={`${inputClass} sm:max-w-[300px] ml-0 border-warning/40`}
                  />
                )}

                {/* Plumbing */}
                <SelectInput
                  value={form.plumbing}
                  onChange={set('plumbing')}
                  options={conditionShort}
                  placeholder="Plumbing Condition"
                />
                {form.plumbing === 'Needs Repair' && (
                  <input
                    type="text"
                    placeholder="Estimated repair cost (optional)"
                    value={form.plumbingRepairCost}
                    onChange={set('plumbingRepairCost')}
                    className={`${inputClass} sm:max-w-[300px] ml-0 border-warning/40`}
                  />
                )}
              </motion.div>

              {/* ===== Documents (Seller Disclosures) - Cash deals only ===== */}
              <div className="katana-line my-4" />
              <SectionHeader index={4}>Documents</SectionHeader>

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
                  <SectionHeader index={6}>Mortgage Statement</SectionHeader>
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
                  <SectionHeader index={8}>Additional Documents</SectionHeader>
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
          </ShojiCard>
        </motion.div>

        {/* ---- Legal agreement ---- */}
        <motion.div variants={fadeUp} custom={10} className="mt-6">
          <ShojiCard hover={false} className="p-5">
            <div className="flex items-start gap-4">
              <div className="shrink-0 mt-0.5 flex items-center justify-center w-9 h-9 rounded-lg bg-gold/10 border border-gold-dim/20">
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
                  <span className="text-sm text-text-dim leading-relaxed group-hover:text-text-primary transition-colors">
                    By checking this box, you agree that if this property goes under contract,
                    Dispo Dojo has first right to locate a buyer and dispo the deal during the
                    inspection period (minimum 8 business days). This grants Dispo Dojo the
                    exclusive ability to market and assign this deal during the inspection window.
                  </span>
                </label>
              </div>
            </div>
          </ShojiCard>
        </motion.div>

        {/* ---- Submit ---- */}
        <motion.div variants={fadeUp} custom={11} className="mt-6">
          <Button
            type="submit"
            variant="gold"
            disabled={!agreed}
            className="w-full py-4 text-base"
          >
            Submit for Underwriting
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
