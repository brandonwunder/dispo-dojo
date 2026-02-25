import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
import ChannelCategory from '../components/community/ChannelCategory'
import ChannelHeader from '../components/community/ChannelHeader'
import MemberList from '../components/community/MemberList'
import MessageBubble from '../components/community/MessageBubble'
import MessageInput from '../components/community/MessageInput'
import TypingIndicator from '../components/community/TypingIndicator'
import PinnedMessagesBar from '../components/community/PinnedMessagesBar'
import ProfileCard from '../components/community/ProfileCard'
import DMList from '../components/community/DMList'
import DMConversation from '../components/community/DMConversation'
import NewDMModal from '../components/community/NewDMModal'
import MessageSkeleton from '../components/community/MessageSkeleton'

/* -- constants ------------------------------------------------ */
const CHANNEL_CATEGORIES = [
  {
    label: 'Community',
    channels: [
      { id: 'general', name: 'General', desc: 'Hang out and chat with the community' },
      { id: 'wins', name: 'Wins', desc: 'Share your wins and celebrate together' },
    ],
  },
  {
    label: 'Deal Room',
    channels: [
      { id: 'deal-talk', name: 'Deal Talk', desc: 'Discuss deals, comps, and strategy' },
      { id: 'resources', name: 'Resources', desc: 'Share useful links and tools' },
    ],
  },
  {
    label: 'Help & Learning',
    channels: [
      { id: 'questions', name: 'Questions', desc: 'Ask anything and get help' },
    ],
  },
]

