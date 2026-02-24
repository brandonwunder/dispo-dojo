import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react'

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function PinnedMessagesBar({ pinnedMessages, isAdmin, onUnpin, onScrollTo }) {
  const [expanded, setExpanded] = useState(false)

  if (!pinnedMessages || pinnedMessages.length === 0) return null

  return (
    <div style={{ background: 'rgba(246,196,69,0.06)', borderBottom: '1px solid rgba(246,196,69,0.12)' }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-2 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Pin className="h-3 w-3 text-gold/60" />
        <span className="text-xs font-medium text-gold/70">
          {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-3 w-3 text-text-dim/30" />
        ) : (
          <ChevronDown className="ml-auto h-3 w-3 text-text-dim/30" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-[200px] overflow-y-auto"
          >
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-2 border-t border-[rgba(246,196,69,0.04)] px-5 py-2 hover:bg-white/[0.02]"
              >
                <button
                  onClick={() => onScrollTo(msg.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-heading font-semibold text-parchment">
                      {msg.authorName}
                    </span>
                    <span className="text-[9px] text-text-dim/25">{fmtTime(msg.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-text-dim/50">{msg.body}</p>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onUnpin(msg.id)}
                    className="shrink-0 text-text-dim/30 hover:text-red-400 transition-colors"
                    title="Unpin"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
