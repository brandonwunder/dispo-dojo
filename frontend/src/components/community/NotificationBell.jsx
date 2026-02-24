import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  AtSign,
  Heart,
  Reply,
  MessageSquare,
  Award,
  Pin,
} from 'lucide-react'

/* -- helpers -------------------------------------------------- */

function relativeTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

const ICON_BY_TYPE = {
  mention: AtSign,
  reaction: Heart,
  reply: Reply,
  dm: MessageSquare,
  badge_earned: Award,
  pinned: Pin,
}

/* -- component ------------------------------------------------ */

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleItemClick = (notification) => {
    onMarkRead?.(notification.id)
    onNavigate?.(notification)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#E53935] px-0.5 text-[8px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[rgba(246,196,69,0.10)] px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-text-dim/50">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => onMarkAllRead?.()}
                  className="text-[10px] text-[#00C6FF] transition-colors duration-150 hover:text-[#00C6FF]/70 focus-visible:outline-none active:scale-95"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification list */}
            <div className="max-h-[360px] overflow-y-auto">
              {(!notifications || notifications.length === 0) ? (
                <div className="flex flex-col items-center gap-1.5 py-8 text-text-dim/30">
                  <Bell className="h-5 w-5" />
                  <p className="text-[10px]">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = ICON_BY_TYPE[n.type] || Bell
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleItemClick(n)}
                      className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.03] focus-visible:outline-none"
                    >
                      {/* Unread dot */}
                      <div className="flex w-2 shrink-0 items-center pt-1">
                        {!n.read && (
                          <div className="h-1.5 w-1.5 rounded-full bg-[#00C6FF] shadow-[0_0_4px_rgba(0,198,255,0.5)]" />
                        )}
                      </div>

                      {/* Icon */}
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <Icon className="h-3.5 w-3.5 text-text-dim/50" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-1">
                          <span className="text-[10px] font-semibold text-parchment">
                            {n.fromName}
                          </span>
                          <span className="shrink-0 text-[9px] text-text-dim/30">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-snug text-text-dim">
                          {n.message}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
