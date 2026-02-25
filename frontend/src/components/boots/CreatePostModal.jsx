import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Wrench, Briefcase, Check } from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const TASK_TYPES = [
  { id: 'photos', label: 'Property Photos' },
  { id: 'walkthrough', label: 'Video Walkthroughs' },
  { id: 'lockbox', label: 'Lockbox Access' },
  { id: 'sign', label: 'Sign Placement' },
  { id: 'occupant', label: 'Occupant Check' },
  { id: 'hoa', label: 'HOA Docs' },
  { id: 'other', label: 'Other' },
]

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1'

// ─── Animation variants ─────────────────────────────────────────────────────

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
  function toggle(optionId) {
    if (selected.includes(optionId)) {
      onChange(selected.filter((s) => s !== optionId))
    } else {
      onChange([...selected, optionId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, label }) => {
        const isSelected = selected.includes(id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
            style={{
              backgroundColor: isSelected ? `${accentColor}20` : 'transparent',
              borderColor: isSelected ? `${accentColor}55` : 'rgba(255,255,255,0.07)',
              color: isSelected ? accentColor : '#C8D1DA',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Two-Option Toggle ───────────────────────────────────────────────────────

function TwoToggle({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map(({ id, label, color }) => {
        const isActive = value === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex-1 px-3 py-2 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
            style={{
              backgroundColor: isActive ? `${color}20` : 'transparent',
              borderColor: isActive ? `${color}55` : 'rgba(255,255,255,0.07)',
              color: isActive ? color : '#C8D1DA',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Service Post Form ───────────────────────────────────────────────────────

function ServiceForm({ profile, onSubmit, submitting }) {
  const [title, setTitle] = useState('')
  const [taskTypes, setTaskTypes] = useState([])
  const [customTaskType, setCustomTaskType] = useState('')
  const [serviceAreas, setServiceAreas] = useState(
    () => profile?.bootsProfile?.serviceArea || []
  )
  const [availability, setAvailability] = useState('available')
  const [description, setDescription] = useState('')

  const accent = '#00C6FF'

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      title,
      taskTypes,
      customTaskType: taskTypes.includes('other') ? customTaskType : '',
      serviceAreas,
      availability,
      description,
    })
  }

  const isValid = title.trim().length > 0 && taskTypes.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className={labelCls}>Title</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. Experienced boots operator in Phoenix metro"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Task Types Offered */}
      <div>
        <label className={labelCls}>Task Types Offered</label>
        <TogglePills
          options={TASK_TYPES}
          selected={taskTypes}
          onChange={setTaskTypes}
          accentColor={accent}
        />
        {taskTypes.includes('other') && (
          <div className="mt-2.5">
            <input
              type="text"
              className={inputCls}
              placeholder="Describe your service..."
              value={customTaskType}
              onChange={(e) => setCustomTaskType(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Service Area */}
      <div>
        <label className={labelCls}>Service Area</label>
        <TagInput
          tags={serviceAreas}
          onChange={setServiceAreas}
          placeholder="Add a city or zip code..."
          accentColor={accent}
        />
      </div>

      {/* Availability Status */}
      <div>
        <label className={labelCls}>Availability Status</label>
        <TwoToggle
          options={[
            { id: 'available', label: 'Available', color: '#00C6FF' },
            { id: 'unavailable', label: 'Unavailable', color: '#C8D1DA' },
          ]}
          value={availability}
          onChange={setAvailability}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls + ' h-24 resize-none'}
          placeholder="Describe your experience, equipment, and turnaround time"
          value={description}
          maxLength={500}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
          {description.length}/500
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={[
          'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
          'bg-[#E53935] border border-[#E53935]/40',
          'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
          'active:scale-[0.98]',
          'transition-colors',
          'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
          'disabled:opacity-40 disabled:pointer-events-none',
        ].join(' ')}
      >
        {submitting ? 'Publishing...' : 'Publish Service Post'}
      </button>
    </form>
  )
}

// ─── Job Post Form ───────────────────────────────────────────────────────────

function JobForm({ onSubmit, submitting }) {
  const [title, setTitle] = useState('')
  const [taskTypes, setTaskTypes] = useState([])
  const [customTaskType, setCustomTaskType] = useState('')
  const [location, setLocation] = useState('')
  const [urgency, setUrgency] = useState('normal')
  const [description, setDescription] = useState('')

  const accent = '#F6C445'

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      title,
      taskTypes,
      customTaskType: taskTypes.includes('other') ? customTaskType : '',
      location,
      urgency,
      description,
    })
  }

  const isValid = title.trim().length > 0 && taskTypes.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <label className={labelCls}>Title</label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. Need photos & walkthrough of duplex in Mesa, AZ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Task Type Needed */}
      <div>
        <label className={labelCls}>Task Type Needed</label>
        <TogglePills
          options={TASK_TYPES}
          selected={taskTypes}
          onChange={setTaskTypes}
          accentColor={accent}
        />
        {taskTypes.includes('other') && (
          <div className="mt-2.5">
            <input
              type="text"
              className={inputCls}
              placeholder="Describe what you need..."
              value={customTaskType}
              onChange={(e) => setCustomTaskType(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label className={labelCls}>Location</label>
        <input
          type="text"
          className={inputCls}
          placeholder="Specific address or general area"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      {/* Urgency */}
      <div>
        <label className={labelCls}>Urgency</label>
        <TwoToggle
          options={[
            { id: 'normal', label: 'Normal', color: '#00C6FF' },
            { id: 'urgent', label: 'Urgent', color: '#E53935' },
          ]}
          value={urgency}
          onChange={setUrgency}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>Description</label>
        <textarea
          className={inputCls + ' h-24 resize-none'}
          placeholder="Describe what's needed, timeline, access details"
          value={description}
          maxLength={500}
          onChange={(e) => setDescription(e.target.value)}
        />
        <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
          {description.length}/500
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={!isValid || submitting}
        className={[
          'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
          'bg-[#E53935] border border-[#E53935]/40',
          'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
          'active:scale-[0.98]',
          'transition-colors',
          'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
          'disabled:opacity-40 disabled:pointer-events-none',
        ].join(' ')}
      >
        {submitting ? 'Publishing...' : 'Publish Job Post'}
      </button>
    </form>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function CreatePostModal({ isOpen, onClose, firebaseUid, profile }) {
  const [postType, setPostType] = useState('service')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleClose() {
    onClose()
    // Reset internal state after close animation
    setTimeout(() => {
      setPostType('service')
      setSubmitting(false)
      setSuccess(false)
    }, 200)
  }

  async function handleSubmit(formData) {
    setSubmitting(true)
    try {
      const postData = {
        userId: firebaseUid,
        userName: profile?.displayName || 'Anonymous',
        userAvatar: profile?.avatarConfig || null,
        type: postType,
        title: formData.title,
        description: formData.description,
        taskTypes: formData.taskTypes,
        customTaskType: formData.customTaskType,
        location: postType === 'job' ? formData.location : '',
        serviceArea: postType === 'service' ? formData.serviceAreas : [],
        availability: postType === 'service' ? formData.availability : 'normal',
        urgency: postType === 'job' ? formData.urgency : 'normal',
        status: 'active',
        applicantCount: 0,
        acceptedUserId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'boots_posts'), postData)
      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 800)
    } catch (err) {
      console.error('Failed to create post:', err)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="boots-create-post-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            key="boots-create-post-panel"
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

              {/* Success overlay */}
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 gap-4"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'rgba(0,198,255,0.15)',
                      filter: 'drop-shadow(0 0 12px rgba(0,198,255,0.4))',
                    }}
                  >
                    <Check size={28} style={{ color: '#00C6FF' }} />
                  </div>
                  <p
                    className="font-heading font-semibold text-sm tracking-wider"
                    style={{ color: '#00C6FF' }}
                  >
                    Post Published!
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Modal heading */}
                  <h2
                    className="font-display text-xl text-center mb-5"
                    style={{ color: '#F4F7FA', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
                  >
                    Create a Post
                  </h2>

                  {/* Post type selector tabs */}
                  <div className="flex gap-2 mb-6">
                    <button
                      type="button"
                      onClick={() => setPostType('service')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
                      style={{
                        backgroundColor: postType === 'service' ? 'rgba(0,198,255,0.12)' : 'transparent',
                        borderColor: postType === 'service' ? 'rgba(0,198,255,0.35)' : 'rgba(255,255,255,0.07)',
                        color: postType === 'service' ? '#00C6FF' : '#C8D1DA',
                      }}
                    >
                      <Wrench size={14} />
                      Offer My Services
                    </button>
                    <button
                      type="button"
                      onClick={() => setPostType('job')}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-sm text-xs font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
                      style={{
                        backgroundColor: postType === 'job' ? 'rgba(246,196,69,0.12)' : 'transparent',
                        borderColor: postType === 'job' ? 'rgba(246,196,69,0.35)' : 'rgba(255,255,255,0.07)',
                        color: postType === 'job' ? '#F6C445' : '#C8D1DA',
                      }}
                    >
                      <Briefcase size={14} />
                      Post a Job
                    </button>
                  </div>

                  {/* Form content with animated switch */}
                  <AnimatePresence mode="wait">
                    {postType === 'service' ? (
                      <motion.div
                        key="service-form"
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ServiceForm
                          profile={profile}
                          onSubmit={handleSubmit}
                          submitting={submitting}
                        />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="job-form"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <JobForm
                          onSubmit={handleSubmit}
                          submitting={submitting}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
