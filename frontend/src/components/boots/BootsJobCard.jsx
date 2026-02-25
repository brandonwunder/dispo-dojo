import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, MapPin, Users, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import GlassPanel from '../GlassPanel'
import ApplicantsList from './ApplicantsList'

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

export const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Card Component ──────────────────────────────────────────────────────────

export default function BootsJobCard({
  post,
  onApply,
  currentUserId,
  userApplications = [],
}) {
  const [showApplicants, setShowApplicants] = useState(false)
  const firstLetter = (post.userName || 'A').charAt(0).toUpperCase()
  const isUrgent = post.urgency === 'urgent'

  const isAuthor = currentUserId && post.userId === currentUserId
  const hasApplied = userApplications.includes(post.id)

  return (
    <motion.div variants={cardVariants}>
      <GlassPanel className="p-5 flex flex-col gap-3.5 h-full">
        {/* Top row: avatar + name + rating */}
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold"
            style={{
              backgroundColor: 'rgba(246,196,69,0.18)',
              color: '#F6C445',
              border: '1px solid rgba(246,196,69,0.3)',
            }}
          >
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold tracking-wider text-parchment truncate">
              {post.userName || 'Anonymous'}
            </p>
          </div>
          <span
            className="shrink-0 flex items-center gap-1 text-[10px] font-heading font-semibold tracking-wider"
            style={{ color: '#C8D1DA' }}
          >
            <Star size={12} style={{ color: '#F6C445', opacity: 0.5 }} />
            New
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-heading font-bold text-sm leading-snug"
          style={{ color: '#F4F7FA' }}
        >
          {post.title}
        </h3>

        {/* Task type badges */}
        {post.taskTypes?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.taskTypes.map((type) => {
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

        {/* Location line */}
        {post.location && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} style={{ color: '#C8D1DA' }} />
            <span className="text-xs font-body text-text-dim truncate">
              {post.location}
            </span>
          </div>
        )}

        {/* Urgency badge + Posted date */}
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
            style={{
              backgroundColor: isUrgent ? 'rgba(229,57,53,0.18)' : 'rgba(16,185,129,0.18)',
              border: `1px solid ${isUrgent ? 'rgba(229,57,53,0.35)' : 'rgba(16,185,129,0.35)'}`,
              color: isUrgent ? '#E53935' : '#10b981',
              boxShadow: isUrgent
                ? '0 0 8px rgba(229,57,53,0.3), 0 0 16px rgba(229,57,53,0.15)'
                : 'none',
              animation: isUrgent ? 'pulse-glow 2s ease-in-out infinite' : 'none',
            }}
          >
            {isUrgent ? 'Urgent' : 'Normal'}
          </span>
          {post.createdAt && (
            <span className="text-[10px] font-body text-text-dim/50">
              {timeAgo(post.createdAt)}
            </span>
          )}
        </div>

        {/* Action button — three states */}
        <div className="mt-auto pt-1">
          {isAuthor ? (
            /* Post author sees "View Applicants" */
            <button
              onClick={() => setShowApplicants((prev) => !prev)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40"
              style={{
                borderColor: 'rgba(0,198,255,0.35)',
                color: '#00C6FF',
              }}
            >
              <Users size={13} />
              View Applicants ({post.applicantCount || 0})
              {showApplicants ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : hasApplied ? (
            /* User has already applied */
            <button
              disabled
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border cursor-default opacity-50"
              style={{
                borderColor: 'rgba(200,209,218,0.2)',
                color: '#C8D1DA',
              }}
            >
              <CheckCircle size={13} />
              Applied
            </button>
          ) : (
            /* Default: Apply */
            <button
              onClick={() => onApply?.(post)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(246,196,69,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40"
              style={{
                borderColor: 'rgba(246,196,69,0.35)',
                color: '#F6C445',
              }}
            >
              Apply
            </button>
          )}
        </div>

        {/* Inline applicants list (expanded for post author) */}
        <AnimatePresence>
          {isAuthor && showApplicants && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="overflow-hidden"
            >
              <div
                className="border-t pt-3 mt-1"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <ApplicantsList
                  postId={post.id}
                  post={post}
                  firebaseUid={currentUserId}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassPanel>

      {/* Pulsing glow keyframes for urgent badge */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(229,57,53,0.3), 0 0 16px rgba(229,57,53,0.15); }
          50% { box-shadow: 0 0 12px rgba(229,57,53,0.5), 0 0 24px rgba(229,57,53,0.25); }
        }
      `}</style>
    </motion.div>
  )
}
