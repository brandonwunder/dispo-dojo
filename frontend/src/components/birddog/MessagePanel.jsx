import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail } from 'lucide-react'
import {
  collection, query, where, orderBy, onSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import MessageThread from './MessageThread'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Slide animation ─────────────────────────────────────────────────────────

const panelVariants = {
  closed: { x: '100%', opacity: 0.5 },
  open: { x: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
}

const overlayVariants = {
  closed: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// ─── MessagePanel ────────────────────────────────────────────────────────────

export default function MessagePanel({ isOpen, onClose, firebaseUid, profile }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeThread, setActiveThread] = useState(null)

  // ─── Real-time threads listener ─────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUid) {
      setLoading(false)
      return
    }

    const q = query(
      collection(db, 'bird_dog_threads'),
      where('participants', 'array-contains', firebaseUid),
      orderBy('lastMessageAt', 'desc'),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        setThreads(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Threads listener error:', err)
        setLoading(false)
      },
    )

    return () => unsub()
  }, [firebaseUid])

  // Close active thread when panel closes
  useEffect(() => {
    if (!isOpen) setActiveThread(null)
  }, [isOpen])

  // Count unread for header badge
  const unreadCount = threads.filter((t) => t.unreadBy?.includes(firebaseUid)).length

  function handleBack() {
    setActiveThread(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="msg-overlay"
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 z-[39]"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          />

          {/* Panel */}
          <motion.div
            key="msg-panel"
            variants={panelVariants}
            initial="closed"
            animate="open"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-40 flex flex-col"
            style={{
              background: 'rgba(11,15,20,0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {activeThread ? (
              /* ── Active Thread View ────────────────────────── */
              <MessageThread
                thread={activeThread}
                firebaseUid={firebaseUid}
                profile={profile}
                onBack={handleBack}
              />
            ) : (
              /* ── Thread List View ──────────────────────────── */
              <>
                {/* Header */}
                <div
                  className="shrink-0 flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-heading font-bold text-base tracking-wider text-parchment">
                      Messages
                    </h2>
                    {unreadCount > 0 && (
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-heading font-bold"
                        style={{
                          color: '#00C6FF',
                          backgroundColor: 'rgba(0,198,255,0.15)',
                          border: '1px solid rgba(0,198,255,0.30)',
                        }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-sm text-text-dim hover:text-parchment transition-colors active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Thread list */}
                <div className="flex-1 overflow-y-auto">
                  {loading && (
                    <div className="flex items-center justify-center py-16">
                      <div
                        className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: 'rgba(0,198,255,0.4)', borderTopColor: 'transparent' }}
                      />
                    </div>
                  )}

                  {!loading && threads.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'rgba(0,198,255,0.08)', border: '1px solid rgba(0,198,255,0.15)' }}
                      >
                        <Mail size={20} style={{ color: 'rgba(0,198,255,0.4)' }} />
                      </div>
                      <p className="text-sm text-text-dim/40 font-body">No messages yet</p>
                      <p className="text-xs text-text-dim/25 font-body">
                        When you accept an applicant or get accepted for a job, a conversation will start here.
                      </p>
                    </div>
                  )}

                  {!loading && threads.length > 0 && (
                    <div className="flex flex-col">
                      {threads.map((thread) => {
                        const otherUserId = thread.participants?.find((id) => id !== firebaseUid) || ''
                        const otherName = thread.participantNames?.[otherUserId] || 'Unknown'
                        const isUnread = thread.unreadBy?.includes(firebaseUid)
                        const firstLetter = (otherName[0] || '?').toUpperCase()

                        return (
                          <button
                            key={thread.id}
                            onClick={() => setActiveThread(thread)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgba(255,255,255,0.03)] active:bg-[rgba(255,255,255,0.05)]"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            {/* Avatar */}
                            <div
                              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm"
                              style={{
                                backgroundColor: isUnread ? 'rgba(0,198,255,0.15)' : 'rgba(255,255,255,0.06)',
                                border: `1px solid ${isUnread ? 'rgba(0,198,255,0.30)' : 'rgba(255,255,255,0.10)'}`,
                                color: isUnread ? '#00C6FF' : '#C8D1DA',
                              }}
                            >
                              {firstLetter}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p
                                  className={`text-sm truncate ${isUnread ? 'font-heading font-bold text-parchment' : 'font-heading font-semibold text-text-dim'}`}
                                >
                                  {otherName}
                                </p>
                                <span className="shrink-0 text-[10px] font-body" style={{ color: 'rgba(200,209,218,0.35)' }}>
                                  {relativeTime(thread.lastMessageAt)}
                                </span>
                              </div>
                              <p className="text-[11px] font-body truncate mt-0.5" style={{ color: 'rgba(0,198,255,0.50)' }}>
                                {thread.jobTitle || 'Direct message'}
                              </p>
                              {thread.lastMessage && (
                                <p className="text-xs font-body truncate mt-0.5" style={{ color: 'rgba(200,209,218,0.4)' }}>
                                  {thread.lastMessage}
                                </p>
                              )}
                            </div>

                            {/* Unread dot */}
                            {isUnread && (
                              <div
                                className="shrink-0 w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: '#00C6FF', boxShadow: '0 0 6px rgba(0,198,255,0.5)' }}
                              />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
