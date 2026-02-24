import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import RankBadge from './RankBadge'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function NewDMModal({ users, currentUid, onSelect, onClose }) {
  const [query, setQuery] = useState('')

  const filtered = (users || [])
    .filter((u) => u.id !== currentUid)
    .filter((u) =>
      !query || (u.displayName || '').toLowerCase().includes(query.toLowerCase())
    )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="w-[340px] bg-[#111B24] border border-[rgba(246,196,69,0.15)] rounded-sm shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgba(246,196,69,0.10)] px-4 py-3">
          <h3 className="font-heading text-sm font-semibold text-parchment">New Message</h3>
          <button
            onClick={onClose}
            className="text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/30 px-3 py-2 focus-within:border-[rgba(246,196,69,0.25)]">
            <Search className="h-3.5 w-3.5 text-text-dim/30" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none"
            />
          </div>
        </div>

        {/* User list */}
        <div className="max-h-[300px] overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-text-dim/30">No users found</p>
          ) : (
            <div className="space-y-0.5">
              {filtered.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user.id, user.displayName)}
                  className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left transition-colors duration-150 hover:bg-white/[0.04] focus-visible:outline-none active:bg-white/[0.06]"
                >
                  <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                    {initials(user.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-heading text-sm font-semibold text-parchment">
                      {user.displayName || 'Unknown'}
                    </span>
                  </div>
                  {user.rank && <RankBadge rankName={user.rank} size="sm" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
