import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
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

const JOB_TASK_TYPES = [
  'Driving for Dollars',
  'Door-Knocking',
  'Cold Calling',
  'Skip Trace Verification',
  'General Scouting',
  'Other',
]

const URGENCY_OPTIONS = ['Low', 'Medium', 'High', 'ASAP']

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

// ─── Single-select Toggle Buttons ────────────────────────────────────────────

function SingleToggle({ options, selected, onChange, accentColor = '#00C6FF' }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
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

// ─── Bird Dog Post Form ──────────────────────────────────────────────────────

function BirdDogPostForm({ profile, onDataChange }) {
  const bdProfile = profile?.birdDogProfile
  const [title, setTitle] = useState('')
  const [serviceArea, setServiceArea] = useState(bdProfile?.serviceArea || [])
  const [methods, setMethods] = useState(bdProfile?.methods || [])
  const [description, setDescription] = useState('')
  const [availType, setAvailType] = useState('now')
  const [availDate, setAvailDate] = useState('')

  const accent = '#00C6FF'

  // Sync form data up to parent on every change
  function sync(updates) {
    const data = {
      title: updates.title ?? title,
      serviceArea: updates.serviceArea ?? serviceArea,
      methods: updates.methods ?? methods,
      description: updates.description ?? description,
      availType: updates.availType ?? availType,
      availDate: updates.availDate ?? availDate,
    }
    onDataChange(data)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className={labelCls}>Title</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. Experienced door-knocker covering all of Fort Worth"
          value={title}
          onChange={(e) => { setTitle(e.target.value); sync({ title: e.target.value }) }}
        />
      </div>

      {/* Service Area */}
      <div>
        <label className={labelCls}>Service Area</label>
        <TagInput
          tags={serviceArea}
          onChange={(v) => { setServiceArea(v); sync({ serviceArea: v }) }}
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
          onChange={(v) => { setMethods(v); sync({ methods: v }) }}
          accentColor={accent}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls + ' h-24 resize-none'}
          placeholder="What are you offering? Specialties, availability, experience..."
          value={description}
          onChange={(e) => { setDescription(e.target.value); sync({ description: e.target.value }) }}
        />
      </div>

      {/* Availability */}
      <div>
        <label className={labelCls}>Availability</label>
        <div className="flex gap-2">
          {[
            { value: 'now', label: 'Available Now' },
            { value: 'starting', label: 'Available Starting...' },
          ].map(({ value, label }) => {
            const isSelected = availType === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => { setAvailType(value); sync({ availType: value }) }}
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
        {availType === 'starting' && (
          <div className="mt-2.5 flex items-center gap-2">
            <Calendar size={14} className="text-text-dim shrink-0" />
            <input
              type="date"
              className={inputCls}
              value={availDate}
              onChange={(e) => { setAvailDate(e.target.value); sync({ availDate: e.target.value }) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Investor Job Post Form ──────────────────────────────────────────────────

function JobPostForm({ profile, onDataChange }) {
  const bdProfile = profile?.birdDogProfile
  const [title, setTitle] = useState('')
  const [targetArea, setTargetArea] = useState(bdProfile?.markets || [])
  const [taskType, setTaskType] = useState('')
  const [payout, setPayout] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('')
  const [deadline, setDeadline] = useState('')

  const accent = '#F6C445'

  function sync(updates) {
    const data = {
      title: updates.title ?? title,
      targetArea: updates.targetArea ?? targetArea,
      taskType: updates.taskType ?? taskType,
      payout: updates.payout ?? payout,
      description: updates.description ?? description,
      urgency: updates.urgency ?? urgency,
      deadline: updates.deadline ?? deadline,
    }
    onDataChange(data)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className={labelCls}>Title</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. Need bird dog for driving routes in South Dallas"
          value={title}
          onChange={(e) => { setTitle(e.target.value); sync({ title: e.target.value }) }}
        />
      </div>

      {/* Target Area */}
      <div>
        <label className={labelCls}>Target Area</label>
        <TagInput
          tags={targetArea}
          onChange={(v) => { setTargetArea(v); sync({ targetArea: v }) }}
          placeholder="Add a city or market..."
          accentColor={accent}
        />
      </div>

      {/* Task Type */}
      <div>
        <label className={labelCls}>Task Type</label>
        <select
          className={inputCls + ' cursor-pointer'}
          value={taskType}
          onChange={(e) => { setTaskType(e.target.value); sync({ taskType: e.target.value }) }}
        >
          <option value="" disabled>Select a task type...</option>
          {JOB_TASK_TYPES.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0B0F14]">{opt}</option>
          ))}
        </select>
      </div>

      {/* Payout Offered */}
      <div>
        <label className={labelCls}>Payout Offered</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. $500 per qualified lead"
          value={payout}
          onChange={(e) => { setPayout(e.target.value); sync({ payout: e.target.value }) }}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls + ' h-24 resize-none'}
          placeholder="Describe what you're looking for, lead criteria, expectations..."
          value={description}
          onChange={(e) => { setDescription(e.target.value); sync({ description: e.target.value }) }}
        />
      </div>

      {/* Urgency */}
      <div>
        <label className={labelCls}>Urgency</label>
        <SingleToggle
          options={URGENCY_OPTIONS}
          selected={urgency}
          onChange={(v) => { setUrgency(v); sync({ urgency: v }) }}
          accentColor={accent}
        />
      </div>

      {/* Deadline */}
      <div>
        <label className={labelCls}>
          Deadline <span className="normal-case text-text-muted">(optional)</span>
        </label>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-text-dim shrink-0" />
          <input
            type="date"
            className={inputCls}
            value={deadline}
            onChange={(e) => { setDeadline(e.target.value); sync({ deadline: e.target.value }) }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function CreatePostModal({ isOpen, onClose, profile, firebaseUid }) {
  const defaultTab = profile?.birdDogProfile?.role === 'investor' ? 'job' : 'bird_dog'
  const [postType, setPostType] = useState(defaultTab)
  const [birdDogData, setBirdDogData] = useState(null)
  const [jobData, setJobData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleClose() {
    onClose()
    setTimeout(() => {
      setPostType(defaultTab)
      setBirdDogData(null)
      setJobData(null)
      setLoading(false)
      setSuccess(false)
    }, 200)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (postType === 'bird_dog') {
        const d = birdDogData || {}
        await addDoc(collection(db, 'bird_dog_posts'), {
          userId: firebaseUid,
          authorName: profile?.displayName || 'Unknown',
          postType: 'bird_dog',
          title: d.title || '',
          description: d.description || '',
          area: d.serviceArea || [],
          methods: d.methods || [],
          taskType: '',
          payout: '',
          urgency: '',
          deadline: '',
          availability: d.availType === 'starting' ? d.availDate || '' : 'now',
          status: 'active',
          applicants: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } else {
        const d = jobData || {}
        await addDoc(collection(db, 'bird_dog_posts'), {
          userId: firebaseUid,
          authorName: profile?.displayName || 'Unknown',
          postType: 'job',
          title: d.title || '',
          description: d.description || '',
          area: d.targetArea || [],
          methods: [],
          taskType: d.taskType || '',
          payout: d.payout || '',
          urgency: d.urgency || '',
          deadline: d.deadline || '',
          availability: '',
          status: 'active',
          applicants: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('Create post error:', err)
    } finally {
      setLoading(false)
    }
  }

  const cyanAccent = '#00C6FF'
  const goldAccent = '#F6C445'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="post-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            key="post-modal-panel"
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

              {/* Title */}
              <h2
                className="font-display text-2xl text-center mb-5"
                style={{ color: '#F4F7FA', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
              >
                Create a Post
              </h2>

              {/* Tab toggles */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setPostType('bird_dog')}
                  className="px-3 py-2.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] text-center"
                  style={{
                    backgroundColor: postType === 'bird_dog' ? `${cyanAccent}20` : 'transparent',
                    borderColor: postType === 'bird_dog' ? `${cyanAccent}55` : 'rgba(255,255,255,0.07)',
                    color: postType === 'bird_dog' ? cyanAccent : '#C8D1DA',
                  }}
                >
                  Offer My Services
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('job')}
                  className="px-3 py-2.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] text-center"
                  style={{
                    backgroundColor: postType === 'job' ? `${goldAccent}20` : 'transparent',
                    borderColor: postType === 'job' ? `${goldAccent}55` : 'rgba(255,255,255,0.07)',
                    color: postType === 'job' ? goldAccent : '#C8D1DA',
                  }}
                >
                  Post a Job
                </button>
              </div>

              {/* Success indicator */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    key="post-success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 px-4 py-3 rounded-sm border border-emerald-500/30 bg-emerald-500/8 text-sm text-emerald-400 flex items-center gap-2 font-body"
                  >
                    Post published successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-0">
                <AnimatePresence mode="wait">
                  {postType === 'bird_dog' ? (
                    <motion.div
                      key="bird-dog-form"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BirdDogPostForm
                        profile={profile}
                        onDataChange={setBirdDogData}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="job-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <JobPostForm
                        profile={profile}
                        onDataChange={setJobData}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || success}
                  className={[
                    'mt-6 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
                    'bg-[#E53935] border border-[#E53935]/40',
                    'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
                    'active:scale-[0.98]',
                    'transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
                  ].join(' ')}
                >
                  {loading ? 'Publishing...' : 'Publish Post'}
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
