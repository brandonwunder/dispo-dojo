import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare } from 'lucide-react'
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import MessageThread from './MessageThread'

// ─── Relative Time Helper ───────────────────────────────────────────────────

function relativeTime(timestamp) {
  if (!timestamp) return ''
  const now = Date.now()
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
  const diff = now - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// ─── Thread Row ─────────────────────────────────────────────────────────────

function ThreadRow({ thread, firebaseUid, onClick }) {
  // Determine the other person's name
  const otherParticipantId = thread.participants?.find((p) => p !== firebaseUid)
  const otherName =
    thread.participantNames?.[otherParticipantId] || 'Unknown User'

  // Truncate last message
  const preview = thread.lastMessage
    ? thread.lastMessage.length > 50
      ? thread.lastMessage.slice(0, 50) + '...'
      : thread.lastMessage
    : 'No messages yet'

  // Unread indicator — check if current user is NOT in readBy of last message
  // We use a simple heuristic: if lastMessageSenderId exists and != current user,
  // and thread has an unread flag for this user
  const hasUnread = thread.unreadBy?.includes(firebaseUid)

  const firstLetter = (otherName || 'U').charAt(0).toUpperCase()

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-xl border transition-colors hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30"
      style={{
        background: hasUnread
          ? 'rgba(0,198,255,0.06)'
          : 'rgba(11,15,20,0.35)',
        borderColor: hasUnread
          ? 'rgba(0,198,255,0.18)'
          : 'rgba(255,255,255,0.06)',
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-heading font-bold"
          style={{
            backgroundColor: 'rgba(0,198,255,0.12)',
            color: '#00C6FF',
            border: '1px solid rgba(0,198,255,0.25)',
          }}
        >
          {firstLetter}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className="text-xs font-heading font-semibold tracking-wider truncate"
              style={{ color: '#F4F7FA' }}
            >
              {otherName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasUnread && (
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: '#00C6FF' }}
                />
              )}
              <span
                className="text-[10px] font-body"
                style={{ color: '#C8D1DA', opacity: 0.6 }}
              >
                {relativeTime(thread.lastMessageAt)}
              </span>
            </div>
          </div>

          {/* Post title */}
          <p
            className="text-[10px] font-heading tracking-wider truncate mb-0.5"
            style={{ color: '#00C6FF', opacity: 0.7 }}
          >
            {thread.postTitle}
          </p>

          {/* Last message preview */}
          <p
            className="text-[11px] font-body truncate leading-snug"
            style={{ color: '#C8D1DA', opacity: 0.7 }}
          >
            {preview}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

// ─── MessagePanel ───────────────────────────────────────────────────────────

export default function MessagePanel({ isOpen, onClose, firebaseUid }) {
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedThread, setSelectedThread] = useState(null)

  // Subscribe to threads for this user
  useEffect(() => {
    if (!firebaseUid || !isOpen) return

    const q = query(
      collection(db, 'boots_threads'),
      where('participants', 'array-contains', firebaseUid),
    )

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0))
      setThreads(docs)
      setLoading(false)
    })

    return unsub
  }, [firebaseUid, isOpen])

  // Count unread threads
  const unreadCount = threads.filter((t) =>
    t.unreadBy?.includes(firebaseUid),
  ).length

  // Reset selected thread when panel closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay so animation finishes before resetting
      const timer = setTimeout(() => setSelectedThread(null), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 sm:bg-transparent"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed top-0 right-0 z-50 w-full sm:w-96 h-screen flex flex-col"
            style={{
              background:
                'linear-gradient(180deg, rgba(11,15,20,0.97) 0%, rgba(17,27,36,0.97) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              boxShadow:
                '-8px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.04)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare
                  size={18}
                  style={{ color: '#00C6FF' }}
                />
                <h2
                  className="text-sm font-heading font-semibold tracking-wider"
                  style={{ color: '#F4F7FA' }}
                >
                  Messages
                </h2>
                {unreadCount > 0 && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-heading font-bold min-w-[20px] text-center"
                    style={{
                      backgroundColor: 'rgba(0,198,255,0.2)',
                      color: '#00C6FF',
                      border: '1px solid rgba(0,198,255,0.35)',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-sm transition-colors hover:brightness-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30 active:scale-[0.95]"
                style={{ color: '#C8D1DA' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {selectedThread ? (
                  <motion.div
                    key="thread"
                    className="h-full"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MessageThread
                      thread={selectedThread}
                      firebaseUid={firebaseUid}
                      onBack={() => setSelectedThread(null)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    className="p-4 flex flex-col gap-2"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center py-12">
                        <div
                          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                          style={{
                            borderColor: 'rgba(0,198,255,0.4)',
                            borderTopColor: 'transparent',
                          }}
                        />
                      </div>
                    ) : threads.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageSquare
                          size={32}
                          className="mx-auto mb-3"
                          style={{ color: '#C8D1DA', opacity: 0.2 }}
                        />
                        <p
                          className="text-sm font-body"
                          style={{ color: '#C8D1DA', opacity: 0.5 }}
                        >
                          No conversations yet
                        </p>
                        <p
                          className="text-xs font-body mt-1"
                          style={{ color: '#C8D1DA', opacity: 0.3 }}
                        >
                          Threads appear when an applicant is accepted
                        </p>
                      </div>
                    ) : (
                      threads.map((thread) => (
                        <ThreadRow
                          key={thread.id}
                          thread={thread}
                          firebaseUid={firebaseUid}
                          onClick={() => setSelectedThread(thread)}
                        />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
