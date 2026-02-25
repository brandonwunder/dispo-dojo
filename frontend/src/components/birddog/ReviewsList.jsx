import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { Star as StarIcon } from 'lucide-react'
import GlassPanel from '../GlassPanel'
import StarRating from './StarRating'

// ─── ReviewsList ─────────────────────────────────────────────────────────────
// Displays reviews received by a user.

export default function ReviewsList({ userId }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'bird_dog_reviews'),
      where('revieweeId', '==', userId),
      orderBy('createdAt', 'desc'),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('ReviewsList listener error:', err)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [userId])

  // Compute average
  const reviewCount = reviews.length
  const avgRating =
    reviewCount > 0
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount) * 10) / 10
      : 0

  function formatDate(timestamp) {
    if (!timestamp) return ''
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (loading) {
    return (
      <GlassPanel className="p-5">
        <div className="flex items-center justify-center py-10">
          <div
            className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
          />
        </div>
      </GlassPanel>
    )
  }

  if (reviewCount === 0) {
    return (
      <GlassPanel className="p-5">
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
          <StarIcon size={24} className="text-text-dim/25" />
          <p className="text-xs text-text-dim/40 font-body">No reviews yet</p>
        </div>
      </GlassPanel>
    )
  }

  return (
    <GlassPanel className="p-5">
      {/* Summary */}
      <div className="flex items-center gap-2 mb-4">
        <StarRating rating={avgRating} size={16} />
        <span className="font-heading font-semibold text-sm tracking-wider text-parchment">
          {avgRating}
        </span>
        <span className="text-[11px] text-text-dim/50 font-body">
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Individual reviews */}
      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-3 rounded-sm bg-black/30 border border-[rgba(255,255,255,0.07)]"
          >
            {/* Reviewer name + stars */}
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-xs font-heading font-semibold text-parchment truncate">
                {review.reviewerName || 'Anonymous'}
              </p>
              <StarRating rating={review.rating || 0} size={12} />
            </div>

            {/* Review text */}
            {review.text && (
              <p className="text-[11px] text-text-dim leading-relaxed font-body mb-2">
                {review.text}
              </p>
            )}

            {/* Tags */}
            {review.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {review.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[9px] font-heading tracking-widest"
                    style={{
                      color: 'rgba(200,209,218,0.5)',
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Date */}
            <p className="text-[10px] text-text-dim/30 font-body">
              {formatDate(review.createdAt)}
            </p>
          </div>
        ))}
      </div>
    </GlassPanel>
  )
}
