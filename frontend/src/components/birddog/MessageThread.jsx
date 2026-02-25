import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Send } from 'lucide-react'
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, arrayRemove,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMessageTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = now - date

  // Today: show time
  if (diff < 86400000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  // Yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth()) {
    return 'Yesterday ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  // Older
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ─── MessageThread ───────────────────────────────────────────────────────────

export default function MessageThread({ thread, firebaseUid, profile, onBack }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Determine other participant
  const otherUserId = thread.participants?.find((id) => id !== firebaseUid) || ''
  const otherName = thread.participantNames?.[otherUserId] || 'Unknown'

  // ─── Mark thread as read ────────────────────────────────────────────────────
  useEffect(() => {
    if (!thread?.id || !firebaseUid) return
    if (thread.unreadBy?.includes(firebaseUid)) {
      updateDoc(doc(db, 'bird_dog_threads', thread.id), {
        unreadBy: arrayRemove(firebaseUid),
      }).catch((err) => console.error('Mark read error:', err))
    }
  }, [thread?.id, firebaseUid, thread?.unreadBy])

  // ─── Real-time messages listener ────────────────────────────────────────────
  useEffect(() => {
    if (!thread?.id) return

    const q = query(
      collection(db, 'bird_dog_threads', thread.id, 'bird_dog_messages'),
      orderBy('createdAt', 'asc'),
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      (err) => console.error('Messages listener error:', err),
    )

    return () => unsub()
  }, [thread?.id])

  // ─── Auto-scroll on new messages ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ─── Send message ──────────────────────────────────────────────────────────
  async function handleSend(e) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      await addDoc(collection(db, 'bird_dog_threads', thread.id, 'bird_dog_messages'), {
        senderId: firebaseUid,
        text: trimmed,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'bird_dog_threads', thread.id), {
        lastMessage: trimmed,
        lastMessageAt: serverTimestamp(),
        unreadBy: [otherUserId],
      })
      setText('')
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ──────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <button
          onClick={onBack}
          className="p-1 rounded-sm text-text-dim hover:text-parchment transition-colors active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-heading font-bold text-sm text-parchment truncate">
            {otherName}
          </p>
          <p className="text-[10px] text-text-dim/60 font-body truncate">
            {thread.jobTitle || 'Direct message'}
          </p>
        </div>
      </div>

      {/* ── Contact info placeholder bar ────────────────── */}
      <div
        className="shrink-0 px-4 py-2 text-[10px] text-text-dim/40 font-body"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.15)' }}
      >
        Contact info will appear here when shared
      </div>

      {/* ── Messages area ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-text-dim/30 font-body text-center">
              No messages yet. Say hello!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.senderId === firebaseUid
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[80%]">
                <div
                  className="px-3 py-2 rounded-lg text-sm font-body leading-relaxed"
                  style={
                    isMine
                      ? {
                          backgroundColor: 'rgba(0,198,255,0.15)',
                          border: '1px solid rgba(0,198,255,0.30)',
                          color: '#F4F7FA',
                        }
                      : {
                          backgroundColor: 'rgba(0,0,0,0.30)',
                          border: '1px solid rgba(255,255,255,0.07)',
                          color: '#C8D1DA',
                        }
                  }
                >
                  {msg.text}
                </div>
                <p
                  className={`text-[9px] mt-1 font-body ${isMine ? 'text-right' : 'text-left'}`}
                  style={{ color: 'rgba(200,209,218,0.35)' }}
                >
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </motion.div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ──────────────────────────────────── */}
      <form
        onSubmit={handleSend}
        className="shrink-0 flex items-center gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-black/30 border border-[rgba(255,255,255,0.10)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 font-body focus:outline-none focus:border-[rgba(0,198,255,0.40)] transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="p-2 rounded-sm transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: '#00C6FF' }}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = 'rgba(0,198,255,0.10)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
