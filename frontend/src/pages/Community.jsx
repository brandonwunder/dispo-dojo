import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Hash, MessageSquare, X } from 'lucide-react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { auth, db } from '../lib/firebase'

// Hooks
import useMessages from '../hooks/useMessages'
import useReplies from '../hooks/useReplies'
import useReactions from '../hooks/useReactions'
import usePresence from '../hooks/usePresence'
import useOnlineUsers from '../hooks/useOnlineUsers'
import useFileUpload from '../hooks/useFileUpload'
import usePinnedMessages from '../hooks/usePinnedMessages'
import useReputation from '../hooks/useReputation'
import useLeaderboard from '../hooks/useLeaderboard'
import useDirectMessages from '../hooks/useDirectMessages'
import useNotifications from '../hooks/useNotifications'
import useUnreadTracking from '../hooks/useUnreadTracking'
import useSearch from '../hooks/useSearch'

// Components
import ChannelHero from '../components/community/ChannelHero'
import MessageBubble from '../components/community/MessageBubble'
import MessageInput from '../components/community/MessageInput'
import TypingIndicator from '../components/community/TypingIndicator'
import PinnedMessagesBar from '../components/community/PinnedMessagesBar'
import OnlineUsersList from '../components/community/OnlineUsersList'
import ProfileCard from '../components/community/ProfileCard'
import Leaderboard from '../components/community/Leaderboard'
import DMList from '../components/community/DMList'
import DMConversation from '../components/community/DMConversation'
import NewDMModal from '../components/community/NewDMModal'
import NotificationBell from '../components/community/NotificationBell'
import SearchBar from '../components/community/SearchBar'
import MessageSkeleton from '../components/community/MessageSkeleton'

/* -- constants ------------------------------------------------ */
const CHANNELS = [
  { id: 'general', name: 'General', desc: 'Hang out and chat with the community' },
  { id: 'wins', name: 'Wins', desc: 'Share your wins and celebrate together' },
  { id: 'deal-talk', name: 'Deal Talk', desc: 'Discuss deals, comps, and strategy' },
  { id: 'questions', name: 'Questions', desc: 'Ask anything and get help' },
  { id: 'resources', name: 'Resources', desc: 'Share useful links and tools' },
]

const QUICK_REACTIONS = ['\u{1F44D}','\u{1F525}','\u{1F4AF}','\u{1F602}','\u2764\uFE0F','\u{1F3AF}']

const CHANNEL_EMPTY_STATES = {
  'general': { icon: '💬', text: 'The dojo is quiet. Break the silence!' },
  'wins': { icon: '🏆', text: 'No wins shared yet — be the first to celebrate!' },
  'deal-talk': { icon: '🤝', text: 'No deal talk yet. Drop your first comp or strategy.' },
  'questions': { icon: '❓', text: 'No questions asked yet. The sensei awaits.' },
  'resources': { icon: '📚', text: 'No resources shared yet. Share a useful link!' },
}

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function isSameDay(a, b) {
  if (!a || !b) return false
  return a.toDateString() === b.toDateString()
}

