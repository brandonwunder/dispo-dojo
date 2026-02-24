import { COMMUNITY_BADGES } from '../../lib/userProfile'

export default function BadgeShowcase({ earnedBadgeIds = [], maxDisplay = 6, showAll = false }) {
  const earned = COMMUNITY_BADGES.filter((b) => earnedBadgeIds.includes(b.id))
  const unearned = COMMUNITY_BADGES.filter((b) => !earnedBadgeIds.includes(b.id))
  const display = showAll ? earned : earned.slice(0, maxDisplay)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {display.length === 0 && (
          <span className="text-[10px] text-text-dim/30">No badges earned yet</span>
        )}
        {display.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1 rounded-sm border border-[rgba(246,196,69,0.15)] bg-white/[0.04] px-2 py-1"
            title={badge.label}
          >
            <span className="text-xs">{badge.icon}</span>
            <span className="text-[10px] font-heading font-semibold text-parchment">{badge.label}</span>
          </div>
        ))}
        {!showAll && earned.length > maxDisplay && (
          <span className="text-[10px] text-text-dim/40 self-center">+{earned.length - maxDisplay} more</span>
        )}
      </div>
      {showAll && unearned.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unearned.map((badge) => (
            <div
              key={badge.id}
              className="flex items-center gap-1 rounded-sm border border-white/[0.05] bg-white/[0.02] px-2 py-1 opacity-30"
              title={`${badge.label} (locked)`}
            >
              <span className="text-xs">{badge.icon}</span>
              <span className="text-[10px] font-heading text-text-dim">{badge.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
