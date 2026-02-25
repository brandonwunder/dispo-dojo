import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Pencil, Save, X, Lock, ChevronRight, ChevronDown,
  Calculator, Send, FileSignature, Briefcase, Trophy,
  DollarSign, Footprints, MessageSquare, Target, Calendar,
  HelpCircle, Phone, Shield, Mail, Sword, Award, Binoculars,
  TrendingUp, CheckCircle, Plus, Flame, Zap, Star,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useUserProfile from '../hooks/useUserProfile'
import {
  RANK_THRESHOLDS, unlockedGear, computeCommunityRank,
  COMMUNITY_RANKS, BADGE_DEFS, COMMUNITY_BADGES,
} from '../lib/userProfile'
import NinjaAvatar, { RANK_BADGE_COLOR } from '../components/NinjaAvatar'
import DealRankBadge from '../components/RankBadge'
import CommunityRankBadge from '../components/community/RankBadge'
import ActivityBadge from '../components/ActivityBadge'
import BadgeShowcase from '../components/community/BadgeShowcase'

// ─── Style constants ───────────────────────────────────────────────────────────
const inputCls =
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'
const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'
const cardStyle = {
  background: 'linear-gradient(135deg, rgba(17,27,36,0.95) 0%, rgba(11,15,20,0.98) 100%)',
  border: '1px solid rgba(246,196,69,0.10)',
  boxShadow: '0 4px 32px rgba(0,0,0,0.4), 0 0 1px rgba(246,196,69,0.08)',
}

// ─── Data constants ────────────────────────────────────────────────────────────
const FAQ = [
  { q: 'How do I submit a deal?', a: 'Go to Find Buyers from the sidebar and use the JV Deal Wizard.' },
  { q: 'How do I level up my ninja?', a: 'Submit underwrites, generate LOIs, and stay active in the community.' },
  { q: 'What is a Bird Dog?', a: 'Someone who finds motivated sellers and brings them to the team for a fee.' },
  { q: 'How do I become Boots on the Ground?', a: 'Sign up on the Boots on Ground page and set your service area.' },
  { q: 'How are payouts handled?', a: 'Payouts are processed by the admin team after a deal closes. Contact support for details.' },
]

const MASK_COLORS = [
  { hex: '#1a1a2e', label: 'Midnight' },
  { hex: '#0E5A88', label: 'Navy' },
  { hex: '#8B0000', label: 'Crimson' },
  { hex: '#1a3d1a', label: 'Forest' },
  { hex: '#3d1a5c', label: 'Violet' },
]
const HEADBAND_COLORS = [
  { hex: '#ffffff', label: 'White' },
  { hex: '#E53935', label: 'Red' },
  { hex: '#F6C445', label: 'Gold' },
  { hex: '#111111', label: 'Black' },
  { hex: '#00C6FF', label: 'Cyan' },
]
const EYE_COLORS = [
  { hex: '#00C6FF', label: 'Cyan' },
  { hex: '#F6C445', label: 'Gold' },
  { hex: '#E53935', label: 'Red' },
  { hex: '#f0f0f0', label: 'White' },
  { hex: '#7F00FF', label: 'Purple' },
]

const ALL_ACCESSORIES = [
  { key: 'smoke-wisps', label: 'Smoke Wisps', unlockKey: 'smoke-wisps' },
  { key: 'katana', label: 'Katana', unlockKey: 'katana' },
  { key: 'glow-eyes', label: 'Glow Eyes', unlockKey: 'glow-eyes' },
  { key: 'black-gi', label: 'Black Gi', unlockKey: 'black-gi' },
  { key: 'golden-trim', label: 'Golden Trim', unlockKey: 'golden-trim' },
  { key: 'full-aura', label: 'Full Aura', unlockKey: 'full-aura' },
]

