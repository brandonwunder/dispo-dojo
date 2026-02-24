import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, MessageSquare, User, Loader2, Camera } from 'lucide-react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../../lib/firebase'
import useUserProfile from '../../hooks/useUserProfile'
import { computeCommunityRank } from '../../lib/userProfile'
import RankBadge from './RankBadge'
import BadgeShowcase from './BadgeShowcase'

function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const ROLE_BADGES = {
  admin: { label: 'Admin', bg: 'rgba(246,196,69,0.15)', color: '#F6C445' },
  mod:   { label: 'Mod',   bg: 'rgba(127,0,255,0.15)',  color: '#7F00FF' },
  vip:   { label: 'VIP',   bg: 'rgba(0,198,255,0.15)',  color: '#00C6FF' },
}

export default function ProfileCard({ uid, name, email, currentUserId, onClose, onStartDM, onViewProfile }) {
  const cardRef = useRef(null)
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const { profile, loading, updatePhotoURL } = useUserProfile(uid)

  const isOwnProfile = Boolean(uid && currentUserId && uid === currentUserId)

  // Click-outside to close
  useEffect(() => {
    function handleMouseDown(e) {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !uid) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `avatars/${uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updatePhotoURL(uid, url)
    } catch (err) {
      console.error('Photo upload failed:', err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const stats = profile?.stats || {}
  const communityXp = stats.communityXp || 0
  const rankInfo = computeCommunityRank(communityXp)
  const role = profile?.role
  const roleBadge = ROLE_BADGES[role]
  const displayName = profile?.displayName || name || 'Guest'
  const photoURL = profile?.photoURL || null

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      style={{
        background: 'rgba(11,15,20,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,198,255,0.18)',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,198,255,0.06), inset 0 1px 0 rgba(255,255,255,0.04)',
        width: '320px',
        overflow: 'hidden',
      }}
      className="p-4 relative"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-[rgba(200,209,218,0.4)] hover:text-[#F4F7FA] focus-visible:text-[#F4F7FA] active:scale-90"
        style={{ transition: 'color 150ms ease' }}
      >
        <X size={14} />
      </button>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'rgba(200,209,218,0.4)' }} />
        </div>
      ) : (
        <>
          {/* Header row */}
          <div className="flex items-center gap-3">
            {/* Avatar with optional photo upload */}
            <div className="relative shrink-0">
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold relative"
                style={{
                  background: photoURL ? 'transparent' : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                  fontFamily: 'var(--font-heading, Rajdhani, sans-serif)',
                  color: '#F4F7FA',
                  boxShadow: '0 0 16px -4px rgba(0,198,255,0.5)',
                  border: '2.5px solid rgba(0,198,255,0.25)',
                  cursor: isOwnProfile ? 'pointer' : 'default',
                }}
                onClick={() => isOwnProfile && !uploading && fileInputRef.current?.click()}
              >
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(displayName)
                )}

                {/* Upload overlay — only own profile */}
                {isOwnProfile && (
                  <div
                    className="absolute inset-0 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.55)',
                      opacity: uploading ? 1 : 0,
                      transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={(e) => { if (!uploading) e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={(e) => { if (!uploading) e.currentTarget.style.opacity = '0' }}
                  >
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#00C6FF' }} />
                    ) : (
                      <Camera size={18} style={{ color: '#00C6FF' }} />
                    )}
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>

            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className="font-semibold truncate"
                  style={{
                    fontFamily: 'var(--font-heading, Rajdhani, sans-serif)',
                    fontSize: '18px',
                    color: '#F4F7FA',
                    lineHeight: 1.2,
                  }}
                >
                  {displayName}
                </p>
                {roleBadge && (
                  <span
                    className="text-[8px] px-1.5 py-[2px] rounded font-semibold leading-none shrink-0"
                    style={{
                      fontFamily: 'var(--font-heading, Rajdhani, sans-serif)',
                      backgroundColor: roleBadge.bg,
                      color: roleBadge.color,
                      border: `1px solid ${roleBadge.color}30`,
                    }}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
              {email && (
                <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(200,209,218,0.4)' }}>
                  {email}
                </p>
              )}
            </div>
          </div>

          {/* Rank row */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <RankBadge rankName={rankInfo.name} size="md" />
              {rankInfo.next && (
                <span className="text-[9px]" style={{ color: 'rgba(200,209,218,0.3)' }}>
                  {Math.round(rankInfo.progress * 100)}% to {rankInfo.next.name}
                </span>
              )}
            </div>
            {/* XP progress bar */}
            <div
              className="mt-1.5 h-1 w-full rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round(rankInfo.progress * 100)}%`,
                  backgroundColor: rankInfo.color,
                  transition: 'width 300ms ease',
                }}
              />
            </div>
          </div>

          {/* Stats row — Messages / Deals / Rank */}
          <div
            className="grid grid-cols-3 gap-0 my-3"
            style={{
              borderTop: '1px solid rgba(0,198,255,0.08)',
              borderBottom: '1px solid rgba(0,198,255,0.08)',
              paddingTop: '12px',
              paddingBottom: '12px',
            }}
          >
            <div className="text-center">
              <div
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading, Rajdhani, sans-serif)', color: '#F6C445' }}
              >
                {(stats.totalMessages || 0).toLocaleString()}
              </div>
              <div
                className="text-[11px]"
                style={{ fontFamily: 'var(--font-body, DM Sans, sans-serif)', color: '#8A9AAA' }}
              >
                Messages
              </div>
            </div>

            <div
              className="text-center"
              style={{
                borderLeft: '1px solid rgba(0,198,255,0.08)',
                borderRight: '1px solid rgba(0,198,255,0.08)',
              }}
            >
              <div
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading, Rajdhani, sans-serif)', color: '#00C6FF' }}
              >
                {(profile?.dealsCount || 0).toLocaleString()}
              </div>
              <div
                className="text-[11px]"
                style={{ fontFamily: 'var(--font-body, DM Sans, sans-serif)', color: '#8A9AAA' }}
              >
                Deals
              </div>
            </div>

            <div className="text-center">
              <div
                className="text-xl font-bold"
                style={{ fontFamily: 'var(--font-heading, Rajdhani, sans-serif)', color: '#E53935' }}
              >
                {profile?.leaderboardRank ? `#${profile.leaderboardRank}` : '—'}
              </div>
              <div
                className="text-[11px]"
                style={{ fontFamily: 'var(--font-body, DM Sans, sans-serif)', color: '#8A9AAA' }}
              >
                Rank
              </div>
            </div>
          </div>

          {/* Badge showcase */}
          <BadgeShowcase
            earnedBadgeIds={profile?.communityBadges || []}
            maxDisplay={4}
          />

          {/* Separator */}
          <div className="mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />

          {/* Action buttons */}
          <div className="mt-3 flex flex-col gap-1.5">
            <button
              onClick={() => onStartDM?.(uid)}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[12px] font-semibold active:scale-[0.98]"
              style={{
                fontFamily: 'var(--font-heading, Rajdhani, sans-serif)',
                color: '#00C6FF',
                transition: 'background 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,198,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Send Message
            </button>
            <button
              onClick={() => onViewProfile?.(uid)}
              className="flex items-center gap-2 w-full rounded-lg px-2.5 py-1.5 text-[12px] font-semibold active:scale-[0.98]"
              style={{
                fontFamily: 'var(--font-heading, Rajdhani, sans-serif)',
                color: 'rgba(200,209,218,0.6)',
                transition: 'background 150ms ease, color 150ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                e.currentTarget.style.color = 'rgba(200,209,218,1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'rgba(200,209,218,0.6)'
              }}
            >
              <User className="h-3.5 w-3.5" />
              View Profile
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
