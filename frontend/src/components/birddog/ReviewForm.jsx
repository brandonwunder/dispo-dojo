import { useState } from 'react'
import { Send, CheckCircle } from 'lucide-react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'
import StarRating from './StarRating'

// ─── Quick-select tags ───────────────────────────────────────────────────────

const QUICK_TAGS = [
  'Responsive',
  'Reliable',
  'Quality Leads',
  'Fair Pay',
  'Good Communicator',
]

// ─── ReviewForm ──────────────────────────────────────────────────────────────
// Inline review form for rating the other party after job completion.

export default function ReviewForm({
  post,
  otherUserId,
  otherUserName,
  firebaseUid,
  reviewerRole,
  reviewerName,
  onComplete,
}) {
  const [starValue, setStarValue] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validation: require at least a star rating
    if (starValue < 1) {
      setError('Please select a star rating')
      return
    }

    setError('')
    setLoading(true)

    try {
      await addDoc(collection(db, 'bird_dog_reviews'), {
        jobPostId: post.id,
        reviewerId: firebaseUid,
        revieweeId: otherUserId,
        reviewerName: reviewerName || 'Unknown',
        rating: starValue,
        text: reviewText.trim(),
        tags: selectedTags,
        reviewerRole,
        createdAt: serverTimestamp(),
      })

      setSuccess(true)
      setTimeout(() => {
        onComplete?.()
      }, 1500)
    } catch (err) {
      console.error('Review submit error:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <GlassPanel className="p-4">
        <div className="flex items-center gap-2 text-sm font-heading font-semibold tracking-wider" style={{ color: '#10b981' }}>
          <CheckCircle size={16} />
          Review submitted! Thank you.
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="p-4">
      <form onSubmit={handleSubmit} noValidate>
        {/* Header */}
        <h4 className="font-heading font-semibold text-sm tracking-wider text-parchment mb-0.5">
          Review {otherUserName || 'User'}
        </h4>
        <p className="text-[11px] text-text-dim/50 font-body mb-3">
          {post.title || 'Completed Job'}
        </p>

        {/* Star Rating */}
        <div className="mb-3">
          <StarRating
            rating={starValue}
            size={20}
            interactive
            onChange={setStarValue}
          />
          {error && (
            <p className="mt-1 text-[10px]" style={{ color: '#E53935' }}>
              {error}
            </p>
          )}
        </div>

        {/* Review Text */}
        <div className="mb-3">
          <textarea
            className="w-full bg-black/30 border border-[rgba(255,255,255,0.1)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,198,255,0.4)] transition-colors font-body resize-none h-20"
            placeholder={`How was your experience working with ${otherUserName || 'them'}?`}
            maxLength={280}
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          />
          <p className="text-right text-[10px] text-text-dim/40 font-body mt-0.5">
            {reviewText.length}/280
          </p>
        </div>

        {/* Quick-select tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {QUICK_TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-2.5 py-1 rounded-full text-[10px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97]"
                style={{
                  color: isSelected ? '#00C6FF' : 'rgba(200,209,218,0.5)',
                  backgroundColor: isSelected ? 'rgba(0,198,255,0.12)' : 'transparent',
                  borderColor: isSelected ? 'rgba(0,198,255,0.35)' : 'rgba(255,255,255,0.1)',
                }}
              >
                {tag}
              </button>
            )
          })}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-sm text-xs font-heading font-semibold tracking-wider text-white bg-[#E53935] border border-[#E53935]/40 hover:bg-[#ef5350] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E53935]/60 active:scale-[0.98] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(229,57,53,0.2)]"
        >
          <Send size={12} />
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </GlassPanel>
  )
}