function formatDayLabel(date) {
  if (!date) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, today)) return 'Today'
  if (isSameDay(date, yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

/* -- component ------------------------------------------------ */
export default function Community() {
  const { user, isAdmin, firebaseReady } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')
  const [activeThread, setActiveThread] = useState(null)
  const [profilePopover, setProfilePopover] = useState(null)
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null)

  // New state
  const [showMembers, setShowMembers] = useState(false)
  const [viewMode, setViewMode] = useState('channel') // 'channel' | 'dm'
  const [activeDMId, setActiveDMId] = useState(null)
  const [showNewDM, setShowNewDM] = useState(false)
  const [allUsers, setAllUsers] = useState([])
  const navigate = useNavigate()

  const feedEnd = useRef(null)
  const replyEnd = useRef(null)
  const messageRefs = useRef({})

  const displayName = user?.name || user?.username || 'Guest'
  const displayEmail = user?.email || 'guest@dispodojo.com'
  const currentUid = user?.firebaseUid || auth.currentUser?.uid
  const channelMeta = CHANNELS.find((c) => c.id === activeChannel)

  // Hooks -- gated on firebaseReady to prevent permission errors
  const { messages, sendMessage, editMessage, deleteMessage, loading, error } = useMessages(activeChannel, firebaseReady)
  const { replies, sendReply, loading: repliesLoading } = useReplies(activeThread?.id)
  const { toggleReaction } = useReactions()
  const { setTyping } = usePresence(displayName, activeChannel)
  const { onlineUsers, typingUsers } = useOnlineUsers(activeChannel, firebaseReady)
  const fileUpload = useFileUpload(activeChannel)
  const replyFileUpload = useFileUpload(activeChannel)
  const { pinnedMessages, pinMessage, unpinMessage } = usePinnedMessages(activeChannel, firebaseReady)

  // New hooks
  const reputation = useReputation()
  const { leaders } = useLeaderboard(10)
  const {
    conversations,
    activeMessages: dmMessages,
    startConversation,
    sendDirectMessage,
    markConversationRead,
  } = useDirectMessages(activeDMId)
  const {
    notifications,
    unreadCount: notifUnreadCount,
    markRead: markNotifRead,
    markAllRead: markAllNotifsRead,
  } = useNotifications()
  const unreadTracking = useUnreadTracking(activeChannel)
  const { query: searchQuery, results: searchResults, search, clearSearch } = useSearch(messages)

  // Fetch all users for DM modal
  useEffect(() => {
    if (!firebaseReady) return
    const q = query(collection(db, 'users'))
    const unsub = onSnapshot(q, (snap) => {
      setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [firebaseReady])

  // Build profiles map for rank display in MessageBubble
  const profilesMap = {}
  allUsers.forEach((u) => { profilesMap[u.id] = u })

  // Auto-scroll
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    replyEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies])

  // Channel switch -- also reset viewMode
  const switchChannel = useCallback((id) => {
    setActiveChannel(id)
    setActiveThread(null)
    setProfilePopover(null)
    setReactionPickerMsgId(null)
    setViewMode('channel')
    setActiveDMId(null)
  }, [])

  // Send handlers
  const handleSendMessage = useCallback((body, gifUrl, gifTitle, attachments, type = null, dealData = null) => {
    sendMessage(body, displayName, displayEmail, gifUrl, gifTitle, attachments, type, dealData)
    setTyping(false)
  }, [sendMessage, displayName, displayEmail, setTyping])

  const handleSendReply = useCallback((body, gifUrl, gifTitle, attachments) => {
    sendReply(body, displayName, displayEmail, gifUrl, gifTitle, attachments, activeThread?.authorId)
  }, [sendReply, displayName, displayEmail, activeThread])

  // Pin toggle -- pass authorId
  const handlePinToggle = useCallback((messageId) => {
    const msg = messages.find((m) => m.id === messageId)
    if (msg?.isPinned) {
      unpinMessage(messageId)
    } else {
      pinMessage(messageId, msg?.authorId)
    }
  }, [messages, pinMessage, unpinMessage])

  // Scroll to pinned message
  const scrollToMessage = useCallback((messageId) => {
    const el = messageRefs.current[messageId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-1', 'ring-gold/30')
      setTimeout(() => el.classList.remove('ring-1', 'ring-gold/30'), 2000)
    }
  }, [])

  // Author click for profile popover
  const handleAuthorClick = useCallback((msg) => {
    setProfilePopover(
      profilePopover?.id === msg.id
        ? null
        : { id: msg.id, name: msg.authorName, email: msg.authorEmail }
    )
  }, [profilePopover])

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="relative z-10 flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── Background layers ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Layer 0: Ninja gathering image */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/community-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 25%',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Layer 1: Atmospheric fade — center heavily darkened for readability */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 50% 40%, rgba(11,15,20,0.45) 0%, rgba(11,15,20,0.75) 55%, rgba(11,15,20,0.92) 100%),
              linear-gradient(180deg, rgba(11,15,20,0.35) 0%, rgba(11,15,20,0.60) 40%, rgba(11,15,20,0.90) 100%)
            `,
          }}
        />
        {/* Layer 2: Left sidebar darkening */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(11,15,20,0.85) 0%, rgba(11,15,20,0.40) 30%, transparent 60%)',
          }}
        />
        {/* Layer 3: Bottom fade to page bg */}
        <div
          className="absolute inset-x-0 bottom-0 h-48"
          style={{ background: 'linear-gradient(to bottom, transparent, #0B0F14)' }}
        />
      </div>

      {/* -- LEFT: Channel sidebar ---------------------------------- */}
      <aside
        className="flex w-[260px] xl:w-[280px] shrink-0 flex-col h-full relative"
        style={{
          background: 'linear-gradient(180deg, #0B0F14 0%, #0E1820 30%, #090D12 70%, #0B0F14 100%)',
          borderRight: '1px solid rgba(0, 198, 255, 0.08)',
        }}
      >
        {/* Branding dock */}
        <div className="px-4 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3 mb-1">
            {/* Hanko seal */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
              style={{
                background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                fontFamily: 'var(--font-display, serif)',
                color: '#F4F7FA',
                boxShadow: '0 0 12px -4px rgba(0,198,255,0.5)',
                letterSpacing: '0.02em',
              }}
            >
              DD
            </div>
            <div>
              <div className="text-sm font-bold text-[#F4F7FA]" style={{ fontFamily: 'var(--font-heading, sans-serif)', letterSpacing: '0.04em' }}>
                Dispo Dojo
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body, sans-serif)' }}>Community</span>
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  {onlineUsers.length} online
                </span>
              </div>
            </div>
          </div>
          {/* Katana divider */}
          <div className="h-px mt-3" style={{
            background: 'linear-gradient(90deg, transparent, #00C6FF, #0E5A88, #00C6FF, transparent)',
            opacity: 0.4,
            boxShadow: '0 0 8px rgba(0,198,255,0.2)',
          }} />
        </div>

        {/* Channel list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {/* Section header */}
          <div className="px-2 py-2 text-[10px] font-bold text-[#8A9AAA] tracking-[0.12em] uppercase"
            style={{ fontFamily: 'var(--font-heading, sans-serif)' }}
          >
            Channels
          </div>

          {CHANNELS.map((ch) => {
            const isActive = activeChannel === ch.id
            const hasUnread = unreadTracking.channelReadState && !unreadTracking.channelReadState[ch.id] && ch.id !== activeChannel
            return (
              <button
                key={ch.id}
                onClick={() => switchChannel(ch.id)}
                className="w-full flex items-center justify-between rounded-lg mb-0.5 group transition-colors duration-150"
                style={{
                  background: isActive ? 'rgba(0,198,255,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid #00C6FF' : '3px solid transparent',
                  padding: isActive ? '8px 12px 8px 9px' : '8px 12px',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-sm font-mono flex-shrink-0"
                    style={{ color: isActive ? '#00C6FF' : '#8A9AAA' }}
                  >
                    #
                  </span>
                  <span
                    className="text-sm truncate"
                    style={{
                      fontFamily: 'var(--font-body, sans-serif)',
                      color: isActive ? '#00C6FF' : '#8A9AAA',
                    }}
                  >
                    {ch.name}
                  </span>
                </div>
                {hasUnread && (
                  <span className="flex-shrink-0 h-2 w-2 rounded-full bg-[#00C6FF] shadow-[0_0_4px_rgba(0,198,255,0.5)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Direct Messages list */}
        <DMList
          conversations={conversations}
          currentUid={currentUid}
          activeDMId={activeDMId}
          onSelectDM={(id) => { setActiveDMId(id); setViewMode('dm'); markConversationRead(id) }}
          onNewDM={() => setShowNewDM(true)}
        />

        {/* Online users */}
        <OnlineUsersList onlineUsers={onlineUsers} currentUid={currentUid} profilesMap={profilesMap} />

        {/* Leaderboard */}
        <Leaderboard leaders={leaders} />

        {/* User dock */}
        <div className="flex-shrink-0 px-3 pb-3 pt-2">
          <div className="h-px mb-3" style={{
            background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.3), transparent)',
          }} />
          <div className="flex items-center gap-3 group">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                  fontFamily: 'var(--font-heading, sans-serif)',
                  color: '#F4F7FA',
                  boxShadow: '0 0 10px -3px rgba(0,198,255,0.4)',
                  border: '2px solid rgba(0,198,255,0.2)',
                }}
              >
                {initials(displayName)}
              </div>
              {/* Online status dot */}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: '#22C55E',
                  borderColor: '#0B0F14',
                  boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                }}
              />
            </div>
            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#F4F7FA] truncate" style={{ fontFamily: 'var(--font-heading, sans-serif)', fontWeight: 600 }}>
                {displayName}
              </div>
              <div className="text-[11px] text-[#8A9AAA]" style={{ fontFamily: 'var(--font-body, sans-serif)' }}>Member</div>
            </div>
            {/* Settings icon — appears on group hover */}
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[#8A9AAA] hover:text-[#F6C445] p-1 rounded">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* -- CENTER: Message feed ----------------------------------- */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Channel hero */}
        <ChannelHero
          channelId={activeChannel}
          messageCount={messages.length}
          memberCount={onlineUsers.length}
          pinnedCount={pinnedMessages.length}
          onPinnedClick={() => {}}
          onMembersClick={() => setShowMembers(p => !p)}
        />
        {/* Toolbar: search + notifications */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-[rgba(246,196,69,0.10)]" style={{ background: 'rgba(11,15,20,0.6)' }}>
          <div className="ml-auto flex items-center gap-2">
            <SearchBar
              onSearch={search}
              onClear={clearSearch}
              results={searchResults}
              query={searchQuery}
              onSelectResult={scrollToMessage}
            />
            <NotificationBell
              notifications={notifications}
              unreadCount={notifUnreadCount}
              onMarkRead={markNotifRead}
              onMarkAllRead={markAllNotifsRead}
              onNavigate={(notif) => {
                if (notif.channelId) { switchChannel(notif.channelId) }
                if (notif.messageId) { setTimeout(() => scrollToMessage(notif.messageId), 300) }
              }}
            />
          </div>
        </div>

        {/* Conditional rendering: DM conversation or channel feed */}
        {viewMode === 'dm' && activeDMId ? (
          <DMConversation
            conversation={conversations.find((c) => c.id === activeDMId)}
            messages={dmMessages}
            onSend={(body, gifUrl, gifTitle, attachments) => {
              sendDirectMessage(activeDMId, body, displayName, gifUrl, gifTitle, attachments)
            }}
            onBack={() => { setViewMode('channel'); setActiveDMId(null) }}
            currentUid={currentUid}
            fileUpload={fileUpload}
            onlineUsers={onlineUsers}
          />
        ) : (
          <>
            {/* Pinned messages */}
            <PinnedMessagesBar
              pinnedMessages={pinnedMessages}
              isAdmin={isAdmin}
              onUnpin={unpinMessage}
              onScrollTo={scrollToMessage}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <MessageSkeleton count={5} />
              ) : error ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-red-400/50">
                  <p className="text-sm">Failed to load messages</p>
                  <p className="text-xs">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-text-dim/30">
                  <span className="text-4xl">{CHANNEL_EMPTY_STATES[activeChannel]?.icon || '💬'}</span>
                  <p className="text-sm">{CHANNEL_EMPTY_STATES[activeChannel]?.text || 'No messages yet. Be the first to post!'}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, index) => {
                    const prevMsg = messages[index - 1]
                    const msgDate = msg.createdAt?.toDate?.()
                    const prevDate = prevMsg?.createdAt?.toDate?.()
                    const isNewDay = !prevMsg || !isSameDay(msgDate, prevDate)
                    const isGrouped = !isNewDay
                      && prevMsg?.authorId === msg.authorId
                      && msg.createdAt?.seconds - prevMsg.createdAt?.seconds < 300

                    return (
                    <div
                      key={msg.id}
                      ref={(el) => { messageRefs.current[msg.id] = el }}
                      className="relative transition-all duration-500"
                    >
                      {isNewDay && (
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className="flex-1 h-px" style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)'
                          }} />
                          <span className="text-[11px] text-[#8A9AAA] px-2 select-none" style={{ fontFamily: 'var(--font-body, sans-serif)' }}>
                            {formatDayLabel(msgDate)}
                          </span>
                          <div className="flex-1 h-px" style={{
                            background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)'
                          }} />
                        </div>
                      )}
                      <MessageBubble
                        msg={msg}
                        isGrouped={isGrouped}
                        isOwn={msg.authorId === currentUid}
                        isAdmin={isAdmin}
                        communityRank={profilesMap[msg.authorId]?.communityRank}
                        currentUid={currentUid}
                        onReply={(m) => setActiveThread(m)}
                        onReact={(id) => setReactionPickerMsgId(reactionPickerMsgId === id ? null : id)}
                        onEdit={editMessage}
                        onDelete={deleteMessage}
                        onPin={handlePinToggle}
                        onToggleReaction={toggleReaction}
                        onAuthorClick={handleAuthorClick}
                      />

                      {/* Quick reaction picker */}
                      <AnimatePresence>
                        {reactionPickerMsgId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute -top-8 right-12 z-50 flex gap-0.5 rounded-full border border-[rgba(246,196,69,0.15)] bg-[#111B24] px-2 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                          >
                            {QUICK_REACTIONS.map((em) => (
                              <button
                                key={em}
                                onClick={() => {
                                  toggleReaction(msg.id, em, msg.reactions, msg.authorId)
                                  setReactionPickerMsgId(null)
                                }}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:scale-125 hover:bg-white/[0.08] transition-transform active:scale-95"
                              >
                                {em}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Profile popover */}
                      <AnimatePresence>
                        {profilePopover?.id === msg.id && (
                          <div className="absolute left-11 top-0 z-40">
                            <ProfileCard
                              uid={msg.authorId}
                              name={profilePopover.name}
                              email={profilePopover.email}
                              currentUserId={currentUid}
                              onClose={() => setProfilePopover(null)}
                              onStartDM={async (uid) => {
                                const convoId = await startConversation(uid, profilePopover.name)
                                if (convoId) { setActiveDMId(convoId); setViewMode('dm') }
                                setProfilePopover(null)
                              }}
                              onViewProfile={(uid) => { navigate(`/community/profile/${uid}`); setProfilePopover(null) }}
                            />
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                  })}
                  <div ref={feedEnd} />
                </div>
              )}
            </div>

            {/* Typing indicator */}
            <TypingIndicator typingUsers={typingUsers} currentUid={currentUid} />

            {/* Message input */}
            <MessageInput
              channelId={activeChannel}
              onSend={handleSendMessage}
              onTyping={setTyping}
              fileUpload={fileUpload}
              onlineUsers={onlineUsers}
            />
          </>
        )}
      </main>

      {/* -- RIGHT: Thread panel ------------------------------------ */}
      <AnimatePresence>
        {activeThread && (
          <motion.aside
            key="thread-panel"
            className="w-[380px] xl:w-[400px] flex-shrink-0 flex flex-col h-full"
            style={{
              background: 'linear-gradient(180deg, #0B0F14 0%, #0E1820 30%, #090D12 70%, #0B0F14 100%)',
              borderLeft: '1px solid rgba(0,198,255,0.08)',
            }}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            {/* Thread header */}
            <div
              className="flex items-center justify-between px-4 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(0,198,255,0.08)' }}
            >
              <h3
                className="font-bold"
                style={{ fontFamily: 'var(--font-heading, sans-serif)', fontSize: '17px', color: '#F4F7FA' }}
              >
                Replies
              </h3>
              <button
                onClick={() => setActiveThread(null)}
                className="text-[#8A9AAA] hover:text-[#F4F7FA] transition-colors duration-150 p-1 rounded"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Parent message quote */}
            {activeThread && (
              <div className="px-4 py-3 mx-3 mt-3 mb-1 rounded-lg flex-shrink-0" style={{
                background: 'rgba(0,198,255,0.04)',
                border: '1px solid rgba(0,198,255,0.12)',
              }}>
                <div
                  className="text-[11px] mb-1"
                  style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#8A9AAA' }}
                >
                  {activeThread.authorName}
                </div>
                <p
                  className="text-sm line-clamp-3"
                  style={{ fontFamily: 'var(--font-body, sans-serif)', color: '#C8D1DA', lineHeight: 1.5 }}
                >
                  {activeThread.body || (activeThread.type === 'deal' ? `\u{1F3E0} ${activeThread.dealData?.address}` : '')}
                </p>
              </div>
            )}

            {/* Katana divider */}
            <div className="mx-4 mt-2 h-px flex-shrink-0" style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,198,255,0.2), transparent)',
            }} />

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {replies.length === 0 ? (
                <p className="text-center text-xs text-text-dim/25">No replies yet</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <div className="hanko-seal flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
                        {initials(r.authorName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-heading text-xs font-semibold text-parchment">
                          {r.authorName}
                        </span>
                        {r.isDeleted && !isAdmin ? (
                          <p className="text-xs italic text-text-dim/30">This reply was deleted</p>
                        ) : (
                          <>
                            <p className={`mt-0.5 text-xs leading-relaxed break-words ${r.isDeleted ? 'line-through text-text-dim/30' : 'text-text-dim'}`}>
                              {r.body}
                            </p>
                            {r.gifUrl && (
                              <img src={r.gifUrl} alt={r.gifTitle || 'GIF'} className="mt-1 max-w-[200px] rounded-sm" />
                            )}
                            {r.attachments?.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {r.attachments.map((att, i) => (
                                  att.type?.startsWith('image/')
                                    ? <img key={i} src={att.url} alt={att.name} className="max-w-[180px] rounded-sm" />
                                    : <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#00C6FF] underline">{att.name}</a>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={replyEnd} />
                </div>
              )}
            </div>

            {/* Reply input */}
            <MessageInput
              placeholder="Reply..."
              onSend={handleSendReply}
              fileUpload={replyFileUpload}
              onlineUsers={onlineUsers}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* -- NewDMModal -------------------------------------------- */}
      <AnimatePresence>
        {showNewDM && (
          <NewDMModal
            users={allUsers}
            currentUid={currentUid}
            onSelect={async (uid, name) => {
              const convoId = await startConversation(uid, name)
              if (convoId) { setActiveDMId(convoId); setViewMode('dm'); markConversationRead(convoId) }
              setShowNewDM(false)
            }}
            onClose={() => setShowNewDM(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
