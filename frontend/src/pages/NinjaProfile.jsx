import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil, Save, Lock, CheckCircle, Star,
  Calculator, Send, FileSignature, Trophy,
  DollarSign,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useUserProfile from '../hooks/useUserProfile'
import {
  RANK_THRESHOLDS, BADGE_DEFS, COMMUNITY_BADGES,
} from '../lib/userProfile'
import NinjaCard from '../components/NinjaCard'
import { RANK_BADGE_COLOR } from '../lib/rankImages'

// ─── Style constants ───────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'
const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'

const sectionCardStyle = {
  background: 'linear-gradient(135deg, rgba(17,27,36,0.85) 0%, rgba(11,15,20,0.92) 100%)',
  border: '1px solid rgba(246,196,69,0.08)',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), 0 0 1px rgba(0,198,255,0.06)',
  padding: '24px',
}

// ─── Data constants ────────────────────────────────────────────────────────────
const STAT_CARDS = [
  { key: 'underwrites', label: 'Underwrites Sent', Icon: Calculator },
  { key: 'lois', label: "LOI's Sent", Icon: Send },
  { key: 'contracts', label: 'Contracts Sent', Icon: FileSignature },
  { key: 'dealsClosed', label: 'Deals Closed', Icon: Trophy },
  { key: 'birdDogLeads', label: 'Bird Dog Leads Sent', Icon: DollarSign },
]

const allBadges = [
  ...BADGE_DEFS.map(b => ({ ...b, icon: b.icon || '🏆' })),
  ...COMMUNITY_BADGES,
]

const BADGE_DESCRIPTIONS = {
  'active-voice':     'Send 100 messages',
  'community-pillar': 'Reach Jonin community rank',
  'deal-hunter':      'Send 10 underwrites',
  'ink-slinger':      'Send 5 LOIs',
  'first-blood':      'Send your first message',
  'closer':           'Close 3 deals',
  'top-closer':       'Close 10 deals',
  'crowd-favorite':   'Get 10 reactions on a single message',
  'sensei':           'Receive 50 thread replies',
  'on-fire':          'Post 7 days in a row',
  'legendary':        'Reach Kage community rank',
}

