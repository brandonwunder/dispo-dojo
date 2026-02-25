import { motion } from 'framer-motion'
import { MessageSquare, User } from 'lucide-react'
import GlassPanel from '../GlassPanel'

// ─── BirdDogCard ─────────────────────────────────────────────────────────────

export default function BirdDogCard({ post }) {
  const initial = (post.authorName || '?')[0].toUpperCase()

  // Determine availability display
  const isAvailable = post.availability === 'available' || post.availability === 'now'
  const startingDate = !isAvailable && post.availability && post.availability !== 'unavailable'
    ? post.availability
    : null

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
              backgroundColor: 'rgba(0,198,255,0.15)',
              color: '#00C6FF',
              boxShadow: '0 0 12px rgba(0,198,255,0.2)',
            }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-semibold text-sm text-parchment truncate">
              {post.authorName || 'Unknown'}
            </p>
          </div>
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
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-parchment tracking-wider text-sm mb-2.5 leading-snug">
          {post.title || 'Untitled Post'}
        </h3>

        {/* Service area tags */}
        {post.area?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {post.area.map((area) => (
              <span
                key={area}
                className="inline-block px-2 py-0.5 rounded-full text-[10px] font-heading font-semibold tracking-wider"
                style={{
                  color: '#00C6FF',
                  backgroundColor: 'rgba(0,198,255,0.10)',
                  border: '1px solid rgba(0,198,255,0.30)',
                }}
              >
                {area}
              </span>
            ))}
          </div>
        )}

        {/* Method badges */}
        {post.methods?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {post.methods.map((method) => (
              <span
                key={method}
                className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-body text-text-dim"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {method}
              </span>
            ))}
          </div>
        )}

        {/* Availability badge */}
        <div className="flex items-center gap-2 mb-2.5">
          {isAvailable ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.5)' }} />
              <span className="text-[11px] font-heading font-semibold tracking-wider" style={{ color: '#10b981' }}>
                Available
              </span>
            </div>
          ) : startingDate ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F6C445', boxShadow: '0 0 6px rgba(246,196,69,0.5)' }} />
              <span className="text-[11px] font-heading font-semibold tracking-wider" style={{ color: '#F6C445' }}>
                Starting {startingDate}
              </span>
            </div>
          ) : null}
        </div>

        {/* Track record placeholder */}
        <p className="text-[11px] text-text-dim/40 font-body mb-3">
          Track record loading...
        </p>

        {/* Bottom row — Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.08)]"
            style={{
              color: '#00C6FF',
              borderColor: 'rgba(0,198,255,0.35)',
            }}
          >
            <User size={12} />
            View Profile
          </button>
          <button
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-sm text-[11px] font-heading font-semibold tracking-wider border transition-colors active:scale-[0.97] hover:bg-[rgba(0,198,255,0.08)]"
            style={{
              color: '#00C6FF',
              borderColor: 'rgba(0,198,255,0.35)',
            }}
          >
            <MessageSquare size={12} />
            Message
          </button>
        </div>
      </GlassPanel>
    </motion.div>
  )
}
