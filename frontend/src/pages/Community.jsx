import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Hash,
  MessageSquare,
  Send,
  SmilePlus,
  X,
  Reply,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { db } from '../lib/firebase'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  where,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore'

/* ── constants ─────────────────────────────────────────── */
const CHANNELS = [
  { id: 'general', name: 'General', desc: 'Hang out and chat with the community' },
  { id: 'wins', name: 'Wins', desc: 'Share your wins and celebrate together' },
  { id: 'deal-talk', name: 'Deal Talk', desc: 'Discuss deals, comps, and strategy' },
  { id: 'questions', name: 'Questions', desc: 'Ask anything and get help' },
  { id: 'resources', name: 'Resources', desc: 'Share useful links and tools' },
]

const EMOJI_GRID = [
  '\u{1F44D}', '\u{1F525}', '\u{1F4AA}', '\u{1F3AF}',
  '\u{1F4B0}', '\u{1F3E0}', '\u{1F4C8}', '\u2705',
  '\u{1F91D}', '\u26A1', '\u{1F389}', '\u{1F44A}',
  '\u{1F48E}', '\u{1F3C6}', '\u2764\uFE0F', '\u{1F602}',
]

/* ── helpers ───────────────────────────────────────────── */
function initials(name) {
  if (!name) return '??'
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/* ── component ─────────────────────────────────────────── */
export default function Community() {
  const { user } = useAuth()

  const [activeChannel, setActiveChannel] = useState('general')
  const [messages, setMessages] = useState([])
  const [replies, setReplies] = useState([])
  const [activeThread, setActiveThread] = useState(null)

  const [msgInput, setMsgInput] = useState('')
  const [replyInput, setReplyInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showReplyEmoji, setShowReplyEmoji] = useState(false)

  const feedEnd = useRef(null)
  const replyEnd = useRef(null)
  const msgInputRef = useRef(null)
  const replyInputRef = useRef(null)
  const emojiRef = useRef(null)
  const replyEmojiRef = useRef(null)

  const displayName = user?.name || user?.username || 'Guest'
  const displayEmail = user?.email || 'guest@dispodojo.com'
  const channelMeta = CHANNELS.find((c) => c.id === activeChannel)

  /* ── real-time messages ──────────────────────────────── */
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', activeChannel),
      orderBy('createdAt', 'asc'),
      limit(100),
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.warn('Messages listener error:', err)
    })
    return unsub
  }, [activeChannel])

  /* ── real-time replies ───────────────────────────────── */
  useEffect(() => {
    if (!activeThread) {
      setReplies([])
      return
    }
    const q = query(
      collection(db, 'replies'),
      where('messageId', '==', activeThread.id),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.warn('Replies listener error:', err)
    })
    return unsub
  }, [activeThread?.id])

  /* ── auto-scroll ─────────────────────────────────────── */
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    replyEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies])

  /* ── close emoji picker on outside click ─────────────── */
  useEffect(() => {
    function handleClick(e) {
      if (showEmoji && emojiRef.current && !emojiRef.current.contains(e.target)) {
        setShowEmoji(false)
      }
      if (showReplyEmoji && replyEmojiRef.current && !replyEmojiRef.current.contains(e.target)) {
        setShowReplyEmoji(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showEmoji, showReplyEmoji])

  /* ── channel switch clears thread ────────────────────── */
  const switchChannel = useCallback((id) => {
    setActiveChannel(id)
    setActiveThread(null)
    setShowEmoji(false)
    setShowReplyEmoji(false)
  }, [])

  /* ── send message ────────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const body = msgInput.trim()
    if (!body) return
    setMsgInput('')
    try {
      await addDoc(collection(db, 'messages'), {
        channelId: activeChannel,
        authorName: displayName,
        authorEmail: displayEmail,
        body,
        replyCount: 0,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }, [msgInput, activeChannel, displayName, displayEmail])

  /* ── send reply ──────────────────────────────────────── */
  const sendReply = useCallback(async () => {
    if (!activeThread) return
    const body = replyInput.trim()
    if (!body) return
    setReplyInput('')
    try {
      await addDoc(collection(db, 'replies'), {
        messageId: activeThread.id,
        authorName: displayName,
        authorEmail: displayEmail,
        body,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'messages', activeThread.id), {
        replyCount: increment(1),
      })
    } catch (err) {
      console.error('Failed to send reply:', err)
    }
  }, [replyInput, activeThread, displayName, displayEmail])

  /* ── key handlers ────────────────────────────────────── */
  const handleMsgKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleReplyKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  /* ── emoji select for message ────────────────────────── */
  const pickEmoji = (emoji) => {
    setMsgInput((prev) => prev + emoji)
    setShowEmoji(false)
    msgInputRef.current?.focus()
  }

  /* ── emoji select for reply ──────────────────────────── */
  const pickReplyEmoji = (emoji) => {
    setReplyInput((prev) => prev + emoji)
    setShowReplyEmoji(false)
    replyInputRef.current?.focus()
  }

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── LEFT: Channel sidebar ──────────────────────────────── */}
      <aside className="lacquer-deep flex w-[220px] shrink-0 flex-col border-r border-[rgba(246,196,69,0.10)]">
        {/* title */}
        <div className="px-4 pt-5 pb-3">
          <h2 className="font-display text-lg tracking-wide text-gold">Community</h2>
        </div>

        {/* label + divider */}
        <div className="px-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-dim/50">
            Channels
          </span>
          <div className="katana-line mt-1.5" />
        </div>

        {/* channel list */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch.id)}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors duration-150
                ${
                  activeChannel === ch.id
                    ? 'bg-[rgba(0,198,255,0.08)] font-medium text-[#00C6FF]'
                    : 'text-text-dim hover:bg-white/[0.04] hover:text-parchment'
                }
              `}
            >
              <Hash className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {ch.name}
            </button>
          ))}
        </nav>

        {/* user card */}
        <div className="border-t border-[rgba(246,196,69,0.10)] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
              {initials(displayName)}
            </div>
            <span className="truncate text-xs font-heading font-semibold text-parchment">
              {displayName}
            </span>
          </div>
        </div>
      </aside>

      {/* ── CENTER: Message feed ───────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* channel header */}
        <header className="lacquer-bar flex items-center gap-2 border-b border-[rgba(246,196,69,0.10)] px-5 py-3">
          <Hash className="h-4 w-4 text-text-dim/50" />
          <span className="font-heading text-sm font-semibold text-parchment">
            {channelMeta?.name}
          </span>
          <span className="ml-2 text-xs text-text-dim/40">
            {channelMeta?.desc}
          </span>
        </header>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-text-dim/30">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">No messages yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="group flex gap-3">
                  {/* avatar */}
                  <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                    {initials(msg.authorName)}
                  </div>

                  {/* content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading text-sm font-semibold text-parchment">
                        {msg.authorName}
                      </span>
                      <span className="text-[10px] text-text-dim/30">
                        {fmtDate(msg.createdAt)} {fmtTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-text-dim break-words">
                      {msg.body}
                    </p>

                    {/* reply button */}
                    <button
                      onClick={() => setActiveThread(msg)}
                      className="mt-1 flex items-center gap-1 text-[11px] text-text-dim/30 opacity-0 transition-opacity duration-150 hover:text-[#00C6FF] group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-95"
                    >
                      <Reply className="h-3 w-3" />
                      {msg.replyCount > 0 ? `${msg.replyCount} ${msg.replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
                    </button>
                  </div>
                </div>
              ))}
              <div ref={feedEnd} />
            </div>
          )}
        </div>

        {/* message input */}
        <div className="border-t border-[rgba(246,196,69,0.10)] px-5 py-3">
          <div className="relative flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/30 px-3 py-2 focus-within:border-[rgba(246,196,69,0.25)]">
            <input
              ref={msgInputRef}
              type="text"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              onKeyDown={handleMsgKey}
              placeholder={`Message #${channelMeta?.name || 'general'}...`}
              className="min-w-0 flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none"
            />

            {/* emoji button */}
            <div className="relative" ref={emojiRef}>
              <button
                onClick={() => setShowEmoji((v) => !v)}
                className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-90"
                aria-label="Emoji picker"
              >
                <SmilePlus className="h-4 w-4" />
              </button>

              {/* emoji popup */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-8 right-0 z-50 grid grid-cols-4 gap-1 rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                  >
                    {EMOJI_GRID.map((em) => (
                      <button
                        key={em}
                        onClick={() => pickEmoji(em)}
                        className="flex h-8 w-8 items-center justify-center rounded-sm text-base transition-transform duration-100 hover:scale-125 hover:bg-white/[0.06] active:scale-95"
                      >
                        {em}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* send button */}
            <button
              onClick={sendMessage}
              disabled={!msgInput.trim()}
              className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-90 ${
                msgInput.trim() ? 'text-[#00C6FF]' : 'text-text-dim/20'
              }`}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>

      {/* ── RIGHT: Thread panel ────────────────────────────────── */}
      <AnimatePresence>
        {activeThread && (
          <motion.aside
            key="thread-panel"
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="flex w-[350px] shrink-0 flex-col border-l border-[rgba(246,196,69,0.10)] bg-[#0B0F14]"
          >
            {/* thread header */}
            <header className="flex items-center justify-between border-b border-[rgba(246,196,69,0.10)] px-4 py-3">
              <span className="font-heading text-sm font-semibold text-parchment">Thread</span>
              <button
                onClick={() => setActiveThread(null)}
                className="text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-90"
                aria-label="Close thread"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* parent message */}
            <div className="border-b border-[rgba(246,196,69,0.06)] px-4 py-3">
              <div className="flex gap-3">
                <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                  {initials(activeThread.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-sm font-semibold text-parchment">
                      {activeThread.authorName}
                    </span>
                    <span className="text-[10px] text-text-dim/30">
                      {fmtDate(activeThread.createdAt)} {fmtTime(activeThread.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-dim break-words">
                    {activeThread.body}
                  </p>
                </div>
              </div>
            </div>

            {/* replies */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {replies.length === 0 ? (
                <p className="text-center text-xs text-text-dim/25">No replies yet</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <div className="hanko-seal flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
                        {initials(r.authorName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-heading text-xs font-semibold text-parchment">
                            {r.authorName}
                          </span>
                          <span className="text-[9px] text-text-dim/25">
                            {fmtTime(r.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-dim break-words">
                          {r.body}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={replyEnd} />
                </div>
              )}
            </div>

            {/* reply input */}
            <div className="border-t border-[rgba(246,196,69,0.10)] px-4 py-3">
              <div className="relative flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/30 px-3 py-2 focus-within:border-[rgba(246,196,69,0.25)]">
                <input
                  ref={replyInputRef}
                  type="text"
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  onKeyDown={handleReplyKey}
                  placeholder="Reply..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none"
                />

                {/* reply emoji button */}
                <div className="relative" ref={replyEmojiRef}>
                  <button
                    onClick={() => setShowReplyEmoji((v) => !v)}
                    className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-90"
                    aria-label="Emoji picker"
                  >
                    <SmilePlus className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {showReplyEmoji && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-8 right-0 z-50 grid grid-cols-4 gap-1 rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] p-2 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
                      >
                        {EMOJI_GRID.map((em) => (
                          <button
                            key={em}
                            onClick={() => pickReplyEmoji(em)}
                            className="flex h-8 w-8 items-center justify-center rounded-sm text-base transition-transform duration-100 hover:scale-125 hover:bg-white/[0.06] active:scale-95"
                          >
                            {em}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* send reply button */}
                <button
                  onClick={sendReply}
                  disabled={!replyInput.trim()}
                  className={`transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:scale-90 ${
                    replyInput.trim() ? 'text-[#00C6FF]' : 'text-text-dim/20'
                  }`}
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
