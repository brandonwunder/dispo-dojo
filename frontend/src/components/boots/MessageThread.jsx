import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

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

// ─── MessageThread ──────────────────────────────────────────────────────────

export default function MessageThread({ thread, firebaseUid, onBack }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

  // Other person's name
  const otherParticipantId = thread.participants?.find(
    (p) => p !== firebaseUid,
  )
  const otherName =
    thread.participantNames?.[otherParticipantId] || 'Unknown User'

  // Subscribe to messages
  useEffect(() => {
    if (!thread?.id) return

    const q = query(
      collection(db, 'boots_threads', thread.id, 'boots_messages'),
    )

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
      setMessages(docs)
      setLoading(false)
    })

    return unsub
  }, [thread?.id])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Mark messages as read when thread is opened
  useEffect(() => {
    if (!thread?.id || !firebaseUid) return

    // Remove current user from unreadBy on the thread
    if (thread.unreadBy?.includes(firebaseUid)) {
      const newUnreadBy = thread.unreadBy.filter((id) => id !== firebaseUid)
      updateDoc(doc(db, 'boots_threads', thread.id), {
        unreadBy: newUnreadBy,
      }).catch((err) => console.error('Failed to mark thread read:', err))
    }
  }, [thread?.id, firebaseUid, thread?.unreadBy])

  // Send message
  async function handleSend(e) {
    e.preventDefault()
    const text = messageText.trim()
    if (!text || sending) return

    setSending(true)
    setMessageText('')

    try {
      // Add message to subcollection
      await addDoc(
        collection(db, 'boots_threads', thread.id, 'boots_messages'),
        {
          senderId: firebaseUid,
          text,
          readBy: [firebaseUid],
          createdAt: serverTimestamp(),
        },
      )

      // Determine the other participant to mark as unread for them
      const otherParticipant = thread.participants?.find(
        (p) => p !== firebaseUid,
      )

      // Update thread metadata
      await updateDoc(doc(db, 'boots_threads', thread.id), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        unreadBy: otherParticipant ? [otherParticipant] : [],
      })
    } catch (err) {
      console.error('Failed to send message:', err)
      setMessageText(text) // Restore text on failure
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 57px)' }}>
      {/* Thread Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={onBack}
          className="p-1.5 rounded-sm transition-colors hover:brightness-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30 active:scale-[0.95]"
          style={{ color: '#C8D1DA' }}
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h3
            className="text-xs font-heading font-semibold tracking-wider truncate"
            style={{ color: '#F4F7FA' }}
          >
            {otherName}
          </h3>
          <p
            className="text-[10px] font-heading tracking-wider truncate"
            style={{ color: '#00C6FF', opacity: 0.7 }}
          >
            {thread.postTitle}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5"
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
        ) : messages.length === 0 ? (
          <div className="py-12 text-center">
            <p
              className="text-xs font-body"
              style={{ color: '#C8D1DA', opacity: 0.4 }}
            >
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === firebaseUid

            return (
              <motion.div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  className="max-w-[80%] rounded-xl px-3.5 py-2.5"
                  style={
                    isMine
                      ? {
                          background:
                            'linear-gradient(135deg, rgba(0,198,255,0.18) 0%, rgba(14,90,136,0.25) 100%)',
                          border: '1px solid rgba(0,198,255,0.2)',
                        }
                      : {
                          background: 'rgba(11,15,20,0.5)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }
                  }
                >
                  <p
                    className="text-xs font-body leading-relaxed break-words"
                    style={{ color: '#F4F7FA' }}
                  >
                    {msg.text}
                  </p>
                  <p
                    className="text-[9px] font-body mt-1"
                    style={{
                      color: isMine
                        ? 'rgba(0,198,255,0.5)'
                        : 'rgba(200,209,218,0.4)',
                    }}
                  >
                    {relativeTime(msg.createdAt)}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="shrink-0 px-4 py-3 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-body outline-none transition-colors focus:ring-2 focus:ring-[#00C6FF]/25"
          style={{
            backgroundColor: 'rgba(11,15,20,0.5)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#F4F7FA',
          }}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!messageText.trim() || sending}
          className="p-2.5 rounded-xl transition-colors active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/30 disabled:opacity-30 disabled:pointer-events-none hover:brightness-125"
          style={{
            backgroundColor: 'rgba(0,198,255,0.15)',
            border: '1px solid rgba(0,198,255,0.3)',
            color: '#00C6FF',
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
