import { Plus, MessageSquare } from 'lucide-react'

/* ── helpers ─────────────────────────────────────────── */

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function relativeTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return `${Math.floor(diff / 86400000)}d`
}

function getOtherParticipant(participantNames, currentUid) {
  if (!participantNames) return { name: 'Unknown', uid: null }
  const entries = Object.entries(participantNames)
  const other = entries.find(([uid]) => uid !== currentUid)
  if (other) return { name: other[1], uid: other[0] }
  // Fallback: if only one participant (self-conversation edge case)
  if (entries.length > 0) return { name: entries[0][1], uid: entries[0][0] }
  return { name: 'Unknown', uid: null }
}

function truncate(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '...' : str
}

/* ── component ─────────────────────────────────────────── */

export default function DMList({ conversations, currentUid, activeDMId, onSelectDM, onNewDM }) {
  return (
    <div className="px-2 pt-3 pb-1" style={{ borderTop: '1px solid rgba(0,198,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#8A9AAA', fontFamily: 'var(--font-body, sans-serif)' }}>
          Direct Messages
        </span>
        <button
          onClick={onNewDM}
          className="text-text-dim/40 transition-colors duration-150 hover:text-[#00C6FF] focus-visible:outline-none active:scale-90"
          aria-label="New direct message"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="katana-line mt-1.5" />

      {/* Conversation list */}
      <nav className="mt-1.5 space-y-0.5">
        {(!conversations || conversations.length === 0) ? (
          <div className="flex flex-col items-center gap-1.5 py-4 text-text-dim/30">
            <MessageSquare className="h-5 w-5" />
            <p className="text-[10px]">No conversations yet</p>
          </div>
        ) : (
          conversations.map((convo) => {
            const other = getOtherParticipant(convo.participantNames, currentUid)
            const isActive = convo.id === activeDMId
            const unread = convo.unreadCount?.[currentUid] || 0
            const preview = convo.lastMessage?.body
              ? truncate(convo.lastMessage.body, 30)
              : 'No messages yet'
            const time = relativeTime(convo.lastMessage?.createdAt)

            return (
              <button
                key={convo.id}
                onClick={() => onSelectDM(convo.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-150
                  ${isActive
                    ? 'bg-[rgba(0,198,255,0.08)]'
                    : 'hover:bg-white/[0.04]'
                  }
                `}
              >
                {/* Avatar */}
                <div className="hanko-seal flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
                  {initials(other.name)}
                </div>

                {/* Name + preview */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`truncate text-xs font-heading font-semibold ${isActive ? 'text-[#00C6FF]' : 'text-parchment'}`}>
                      {other.name}
                    </span>
                    {time && (
                      <span className="shrink-0 text-[9px] text-text-dim/30">
                        {time}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-[10px] leading-snug text-text-dim/40">
                      {preview}
                    </p>
                    {unread > 0 && (
                      <span className="flex h-4 min-w-[16px] shrink-0 items-center justify-center rounded-full bg-[#00C6FF] px-1 text-[9px] font-bold text-[#0B0F14]">
                        {unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </nav>
    </div>
  )
}
