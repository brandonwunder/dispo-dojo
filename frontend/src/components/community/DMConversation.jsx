import { useEffect, useRef } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import MessageInput from './MessageInput'
import AttachmentPreview from './AttachmentPreview'
import { formatMessageBody } from '../../lib/formatMessage'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
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

export default function DMConversation({
  conversation,
  messages,
  onSend,
  onBack,
  currentUid,
  fileUpload,
  onlineUsers,
}) {
  const feedEnd = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Derive the other participant's name from the conversation
  const otherUid = conversation?.participantNames
    ? Object.keys(conversation.participantNames).find((uid) => uid !== currentUid)
    : null
  const otherName = otherUid ? conversation.participantNames[otherUid] : 'Unknown'
  const isOtherOnline = onlineUsers?.some((u) => u.uid === otherUid)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-[rgba(246,196,69,0.10)] px-4 py-3">
        <button
          onClick={onBack}
          className="text-text-dim/50 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
          title="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="relative">
          <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
            {initials(otherName)}
          </div>
          {isOtherOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0F14] bg-green-400" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="font-heading text-sm font-semibold text-parchment">
            {otherName}
          </span>
          <span className="ml-2 text-[10px] text-text-dim/40">
            {isOtherOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        <button
          onClick={onBack}
          className="text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-text-dim/30">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex gap-3 rounded-sm px-1 py-1.5"
              >
                <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                  {initials(msg.authorName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-heading text-sm font-semibold text-parchment">
                      {msg.authorName}
                    </span>
                    <span className="text-[10px] text-text-dim/30">
                      {fmtDate(msg.createdAt)} {fmtTime(msg.createdAt)}
                    </span>
                  </div>

                  <p className="mt-0.5 text-sm leading-relaxed break-words text-text-dim">
                    {formatMessageBody(msg.body)}
                  </p>

                  {msg.gifUrl && (
                    <div className="mt-2 max-w-[300px] overflow-hidden rounded-sm">
                      <img
                        src={msg.gifUrl}
                        alt={msg.gifTitle || 'GIF'}
                        className="w-full rounded-sm"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {msg.attachments?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.attachments.map((att, i) => (
                        <AttachmentPreview key={i} attachment={att} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={feedEnd} />
          </div>
        )}
      </div>

      {/* Message input */}
      <MessageInput
        placeholder={`Message ${otherName}...`}
        onSend={onSend}
        fileUpload={fileUpload}
        onlineUsers={onlineUsers}
      />
    </div>
  )
}
