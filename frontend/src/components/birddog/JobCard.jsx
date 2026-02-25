import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Send, Users, ChevronUp, CheckCircle } from 'lucide-react'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import GlassPanel from '../GlassPanel'
import ApplicantsList from './ApplicantsList'
import StarRating from './StarRating'

// ─── Urgency color map ───────────────────────────────────────────────────────

const URGENCY_COLORS = {
  Low:    '#10b981',
  Medium: '#F6C445',
  High:   '#f97316',
  ASAP:   '#E53935',
}

// ─── Format deadline ─────────────────────────────────────────────────────────

function formatDeadline(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

// ─── useUserRating hook ──────────────────────────────────────────────────────

function useUserRating(userId) {
  const [data, setData] = useState({ avgRating: 0, reviewCount: 0, loading: true })

  useEffect(() => {
    if (!userId) {
      setData({ avgRating: 0, reviewCount: 0, loading: false })
      return
    }
    const q = query(
      collection(db, 'bird_dog_reviews'),
      where('revieweeId', '==', userId),
    )
    const unsub = onSnapshot(q, (snap) => {
      const reviews = snap.docs.map((d) => d.data())
      const count = reviews.length
      const avg = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
      setData({ avgRating: Math.round(avg * 10) / 10, reviewCount: count, loading: false })
    })
    return () => unsub()
  }, [userId])

  return data
}

// ─── JobCard ─────────────────────────────────────────────────────────────────

export default function JobCard({ post, onApply, currentUserId }) {
  const [showApplicants, setShowApplicants] = useState(false)
  const [completing, setCompleting] = useState(false)

  const initial = (post.authorName || '?')[0].toUpperCase()
  const isOwner = post.userId === currentUserId
  const { avgRating, reviewCount } = useUserRating(post.userId)
  const urgencyColor = URGENCY_COLORS[post.urgency] || '#C8D1DA'
  const deadlineText = formatDeadline(post.deadline)
  const applicantCount = post.applicants?.length || 0

  // Mark Complete logic
  const isAcceptedApplicant = post.applicants?.some(
    (a) => a.userId === currentUserId && a.status === 'accepted',
  )
  const canComplete =
    post.status === 'in_progress' && (post.userId === currentUserId || isAcceptedApplicant)

  async function handleMarkComplete() {
    setCompleting(true)
    try {
      await updateDoc(doc(db, 'bird_dog_posts', post.id), { status: 'completed' })
    } catch (err) {
      console.error('Error marking complete:', err)
    } finally {
      setCompleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <GlassPanel className="p-4">
        {/* Top row — Avatar + Name + Rating */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-heading font-bold text-sm"
            style={{
              backgroundColor: 'rgba(246,196,69,0.15)',
              color: '#F6C445',
              boxShadow: '0 0 12px rgba(246,196,69,0.2)',
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-parchment truncate">
              {post.authorName || 'Unknown'}
            </p>
          </div>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <StarRating rating={avgRating} size={12} />
              <span className="text-[10px] text-text-dim/50 font-body">
                ({reviewCount})
              </span>
            </div>
          ) : (
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-widest"
              style={{
                color: '#F6C445',
                backgroundColor: 'rgba(246,196,69,0.12)',
                border: '1px solid rgba(246,196,69,0.25)',
              }}
            >
              New
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-parchment tracking-wider text-sm mb-2.5 leading-snug">
          {post.title || 'Untitled Job'}
        </h3>

        {/* Target area tags */}
        {post.area?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {post.area.map((area) => (
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

        {/* Task type badge */}
        {post.taskType && (
          <div className="mb-2.5">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
              style={{
                color: '#00C6FF',
                backgroundColor: 'rgba(0,198,255,0.10)',
                border: '1px solid rgba(0,198,255,0.30)',
              }}
            >
              {post.taskType}
            </span>
          </div>
        )}

        {/* Payout */}
        {post.payout && (
          <p
            className="font-heading font-bold text-xl tracking-wider mb-2"
            style={{ color: '#F6C445' }}
          >
            {post.payout}
          </p>
        )}

        {/* Urgency badge */}
        {post.urgency && (
          <div className="mb-2">
            <span
              className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-widest"
              style={{
                color: urgencyColor,
                backgroundColor: `${urgencyColor}18`,
                border: `1px solid ${urgencyColor}33`,
              }}
            >
              {post.urgency}
            </span>
          </div>
        )}

        {/* Deadline */}
        {deadlineText && (
          <p className="text-[11px] text-text-dim/50 font-body mb-3">
            Due: {deadlineText}
          </p>
        )}

        {/* Bottom row — Buttons */}
        <div className="flex gap-2 mt-1">
          {!isOwner ? (
            <>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.08)]"
                style={{
                  color: '#00C6FF',
                  borderColor: 'rgba(0,198,255,0.35)',
                }}
              >
                <Eye size={12} />
                View Details
              </button>
              {canComplete ? (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(16,185,129,0.08)] disabled:opacity-50"
                  style={{
                    color: '#10b981',
                    borderColor: 'rgba(16,185,129,0.35)',
                  }}
                >
                  <CheckCircle size={12} />
                  {completing ? 'Completing...' : 'Mark Complete'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onApply?.(post)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider text-white transition-colors active:scale-[0.98] hover:bg-[#ef5350]"
                  style={{
                    backgroundColor: '#E53935',
                    border: '1px solid rgba(229,57,53,0.40)',
                    boxShadow: '0 4px 16px rgba(229,57,53,0.20)',
                  }}
                >
                  <Send size={12} />
                  Apply
                </button>
              )}
            </>
          ) : (
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowApplicants((prev) => !prev)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.08)]"
                style={{
                  color: '#00C6FF',
                  borderColor: 'rgba(0,198,255,0.35)',
                }}
              >
                {showApplicants ? (
                  <ChevronUp size={12} />
                ) : (
                  <Users size={12} />
                )}
                {showApplicants ? 'Hide Applicants' : `View Applicants${applicantCount > 0 ? ` (${applicantCount})` : ''}`}
              </button>
              {canComplete && (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(16,185,129,0.08)] disabled:opacity-50"
                  style={{
                    color: '#10b981',
                    borderColor: 'rgba(16,185,129,0.35)',
                  }}
                >
                  <CheckCircle size={12} />
                  {completing ? '...' : 'Complete'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Applicants list — inline expandable section for post owner */}
        <AnimatePresence>
          {isOwner && showApplicants && (
            <motion.div
              key="applicants-section"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ overflow: 'hidden' }}
            >
              <ApplicantsList post={post} firebaseUid={currentUserId} />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>
    </motion.div>
  )
}
