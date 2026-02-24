import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, MessageSquare, Heart, Award, Calendar } from 'lucide-react'
import useUserProfile from '../hooks/useUserProfile'
import { computeCommunityRank } from '../lib/userProfile'
import RankBadge from '../components/community/RankBadge'
import BadgeShowcase from '../components/community/BadgeShowcase'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

const cardClass = 'bg-[#111B24] border border-[rgba(246,196,69,0.10)] rounded-sm'

export default function CommunityProfile() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const { profile, loading } = useUserProfile(uid)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00C6FF] border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-3 text-text-dim/40">
        <p className="text-sm">Profile not found</p>
        <button
          onClick={() => navigate('/community')}
          className="text-xs text-[#00C6FF] underline hover:text-[#00C6FF]/80 transition-colors duration-150"
        >
          Back to Community
        </button>
      </div>
    )
  }

  const stats = profile.stats || {}
  const rank = computeCommunityRank(stats.communityXp || 0)
  const xpCurrent = (stats.communityXp || 0) - rank.xpRequired
  const xpNeeded = rank.next ? rank.next.xpRequired - rank.xpRequired : 1
  const progressPercent = rank.next ? Math.min((xpCurrent / xpNeeded) * 100, 100) : 100

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto px-4 py-6">
      <motion.div
        className="mx-auto max-w-2xl space-y-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/community')}
          className="group flex items-center gap-1.5 text-xs text-text-dim/50 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Back to Community
        </button>

        {/* Hero section */}
        <div className={`${cardClass} px-6 py-6`}>
          <div className="flex items-start gap-4">
            <div className="hanko-seal flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-lg font-bold">
              {initials(profile.displayName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl tracking-wide text-gold truncate">
                {profile.displayName || 'Ninja'}
              </h1>
              <p className="mt-0.5 text-xs text-text-dim/50 truncate">
                @{profile.username || uid?.slice(0, 8)}
              </p>
              <div className="mt-2">
                <RankBadge rankName={rank.name} size="md" />
              </div>
              {profile.bio && (
                <p className="mt-3 text-sm leading-relaxed text-text-dim">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Rank card */}
        <div className={`${cardClass} px-6 py-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
                Community Rank
              </p>
              <p className="mt-1 font-heading text-lg font-semibold" style={{ color: rank.color }}>
                {rank.name}
              </p>
            </div>
            <span
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-heading font-bold"
              style={{
                backgroundColor: `${rank.color}15`,
                color: rank.color,
              }}
            >
              Lv{rank.level}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: rank.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-[10px] text-text-dim/40">
                {stats.communityXp || 0} / {rank.next ? rank.next.xpRequired : rank.xpRequired} XP
              </span>
              {rank.next && (
                <span className="text-[10px] text-text-dim/30">
                  Next: {rank.next.name}
                </span>
              )}
              {!rank.next && (
                <span className="text-[10px]" style={{ color: rank.color }}>
                  Max Rank
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: MessageSquare, value: stats.totalMessages || 0, label: 'Messages sent' },
            { icon: Heart, value: stats.totalReactionsReceived || 0, label: 'Reactions received' },
            { icon: MessageSquare, value: stats.totalMessages || 0, label: 'Threads started' },
            { icon: Award, value: stats.postingStreak || 0, label: 'Posting streak' },
          ].map((item, i) => (
            <motion.div
              key={i}
              className={`${cardClass} flex flex-col items-center justify-center px-4 py-4`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.06 }}
            >
              <item.icon className="h-4 w-4 text-text-dim/30" />
              <span className="mt-2 text-2xl font-heading font-semibold text-parchment">
                {item.value}
              </span>
              <span className="mt-0.5 text-[10px] text-text-dim/40">{item.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Badges section */}
        <div className={`${cardClass} px-6 py-5`}>
          <h3 className="mb-3 text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
            Badges
          </h3>
          <BadgeShowcase earnedBadgeIds={profile.communityBadges || []} showAll={true} />
        </div>

        {/* Member since */}
        <div className="flex items-center justify-center gap-1.5 pb-4 text-text-dim/30">
          <Calendar className="h-3 w-3" />
          <span className="text-[10px]">
            Member since {formatDate(profile.createdAt)}
          </span>
        </div>
      </motion.div>
    </div>
  )
}
