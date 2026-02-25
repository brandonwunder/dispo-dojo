import { Trophy } from 'lucide-react'
import { COMMUNITY_RANKS, computeCommunityRank } from '../../lib/userProfile'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtXp(xp) {
  if (!xp && xp !== 0) return '0'
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return String(xp)
}

const RANK_GROUPS = [
  { name: 'Kage', color: '#F6C445' },
  { name: 'ANBU', color: '#E53935' },
  { name: 'Jonin', color: '#7F00FF' },
  { name: 'Chunin', color: '#00C6FF' },
  { name: 'Genin', color: '#22C55E' },
  { name: 'Academy Student', color: '#9CA3AF' },
]

export default function MemberList({
  allUsers = [],
  onlineUsers = [],
  leaders = [],
  currentUid,
  onUserClick,
}) {
  const onlineUids = new Set(onlineUsers.map((u) => u.odId))

  // Group users by rank
  const grouped = {}
  RANK_GROUPS.forEach((rg) => { grouped[rg.name] = [] })
  allUsers.forEach((user) => {
    const xp = user.stats?.communityXp || 0
    const rank = computeCommunityRank(xp)
    const rankName = rank?.name || 'Academy Student'
    if (!grouped[rankName]) grouped[rankName] = []
    grouped[rankName].push({ ...user, xp, rankName, isOnline: onlineUids.has(user.id) })
  })

  // Sort each group: online first, then by XP desc
  Object.values(grouped).forEach((arr) => {
    arr.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1
      return b.xp - a.xp
    })
  })

  const top3 = leaders.slice(0, 3)

  return (
    <div
      className="flex flex-col h-full"
      style={{
        background: '#0E1317',
        borderLeft: '1px solid rgba(0,198,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,198,255,0.06)' }}
      >
        <span
          className="text-[13px] font-semibold"
          style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
        >
          Members
        </span>
        <span className="text-[11px]" style={{ color: '#8A9AAA' }}>
          — {allUsers.length}
        </span>
      </div>

      {/* Top Contributors */}
      {top3.length > 0 && (
        <div className="px-3 pt-3 pb-2 shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Trophy className="h-3 w-3" style={{ color: '#F6C445' }} />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.08em]"
              style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#F6C445' }}
            >
              Top Contributors
            </span>
          </div>
          {top3.map((user, idx) => {
            const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}']
            return (
              <button
                key={user.id}
                onClick={() => onUserClick?.(user)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.04]"
              >
                <span className="text-[12px] shrink-0">{medals[idx]}</span>
                <div
                  className="h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                    fontFamily: 'var(--font-heading, sans-serif)',
                    color: '#F4F7FA',
                  }}
                >
                  {initials(user.displayName)}
                </div>
                <span
                  className="text-[12px] truncate"
                  style={{ fontFamily: 'var(--font-heading, sans-serif)', fontWeight: 600, color: '#F4F7FA' }}
                >
                  {user.displayName || 'Ninja'}
                </span>
                <span className="ml-auto text-[10px] shrink-0" style={{ color: '#8A9AAA' }}>
                  {fmtXp(user.stats?.communityXp || 0)} XP
                </span>
              </button>
            )
          })}
          <div className="mt-2 h-px" style={{ background: 'rgba(0,198,255,0.06)' }} />
        </div>
      )}

      {/* Member groups by rank */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {RANK_GROUPS.map((rg) => {
          const members = grouped[rg.name]
          if (!members || members.length === 0) return null
          const onlineCount = members.filter((m) => m.isOnline).length
          return (
            <div key={rg.name} className="mt-3 first:mt-1">
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: rg.color }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ fontFamily: 'var(--font-body, sans-serif)', color: rg.color }}
                >
                  {rg.name}
                </span>
                <span className="text-[10px]" style={{ color: '#8A9AAA' }}>
                  — {onlineCount}/{members.length}
                </span>
              </div>
              {members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onUserClick?.(member)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1 transition-colors duration-150 hover:bg-white/[0.04]"
                >
                  <div className="relative shrink-0">
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                        fontFamily: 'var(--font-heading, sans-serif)',
                        color: '#F4F7FA',
                        opacity: member.isOnline ? 1 : 0.5,
                      }}
                    >
                      {initials(member.displayName)}
                    </div>
                    {member.isOnline && (
                      <span
                        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                        style={{ background: '#22C55E', borderColor: '#0E1317' }}
                      />
                    )}
                  </div>
                  <span
                    className="text-[13px] truncate"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: member.isOnline ? '#F4F7FA' : '#8A9AAA',
                    }}
                  >
                    {member.displayName || 'Ninja'}
                  </span>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