// Keep flat array for hook lookups
const CHANNELS = CHANNEL_CATEGORIES.flatMap((cat) => cat.channels)

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
  const [replyingTo, setReplyingTo] = useState(null)
  const [profilePopover, setProfilePopover] = useState(null)

  // New state
  const [showMembers, setShowMembers] = useState(false)
  const [showPinned, setShowPinned] = useState(false)
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
    setViewMode('channel')
    setActiveDMId(null)
  }, [])

  // Send handlers
  const handleSendMessage = useCallback((body, gifUrl, gifTitle, attachments, type = null, dealData = null, replyTo = null) => {
    sendMessage(body, displayName, displayEmail, gifUrl, gifTitle, attachments, type, dealData, replyTo)
    setTyping(false)
    setReplyingTo(null)
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
        {/* Layer 1: Heavy darkening for readability — panels feel solid */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 50% 40%, rgba(11,15,20,0.80) 0%, rgba(11,15,20,0.92) 55%, rgba(11,15,20,0.98) 100%),
              linear-gradient(180deg, rgba(11,15,20,0.75) 0%, rgba(11,15,20,0.90) 40%, rgba(11,15,20,0.98) 100%)
            `,
          }}
        />
        {/* Layer 2: Full-width darkening */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, rgba(11,15,20,0.98) 0%, rgba(11,15,20,0.85) 30%, rgba(11,15,20,0.70) 60%, rgba(11,15,20,0.85) 80%, rgba(11,15,20,0.98) 100%)',
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
        className="flex w-[240px] shrink-0 flex-col h-full relative"
        style={{
          background: '#0E1317',
          borderRight: '1px solid rgba(0,198,255,0.06)',
        }}
      >
        {/* Server header */}
        <div className="px-3 pt-4 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0"
              style={{
                background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                fontFamily: 'var(--font-display, serif)',
                color: '#F4F7FA',
                boxShadow: '0 0 12px -4px rgba(0,198,255,0.4)',
                borderRadius: '12px',
              }}
            >
              DD
            </div>
            <span
              className="text-[15px] font-bold"
              style={{ fontFamily: 'var(--font-heading, sans-serif)', color: '#F4F7FA' }}
            >
              Dispo Dojo
            </span>
          </div>
          <div className="mt-3 h-px" style={{ background: 'rgba(0,198,255,0.06)' }} />
        </div>

        {/* Channel categories */}
        <div className="flex-1 overflow-y-auto px-1 pb-2">
          {CHANNEL_CATEGORIES.map((cat) => (
            <ChannelCategory
              key={cat.label}
              label={cat.label}
              channels={cat.channels}
              activeChannel={activeChannel}
              unreadChannels={
                unreadTracking.channelReadState
                  ? Object.fromEntries(
                      cat.channels
                        .filter((ch) => !unreadTracking.channelReadState[ch.id] && ch.id !== activeChannel)
                        .map((ch) => [ch.id, true])
                    )
                  : {}
              }
              onSelectChannel={switchChannel}
            />
          ))}
        </div>

        {/* Direct Messages */}
        <DMList
          conversations={conversations}
          currentUid={currentUid}
          activeDMId={activeDMId}
          onSelectDM={(id) => { setActiveDMId(id); setViewMode('dm'); markConversationRead(id) }}
          onNewDM={() => setShowNewDM(true)}
        />

        {/* User dock */}
        <div className="shrink-0 px-3 pb-3 pt-2" style={{ borderTop: '1px solid rgba(0,198,255,0.06)' }}>
          <div className="flex items-center gap-2.5 group">
            <div className="relative shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                  fontFamily: 'var(--font-heading, sans-serif)',
                  color: '#F4F7FA',
                  border: '2px solid rgba(0,198,255,0.15)',
                }}
              >
                {initials(displayName)}
              </div>
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                style={{ background: '#22C55E', borderColor: '#0E1317' }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#F4F7FA] truncate" style={{ fontFamily: 'var(--font-heading, sans-serif)', fontWeight: 600 }}>
                {displayName}
              </div>
              <div className="text-[10px]" style={{ color: '#8A9AAA', fontFamily: 'var(--font-body, sans-serif)' }}>Online</div>
            </div>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded" style={{ color: '#8A9AAA' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* -- CENTER: Message feed ----------------------------------- */}
      <main className="flex min-w-0 flex-1 flex-col" style={{ background: 'rgba(17,27,36,0.85)' }}>
        {/* Channel header */}
        <ChannelHeader
          channelId={activeChannel}
          pinnedCount={pinnedMessages.length}
          showMembers={showMembers}
          onToggleMembers={() => setShowMembers((v) => !v)}
          onTogglePinned={() => setShowPinned((v) => !v)}
          onSearch={search}
          onClearSearch={clearSearch}
          searchResults={searchResults}
          searchQuery={searchQuery}
          onSelectSearchResult={scrollToMessage}
          notifications={notifications}
          notifUnreadCount={notifUnreadCount}
          onMarkNotifRead={markNotifRead}
          onMarkAllNotifsRead={markAllNotifsRead}
          onNotifNavigate={(notif) => {
            if (notif.channelId) switchChannel(notif.channelId)
            if (notif.messageId) setTimeout(() => scrollToMessage(notif.messageId), 300)
          }}
        />

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
            {showPinned && (
              <PinnedMessagesBar
                pinnedMessages={pinnedMessages}
                isAdmin={isAdmin}
                onUnpin={unpinMessage}
                onScrollTo={scrollToMessage}
              />
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4" style={{ paddingBottom: '8px' }}>
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
                        isOwn={msg.authorId === currentUid || msg.authorEmail === displayEmail}
                        isAdmin={isAdmin}
                        communityRank={profilesMap[msg.authorId]?.communityRank}
                        currentUid={currentUid}
                        onReply={(m) => setReplyingTo(m)}
                        onScrollToMessage={scrollToMessage}
                        onEdit={editMessage}
                        onDelete={deleteMessage}
                        onPin={handlePinToggle}
                        onToggleReaction={toggleReaction}
                        onAuthorClick={handleAuthorClick}
                      />

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
                              onViewProfile={(uid) => { navigate(`/ninja-profile/${uid}`); setProfilePopover(null) }}
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
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
            />
          </>
        )}
      </main>

      {/* Right panel: Member list */}
      {showMembers && !activeThread && viewMode !== 'dm' && (
        <div className="w-[240px] shrink-0 h-full">
          <MemberList
            allUsers={allUsers}
            onlineUsers={onlineUsers}
            leaders={leaders}
            currentUid={currentUid}
            onUserClick={(user) => {
              setProfilePopover({
                id: user.id,
                name: user.displayName,
                email: user.email,
              })
            }}
          />
        </div>
      )}

      {/* -- RIGHT: Thread panel ------------------------------------ */}
      <AnimatePresence>
        {activeThread && (
          <motion.aside
            key="thread-panel"
            className="w-[360px] flex-shrink-0 flex flex-col h-full"
            style={{
              background: '#0E1317',
              borderLeft: '1px solid rgba(0,198,255,0.06)',
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