function getRankRequirement(tier) {
  if (tier.minUnderwrites === 0 && tier.minDeals === 0) return 'Starting rank'
  const parts = []
  if (tier.minUnderwrites > 0) parts.push(`${tier.minUnderwrites} underwrite${tier.minUnderwrites > 1 ? 's' : ''} sent`)
  if (tier.minDeals > 0) parts.push(`${tier.minDeals} deal${tier.minDeals > 1 ? 's' : ''} closed`)
  return parts.join(' & ')
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-[3px] h-4 rounded-full bg-[#00C6FF]" />
      <h3 className="text-[13px] font-heading font-bold tracking-[0.15em] uppercase text-text-dim/50">
        {label}
      </h3>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NinjaProfile() {
  const { uid: paramUid } = useParams()
  const navigate = useNavigate()
  const { user, profile: ownProfile, updateProfile } = useAuth()
  const currentUid = user?.firebaseUid

  const targetUid = paramUid || currentUid
  const isOwnProfile = !paramUid || paramUid === currentUid

  const { profile: fetchedProfile, loading } = useUserProfile(isOwnProfile ? null : targetUid)

  // If own profile hasn't loaded after 3s, use a minimal fallback so the page isn't stuck on a spinner
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (ownProfile || !isOwnProfile) return
    const id = setTimeout(() => setTimedOut(true), 3000)
    return () => clearTimeout(id)
  }, [ownProfile, isOwnProfile])

  const fallbackProfile = timedOut && isOwnProfile && !ownProfile
    ? { displayName: user?.name || 'Ninja', username: user?.username || '', rank: 'initiate', stats: {}, createdAt: new Date().toISOString() }
    : null

  const profile = isOwnProfile ? (ownProfile || fallbackProfile) : fetchedProfile

  // ── Draft / edit state ────────────────────────────────────────────
  const [draft, setDraft] = useState({})
  const [editing, setEditing] = useState(null) // null | 'identity' | 'contact'
  const [saving, setSaving] = useState(false)

  const rank = profile?.rank || 'initiate'
  const stats = profile?.stats || {}
  const rankIndex = RANK_THRESHOLDS.findIndex(t => t.rank === rank)

  const merged = { ...profile, ...draft }

  const patch = useCallback((key, value) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }, [])

  const patchNotif = useCallback((key, value) => {
    setDraft(prev => ({
      ...prev,
      notificationPrefs: {
        ...(profile?.notificationPrefs || {}),
        ...(prev.notificationPrefs || {}),
        [key]: value,
      },
    }))
  }, [profile])

  const handleSave = async () => {
    if (!Object.keys(draft).length) { setEditing(null); return }
    setSaving(true)
    try {
      await updateProfile(draft)
      setDraft({})
      setEditing(null)
    } catch (err) {
      console.error('Profile save failed:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── Loading / not found ───────────────────────────────────────────
  if (!profile) {
    if (isOwnProfile || loading) {
      return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00C6FF] border-t-transparent" />
        </div>
      )
    }
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-3 text-text-dim/40">
        <p className="text-sm font-body">Profile not found</p>
        <button
          onClick={() => navigate('/')}
          className="text-xs text-[#00C6FF] underline hover:text-[#00C6FF]/80 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen pb-16"
      style={{
        backgroundImage: 'url(/ninja-profile-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-[#0B0F14]/75 pointer-events-none" />
      <div className="relative z-10 max-w-[720px] mx-auto px-4">

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1 — Hero: Ninja Card
            ═══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center pt-8 pb-12">
          <div className="relative">
            {/* Ambient glow */}
            <div
              className="absolute inset-0 blur-3xl opacity-30 rounded-full scale-150 -z-10"
              style={{ background: RANK_BADGE_COLOR[rank] || '#00C6FF' }}
            />
            <NinjaCard
              rank={rank}
              name={profile?.displayName || 'Ninja'}
              username={profile?.username}
              market={profile?.market}
              stats={profile?.stats}
              size="full"
            />
          </div>

          {/* Edit identity button (own profile only) */}
          {isOwnProfile && editing !== 'identity' && (
            <button
              onClick={() => { setEditing('identity'); setDraft({}) }}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-heading font-semibold tracking-wider uppercase text-text-dim/50 hover:text-[#00C6FF] border border-white/5 hover:border-[rgba(0,198,255,0.2)] transition-colors duration-200"
            >
              <Pencil size={13} /> Edit Profile
            </button>
          )}
        </div>

        {/* Identity edit form (conditional) */}
        <AnimatePresence>
          {editing === 'identity' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden mb-6"
            >
              <div style={sectionCardStyle}>
                <SectionHeader label="Edit Profile" />
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input
                      className={inputCls}
                      value={merged.displayName || ''}
                      onChange={e => patch('displayName', e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-dim/40 pointer-events-none">@</span>
                      <input
                        className={inputCls + ' pl-7'}
                        value={(merged.username || '').replace(/^@/, '')}
                        onChange={e => {
                          const raw = e.target.value.replace(/^@/, '')
                          patch('username', raw)
                        }}
                        placeholder="handle"
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea
                      rows={3}
                      className={inputCls + ' resize-none'}
                      value={merged.bio || ''}
                      onChange={e => patch('bio', e.target.value)}
                      placeholder="Tell the dojo who you are..."
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Market</label>
                    <input
                      className={inputCls}
                      value={merged.market || ''}
                      onChange={e => patch('market', e.target.value)}
                      placeholder="e.g. Dallas, TX"
                    />
                  </div>

                  {/* Contact fields */}
                  <div className="pt-3 mt-3 border-t border-white/5">
                    <div>
                      <label className={labelCls}>Email</label>
                      <input
                        className={inputCls + ' opacity-50 cursor-not-allowed'}
                        value={merged.email || user?.email || ''}
                        readOnly
                      />
                      <p className="mt-1 text-[10px] text-text-dim/30 font-body">Email cannot be changed here.</p>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone</label>
                    <input
                      className={inputCls}
                      value={merged.phone || ''}
                      onChange={e => patch('phone', e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  {/* Notification toggles */}
                  <div className="pt-3 mt-1 border-t border-white/5 space-y-2">
                    <label className={labelCls}>Notifications</label>
                    {[
                      { key: 'communityReplies', label: 'Community Replies' },
                      { key: 'dealUpdates', label: 'Deal Updates' },
                      { key: 'taskAssignments', label: 'Task Assignments' },
                    ].map(({ key, label: notifLabel }) => {
                      const notifPrefs = {
                        ...(profile?.notificationPrefs || {}),
                        ...(draft.notificationPrefs || {}),
                      }
                      return (
                        <label key={key} className="flex items-center gap-2 text-sm text-text-dim/70 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifPrefs[key] ?? true}
                            onChange={() => patchNotif(key, !(notifPrefs[key] ?? true))}
                            className="accent-[#00C6FF]"
                          />
                          {notifLabel}
                        </label>
                      )
                    })}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-1.5 rounded-md text-[11px] font-heading font-bold uppercase tracking-wider bg-[#00C6FF]/10 text-[#00C6FF] border border-[#00C6FF]/20 hover:bg-[#00C6FF]/20 transition-colors"
                    >
                      <Save size={12} className="inline mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditing(null); setDraft({}) }}
                      className="px-4 py-1.5 rounded-md text-[11px] font-heading uppercase tracking-wider text-text-dim/50 border border-white/5 hover:text-white/70 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2 — The Path: Rank Timeline
            ═══════════════════════════════════════════════════════════ */}
        <motion.section
          style={sectionCardStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <SectionHeader label="The Path" />
          <div className="flex items-center gap-0 overflow-x-auto pt-4 pb-16 scrollbar-hide relative">
            {RANK_THRESHOLDS.map((tier, i) => {
              const isCurrent = tier.rank === rank
              const isPast = rankIndex > i
              const isFuture = rankIndex < i
              const color = RANK_BADGE_COLOR[tier.rank]
              return (
                <React.Fragment key={tier.rank}>
                  {i > 0 && (
                    <div
                      className="h-0.5 flex-1 min-w-[20px]"
                      style={{ background: isPast || isCurrent ? color : 'rgba(255,255,255,0.06)' }}
                    />
                  )}
                  <div className="relative group flex flex-col items-center shrink-0 px-1">
                    <div
                      className={`rounded-full flex items-center justify-center border
                        ${isCurrent ? 'w-12 h-12 ring-2 ring-offset-1 ring-offset-[#0B0F14]' : 'w-8 h-8'}
                        ${isFuture ? 'opacity-30' : ''}`}
                      style={{
                        background: isPast || isCurrent ? `${color}15` : 'rgba(255,255,255,0.03)',
                        borderColor: isPast || isCurrent ? `${color}50` : 'rgba(255,255,255,0.06)',
                        ...(isCurrent ? { ringColor: color, boxShadow: `0 0 12px ${color}30` } : {}),
                      }}
                    >
                      {isPast && <CheckCircle size={14} style={{ color }} />}
                      {isCurrent && <Star size={18} style={{ color }} />}
                      {isFuture && <Lock size={12} className="text-white/15" />}
                    </div>
                    <span className={`text-[9px] mt-1.5 font-heading tracking-wider whitespace-nowrap
                      ${isCurrent ? 'font-bold text-white' : 'text-text-dim/40'}`}>
                      {tier.name}
                    </span>
                    {/* Rank tooltip */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-[#111B24] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/10 whitespace-nowrap shadow-lg shadow-black/50">
                      <div className="font-heading font-bold text-[12px] mb-0.5" style={{ color }}>{tier.name}</div>
                      <div className="text-[11px] text-[#C8D1DA]">{getRankRequirement(tier)}</div>
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3 — Mission Log: Stats Grid
            ═══════════════════════════════════════════════════════════ */}
        <motion.section
          style={sectionCardStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <SectionHeader label="Mission Log" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {STAT_CARDS.map(({ key, label, Icon }) => (
              <div
                key={key}
                className="rounded-lg p-4 text-center transition-transform duration-200 hover:-translate-y-0.5"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(0,198,255,0.06)',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
                }}
              >
                <Icon size={18} className="mx-auto mb-2" style={{ color: RANK_BADGE_COLOR[rank] || '#00C6FF', opacity: 0.5 }} />
                <div className="font-heading font-bold text-[28px] text-[#00C6FF] leading-none">
                  {stats?.[key] || 0}
                </div>
                <div className="text-[11px] text-text-dim/50 mt-1.5 font-body tracking-wide">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4 — Trophy Wall: Badge Grid
            ═══════════════════════════════════════════════════════════ */}
        <motion.section
          style={sectionCardStyle}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <SectionHeader label="Trophy Wall" />
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {allBadges.map((badge) => {
              const earned = (profile?.badges || []).includes(badge.id) || (profile?.communityBadges || []).includes(badge.id)
              return (
                <div
                  key={badge.id}
                  className={`relative group rounded-lg p-3 text-center transition-transform duration-200
                    ${earned ? 'hover:scale-105' : 'opacity-30 grayscale'}`}
                  style={{
                    background: earned ? 'rgba(0,198,255,0.06)' : 'rgba(0,0,0,0.2)',
                    border: `1px solid ${earned ? 'rgba(0,198,255,0.12)' : 'rgba(255,255,255,0.03)'}`,
                  }}
                >
                  <div className="text-xl mb-1">{badge.icon || '🏆'}</div>
                  <div className="text-[9px] font-heading text-text-dim/50 truncate tracking-wide">{badge.label}</div>
                  {!earned && <Lock size={10} className="absolute top-1.5 right-1.5 text-white/15" />}
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg bg-[#111B24] text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-white/10 whitespace-nowrap shadow-lg shadow-black/50">
                    <div className="font-heading font-bold text-[12px] mb-0.5">{badge.label}</div>
                    <div className="text-[11px] text-[#C8D1DA]">{BADGE_DESCRIPTIONS[badge.id] || badge.label}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5 — Hunting Grounds (conditional)
            ═══════════════════════════════════════════════════════════ */}
        {(profile?.market || profile?.buyBox) && (
          <motion.section
            style={sectionCardStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <SectionHeader label="Hunting Grounds" />
            <div className="space-y-3">
              {profile?.market && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-heading uppercase tracking-widest text-text-dim/40">Market</span>
                  <span className="text-sm text-parchment font-body">{profile.market}</span>
                </div>
              )}
              {profile?.buyBox?.markets?.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-heading uppercase tracking-widest text-text-dim/40 pt-1">Buy Box Markets</span>
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                    {profile.buyBox.markets.map(m => (
                      <span key={m} className="px-2.5 py-1 text-xs font-body text-parchment bg-white/[0.06] border border-white/[0.08] rounded-md">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(profile?.buyBox?.minPrice || profile?.buyBox?.maxPrice) && (
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-heading uppercase tracking-widest text-text-dim/40">Price Range</span>
                  <span className="text-sm text-parchment font-body">
                    ${(profile.buyBox.minPrice || 0).toLocaleString()} &ndash; ${(profile.buyBox.maxPrice || 0).toLocaleString()}
                  </span>
                </div>
              )}
              {profile?.buyBox?.propertyTypes?.length > 0 && (
                <div className="flex justify-between items-start">
                  <span className="text-[11px] font-heading uppercase tracking-widest text-text-dim/40 pt-1">Property Types</span>
                  <div className="flex flex-wrap gap-1.5 justify-end max-w-[60%]">
                    {profile.buyBox.propertyTypes.map(t => (
                      <span key={t} className="px-2.5 py-1 text-xs font-body text-[#00C6FF] bg-[#00C6FF]/[0.08] border border-[#00C6FF]/[0.15] rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.section>
        )}


      </div>
    </div>
  )
}
