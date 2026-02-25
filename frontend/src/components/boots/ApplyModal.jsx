import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'

// ─── Constants ───────────────────────────────────────────────────────────────

const BADGE_COLORS = {
  photos: '#00C6FF',
  walkthrough: '#A855F7',
  lockbox: '#F6C445',
  sign: '#10b981',
  occupant: '#f97316',
  hoa: '#84cc16',
  other: '#C8D1DA',
}

const TASK_TYPE_LABELS = {
  photos: 'Property Photos',
  walkthrough: 'Walkthroughs',
  lockbox: 'Lockbox Access',
  sign: 'Sign Placement',
  occupant: 'Occupant Check',
  hoa: 'HOA Docs',
  other: 'Other',
}

// ─── Animation Variants ─────────────────────────────────────────────────────

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

// ─── ApplyModal ─────────────────────────────────────────────────────────────

export default function ApplyModal({ isOpen, onClose, post, firebaseUid, profile }) {
  const [pitchText, setPitchText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    if (submitting) return
    onClose()
    setTimeout(() => {
      setPitchText('')
      setSubmitting(false)
    }, 200)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pitchText.trim() || submitting) return
    setSubmitting(true)

    try {
      await addDoc(collection(db, 'boots_applications'), {
        postId: post.id,
        applicantId: firebaseUid,
        applicantName: profile?.displayName || 'Anonymous',
        message: pitchText.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      })

      // Increment applicant count on the post
      await updateDoc(doc(db, 'boots_posts', post.id), {
        applicantCount: increment(1),
      })

      handleClose()
    } catch (err) {
      console.error('Failed to submit application:', err)
      setSubmitting(false)
    }
  }

  const bootsProfile = profile?.bootsProfile
  const taskTypes = bootsProfile?.taskTypes || []
  const serviceArea = bootsProfile?.serviceArea || []

  return (
    <AnimatePresence>
      {isOpen && post && (
        <motion.div
          key="apply-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            key="apply-modal-panel"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full max-w-md mx-4"
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

              {/* Header */}
              <div className="mb-5">
                <h2
                  className="font-heading font-bold text-base pr-8"
                  style={{ color: '#F4F7FA' }}
                >
                  {post.title}
                </h2>
                <p className="text-xs font-body mt-1" style={{ color: '#C8D1DA' }}>
                  Posted by {post.userName || 'Anonymous'}
                </p>
              </div>

              {/* Application form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Pitch message */}
                <div>
                  <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1">
                    Your Pitch
                  </label>
                  <textarea
                    className="w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body h-24 resize-none"
                    placeholder="Tell them why you're a good fit for this task..."
                    value={pitchText}
                    onChange={(e) => setPitchText(e.target.value)}
                    maxLength={280}
                    disabled={submitting}
                  />
                  <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
                    {pitchText.length}/280
                  </p>
                </div>

                {/* Capabilities preview */}
                {(taskTypes.length > 0 || serviceArea.length > 0) && (
                  <div>
                    <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-2">
                      Your Capabilities
                    </label>

                    {/* Task type badges */}
                    {taskTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {taskTypes.map((type) => {
                          const color = BADGE_COLORS[type] || BADGE_COLORS.other
                          return (
                            <span
                              key={type}
                              className="px-2 py-0.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider"
                              style={{
                                backgroundColor: `${color}18`,
                                border: `1px solid ${color}35`,
                                color,
                              }}
                            >
                              {TASK_TYPE_LABELS[type] || type}
                            </span>
                          )
                        })}
                      </div>
                    )}

                    {/* Service area chips */}
                    {serviceArea.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {serviceArea.map((area) => (
                          <span
                            key={area}
                            className="px-2 py-0.5 rounded-sm text-[10px] font-heading font-semibold tracking-wider"
                            style={{
                              backgroundColor: 'rgba(0,198,255,0.12)',
                              border: '1px solid rgba(0,198,255,0.25)',
                              color: '#00C6FF',
                            }}
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!pitchText.trim() || submitting}
                  className={[
                    'mt-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider',
                    'border transition-colors active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40',
                    'disabled:opacity-40 disabled:pointer-events-none',
                  ].join(' ')}
                  style={{
                    backgroundColor: 'rgba(246,196,69,0.15)',
                    borderColor: 'rgba(246,196,69,0.4)',
                    color: '#F6C445',
                    boxShadow: '0 4px 20px rgba(246,196,69,0.15)',
                  }}
                >
                  <Send size={14} />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
