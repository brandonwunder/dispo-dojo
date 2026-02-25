import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, MapPin, Briefcase, Plus, Check, ArrowLeft,
} from 'lucide-react'
import GlassPanel from '../GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const BIRD_DOG_METHODS = [
  'Driving for Dollars',
  'Door-Knocking',
  'Cold Calling',
  'Skip Tracing',
  'Referral Network',
  'Other',
]

const INVESTOR_DEAL_TYPES = [
  'Wholesale',
  'Fix & Flip',
  'Buy & Hold',
  'Subject-To',
  'Creative Finance',
]

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

// ─── Overlay animation ───────────────────────────────────────────────────────

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.97,
    transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Tag Input ───────────────────────────────────────────────────────────────

function TagInput({ tags, onChange, placeholder, accentColor = '#00C6FF' }) {
  const [value, setValue] = useState('')

  function addTag() {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setValue('')
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          className={inputCls}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          onClick={addTag}
          className="shrink-0 flex items-center justify-center w-10 rounded-sm border transition-colors active:scale-[0.96]"
          style={{
            borderColor: `${accentColor}33`,
            backgroundColor: `${accentColor}15`,
            color: accentColor,
          }}
        >
          <Plus size={16} />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-heading font-semibold tracking-wider"
              style={{
                backgroundColor: `${accentColor}18`,
                border: `1px solid ${accentColor}33`,
                color: accentColor,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="opacity-60 hover:opacity-100 transition-opacity active:scale-90"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toggle Pills ────────────────────────────────────────────────────────────

function TogglePills({ options, selected, onChange, accentColor = '#00C6FF' }) {
  function toggle(option) {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className="px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
            style={{
              backgroundColor: isSelected ? `${accentColor}20` : 'transparent',
              borderColor: isSelected ? `${accentColor}55` : 'rgba(255,255,255,0.07)',
              color: isSelected ? accentColor : '#C8D1DA',
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

// ─── Custom Checkbox ─────────────────────────────────────────────────────────

function CustomCheckbox({ checked, onChange, label, accentColor = '#00C6FF' }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div
          className="w-4 h-4 rounded-sm border flex items-center justify-center transition-colors"
          style={{
            borderColor: checked ? accentColor : 'rgba(255,255,255,0.12)',
            backgroundColor: checked ? `${accentColor}15` : 'transparent',
          }}
        >
          {checked && <Check size={10} style={{ color: accentColor }} />}
        </div>
      </div>
      <span className="text-xs text-text-dim leading-snug font-body group-hover:text-parchment transition-colors">
        {label}
      </span>
    </label>
  )
}

// ─── Step 1: Role Selection ──────────────────────────────────────────────────

function RoleSelection({ onSelect }) {
  const [hovered, setHovered] = useState(null)

  const roles = [
    {
      id: 'bird_dog',
      Icon: MapPin,
      color: '#00C6FF',
      title: 'Bird Dog',
      description: 'I scout properties and find leads for investors',
    },
    {
      id: 'investor',
      Icon: Briefcase,
      color: '#F6C445',
      title: 'Investor',
      description: 'I need bird dogs to find leads in my markets',
    },
  ]

  return (
    <div>
      <h2
        className="font-display text-2xl text-center mb-1"
        style={{ color: '#F4F7FA', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
      >
        Join the Bird Dog Network
      </h2>
      <p className="text-sm text-text-dim text-center font-body mb-6">
        What best describes you?
      </p>

      <div className="grid grid-cols-2 gap-3">
        {roles.map(({ id, Icon, color, title, description }) => {
          const isHovered = hovered === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              className="flex flex-col items-center gap-3 p-5 rounded-sm border text-center transition-colors active:scale-[0.98]"
              style={{
                borderColor: isHovered ? `${color}55` : 'rgba(255,255,255,0.07)',
                backgroundColor: isHovered ? `${color}10` : 'transparent',
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${color}15`,
                  filter: `drop-shadow(0 0 10px ${color}40)`,
                }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div>
                <p
                  className="font-heading font-semibold text-sm tracking-wider mb-1"
                  style={{ color }}
                >
                  {title}
                </p>
                <p className="text-[11px] text-text-dim leading-snug font-body">
                  {description}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 2: Bird Dog Form ───────────────────────────────────────────────────

function BirdDogForm({ onBack, onSubmit }) {
  const [serviceArea, setServiceArea] = useState([])
  const [methods, setMethods] = useState([])
  const [bio, setBio] = useState('')
  const [availability, setAvailability] = useState('available')
  const [contactPrefs, setContactPrefs] = useState({
    showPhone: false,
    showEmail: false,
    dmsOnly: true,
  })

  const accent = '#00C6FF'

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      role: 'bird_dog',
      serviceArea,
      methods,
      bio,
      availability,
      contactPrefs,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-text-dim hover:text-parchment transition-colors font-heading tracking-wider uppercase self-start active:scale-[0.97]"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <h2
        className="font-display text-xl text-center -mt-1"
        style={{ color: '#F4F7FA', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
      >
        Set Up Your Bird Dog Profile
      </h2>

      {/* Service Area */}
      <div>
        <label className={labelCls}>Service Area</label>
        <TagInput
          tags={serviceArea}
          onChange={setServiceArea}
          placeholder="Add a city or zip code..."
          accentColor={accent}
        />
      </div>

      {/* Methods */}
      <div>
        <label className={labelCls}>Methods</label>
        <TogglePills
          options={BIRD_DOG_METHODS}
          selected={methods}
          onChange={setMethods}
          accentColor={accent}
        />
      </div>

      {/* Bio / Pitch */}
      <div>
        <label className={labelCls}>Bio / Pitch</label>
        <textarea
          className={inputCls + ' h-20 resize-none'}
          placeholder="Tell investors why they should work with you..."
          value={bio}
          maxLength={280}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
          {bio.length}/280
        </p>
      </div>

      {/* Availability */}
      <div>
        <label className={labelCls}>Availability</label>
        <div className="flex gap-2">
          {[
            { value: 'available', label: 'Available Now' },
            { value: 'unavailable', label: 'Not Available' },
          ].map(({ value, label }) => {
            const isSelected = availability === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setAvailability(value)}
                className="flex-1 px-3 py-2 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
                style={{
                  backgroundColor: isSelected ? `${accent}20` : 'transparent',
                  borderColor: isSelected ? `${accent}55` : 'rgba(255,255,255,0.07)',
                  color: isSelected ? accent : '#C8D1DA',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Contact Preferences */}
      <div>
        <label className={labelCls}>Contact Preferences</label>
        <div className="flex flex-col gap-2.5 mt-1">
          <CustomCheckbox
            checked={contactPrefs.showPhone}
            onChange={(v) => setContactPrefs((p) => ({ ...p, showPhone: v }))}
            label="Show my phone number"
            accentColor={accent}
          />
          <CustomCheckbox
            checked={contactPrefs.showEmail}
            onChange={(v) => setContactPrefs((p) => ({ ...p, showEmail: v }))}
            label="Show my email"
            accentColor={accent}
          />
          <CustomCheckbox
            checked={contactPrefs.dmsOnly}
            onChange={(v) => setContactPrefs((p) => ({ ...p, dmsOnly: v }))}
            label="DMs only (recommended)"
            accentColor={accent}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className={[
          'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
          'bg-[#E53935] border border-[#E53935]/40',
          'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
          'active:scale-[0.98]',
          'transition-colors',
          'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
        ].join(' ')}
      >
        Save Profile & Continue
      </button>
    </form>
  )
}

// ─── Step 2: Investor Form ───────────────────────────────────────────────────

function InvestorForm({ onBack, onSubmit }) {
  const [markets, setMarkets] = useState([])
  const [dealTypes, setDealTypes] = useState([])
  const [bio, setBio] = useState('')
  const [contactPrefs, setContactPrefs] = useState({
    showPhone: false,
    showEmail: false,
    dmsOnly: true,
  })

  const accent = '#F6C445'

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      role: 'investor',
      markets,
      dealTypes,
      bio,
      availability: 'available',
      contactPrefs,
      createdAt: new Date().toISOString(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-text-dim hover:text-parchment transition-colors font-heading tracking-wider uppercase self-start active:scale-[0.97]"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <h2
        className="font-display text-xl text-center -mt-1"
        style={{ color: '#F4F7FA', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
      >
        Set Up Your Investor Profile
      </h2>

      {/* Markets */}
      <div>
        <label className={labelCls}>Markets You're Active In</label>
        <TagInput
          tags={markets}
          onChange={setMarkets}
          placeholder="Add a city or market..."
          accentColor={accent}
        />
      </div>

      {/* Deal Types */}
      <div>
        <label className={labelCls}>Deal Types</label>
        <TogglePills
          options={INVESTOR_DEAL_TYPES}
          selected={dealTypes}
          onChange={setDealTypes}
          accentColor={accent}
        />
      </div>

      {/* Bio */}
      <div>
        <label className={labelCls}>Bio</label>
        <textarea
          className={inputCls + ' h-20 resize-none'}
          placeholder="Tell bird dogs about your investing criteria..."
          value={bio}
          maxLength={280}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
          {bio.length}/280
        </p>
      </div>

      {/* Contact Preferences */}
      <div>
        <label className={labelCls}>Contact Preferences</label>
        <div className="flex flex-col gap-2.5 mt-1">
          <CustomCheckbox
            checked={contactPrefs.showPhone}
            onChange={(v) => setContactPrefs((p) => ({ ...p, showPhone: v }))}
            label="Show my phone number"
            accentColor={accent}
          />
          <CustomCheckbox
            checked={contactPrefs.showEmail}
            onChange={(v) => setContactPrefs((p) => ({ ...p, showEmail: v }))}
            label="Show my email"
            accentColor={accent}
          />
          <CustomCheckbox
            checked={contactPrefs.dmsOnly}
            onChange={(v) => setContactPrefs((p) => ({ ...p, dmsOnly: v }))}
            label="DMs only (recommended)"
            accentColor={accent}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className={[
          'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
          'bg-[#E53935] border border-[#E53935]/40',
          'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
          'active:scale-[0.98]',
          'transition-colors',
          'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
        ].join(' ')}
      >
        Save Profile & Continue
      </button>
    </form>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function ProfileSetupModal({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(null)

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole)
    setStep(2)
  }

  function handleBack() {
    setStep(1)
    setRole(null)
  }

  function handleSubmit(profileData) {
    onComplete(profileData)
    // Reset internal state for next open
    setStep(1)
    setRole(null)
  }

  function handleClose() {
    onClose()
    // Reset after close animation
    setTimeout(() => {
      setStep(1)
      setRole(null)
    }, 200)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="profile-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            key="profile-modal-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel
              className="p-6 relative"
              style={{ maxHeight: '85vh', overflowY: 'auto' }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-text-dim/40 hover:text-parchment transition-colors active:scale-90 focus-visible:outline-none z-10"
              >
                <X size={18} />
              </button>

              {/* Step content */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RoleSelection onSelect={handleRoleSelect} />
                  </motion.div>
                )}

                {step === 2 && role === 'bird_dog' && (
                  <motion.div
                    key="step-2-birddog"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BirdDogForm onBack={handleBack} onSubmit={handleSubmit} />
                  </motion.div>
                )}

                {step === 2 && role === 'investor' && (
                  <motion.div
                    key="step-2-investor"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <InvestorForm onBack={handleBack} onSubmit={handleSubmit} />
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
