import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'
import StarRating from './StarRating'

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(timestamp) {
  if (!timestamp) return ''
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Tag Colors ─────────────────────────────────────────────────────────────

const TAG_COLORS = {
  Responsive: '#00C6FF',
  Reliable: '#10b981',
  'Quality Work': '#F6C445',
  'Good Communicator': '#A855F7',
  'On Time': '#f97316',
}

// ─── ReviewsList ────────────────────────────────────────────────────────────
// Displays reviews for a user. Pass field="revieweeId" for reviews ABOUT a user,
// or field="reviewerId" for reviews WRITTEN BY a user.

export default function ReviewsList({ userId, field = 'revieweeId', emptyMessage }) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    const q = query(
      collection(db, 'boots_reviews'),
      where(field, '==', userId),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [userId, field])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <GlassPanel className="p-6 text-center">
        <Star size={24} className="mx-auto mb-2" style={{ color: '#C8D1DA', opacity: 0.25 }} />
        <p className="text-text-dim font-body text-sm">
          {emptyMessage || 'No reviews yet.'}
        </p>
      </GlassPanel>
    )
  }

  // Compute average rating
  const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
  const avgRating = Math.round((totalRating / reviews.length) * 10) / 10

  return (
    <div className="flex flex-col gap-4">
      {/* Summary header */}
      <div className="flex items-center gap-3">
        <StarRating value={avgRating} readOnly size={18} />
        <span
          className="text-sm font-heading font-semibold"
          style={{ color: '#F6C445' }}
        >
          {avgRating}
        </span>
        <span className="text-xs font-body" style={{ color: '#C8D1DA' }}>
          ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
        </span>
      </div>

      {/* Individual review cards */}
      <motion.div
        className="flex flex-col gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      >
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <GlassPanel className="p-4">
              {/* Reviewer name + date */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-heading font-bold"
                    style={{
                      backgroundColor: 'rgba(0,198,255,0.15)',
                      color: '#00C6FF',
                      border: '1px solid rgba(0,198,255,0.25)',
                    }}
                  >
                    {(review.reviewerName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <span
                    className="text-xs font-heading font-semibold tracking-wider"
                    style={{ color: '#F4F7FA' }}
                  >
                    {review.reviewerName || 'Anonymous'}
                  </span>
                </div>
                {review.createdAt && (
                  <span className="text-[10px] font-body" style={{ color: '#C8D1DA', opacity: 0.5 }}>
                    {timeAgo(review.createdAt)}
                  </span>
                )}
              </div>

              {/* Star rating */}
              <div className="mb-2">
                <StarRating value={review.rating} readOnly size={14} />
              </div>

              {/* Tags */}
              {review.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {review.tags.map((tag) => {
                    const color = TAG_COLORS[tag] || '#C8D1DA'
                    return (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded-sm text-[9px] font-heading font-semibold tracking-wider"
                        style={{
                          backgroundColor: `${color}15`,
                          border: `1px solid ${color}30`,
                          color,
                        }}
                      >
                        {tag}
                      </span>
                    )
                  })}
                </div>
              )}

              {/* Review text */}
              {review.text && (
                <p
                  className="text-xs font-body leading-relaxed"
                  style={{ color: '#C8D1DA' }}
                >
                  {review.text}
                </p>
              )}
            </GlassPanel>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
