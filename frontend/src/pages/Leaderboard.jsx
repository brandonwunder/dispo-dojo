import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Crown, Loader2 } from 'lucide-react'
import { getDocs, collection } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import NinjaAvatar from '../components/NinjaAvatar'
import RankBadge from '../components/RankBadge'

// ─── Score engine ────────────────────────────────────────────────────────────

function computeScore(stats = {}) {
  return (
    (stats.underwrites || 0) * 10 +
    (stats.lois || 0) * 8 +
    (stats.contracts || 0) * 8 +
    (stats.dealsSubmitted || 0) * 15 +
    (stats.dealsClosed || 0) * 50 +
    Math.floor((stats.messages || 0) / 100) * 5 +
    (stats.birdDogLeads || 0) * 12 +
    (stats.bootsTasksCompleted || 0) * 8
  )
}

// ─── Tab config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overall',    label: 'Overall',     sortKey: (p) => p.score },
  { id: 'underwrites',label: 'Underwrites', sortKey: (p) => p.stats?.underwrites || 0 },
  { id: 'lois',       label: 'LOIs',        sortKey: (p) => p.stats?.lois || 0 },
  { id: 'active',     label: 'Most Active', sortKey: (p) => p.stats?.messages || 0 },
  { id: 'birddog',    label: 'Bird Dog',    sortKey: (p) => p.stats?.birdDogLeads || 0 },
]

// ─── Podium medal config ──────────────────────────────────────────────────────

const MEDALS = {
  1: {
    label: '#1',
    heightClass: 'h-44',
    avatarSize: 80,
    border: '#F6C445',
    glow: 'rgba(246,196,69,0.28)',
    bgGradient: 'linear-gradient(160deg, rgba(246,196,69,0.08) 0%, rgba(246,196,69,0.02) 100%)',
    textColor: '#F6C445',
    showAura: true,
    showCrown: true,
    zIndex: 10,
  },
  2: {
    label: '#2',
    heightClass: 'h-32',
    avatarSize: 64,
    border: 'rgba(192,192,192,0.4)',
    glow: 'rgba(192,192,192,0.12)',
    bgGradient: 'linear-gradient(160deg, rgba(192,192,192,0.06) 0%, rgba(192,192,192,0.01) 100%)',
    textColor: '#c0c0c0',
    showAura: false,
    showCrown: false,
    zIndex: 5,
  },
  3: {
    label: '#3',
    heightClass: 'h-28',
    avatarSize: 64,
    border: 'rgba(205,127,50,0.4)',
    glow: 'rgba(205,127,50,0.12)',
    bgGradient: 'linear-gradient(160deg, rgba(205,127,50,0.06) 0%, rgba(205,127,50,0.01) 100%)',
    textColor: '#cd7f32',
    showAura: false,
    showCrown: false,
    zIndex: 5,
  },
}

// ─── Podium card ─────────────────────────────────────────────────────────────

