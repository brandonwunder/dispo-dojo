import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reply, Smile, Pencil, Trash2, Pin } from 'lucide-react'
import ReactionBar from './ReactionBar'
import AttachmentPreview from './AttachmentPreview'
import RankBadge from './RankBadge'
import DealCard from './DealCard'
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

export default function MessageBubble({
  msg,
  isGrouped = false,
  isOwn,
  isAdmin,
  communityRank,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onAuthorClick,
  currentUid,
}) {
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(msg.body)

  if (msg.isDeleted && !isAdmin) {
    return (
      <div className="flex gap-3 py-1 opacity-50">
        <div className="h-8 w-8 shrink-0" />
        <p className="text-sm italic text-text-dim/40">This message was deleted</p>
      </div>
    )
  }

  const handleEditSave = () => {
    if (editBody.trim() && editBody.trim() !== msg.body) {
      onEdit(msg.id, editBody.trim())
    }
    setEditing(false)
  }

  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setEditBody(msg.body)
    }
  }

  return (
    <div
      className={`group relative flex gap-3 rounded-sm px-1 transition-colors duration-100 hover:bg-white/[0.02] ${
        isGrouped ? 'py-0.5' : 'py-1.5'
      } ${msg.isDeleted ? 'opacity-40' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar or grouped spacer */}
      {isGrouped ? (
        <div className="w-11 flex-shrink-0 flex items-end justify-end" style={{ minWidth: '44px' }}>
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-100 text-[10px] text-[#8A9AAA] pb-0.5 pr-1 select-none"
            style={{ fontFamily: 'var(--font-body, sans-serif)' }}
          >
            {msg.createdAt?.toDate?.()?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) || ''}
          </span>
        </div>
      ) : (
        <div
          className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
            fontFamily: 'var(--font-heading, sans-serif)',
            color: '#F4F7FA',
            boxShadow: '0 0 10px -3px rgba(0,198,255,0.35)',
            border: '2px solid rgba(0,198,255,0.15)',
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          {initials(msg.authorName)}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {!isGrouped && (
          <div className="flex items-baseline gap-2">
            <button
              onClick={() => onAuthorClick(msg)}
              className="text-sm text-[#F4F7FA] hover:text-[#F6C445] transition-colors duration-150 cursor-pointer"
              style={{
                fontFamily: 'var(--font-heading, sans-serif)',
                fontWeight: 600,
                ...(communityRank === 'Kage'
                  ? { textShadow: '0 0 8px rgba(246,196,69,0.4)' }
                  : communityRank === 'ANBU'
                  ? { textShadow: '0 0 6px rgba(229,57,53,0.3)' }
                  : undefined),
              }}
            >
              {msg.authorName}
            </button>
            {msg.authorRole === 'admin' && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                style={{
                  background: 'rgba(229,57,53,0.12)',
                  color: '#EF5350',
                  border: '1px solid rgba(229,57,53,0.25)',
                  fontFamily: 'var(--font-heading, sans-serif)',
                  letterSpacing: '0.04em',
                }}
              >
                Admin
              </span>
            )}
            <RankBadge rankName={communityRank} />
            <span
              className="text-[11px] text-[#8A9AAA]"
              style={{ fontFamily: 'var(--font-body, sans-serif)' }}
            >
              {fmtDate(msg.createdAt)} {fmtTime(msg.createdAt)}
            </span>
            {msg.isEdited && (
              <span className="text-[9px] text-text-dim/25">(edited)</span>
            )}
            {msg.isDeleted && isAdmin && (
              <span className="text-[9px] text-red-400/60">(Deleted)</span>
            )}
          </div>
        )}

        {editing ? (
          <div className="mt-1">
            <input
              type="text"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={handleEditKey}
              onBlur={handleEditSave}
              autoFocus
              className="w-full rounded-sm border border-[rgba(246,196,69,0.2)] bg-black/30 px-2 py-1 text-sm text-parchment focus:outline-none focus:border-gold/40"
            />
            <p className="mt-0.5 text-[9px] text-text-dim/30">Enter to save, Esc to cancel</p>
          </div>
        ) : (
          <p className={`text-sm leading-relaxed break-words ${isGrouped ? '' : 'mt-0.5'} ${msg.isDeleted ? 'line-through text-text-dim/30' : 'text-text-dim'}`}>
            {formatMessageBody(msg.body)}
          </p>
        )}

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

        {msg.type === 'deal' && msg.dealData && (
          <DealCard dealData={msg.dealData} />
        )}

        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <ReactionBar
            reactions={msg.reactions}
            currentUid={currentUid}
            onToggle={(emoji) => onToggleReaction(msg.id, emoji, msg.reactions)}
          />
        )}

        <button
          onClick={() => onReply(msg)}
          className="mt-1 flex items-center gap-1 text-[11px] text-text-dim/30 opacity-0 transition-opacity duration-150 hover:text-[#00C6FF] group-hover:opacity-100 focus-visible:opacity-100 active:scale-95"
        >
          <Reply className="h-3 w-3" />
          {msg.replyCount > 0
            ? `${msg.replyCount} ${msg.replyCount === 1 ? 'reply' : 'replies'}`
            : 'Reply'}
        </button>
      </div>

      <AnimatePresence>
        {showActions && !msg.isDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute -top-3 right-2 flex items-center gap-0.5 rounded-sm border border-[rgba(246,196,69,0.12)] bg-[#111B24] px-1 py-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={() => onReact(msg.id)}
              className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-gold transition-colors"
              title="React"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onReply(msg)}
              className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-[#00C6FF] transition-colors"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
            {isOwn && (
              <button
                onClick={() => { setEditing(true); setEditBody(msg.body) }}
                className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-gold transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {(isOwn || isAdmin) && (
              <button
                onClick={() => onDelete(msg.id)}
                className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onPin(msg.id)}
                className={`rounded-sm p-1 transition-colors hover:bg-white/[0.06] ${
                  msg.isPinned ? 'text-gold' : 'text-text-dim/40 hover:text-gold'
                }`}
                title={msg.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
