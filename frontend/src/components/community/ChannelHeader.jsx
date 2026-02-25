import { Hash, Pin, Users } from 'lucide-react'
import SearchBar from './SearchBar'
import NotificationBell from './NotificationBell'

const CHANNEL_DESCRIPTIONS = {
  general: 'The main hub — news, updates, and open conversation',
  wins: 'Share your closed deals and celebrate victories',
  'deal-talk': 'Analyze deals, ask for feedback, and collaborate',
  questions: 'No question is too basic — the dojo teaches all',
  resources: 'Scripts, templates, tools, and educational links',
}

export default function ChannelHeader({
  channelId,
  pinnedCount = 0,
  showMembers,
  onToggleMembers,
  onTogglePinned,
  // Search props
  onSearch,
  onClearSearch,
  searchResults,
  searchQuery,
  onSelectSearchResult,
  // Notification props
  notifications,
  notifUnreadCount,
  onMarkNotifRead,
  onMarkAllNotifsRead,
  onNotifNavigate,
}) {
  const description = CHANNEL_DESCRIPTIONS[channelId] || ''

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 shrink-0"
      style={{
        background: '#111B24',
        borderBottom: '1px solid rgba(0,198,255,0.06)',
        minHeight: '48px',
      }}
    >
      {/* Left: Channel name + description */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Hash className="h-5 w-5 shrink-0" style={{ color: '#8A9AAA' }} />
        <span
          className="text-[15px] font-bold shrink-0"
          style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
        >
          {channelId}
        </span>
        <div
          className="h-4 w-px shrink-0 mx-1"
          style={{ background: 'rgba(0,198,255,0.12)' }}
        />
        <span
          className="text-[12px] truncate"
          style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA' }}
        >
          {description}
        </span>
      </div>

      {/* Right: Action icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Pinned messages */}
        {pinnedCount > 0 && (
          <button
            onClick={onTogglePinned}
            className="relative flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
            title="Pinned messages"
          >
            <Pin className="h-4 w-4" style={{ color: '#8A9AAA' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#F6C445' }}>
              {pinnedCount}
            </span>
          </button>
        )}

        {/* Members toggle */}
        <button
          onClick={onToggleMembers}
          className="rounded-md p-1.5 transition-colors duration-150 hover:bg-white/[0.06]"
          title="Member list"
          style={{ color: showMembers ? '#F4F7FA' : '#8A9AAA' }}
        >
          <Users className="h-4 w-4" />
        </button>

        {/* Search */}
        <SearchBar
          onSearch={onSearch}
          onClear={onClearSearch}
          results={searchResults}
          query={searchQuery}
          onSelectResult={onSelectSearchResult}
        />

        {/* Notifications */}
        <NotificationBell
          notifications={notifications}
          unreadCount={notifUnreadCount}
          onMarkRead={onMarkNotifRead}
          onMarkAllRead={onMarkAllNotifsRead}
          onNavigate={onNotifNavigate}
        />
      </div>
    </div>
  )
}
