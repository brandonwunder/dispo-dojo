import { motion } from 'framer-motion'
import { MessageCircle } from 'lucide-react'
import GlassPanel from '../GlassPanel'
import StarRating from './StarRating'
import useBootsRating from './useBootsRating'

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

// ─── Card Component ──────────────────────────────────────────────────────────

export default function BootsOperatorCard({ post }) {
  const firstLetter = (post.userName || 'A').charAt(0).toUpperCase()
  const isAvailable = post.availability === 'available'
  const { avg, count, loading: ratingLoading } = useBootsRating(post.userId)

  return (
    <motion.div variants={cardVariants}>
      <GlassPanel className="p-5 flex flex-col gap-3.5 h-full">
        {/* Top row: avatar + name + rating */}
        <div className="flex items-center gap-3">
          <div
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-heading font-bold"
            style={{
              backgroundColor: 'rgba(0,198,255,0.18)',
              color: '#00C6FF',
              border: '1px solid rgba(0,198,255,0.3)',
            }}
          >
            {firstLetter}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-heading font-semibold tracking-wider text-parchment truncate">
              {post.userName || 'Anonymous'}
            </p>
          </div>
          <span className="shrink-0 flex items-center gap-1.5">
            {ratingLoading ? (
              <span className="text-[10px] font-heading font-semibold tracking-wider" style={{ color: '#C8D1DA', opacity: 0.4 }}>...</span>
            ) : count > 0 ? (
              <>
                <StarRating value={avg} readOnly size={12} />
                <span className="text-[10px] font-heading font-semibold tracking-wider" style={{ color: '#C8D1DA' }}>
                  ({count})
                </span>
              </>
            ) : (
              <span className="text-[10px] font-heading font-semibold tracking-wider" style={{ color: '#C8D1DA', opacity: 0.5 }}>
                New
              </span>
            )}
          </span>
        </div>

        {/* Title */}
        <h3
          className="font-heading font-bold text-sm leading-snug"
          style={{ color: '#F4F7FA' }}
        >
          {post.title}
        </h3>

        {/* Service area chips */}
        {post.serviceArea?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.serviceArea.map((area) => (
              <span
                key={area}
                className="px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
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

        {/* Availability + Contact row */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isAvailable ? '#10b981' : '#6b7280',
                boxShadow: isAvailable ? '0 0 6px rgba(16,185,129,0.5)' : 'none',
              }}
            />
            <span
              className="text-[10px] font-heading font-semibold tracking-wider"
              style={{ color: isAvailable ? '#10b981' : '#6b7280' }}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/40"
            style={{
              borderColor: 'rgba(0,198,255,0.35)',
              color: '#00C6FF',
            }}
          >
            <MessageCircle size={12} />
            Contact
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  )
}
