import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { COMMUNITY_RANKS } from '../../lib/userProfile'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function rankColor(rankName) {
  const rank = COMMUNITY_RANKS.find((r) => r.name === rankName)
  return rank?.color || '#9CA3AF'
}

export default function OnlineUsersList({ onlineUsers, currentUid, profilesMap }) {
  const [expanded, setExpanded] = useState(false)
  const others = onlineUsers.filter((u) => u.odId !== currentUid)

  return (
    <div className="border-t border-[rgba(246,196,69,0.10)] px-3 py-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-dim/40">
          Online — {others.length + 1}
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-3 w-3 text-text-dim/25" />
        ) : (
          <ChevronDown className="ml-auto h-3 w-3 text-text-dim/25" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 max-h-[150px] space-y-1 overflow-y-auto"
          >
            {others.map((u) => (
              <div key={u.odId} className="flex items-center gap-2">
                <div className="relative">
                  <div className="hanko-seal flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold">
                    {initials(u.displayName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0B0F14] bg-green-400" />
                </div>
                <span className="truncate text-[10px] text-text-dim/60">{u.displayName}</span>
                {profilesMap?.[u.odId]?.communityRank && profilesMap[u.odId].communityRank !== 'Academy Student' && (
                  <span
                    className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: rankColor(profilesMap[u.odId].communityRank) }}
                    title={profilesMap[u.odId].communityRank}
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
