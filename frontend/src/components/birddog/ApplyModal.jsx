import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, CheckCircle } from 'lucide-react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'

// ─── Animation variants ───────────────────────────────────────────────────────

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

const inputCls =
  'w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body'

const PITCH_MAX = 280

// ─── ApplyModal ───────────────────────────────────────────────────────────────

export default function ApplyModal({ isOpen, onClose, post, profile, firebaseUid }) {
  const [pitch, setPitch] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Check if the user has already applied
  const alreadyApplied = post?.applicants?.some((a) => a.userId === firebaseUid)

  function handleClose() {
    onClose()
    setTimeout(() => {
      setPitch('')
      setLoading(false)
      setSuccess(false)
    }, 200)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!pitch.trim() || loading || alreadyApplied) return

    setLoading(true)
    try {
      await updateDoc(doc(db, 'bird_dog_posts', post.id), {
        applicants: arrayUnion({
          userId: firebaseUid,
          name: profile?.displayName || 'Unknown',
          pitch: pitch.trim(),
          methods: profile?.birdDogProfile?.methods || [],
          serviceArea: profile?.birdDogProfile?.serviceArea || [],
          stats: { birdDogLeads: profile?.stats?.birdDogLeads || 0 },
          status: 'pending',
          appliedAt: new Date().toISOString(),
        }),
      })

      setSuccess(true)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err) {
      console.error('Apply error:', err)
    } finally {
      setLoading(false)
    }
  }

  const methods = profile?.birdDogProfile?.methods || []
  const serviceArea = profile?.birdDogProfile?.serviceArea || []
  const leadCount = profile?.stats?.birdDogLeads || 0

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
              <h2
                className="font-heading font-bold text-lg tracking-wider text-parchment mb-1 pr-8"
              >
                {post.title || 'Untitled Job'}
              </h2>
              <p className="text-xs text-text-dim font-body mb-5">
                Posted by {post.authorName || 'Unknown'}
              </p>

              {/* Success indicator */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    key="apply-success"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 px-4 py-3 rounded-sm border border-emerald-500/30 bg-emerald-500/8 text-sm text-emerald-400 flex items-center gap-2 font-body"
                  >
                    <CheckCircle size={14} />
                    Application submitted successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Already applied state */}
              {alreadyApplied && !success && (
                <div className="mb-4 px-4 py-3 rounded-sm border text-sm flex items-center gap-2 font-body"
                  style={{
                    borderColor: 'rgba(246,196,69,0.3)',
                    backgroundColor: 'rgba(246,196,69,0.08)',
                    color: '#F6C445',
                  }}
                >
                  <CheckCircle size={14} />
                  You have already applied to this job.
                </div>
              )}

              {/* Form — hidden if already applied */}
              {!alreadyApplied && !success && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Pitch message */}
                  <div>
                    <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1">
                      Your Pitch
                    </label>
                    <textarea
                      className={inputCls + ' h-28 resize-none'}
                      placeholder="Why are you a good fit for this job? Mention your experience in this area..."
                      maxLength={PITCH_MAX}
                      value={pitch}
                      onChange={(e) => setPitch(e.target.value)}
                    />
                    <p className="mt-1 text-right text-[10px] font-body"
                      style={{ color: pitch.length >= PITCH_MAX ? '#E53935' : 'rgba(200,209,218,0.4)' }}
                    >
                      {pitch.length}/{PITCH_MAX}
                    </p>
                  </div>

                  {/* Profile preview */}
                  <div>
                    <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-2">
                      Your Profile Preview
                    </label>
                    <div className="p-3 rounded-sm bg-black/30 border border-[rgba(255,255,255,0.07)]">
                      {/* Methods */}
                      {methods.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {methods.map((m) => (
                            <span
                              key={m}
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
                              style={{
                                color: '#00C6FF',
                                backgroundColor: 'rgba(0,198,255,0.10)',
                                border: '1px solid rgba(0,198,255,0.30)',
                              }}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Service area */}
                      {serviceArea.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {serviceArea.map((area) => (
                            <span
                              key={area}
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
                              style={{
                                color: '#F6C445',
                                backgroundColor: 'rgba(246,196,69,0.10)',
                                border: '1px solid rgba(246,196,69,0.30)',
                              }}
                            >
                              {area}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Stats */}
                      <p className="text-[11px] text-text-dim/50 font-body">
                        {leadCount} lead{leadCount !== 1 ? 's' : ''} submitted
                      </p>

                      {methods.length === 0 && serviceArea.length === 0 && (
                        <p className="text-[11px] text-text-dim/30 font-body">
                          No profile info yet. Set up your bird dog profile first.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !pitch.trim()}
                    className={[
                      'flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm text-sm font-heading font-semibold tracking-wider text-white',
                      'bg-[#E53935] border border-[#E53935]/40',
                      'hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60',
                      'active:scale-[0.98]',
                      'transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'shadow-[0_4px_20px_rgba(229,57,53,0.25)]',
                    ].join(' ')}
                  >
                    <Send size={14} />
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