const STAT_CARDS = [
  { key: 'underwrites', label: 'Underwrites', Icon: Calculator },
  { key: 'lois', label: 'LOIs', Icon: Send },
  { key: 'contracts', label: 'Contracts', Icon: FileSignature },
  { key: 'dealsSubmitted', label: 'Deals Submitted', Icon: Briefcase },
  { key: 'dealsClosed', label: 'Deals Closed', Icon: Trophy },
  { key: 'birdDogLeads', label: 'Bird Dog Leads', Icon: DollarSign },
  { key: 'bootsTasksCompleted', label: 'Boots Tasks', Icon: Footprints },
  { key: 'totalMessages', label: 'Messages', Icon: MessageSquare },
]

// ─── Shared sub-components ─────────────────────────────────────────────────────

function ColorSwatches({ colors, value, onChange, locked }) {
  return (
    <div className="flex gap-2.5 flex-wrap">
      {colors.map(({ hex, label }) => (
        <button
          key={hex}
          title={label}
          disabled={locked}
          onClick={() => !locked && onChange(hex)}
          className="relative w-8 h-8 rounded-sm border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/60 active:scale-90"
          style={{
            backgroundColor: hex,
            borderColor: value === hex ? '#F6C445' : 'rgba(255,255,255,0.12)',
            boxShadow: value === hex ? `0 0 10px ${hex}60` : 'none',
            opacity: locked ? 0.35 : 1,
            cursor: locked ? 'not-allowed' : 'pointer',
            transform: value === hex ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {locked && (
            <Lock size={10} className="absolute inset-0 m-auto text-white/70" />
          )}
        </button>
      ))}
    </div>
  )
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-10 h-5 rounded-full flex-shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/60"
      style={{
        background: checked
          ? 'linear-gradient(90deg, #0E5A88, #00C6FF)'
          : 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full"
        style={{
          left: checked ? '1.25rem' : '0.125rem',
          background: checked ? '#fff' : 'rgba(255,255,255,0.4)',
          boxShadow: checked ? '0 0 6px rgba(0,198,255,0.5)' : 'none',
          transition: 'left 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </button>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[rgba(246,196,69,0.08)] last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-left gap-3 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F6C445]/40 rounded-sm"
      >
        <span className="font-heading text-sm text-parchment/90 group-hover:text-parchment transition-colors">
          {q}
        </span>
        <ChevronRight
          size={14}
          className="text-text-dim/50 flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-3 text-sm text-text-dim/70 leading-relaxed font-body">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgressBar({ value, max, color = '#00C6FF', height = 'h-1.5' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div className={`w-full ${height} rounded-full overflow-hidden`} style={{ background: 'rgba(255,255,255,0.07)' }}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
        style={{
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  )
}

function SectionWrapper({ children, title, subtitle, icon: Icon, delay = 0, rightSlot }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 26 }}
    >
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon size={16} className="text-gold/60" />}
            <div>
              <h2 className="font-heading text-sm font-semibold tracking-widest uppercase text-parchment/90">{title}</h2>
              {subtitle && <p className="text-[10px] text-text-dim/40 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {rightSlot}
        </div>
      )}
      <div className="rounded-sm p-5 sm:p-6" style={cardStyle}>
        {children}
      </div>
    </motion.section>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDateLong(dateStr) {
  if (!dateStr) return 'Unknown'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function NinjaProfile() {
  const { uid: paramUid } = useParams()
  const navigate = useNavigate()
  const { user, profile: ownProfile, updateProfile, firebaseReady } = useAuth()
  const currentUid = user?.firebaseUid

  const targetUid = paramUid || currentUid
  const isOwnProfile = !paramUid || paramUid === currentUid

  const { profile: fetchedProfile, loading } = useUserProfile(isOwnProfile ? null : targetUid)
  const profile = isOwnProfile ? ownProfile : fetchedProfile

  // ── Draft / edit state ────────────────────────────────────────────
  const [draft, setDraft] = useState({})
  const [editSection, setEditSection] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const rank = profile?.rank || 'initiate'
  const stats = profile?.stats || {}
  const avatarConfig = profile?.avatarConfig || {}
  const unlocked = unlockedGear(rank)
  const rankColor = RANK_BADGE_COLOR[rank] || '#00C6FF'
  const communityRank = computeCommunityRank(stats.communityXp || 0)

  const merged = { ...profile, ...draft }
  const mergedAvatar = { ...(avatarConfig || {}), ...(draft.avatarConfig || {}) }

  const patch = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }, [])

  const patchAvatar = useCallback((key, value) => {
    setDraft((prev) => ({
      ...prev,
      avatarConfig: { ...(prev.avatarConfig || avatarConfig), [key]: value },
    }))
  }, [avatarConfig])

  const patchNotif = useCallback((key, value) => {
    setDraft((prev) => ({
      ...prev,
      notificationPrefs: {
        ...(profile?.notificationPrefs || {}),
        ...(prev.notificationPrefs || {}),
        [key]: value,
      },
    }))
  }, [profile])

  const handleSave = async () => {
    if (!Object.keys(draft).length) { setEditSection(null); return }
    setSaving(true)
    try {
      await updateProfile(draft)
      setDraft({})
      setEditSection(null)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const toggleAccessory = (key) => {
    const currentGear = mergedAvatar.gear || []
    const next = currentGear.includes(key)
      ? currentGear.filter((g) => g !== key)
      : [...currentGear, key]
    patchAvatar('gear', next)
  }

  const hasPendingChanges = Object.keys(draft).length > 0

  // Rank progress
  const underwrites = stats.underwrites || 0
  const currentRankIdx = RANK_THRESHOLDS.findIndex((t) => t.rank === rank)
  const nextTier = RANK_THRESHOLDS[currentRankIdx + 1] || null
  const earnedBadges = profile?.badges || []

  // Community rank progress
  const xpCurrent = (stats.communityXp || 0) - communityRank.xpRequired
  const xpNeeded = communityRank.next ? communityRank.next.xpRequired - communityRank.xpRequired : 1

  // ── Loading / not found ───────────────────────────────────────────
  const isLoading = isOwnProfile ? (!firebaseReady || !ownProfile) : loading
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#00C6FF] border-t-transparent" />
      </div>
    )
  }

  if (!profile) {
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
      className="min-h-screen overflow-y-auto pb-16"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(246,196,69,0.12) transparent' }}
    >
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* HERO BANNER                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden"
        style={{
          background: `
            radial-gradient(ellipse 70% 120% at 50% -10%, ${rankColor}20 0%, transparent 60%),
            radial-gradient(ellipse 50% 80% at 80% 100%, rgba(14,90,136,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 40% 60% at 20% 80%, rgba(127,0,255,0.04) 0%, transparent 50%),
            linear-gradient(180deg, #0B0F14 0%, #111B24 100%)
          `,
          borderBottom: `1px solid ${rankColor}15`,
        }}
      >
        {/* Grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
            opacity: 0.5,
          }}
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col items-center text-center">
            {/* Avatar with glow */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mb-5"
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${rankColor}25 0%, transparent 70%)`,
                  transform: 'scale(2.2)',
                  filter: 'blur(20px)',
                }}
              />
              <div
                className="relative flex items-end justify-center rounded-sm overflow-hidden"
                style={{
                  width: 140,
                  height: 168,
                  background: `radial-gradient(ellipse at 50% 60%, ${rankColor}0a 0%, transparent 70%), rgba(10,13,18,0.6)`,
                  border: `1px solid ${rankColor}20`,
                  boxShadow: `inset 0 -24px 48px rgba(0,0,0,0.5), 0 0 30px ${rankColor}10`,
                }}
              >
                <NinjaAvatar
                  config={mergedAvatar}
                  size={110}
                  rank={rank}
                  showAura={rank !== 'initiate'}
                />
              </div>
            </motion.div>

            {/* Identity info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="space-y-2"
            >
              {editSection === 'identity' ? (
                /* ── Identity edit mode ── */
                <div className="max-w-sm mx-auto space-y-3 text-left">
                  <div>
                    <label className={labelCls}>Display Name</label>
                    <input className={inputCls} value={merged.displayName || ''} onChange={(e) => patch('displayName', e.target.value)} placeholder="Your name" />
                  </div>
                  <div>
                    <label className={labelCls}>Username</label>
                    <input className={inputCls} value={merged.username || ''} onChange={(e) => patch('username', e.target.value)} placeholder="@handle" />
                  </div>
                  <div>
                    <label className={labelCls}>Bio</label>
                    <textarea rows={3} className={inputCls + ' resize-none'} value={merged.bio || ''} onChange={(e) => patch('bio', e.target.value)} placeholder="Tell the dojo who you are..." />
                  </div>
                  <div>
                    <label className={labelCls}>Market</label>
                    <input className={inputCls} value={merged.market || ''} onChange={(e) => patch('market', e.target.value)} placeholder="e.g. Dallas, TX" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase"
                      style={{
                        background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                        color: '#F4F7FA',
                        border: '1px solid rgba(0,198,255,0.4)',
                        boxShadow: '0 4px 16px rgba(0,198,255,0.25)',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      <Save size={14} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setDraft({}); setEditSection(null) }}
                      className="px-4 py-2 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase text-text-dim/60 hover:text-parchment transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Identity view mode ── */
                <>
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="font-display text-2xl sm:text-3xl tracking-wide text-gold">
                      {profile.displayName || 'Ninja'}
                    </h1>
                    {isOwnProfile && (
                      <button
                        onClick={() => setEditSection('identity')}
                        className="p-1.5 rounded-sm text-text-dim/40 hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40 active:scale-90"
                        title="Edit profile"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm font-heading text-text-dim/50 tracking-wide">
                    @{profile.username || targetUid?.slice(0, 8)}
                  </p>

                  {/* Rank badges */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <DealRankBadge rank={rank} size="md" />
                    <CommunityRankBadge rankName={communityRank.name} size="md" />
                  </div>

                  {profile.bio && (
                    <p className="text-sm text-text-dim/70 leading-relaxed max-w-md mx-auto pt-1 font-body">
                      {profile.bio}
                    </p>
                  )}

                  {profile.market && (
                    <p className="text-xs text-text-dim/40 font-body pt-0.5">
                      {profile.market}
                    </p>
                  )}

                  <p className="text-[10px] text-text-dim/25 pt-2 flex items-center justify-center gap-1">
                    <Calendar size={10} />
                    Member since {formatDate(profile.createdAt)}
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* CONTENT SECTIONS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ─── THE ARMORY (own profile only) ────────────────────────────── */}
        {isOwnProfile && (
          <SectionWrapper
            title="The Armory"
            subtitle="Customize your ninja"
            icon={Sword}
            delay={0.08}
            rightSlot={
              hasPendingChanges && draft.avatarConfig ? (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-heading text-xs font-semibold tracking-wider uppercase"
                  style={{
                    background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                    color: '#F4F7FA',
                    border: '1px solid rgba(0,198,255,0.4)',
                    boxShadow: '0 4px 12px rgba(0,198,255,0.2)',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  <Save size={12} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              ) : null
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8">
              {/* Avatar preview */}
              <div className="flex justify-center">
                <div
                  className="relative flex items-end justify-center rounded-sm overflow-hidden"
                  style={{
                    width: 180,
                    height: 216,
                    background: `radial-gradient(ellipse at 50% 60%, ${rankColor}0a 0%, transparent 70%), #0a0d12`,
                    border: `1px solid ${rankColor}15`,
                    boxShadow: `inset 0 -24px 48px rgba(0,0,0,0.5), 0 0 40px ${rankColor}08`,
                  }}
                >
                  <NinjaAvatar
                    config={mergedAvatar}
                    size={140}
                    rank={rank}
                    showAura={false}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-5">
                {/* Base toggle */}
                <div>
                  <span className={labelCls}>Base</span>
                  <div className="flex gap-2">
                    {['male', 'female'].map((base) => (
                      <button
                        key={base}
                        onClick={() => patchAvatar('base', base)}
                        className="flex-1 py-2 rounded-sm text-xs font-heading font-semibold tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/60 active:scale-95"
                        style={{
                          background: mergedAvatar.base === base
                            ? 'linear-gradient(135deg, rgba(0,198,255,0.15), rgba(0,198,255,0.05))'
                            : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${mergedAvatar.base === base ? 'rgba(0,198,255,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          color: mergedAvatar.base === base ? '#00C6FF' : 'rgba(200,209,218,0.6)',
                        }}
                      >
                        {base}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mask color */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={labelCls + ' mb-0'}>Mask Color</span>
                    {!unlocked.includes('mask-colors') && (
                      <span className="text-[9px] font-heading text-text-dim/40 uppercase tracking-wider flex items-center gap-1">
                        <Lock size={8} /> Scout+
                      </span>
                    )}
                  </div>
                  <ColorSwatches
                    colors={MASK_COLORS}
                    value={mergedAvatar.maskColor}
                    onChange={(hex) => patchAvatar('maskColor', hex)}
                    locked={!unlocked.includes('mask-colors')}
                  />
                </div>

                {/* Headband color */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={labelCls + ' mb-0'}>Headband Color</span>
                    {!unlocked.includes('headband-colors') && (
                      <span className="text-[9px] font-heading text-text-dim/40 uppercase tracking-wider flex items-center gap-1">
                        <Lock size={8} /> Shinobi+
                      </span>
                    )}
                  </div>
                  <ColorSwatches
                    colors={HEADBAND_COLORS}
                    value={mergedAvatar.headbandColor}
                    onChange={(hex) => patchAvatar('headbandColor', hex)}
                    locked={!unlocked.includes('headband-colors')}
                  />
                </div>

                {/* Eye color */}
                <div>
                  <span className={labelCls}>Eye Color</span>
                  <ColorSwatches
                    colors={EYE_COLORS}
                    value={mergedAvatar.eyeColor}
                    onChange={(hex) => patchAvatar('eyeColor', hex)}
                    locked={false}
                  />
                </div>

                {/* Accessories */}
                <div>
                  <span className={labelCls}>Accessories</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {ALL_ACCESSORIES.map(({ key, label, unlockKey }) => {
                      const isUnlocked = unlocked.includes(unlockKey)
                      const isActive = (mergedAvatar.gear || []).includes(key)
                      return (
                        <button
                          key={key}
                          disabled={!isUnlocked}
                          onClick={() => isUnlocked && toggleAccessory(key)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-sm text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F6C445]/40 active:scale-[0.98]"
                          style={{
                            background: isActive ? 'rgba(0,198,255,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? 'rgba(0,198,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                            opacity: isUnlocked ? 1 : 0.4,
                            cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <span className="font-heading font-semibold tracking-wide" style={{ color: isActive ? '#00C6FF' : 'rgba(200,209,218,0.7)' }}>
                            {label}
                          </span>
                          {isUnlocked ? (
                            <span
                              className="w-4 h-4 rounded-sm flex items-center justify-center"
                              style={{
                                background: isActive ? '#00C6FF' : 'rgba(255,255,255,0.08)',
                                border: `1px solid ${isActive ? '#00C6FF' : 'rgba(255,255,255,0.12)'}`,
                              }}
                            >
                              {isActive && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="#0B0F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </span>
                          ) : (
                            <Lock size={12} className="text-text-dim/40" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </SectionWrapper>
        )}

        {/* ─── THE PATH — Rank & Progression ────────────────────────────── */}
        <SectionWrapper title="The Path" subtitle="Your journey through the ranks" icon={Flame} delay={0.16}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deal Rank */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <NinjaAvatar config={mergedAvatar} size={48} rank={rank} showAura={false} />
                <div>
                  <p className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest">Deal Rank</p>
                  <DealRankBadge rank={rank} size="md" />
                  <p className="text-[10px] text-text-dim/40 mt-1 font-body">
                    {underwrites} underwrite{underwrites !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {nextTier && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest">
                      Progress to {nextTier.name}
                    </span>
                    <span className="text-[10px] font-heading text-text-dim/40">
                      {underwrites} / {nextTier.minUnderwrites}
                    </span>
                  </div>
                  <ProgressBar value={underwrites} max={nextTier.minUnderwrites} color="#00C6FF" />
                </div>
              )}

              <div className="space-y-1">
                {RANK_THRESHOLDS.map((tier) => {
                  const isCurrent = tier.rank === rank
                  return (
                    <div
                      key={tier.rank}
                      className="flex items-center justify-between px-3 py-2 rounded-sm"
                      style={{
                        background: isCurrent ? 'rgba(246,196,69,0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCurrent ? 'rgba(246,196,69,0.25)' : 'rgba(255,255,255,0.04)'}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F6C445', boxShadow: '0 0 6px #F6C44580' }} />
                        )}
                        {!isCurrent && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                        <DealRankBadge rank={tier.rank} size="sm" />
                      </div>
                      <span className="text-[9px] font-heading text-text-dim/35 uppercase tracking-wider">
                        {tier.minUnderwrites}+ writes
                        {tier.minDeals > 0 ? ` / ${tier.minDeals}+ deals` : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Community Rank */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest">Community Rank</p>
                  <p className="mt-1 font-heading text-lg font-semibold" style={{ color: communityRank.color }}>
                    {communityRank.name}
                  </p>
                </div>
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-heading font-bold"
                  style={{ backgroundColor: `${communityRank.color}15`, color: communityRank.color }}
                >
                  Lv{communityRank.level}
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest">
                    {communityRank.next ? `Progress to ${communityRank.next.name}` : 'Max Rank'}
                  </span>
                  <span className="text-[10px] font-heading text-text-dim/40">
                    {stats.communityXp || 0} / {communityRank.next ? communityRank.next.xpRequired : communityRank.xpRequired} XP
                  </span>
                </div>
                <ProgressBar
                  value={xpCurrent}
                  max={xpNeeded}
                  color={communityRank.color}
                  height="h-2"
                />
              </div>

              <div className="space-y-1">
                {COMMUNITY_RANKS.map((cr) => {
                  const isCurrent = cr.name === communityRank.name
                  return (
                    <div
                      key={cr.name}
                      className="flex items-center justify-between px-3 py-2 rounded-sm"
                      style={{
                        background: isCurrent ? `${cr.color}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isCurrent ? `${cr.color}30` : 'rgba(255,255,255,0.04)'}`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cr.color, boxShadow: `0 0 6px ${cr.color}80` }} />
                        )}
                        {!isCurrent && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                        <CommunityRankBadge rankName={cr.name} size="md" />
                      </div>
                      <span className="text-[9px] font-heading text-text-dim/35 uppercase tracking-wider">
                        Lv{cr.level} &middot; {cr.xpRequired} XP
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </SectionWrapper>

        {/* ─── MISSION LOG — Stats ──────────────────────────────────────── */}
        <SectionWrapper title="Mission Log" subtitle="Your activity stats" icon={Zap} delay={0.24}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STAT_CARDS.map(({ key, label, Icon }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 260, damping: 24 }}
                className="flex flex-col items-center justify-center px-3 py-4 rounded-sm"
                style={{
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <Icon size={16} className="text-text-dim/30 mb-2" />
                <span className="text-2xl font-heading font-bold text-parchment tabular-nums">
                  {stats[key] || 0}
                </span>
                <span className="text-[9px] font-heading text-text-dim/40 uppercase tracking-wider mt-1 text-center">
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </SectionWrapper>

        {/* ─── TROPHY WALL — Badges ─────────────────────────────────────── */}
        <SectionWrapper title="Trophy Wall" subtitle="Badges & achievements" icon={Award} delay={0.32}>
          {/* Deal Badges */}
          <div className="mb-5">
            <p className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest mb-3">Deal Badges</p>
            {earnedBadges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {earnedBadges.map((id) => (
                  <ActivityBadge key={id} id={id} size="md" />
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-dim/30 font-body italic">
                No deal badges earned yet. Submit underwrites and close deals to unlock them.
              </p>
            )}
            {/* Show locked badges */}
            {BADGE_DEFS.filter((b) => !earnedBadges.includes(b.id)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {BADGE_DEFS.filter((b) => !earnedBadges.includes(b.id)).map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm text-[11px] font-heading font-semibold tracking-wide uppercase"
                    style={{
                      color: 'rgba(200,209,218,0.25)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    title={`Locked`}
                  >
                    <Lock size={10} />
                    {b.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Community Badges */}
          <div>
            <p className="text-[10px] font-heading text-text-dim/40 uppercase tracking-widest mb-3">Community Badges</p>
            <BadgeShowcase earnedBadgeIds={profile.communityBadges || []} showAll={true} />
          </div>
        </SectionWrapper>

        {/* ─── HUNTING GROUNDS — Buy Box ────────────────────────────────── */}
        {(profile.buyBox || isOwnProfile) && (
          <SectionWrapper title="Hunting Grounds" subtitle="Target markets & buy box" icon={Target} delay={0.4}>
            {profile.buyBox ? (
              <div className="space-y-4">
                {isOwnProfile && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => navigate('/buy-boxes')}
                      className="flex items-center gap-1.5 text-[10px] font-heading tracking-wider uppercase text-[#00C6FF]/70 hover:text-[#00C6FF] transition-colors"
                    >
                      <Pencil size={11} />
                      Edit Buy Box
                    </button>
                  </div>
                )}

                {profile.buyBox.markets?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1.5">Markets</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.buyBox.markets.map((m) => (
                        <span key={m} className="px-2.5 py-1 text-xs font-body text-parchment bg-white/[0.06] border border-white/[0.08] rounded-sm">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.buyBox.minPrice || profile.buyBox.maxPrice) ? (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Price Range</p>
                    <p className="text-sm font-body text-gold">
                      ${(profile.buyBox.minPrice || 0).toLocaleString()} &ndash; ${(profile.buyBox.maxPrice || 0).toLocaleString()}
                    </p>
                  </div>
                ) : null}

                {profile.buyBox.propertyTypes?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1.5">Property Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.buyBox.propertyTypes.map((t) => (
                        <span key={t} className="px-2.5 py-1 text-xs font-body text-[#00C6FF] bg-[#00C6FF]/[0.08] border border-[#00C6FF]/[0.15] rounded-sm">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.buyBox.dealTypes?.length > 0 && (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1.5">Deal Types</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.buyBox.dealTypes.map((d) => (
                        <span key={d} className="px-2.5 py-1 text-xs font-body text-gold bg-[#F6C445]/[0.08] border border-[#F6C445]/[0.15] rounded-sm">
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.buyBox.closeTimeline && (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Close Timeline</p>
                    <p className="text-xs font-body text-text-dim">{profile.buyBox.closeTimeline}</p>
                  </div>
                )}

                {profile.buyBox.notes && (
                  <div>
                    <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Notes</p>
                    <p className="text-xs font-body text-text-dim leading-relaxed">{profile.buyBox.notes}</p>
                  </div>
                )}

                {profile.buyBox.updatedAt && (
                  <p className="text-[9px] text-text-dim/25 pt-1">Last updated {formatDate(profile.buyBox.updatedAt)}</p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-text-dim/40 font-body">No buy box submitted yet</p>
                {isOwnProfile && (
                  <button
                    onClick={() => navigate('/buy-boxes')}
                    className="mt-3 text-xs font-heading tracking-wider uppercase text-[#00C6FF] hover:text-[#00C6FF]/80 transition-colors"
                  >
                    Set Up Your Buy Box
                  </button>
                )}
              </div>
            )}
          </SectionWrapper>
        )}

        {/* ─── INTEL FILE — Contact & Settings (own profile only) ────────── */}
        {isOwnProfile && (
          <SectionWrapper title="Intel File" subtitle="Contact, notifications & support" icon={Shield} delay={0.48}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Contact & Notifications */}
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    className={inputCls + ' opacity-50 cursor-not-allowed'}
                    value={merged.email || user?.email || ''}
                    readOnly
                  />
                  <p className="mt-1 text-[10px] text-text-dim/30 font-body">Email cannot be changed here.</p>
                </div>

                <div>
                  <label className={labelCls}>Phone</label>
                  <input
                    className={inputCls}
                    value={merged.phone || ''}
                    onChange={(e) => patch('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <span className={labelCls}>Notifications</span>
                  <div className="space-y-3 mt-2">
                    {[
                      { key: 'communityReplies', label: 'Community Replies' },
                      { key: 'dealUpdates', label: 'Deal Updates' },
                      { key: 'taskAssignments', label: 'Task Assignments' },
                    ].map(({ key, label }) => {
                      const notifPrefs = {
                        ...(profile?.notificationPrefs || {}),
                        ...(draft.notificationPrefs || {}),
                      }
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-body text-text-dim/80">{label}</span>
                          <Toggle
                            id={`notif-${key}`}
                            checked={notifPrefs[key] ?? true}
                            onChange={(val) => patchNotif(key, val)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Account info */}
                <div className="pt-2">
                  <span className={labelCls}>Role</span>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-heading font-semibold tracking-wider uppercase"
                      style={{
                        color: (profile?.role || 'member') === 'admin' ? '#F6C445' : '#00C6FF',
                        background: (profile?.role || 'member') === 'admin' ? 'rgba(246,196,69,0.1)' : 'rgba(0,198,255,0.08)',
                        border: `1px solid ${(profile?.role || 'member') === 'admin' ? 'rgba(246,196,69,0.3)' : 'rgba(0,198,255,0.2)'}`,
                      }}
                    >
                      {profile?.role || 'member'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className={labelCls}>Member Since</span>
                  <p className="text-sm text-parchment/80 font-body">{formatDateLong(profile?.createdAt)}</p>
                </div>

                {/* Save button for contact changes */}
                {(draft.phone !== undefined || draft.notificationPrefs) && (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase"
                    style={{
                      background: saved ? 'rgba(0,198,255,0.08)' : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                      color: saved ? '#00C6FF' : '#F4F7FA',
                      border: `1px solid ${saved ? 'rgba(0,198,255,0.3)' : 'rgba(0,198,255,0.4)'}`,
                      boxShadow: saved ? 'none' : '0 4px 16px rgba(0,198,255,0.25)',
                      opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}</>}
                  </button>
                )}
              </div>

              {/* FAQ & Support */}
              <div>
                <span className={labelCls}>FAQ</span>
                <div className="mt-1 mb-5">
                  {FAQ.map((item, i) => (
                    <FaqItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>

                <a
                  href="mailto:support@dispodojo.com"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/50"
                  style={{
                    background: 'rgba(246,196,69,0.08)',
                    border: '1px solid rgba(246,196,69,0.2)',
                    color: '#F6C445',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(246,196,69,0.14)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(246,196,69,0.08)' }}
                >
                  <Mail size={14} />
                  Contact Support
                </a>

                {/* Quick Links */}
                <div className="mt-5">
                  <span className={labelCls}>Quick Links</span>
                  <div className="space-y-1 mt-2">
                    {[
                      { label: 'Bird Dog', path: '/bird-dog' },
                      { label: 'Boots on Ground', path: '/boots-on-ground' },
                      { label: 'Find Buyers', path: '/find-buyers' },
                    ].map(({ label, path }) => (
                      <Link
                        key={path}
                        to={path}
                        className="flex items-center justify-between px-3 py-2.5 rounded-sm group transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F6C445]/40"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0,198,255,0.06)'
                          e.currentTarget.style.borderColor = 'rgba(0,198,255,0.18)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                        }}
                      >
                        <span className="text-sm font-heading text-text-dim/80 group-hover:text-parchment transition-colors">
                          {label}
                        </span>
                        <ChevronRight size={14} className="text-text-dim/40 group-hover:text-[#00C6FF] transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionWrapper>
        )}
      </div>
    </div>
  )
}
