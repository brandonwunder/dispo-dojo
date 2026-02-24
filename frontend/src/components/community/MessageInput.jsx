import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, SmilePlus, Image, Paperclip, X, Loader2, Reply } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import GifPicker from './GifPicker'
import MentionAutocomplete from './MentionAutocomplete'
import DealForm from './DealForm'

const CHANNEL_PLACEHOLDERS = {
  general: 'Drop a message in #general...',
  wins: 'Share your win in #wins! 🔥',
  'deal-talk': 'Post a deal or ask for feedback...',
  questions: 'Ask your question — no question is too basic...',
  resources: 'Share a resource with the dojo...',
}

export default function MessageInput({
  placeholder,
  onSend,
  onTyping,
  fileUpload,
  onlineUsers,
  channelId = 'general',
  replyingTo = null,
  onCancelReply,
}) {
  const [body, setBody] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [pendingGif, setPendingGif] = useState(null)
  const [pendingAttachments, setPendingAttachments] = useState([])
  const [mentionQuery, setMentionQuery] = useState('')
  const [showMentions, setShowMentions] = useState(false)
  const [showDealForm, setShowDealForm] = useState(false)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    const trimmed = body.trim()
    if (!trimmed && !pendingGif && pendingAttachments.length === 0) return
    onSend(
      trimmed,
      pendingGif?.url || null,
      pendingGif?.title || null,
      pendingAttachments,
      null,
      null,
      replyingTo ? { id: replyingTo.id, authorName: replyingTo.authorName, bodyPreview: (replyingTo.body || '').slice(0, 100) } : null,
    )
    setBody('')
    setPendingGif(null)
    setPendingAttachments([])
    onCancelReply?.()
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    const val = e.target.value
    setBody(val)
    onTyping?.(true)

    // Detect @mention
    const lastAt = val.lastIndexOf('@')
    if (lastAt !== -1 && lastAt === val.length - 1) {
      setShowMentions(true)
      setMentionQuery('')
    } else if (lastAt !== -1 && !val.slice(lastAt).includes(' ')) {
      setShowMentions(true)
      setMentionQuery(val.slice(lastAt + 1))
    } else {
      setShowMentions(false)
    }
  }

  const handleMentionSelect = (name) => {
    const lastAt = body.lastIndexOf('@')
    setBody(body.slice(0, lastAt) + `@${name} `)
    setShowMentions(false)
    inputRef.current?.focus()
  }

  const handleEmojiSelect = (emoji) => {
    setBody((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const handleGifSelect = (url, title) => {
    setPendingGif({ url, title })
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !fileUpload) return
    const attachment = await fileUpload.upload(file)
    if (attachment) {
      setPendingAttachments((prev) => [...prev, attachment])
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingGif = () => setPendingGif(null)
  const removePendingAttachment = (idx) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const hasContent = body.trim() || pendingGif || pendingAttachments.length > 0

  return (
    <div
      className="px-5 py-3"
      style={{
        background: '#111B24',
        borderTop: '1px solid rgba(0,198,255,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Replying-to banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(0,198,255,0.06)', border: '1px solid rgba(0,198,255,0.15)' }}
          >
            <Reply className="h-3 w-3 shrink-0" style={{ color: 'rgba(0,198,255,0.6)' }} />
            <span className="text-[11px]" style={{ color: 'rgba(0,198,255,0.6)', fontFamily: 'var(--font-heading, sans-serif)' }}>
              Replying to <span className="font-semibold">{replyingTo.authorName}</span>
            </span>
            <span className="text-[11px] truncate flex-1" style={{ color: 'rgba(200,209,218,0.35)', fontFamily: 'var(--font-body, sans-serif)' }}>
              — {(replyingTo.body || '').slice(0, 80)}
            </span>
            <button onClick={onCancelReply} className="ml-auto shrink-0 hover:text-white transition-colors" style={{ color: 'rgba(200,209,218,0.4)' }}>
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Pending previews */}
      {(pendingGif || pendingAttachments.length > 0 || fileUpload?.uploading) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {pendingGif && (
            <div className="relative inline-block">
              <img src={pendingGif.url} alt={pendingGif.title} className="h-16 rounded-sm" />
              <button
                onClick={removePendingGif}
                className="absolute -top-1 -right-1 rounded-full bg-black/70 p-0.5 text-white hover:bg-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {pendingAttachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-1 rounded-sm border border-[rgba(246,196,69,0.1)] bg-white/[0.03] px-2 py-1">
              <span className="text-[10px] text-parchment truncate max-w-[120px]">{att.name}</span>
              <button
                onClick={() => removePendingAttachment(i)}
                className="text-text-dim/40 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {fileUpload?.uploading && (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[#00C6FF]" />
              <span className="text-[10px] text-text-dim/40">{fileUpload.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="relative flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/30 px-3 py-2 focus-within:border-[rgba(246,196,69,0.25)]">
        {/* @mention autocomplete */}
        <MentionAutocomplete
          query={mentionQuery}
          users={onlineUsers || []}
          onSelect={handleMentionSelect}
          visible={showMentions}
        />

        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />

        {/* Deal share button */}
        <button
          type="button"
          onClick={() => setShowDealForm(true)}
          title="Share a deal"
          className="text-text-dim/40 transition-colors duration-150 hover:text-[#F6C445] focus-visible:outline-none active:scale-90"
          style={{ fontSize: '16px', lineHeight: 1 }}
        >
          🏠
        </button>

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={placeholder || CHANNEL_PLACEHOLDERS[channelId] || `Message #${channelId}...`}
          className="min-w-0 flex-1 text-sm placeholder:text-[rgba(200,209,218,0.30)] focus:outline-none"
          style={{
            background: 'transparent',
            color: '#F4F7FA',
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: '14px',
            lineHeight: '1.6',
            outline: 'none',
          }}
        />

        {/* GIF button */}
        <div className="relative">
          <button
            onClick={() => { setShowGif((v) => !v); setShowEmoji(false) }}
            className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
            title="GIF"
          >
            <Image className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showGif && (
              <GifPicker
                onSelect={(url, title) => { handleGifSelect(url, title); setShowGif(false) }}
                onClose={() => setShowGif(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => { setShowEmoji((v) => !v); setShowGif(false) }}
            className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
            title="Emoji"
          >
            <SmilePlus className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showEmoji && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasContent}
          title="Send"
          className="rounded-lg p-2 flex items-center justify-center focus-visible:outline-none"
          style={{
            background: hasContent
              ? 'linear-gradient(135deg, #E53935 0%, #B3261E 100%)'
              : 'rgba(255,255,255,0.05)',
            color: hasContent ? '#fff' : '#8A9AAA',
            boxShadow: hasContent ? '0 0 16px -4px rgba(229,57,53,0.5)' : 'none',
            cursor: hasContent ? 'pointer' : 'not-allowed',
            transform: hasContent ? 'scale(1)' : 'scale(0.95)',
            transition: 'background 150ms, box-shadow 150ms, transform 150ms',
            minWidth: '36px',
            minHeight: '36px',
          }}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* File upload error */}
      {fileUpload?.error && (
        <p className="mt-1 text-[10px] text-red-400/70">
          {fileUpload.error}
          <button onClick={fileUpload.clearError} className="ml-1 underline">dismiss</button>
        </p>
      )}

      {/* Deal form modal */}
      <AnimatePresence>
        {showDealForm && (
          <DealForm
            onClose={() => setShowDealForm(false)}
            onSubmit={(dealData) => {
              onSend(
                `🏠 ${dealData.address}`,
                null,
                null,
                [],
                'deal',
                dealData,
              )
              setShowDealForm(false)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
