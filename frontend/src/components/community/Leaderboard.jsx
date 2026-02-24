import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { computeCommunityRank } from '../../lib/userProfile'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtXp(xp) {
  if (!xp && xp !== 0) return '0'
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return String(xp)
}

const PODIUM_COLORS = {
  1: { ring: 'rgba(246,196,69,0.5)', glow: 'rgba(246,196,69,0.25)', label: '#F6C445' },
  2: { ring: 'rgba(192,192,210,0.4)', glow: 'rgba(192,192,210,0.15)', label: '#C0C0D2' },
  3: { ring: 'rgba(205,127,50,0.4)', glow: 'rgba(205,127,50,0.15)', label: '#CD7F32' },
}

export default function Leaderboard({ leaders = [] }) {
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const displayCount = showAll ? 10 : 5
  const visible = leaders.slice(0, displayCount)

  return (
    <div className="border-t border-[rgba(246,196,69,0.10)]">
      {/* Header toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.02] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/30 active:bg-white/[0.04]"
      >
        <Trophy className="h-3.5 w-3.5 text-gold" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-dim/40 font-heading">
          Leaderboard
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-3 w-3 text-text-dim/25" />
        ) : (
          <ChevronDown className="ml-auto h-3 w-3 text-text-dim/25" />
        )}
      </button>

      {/* Collapsible body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0.5">
              {visible.length === 0 && (
                <p className="text-[10px] text-text-dim/30">No users yet</p>
              )}

              <div className="space-y-1">
                {visible.map((user, idx) => {
                  const rank = idx + 1
                  const xp = user.stats?.communityXp || 0
                  const communityRank = computeCommunityRank(xp)
                  const podium = PODIUM_COLORS[rank]
                  const isPodium = rank <= 3

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-2 rounded-sm px-1.5 py-1 ${
                        isPodium ? 'bg-white/[0.02]' : ''
                      }`}
                    >
                      {/* Rank number */}
                      <span
                        className="w-4 shrink-0 text-right text-[10px] font-heading font-bold tabular-nums"
                        style={{ color: podium?.label || 'rgba(200,209,218,0.35)' }}
                      >
                        #{rank}
                      </span>

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className="hanko-seal flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold"
                          style={
                            isPodium
                              ? {
                                  boxShadow: `0 0 8px -2px ${podium.glow}, 0 0 0 1px ${podium.ring}`,
                                }
                              : undefined
                          }
                        >
                          {initials(user.displayName)}
                        </div>
                        {/* Rank color dot */}
                        <div
                          className="absolute -bottom-0.5 -right-0.5 h-[6px] w-[6px] rounded-full border border-[#111B24]"
                          style={{ backgroundColor: communityRank.color }}
                        />
                      </div>

                      {/* Name */}
                      <span className="min-w-0 flex-1 truncate text-[10px] font-heading font-semibold text-parchment">
                        {user.displayName || 'Ninja'}
                      </span>

                      {/* XP */}
                      <span className="shrink-0 text-[9px] tabular-nums text-text-dim/40">
                        {fmtXp(xp)} XP
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Show more / less toggle */}
              {leaders.length > 5 && (
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-2 w-full rounded-sm py-1 text-center text-[9px] font-heading font-semibold uppercase tracking-wider text-text-dim/30 transition-colors duration-150 hover:bg-white/[0.03] hover:text-text-dim/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/20 active:scale-[0.98]"
                >
                  {showAll ? 'Show less' : `Show top 10`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