function PodiumCard({ entry, position, tabSortKey }) {
  const m = MEDALS[position]
  const tabValue = tabSortKey(entry)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: position * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col items-center justify-end rounded-xl px-4 pb-4 pt-5 ${m.heightClass}`}
      style={{
        background: m.bgGradient,
        border: `1px solid ${m.border}`,
        boxShadow: `0 0 28px ${m.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`,
        zIndex: m.zIndex,
        minWidth: position === 1 ? 148 : 120,
      }}
    >
      {/* Crown for #1 */}
      {m.showCrown && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 18 }}
          className="absolute -top-6"
        >
          <Crown
            size={28}
            style={{ color: '#F6C445', filter: 'drop-shadow(0 0 6px rgba(246,196,69,0.6))' }}
          />
        </motion.div>
      )}

      {/* Avatar */}
      <div className="mb-2">
        <NinjaAvatar
          config={entry.avatarConfig || {}}
          size={m.avatarSize}
          rank={entry.rank || 'initiate'}
          showAura={m.showAura}
        />
      </div>

      {/* Username */}
      <p
        className="font-heading font-bold text-sm text-center leading-tight mb-1 truncate w-full text-center"
        style={{ color: m.textColor, maxWidth: 120 }}
      >
        {entry.username || entry.displayName || 'Ninja'}
      </p>

      {/* Rank badge */}
      <div className="mb-2">
        <RankBadge rank={entry.rank || 'initiate'} size="sm" />
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1">
        <span className="font-heading font-bold text-lg" style={{ color: m.textColor }}>
          {tabValue.toLocaleString()}
        </span>
        <span className="text-[10px] font-heading tracking-widest uppercase" style={{ color: `${m.textColor}99` }}>
          pts
        </span>
      </div>

      {/* Position badge at bottom */}
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-heading font-bold"
        style={{
          background: '#0B0F14',
          border: `1.5px solid ${m.border}`,
          color: m.textColor,
          boxShadow: `0 0 10px ${m.glow}`,
        }}
      >
        {position}
      </div>
    </motion.div>
  )
}

// ─── Ranked row ───────────────────────────────────────────────────────────────

function RankedRow({ entry, rank, isCurrentUser, tabSortKey, index }) {
  const tabValue = tabSortKey(entry)
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-4 px-4 py-3 rounded-lg"
      style={{
        background: isCurrentUser
          ? 'linear-gradient(90deg, rgba(0,198,255,0.08) 0%, rgba(0,198,255,0.03) 100%)'
          : 'rgba(255,255,255,0.02)',
        border: isCurrentUser
          ? '1px solid rgba(0,198,255,0.2)'
          : '1px solid rgba(255,255,255,0.05)',
        boxShadow: isCurrentUser ? '0 0 12px rgba(0,198,255,0.06)' : 'none',
      }}
    >
      {/* Rank number */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-xs"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#C8D1DA',
        }}
      >
        {rank}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        <NinjaAvatar
          config={entry.avatarConfig || {}}
          size={32}
          rank={entry.rank || 'initiate'}
          showAura={false}
        />
      </div>

      {/* Name + badge */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="font-heading font-semibold text-sm truncate" style={{ color: '#F4F7FA' }}>
          {entry.username || entry.displayName || 'Ninja'}
        </span>
        {isCurrentUser && (
          <span
            className="flex-shrink-0 text-[9px] font-heading font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm"
            style={{
              background: 'rgba(0,198,255,0.12)',
              color: '#00C6FF',
              border: '1px solid rgba(0,198,255,0.3)',
            }}
          >
            You
          </span>
        )}
        <div className="flex-shrink-0 hidden sm:block">
          <RankBadge rank={entry.rank || 'initiate'} size="sm" />
        </div>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <span className="font-heading font-bold text-sm" style={{ color: '#F4F7FA' }}>
          {tabValue.toLocaleString()}
        </span>
        <span className="text-[9px] font-heading tracking-widest uppercase" style={{ color: '#C8D1DA80' }}>
          pts
        </span>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Leaderboard() {
  const { user, profile } = useAuth()
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overall')

  // Load all user profiles on mount
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getDocs(collection(db, 'users'))
      .then((snap) => {
        if (cancelled) return
        const users = snap.docs.map((d) => {
          const data = d.data()
          return {
            ...data,
            id: d.id,
            score: computeScore(data.stats),
          }
        })
        // Default sort by overall score descending
        users.sort((a, b) => b.score - a.score)
        setAllUsers(users)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Leaderboard fetch error:', err)
        setError('Could not load the leaderboard. Please try again.')
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  // Current tab sort function
  const currentTab = TABS.find((t) => t.id === activeTab) || TABS[0]

  // Sorted list for current tab
  const sorted = useMemo(() => {
    return [...allUsers].sort((a, b) => currentTab.sortKey(b) - currentTab.sortKey(a))
  }, [allUsers, activeTab])

  // Identify current user's entry in the sorted list
  const currentUserId = user?.firebaseUid
  const currentUserEntry = useMemo(() => {
    if (!currentUserId) return null
    return sorted.find((u) => u.id === currentUserId) || null
  }, [sorted, currentUserId])

  const currentUserRank = useMemo(() => {
    if (!currentUserEntry) return null
    return sorted.findIndex((u) => u.id === currentUserId) + 1
  }, [sorted, currentUserId, currentUserEntry])

  // Podium (top 3)
  const podium = sorted.slice(0, 3)
  // List rows: positions 4-10 (indices 3-9), or all if fewer than 4
  const listRows = sorted.length <= 3 ? [] : sorted.slice(3, 10)

  // Whether current user is already visible in podium or list
  const currentUserVisible =
    currentUserRank !== null && currentUserRank <= (listRows.length > 0 ? 10 : 3)

  return (
    <div
      className="min-h-screen px-4 py-8 md:px-8"
      style={{ background: '#0B0F14' }}
    >
      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3 mb-8"
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(246,196,69,0.15) 0%, rgba(246,196,69,0.05) 100%)',
            border: '1px solid rgba(246,196,69,0.25)',
            boxShadow: '0 0 16px rgba(246,196,69,0.12)',
          }}
        >
          <Trophy size={20} style={{ color: '#F6C445' }} />
        </div>
        <div>
          <h1
            className="font-display text-3xl font-bold leading-none neon-shimmer-text"
            style={{ letterSpacing: '-0.03em' }}
          >
            Leaderboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#C8D1DA', lineHeight: 1.5 }}>
            Top ninjas ranked by activity and results
          </p>
        </div>
      </motion.div>

      {/* ── Loading ──────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2
            size={36}
            className="animate-spin"
            style={{ color: '#00C6FF', opacity: 0.7 }}
          />
          <p className="font-heading text-sm tracking-wider" style={{ color: '#C8D1DA' }}>
            Loading rankings...
          </p>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────────── */}
      {!loading && error && (
        <div
          className="flex flex-col items-center justify-center py-32 gap-3 rounded-xl"
          style={{
            background: 'rgba(229,57,53,0.06)',
            border: '1px solid rgba(229,57,53,0.2)',
          }}
        >
          <Trophy size={32} style={{ color: '#E5393580', opacity: 0.5 }} />
          <p className="font-heading font-semibold text-sm" style={{ color: '#E53935' }}>
            {error}
          </p>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────── */}
      {!loading && !error && allUsers.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-32 gap-3 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Trophy size={32} style={{ color: '#F6C44540' }} />
          <p className="font-heading text-sm" style={{ color: '#C8D1DA' }}>
            No ninjas yet — be the first to earn points!
          </p>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────── */}
      {!loading && !error && allUsers.length > 0 && (
        <>
          {/* ── Podium ─────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <div
              key={activeTab + '-podium'}
              className="flex items-end justify-center gap-3 mb-10"
            >
              {/* 2nd place (left) */}
              {podium[1] ? (
                <PodiumCard
                  entry={podium[1]}
                  position={2}
                  tabSortKey={currentTab.sortKey}
                />
              ) : (
                <div className="h-32 w-28" />
              )}

              {/* 1st place (center, tallest) */}
              {podium[0] ? (
                <PodiumCard
                  entry={podium[0]}
                  position={1}
                  tabSortKey={currentTab.sortKey}
                />
              ) : (
                <div className="h-44 w-36" />
              )}

              {/* 3rd place (right) */}
              {podium[2] ? (
                <PodiumCard
                  entry={podium[2]}
                  position={3}
                  tabSortKey={currentTab.sortKey}
                />
              ) : (
                <div className="h-28 w-28" />
              )}
            </div>
          </AnimatePresence>

          {/* ── Tab strip ─────────────────────────────────────── */}
          <div
            className="flex gap-1 mb-6 overflow-x-auto"
            style={{
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              paddingBottom: 0,
            }}
          >
            {TABS.map((tab) => {
              const active = tab.id === activeTab
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-4 py-2.5 font-heading font-semibold text-xs tracking-wider uppercase flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 rounded-t-md"
                  style={{
                    color: active ? '#00C6FF' : '#C8D1DA',
                    background: active ? 'rgba(0,198,255,0.06)' : 'transparent',
                    transition: 'color 0.2s ease, background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = '#F4F7FA'
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = '#C8D1DA'
                  }}
                >
                  {tab.label}
                  {active && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: '#00C6FF', boxShadow: '0 0 8px rgba(0,198,255,0.5)' }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Ranked list (positions 4–10) ──────────────────── */}
          {listRows.length > 0 && (
            <div className="space-y-2 mb-4">
              {listRows.map((entry, i) => {
                const rank = i + 4
                const isCurrentUser = entry.id === currentUserId
                return (
                  <RankedRow
                    key={entry.id}
                    entry={entry}
                    rank={rank}
                    isCurrentUser={isCurrentUser}
                    tabSortKey={currentTab.sortKey}
                    index={i}
                  />
                )
              })}
            </div>
          )}

          {/* ── Current user pinned row (if not visible above) ─ */}
          {currentUserEntry && !currentUserVisible && (
            <>
              {/* Separator */}
              <div
                className="flex items-center gap-3 my-3"
                style={{ opacity: 0.4 }}
              >
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-[10px] font-heading tracking-widest uppercase" style={{ color: '#C8D1DA' }}>
                  Your position
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
              <RankedRow
                entry={currentUserEntry}
                rank={currentUserRank}
                isCurrentUser={true}
                tabSortKey={currentTab.sortKey}
                index={0}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
