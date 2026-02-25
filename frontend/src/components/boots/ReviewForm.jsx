import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'
import StarRating from './StarRating'

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

// ─── Quick Tags ─────────────────────────────────────────────────────────────

const QUICK_TAGS = [
  'Responsive',
  'Reliable',
  'Quality Work',
  'Good Communicator',
  'On Time',
]

// ─── ReviewForm Modal ───────────────────────────────────────────────────────

export default function ReviewForm({
  isOpen,
  onClose,
  postId,
  revieweeId,
  revieweeName,
  firebaseUid,
  reviewerName,
}) {
  const [starValue, setStarValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    if (submitting) return
    onClose()
    setTimeout(() => {
      setStarValue(0)
      setReviewText('')
      setSelectedTags([])
      setSubmitting(false)
    }, 200)
  }

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (starValue === 0 || submitting) return
    setSubmitting(true)

    try {
      await addDoc(collection(db, 'boots_reviews'), {
        postId,
        reviewerId: firebaseUid,
        reviewerName: reviewerName || 'Anonymous',
        revieweeId,
        rating: starValue,
        text: reviewText.trim(),
        tags: selectedTags,
        createdAt: serverTimestamp(),
      })
      handleClose()
    } catch (err) {
      console.error('Failed to submit review:', err)
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="review-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            key="review-modal-panel"
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
                  Review {revieweeName}
                </h2>
                <p className="text-xs font-body mt-1" style={{ color: '#C8D1DA' }}>
                  Share your experience working with them
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Star Rating */}
                <div>
                  <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-2">
                    Rating
                  </label>
                  <StarRating value={starValue} onChange={setStarValue} size={28} />
                </div>

                {/* Quick Tags */}
                <div>
                  <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-2">
                    Quick Tags
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="px-2.5 py-1 rounded-sm text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40"
                          style={
                            isSelected
                              ? {
                                  backgroundColor: 'rgba(246,196,69,0.18)',
                                  borderColor: 'rgba(246,196,69,0.45)',
                                  color: '#F6C445',
                                }
                              : {
                                  backgroundColor: 'rgba(200,209,218,0.06)',
                                  borderColor: 'rgba(200,209,218,0.12)',
                                  color: '#C8D1DA',
                                }
                          }
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim mb-1">
                    Review (optional)
                  </label>
                  <textarea
                    className="w-full bg-black/30 border border-gold-dim/20 rounded-sm px-3 py-2.5 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-cyan/40 transition-colors font-body h-20 resize-none"
                    placeholder="Tell others about your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={280}
                    disabled={submitting}
                  />
                  <p className="text-[10px] text-text-dim/40 text-right mt-1 font-body">
                    {reviewText.length}/280
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={starValue === 0 || submitting}
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
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
