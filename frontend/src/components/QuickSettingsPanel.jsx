import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, User, Sword, Phone, Shield, Trophy, HelpCircle,
  Save, ChevronRight, Lock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NinjaAvatar from './NinjaAvatar'
import RankBadge from './RankBadge'
import ActivityBadge from './ActivityBadge'
import { RANK_THRESHOLDS, unlockedGear } from '../lib/userProfile'

// ---------------------------------------------------------------------------
// Style constants
// ---------------------------------------------------------------------------
const inputCls =
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors'
const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------
const FAQ = [
  {
    q: 'How do I submit a deal?',
    a: 'Go to Find Buyers from the sidebar and use the JV Deal Wizard.',
  },
  {
    q: 'How do I level up my ninja?',
    a: 'Submit underwrites, generate LOIs, and stay active in the community.',
  },
  {
    q: 'What is a Bird Dog?',
    a: 'Someone who finds motivated sellers and brings them to the team for a fee.',
  },
  {
    q: 'How do I become Boots on the Ground?',
    a: 'Sign up on the Boots on Ground page and set your service area.',
  },
  {
    q: 'How are payouts handled?',
    a: 'Payouts are processed by the admin team after a deal closes. Contact support for details.',
  },
]

// ---------------------------------------------------------------------------
// Mask / headband / eye color palettes
// ---------------------------------------------------------------------------
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

// All possible accessories (ordered by unlock tier)
const ALL_ACCESSORIES = [
  { key: 'smoke-wisps',  label: 'Smoke Wisps',  unlockKey: 'smoke-wisps'  },
  { key: 'katana',       label: 'Katana',        unlockKey: 'katana'       },
  { key: 'glow-eyes',   label: 'Glow Eyes',     unlockKey: 'glow-eyes'    },
  { key: 'black-gi',    label: 'Black Gi',      unlockKey: 'black-gi'     },
  { key: 'golden-trim', label: 'Golden Trim',   unlockKey: 'golden-trim'  },
  { key: 'full-aura',   label: 'Full Aura',     unlockKey: 'full-aura'    },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Colour swatch strip */
function ColorSwatches({ colors, value, onChange, locked }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {colors.map(({ hex, label }) => (
        <button
          key={hex}
          title={label}
          disabled={locked}
          onClick={() => !locked && onChange(hex)}
          className="relative w-7 h-7 rounded-sm border-2 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/60 active:scale-90"
          style={{
            backgroundColor: hex,
            borderColor: value === hex ? '#F6C445' : 'rgba(255,255,255,0.12)',
            boxShadow: value === hex ? `0 0 8px ${hex}60` : 'none',
            opacity: locked ? 0.35 : 1,
            cursor: locked ? 'not-allowed' : 'pointer',
            transform: value === hex ? 'scale(1.15)' : 'scale(1)',
          }}
        >
          {locked && (
            <Lock
              size={10}
              className="absolute inset-0 m-auto text-white/70"
            />
          )}
        </button>
      ))}
    </div>
  )
}

/** Toggle switch */
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
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
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

/** Single FAQ accordion item */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border-b border-[rgba(246,196,69,0.08)] last:border-0"
    >
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
            <p className="pb-3 text-sm text-text-dim/70 leading-relaxed font-body">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Progress bar */
function ProgressBar({ value, max, color = '#00C6FF' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <div
        className="h-full rounded-full transition-[width]"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'identity', label: 'Identity', Icon: User },
  { id: 'ninja',    label: 'Ninja',    Icon: Sword },
  { id: 'contact',  label: 'Contact',  Icon: Phone },
  { id: 'account',  label: 'Account',  Icon: Shield },
  { id: 'rank',     label: 'Rank',     Icon: Trophy },
  { id: 'support',  label: 'Support',  Icon: HelpCircle },
]

const SAVE_TABS = new Set(['identity', 'ninja', 'contact'])

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuickSettingsPanel({ isOpen, onClose }) {
  const { user, profile, updateProfile } = useAuth()

  const rank = profile?.rank || 'initiate'
  const stats = profile?.stats || {}
  const avatarConfig = profile?.avatarConfig || {}
  const unlocked = unlockedGear(rank)

  // Active tab
  const [activeTab, setActiveTab] = useState('identity')
  const [saving, setSaving] = useState(false)

  // Accumulated local edits — only flushed on Save
  const [draft, setDraft] = useState({})

  // Merge: profile → draft overlay
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
    if (!Object.keys(draft).length) return
    setSaving(true)
    try {
      await updateProfile(draft)
      setDraft({})
    } finally {
      setSaving(false)
    }
  }

  // Accessories toggle
  const toggleAccessory = (key) => {
    const currentGear = mergedAvatar.gear || []
    const next = currentGear.includes(key)
      ? currentGear.filter((g) => g !== key)
      : [...currentGear, key]
    patchAvatar('gear', next)
  }

  // Rank progress info
  const underwrites = stats.underwrites || 0
  const currentRankIdx = RANK_THRESHOLDS.findIndex((t) => t.rank === rank)
  const nextTier = RANK_THRESHOLDS[currentRankIdx + 1] || null
  const earnedBadges = profile?.badges || []

  // --------------------------------------------------------------------------
  // Tab renderers
  // --------------------------------------------------------------------------

  const renderIdentity = () => (
    <div className="space-y-4">
      <div>
        <label className={labelCls} htmlFor="qs-displayName">Display Name</label>
        <input
          id="qs-displayName"
          className={inputCls}
          value={merged.displayName || ''}
          onChange={(e) => patch('displayName', e.target.value)}
          placeholder="Your name"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="qs-username">Username</label>
        <input
          id="qs-username"
          className={inputCls}
          value={merged.username || ''}
          onChange={(e) => patch('username', e.target.value)}
          placeholder="@handle"
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="qs-bio">Bio</label>
        <textarea
          id="qs-bio"
          rows={3}
          className={inputCls + ' resize-none'}
          value={merged.bio || ''}
          onChange={(e) => patch('bio', e.target.value)}
          placeholder="Tell the dojo who you are..."
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="qs-market">Market</label>
        <input
          id="qs-market"
          className={inputCls}
          value={merged.market || ''}
          onChange={(e) => patch('market', e.target.value)}
          placeholder="e.g. Dallas, TX"
        />
      </div>
    </div>
  )

  const renderNinja = () => {
    const canMaskColors    = unlocked.includes('mask-colors')
    const canHeadbandColors = unlocked.includes('headband-colors')

    return (
      <div className="space-y-5">
        {/* Avatar preview */}
        <div className="flex justify-center">
          <div
            className="relative flex items-end justify-center rounded-sm overflow-hidden"
            style={{
              width: 128,
              height: 152,
              background: 'radial-gradient(ellipse at 50% 60%, rgba(0,198,255,0.06) 0%, rgba(0,0,0,0) 70%), #0a0d12',
              border: '1px solid rgba(246,196,69,0.1)',
              boxShadow: 'inset 0 -20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <NinjaAvatar
              config={mergedAvatar}
              size={96}
              rank={rank}
              showAura={false}
            />
          </div>
        </div>

        {/* Base toggle */}
        <div>
          <span className={labelCls}>Base</span>
          <div className="flex gap-2">
            {['male', 'female'].map((base) => (
              <button
                key={base}
                onClick={() => patchAvatar('base', base)}
                className="flex-1 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/60 active:scale-95"
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
          <div className="flex items-center gap-2 mb-1.5">
            <span className={labelCls + ' mb-0'}>Mask Color</span>
            {!canMaskColors && (
              <span className="text-[9px] font-heading text-text-dim/40 uppercase tracking-wider flex items-center gap-1">
                <Lock size={8} /> Scout+
              </span>
            )}
          </div>
          <ColorSwatches
            colors={MASK_COLORS}
            value={mergedAvatar.maskColor}
            onChange={(hex) => patchAvatar('maskColor', hex)}
            locked={!canMaskColors}
          />
        </div>

        {/* Headband color */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={labelCls + ' mb-0'}>Headband Color</span>
            {!canHeadbandColors && (
              <span className="text-[9px] font-heading text-text-dim/40 uppercase tracking-wider flex items-center gap-1">
                <Lock size={8} /> Shinobi+
              </span>
            )}
          </div>
          <ColorSwatches
            colors={HEADBAND_COLORS}
            value={mergedAvatar.headbandColor}
            onChange={(hex) => patchAvatar('headbandColor', hex)}
            locked={!canHeadbandColors}
          />
        </div>

        {/* Eye color — always available */}
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
          <div className="space-y-1">
            {ALL_ACCESSORIES.map(({ key, label, unlockKey }) => {
              const isUnlocked = unlocked.includes(unlockKey)
              const isActive   = (mergedAvatar.gear || []).includes(key)
              return (
                <button
                  key={key}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && toggleAccessory(key)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-sm text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F6C445]/40 active:scale-[0.98]"
                  style={{
                    background: isActive
                      ? 'rgba(0,198,255,0.08)'
                      : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(0,198,255,0.25)' : 'rgba(255,255,255,0.06)'}`,
                    opacity: isUnlocked ? 1 : 0.4,
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span
                    className="font-heading font-semibold tracking-wide"
                    style={{ color: isActive ? '#00C6FF' : 'rgba(200,209,218,0.7)' }}
                  >
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
    )
  }

  const renderContact = () => {
    const notifPrefs = {
      ...(profile?.notificationPrefs || {}),
      ...(draft.notificationPrefs || {}),
    }
    return (
      <div className="space-y-5">
        <div>
          <label className={labelCls} htmlFor="qs-email">Email</label>
          <input
            id="qs-email"
            className={inputCls + ' opacity-50 cursor-not-allowed'}
            value={merged.email || user?.email || ''}
            readOnly
          />
          <p className="mt-1 text-[10px] text-text-dim/40 font-body">Email cannot be changed here.</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="qs-phone">Phone</label>
          <input
            id="qs-phone"
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
              { key: 'dealUpdates',      label: 'Deal Updates' },
              { key: 'taskAssignments',  label: 'Task Assignments' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-body text-text-dim/80">{label}</span>
                <Toggle
                  id={`notif-${key}`}
                  checked={notifPrefs[key] ?? true}
                  onChange={(val) => patchNotif(key, val)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAccount = () => {
    const role = profile?.role || 'member'
    const createdAt = profile?.createdAt
      ? new Date(profile.createdAt).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        })
      : 'Unknown'

    const quickLinks = [
      { label: 'Bird Dog',        path: '/bird-dog' },
      { label: 'Boots on Ground', path: '/boots-on-ground' },
      { label: 'Find Buyers',     path: '/find-buyers' },
    ]

    return (
      <div className="space-y-5">
        {/* Role chip */}
        <div>
          <span className={labelCls}>Role</span>
          <div className="mt-1">
            <span
              className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-heading font-semibold tracking-wider uppercase"
              style={{
                color: role === 'admin' ? '#F6C445' : '#00C6FF',
                background: role === 'admin' ? 'rgba(246,196,69,0.1)' : 'rgba(0,198,255,0.08)',
                border: `1px solid ${role === 'admin' ? 'rgba(246,196,69,0.3)' : 'rgba(0,198,255,0.2)'}`,
              }}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Member since */}
        <div>
          <span className={labelCls}>Member Since</span>
          <p className="text-sm text-parchment/80 font-body">{createdAt}</p>
        </div>

        {/* Quick links */}
        <div>
          <span className={labelCls}>Quick Links</span>
          <div className="space-y-1 mt-1">
            {quickLinks.map(({ label, path }) => (
              <a
                key={path}
                href={path}
                onClick={onClose}
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
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderRank = () => {
    const currentTier = RANK_THRESHOLDS.find((t) => t.rank === rank) || RANK_THRESHOLDS[0]
    const nextUnderwriteTarget = nextTier ? nextTier.minUnderwrites : currentTier.minUnderwrites

    return (
      <div className="space-y-5">
        {/* Current rank card */}
        <div
          className="flex items-center gap-4 p-4 rounded-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(246,196,69,0.06) 0%, rgba(0,198,255,0.04) 100%)',
            border: '1px solid rgba(246,196,69,0.15)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}
        >
          <NinjaAvatar config={mergedAvatar} size={56} rank={rank} showAura={false} />
          <div className="min-w-0">
            <p className="text-xs font-heading text-text-dim/50 uppercase tracking-widest mb-1">Current Rank</p>
            <RankBadge rank={rank} size="md" />
            <p className="text-xs text-text-dim/50 mt-1.5 font-body">
              {underwrites} underwrite{underwrites !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        {nextTier && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={labelCls + ' mb-0'}>Progress to {nextTier.name}</span>
              <span className="text-[10px] font-heading text-text-dim/50">
                {underwrites} / {nextUnderwriteTarget}
              </span>
            </div>
            <ProgressBar
              value={underwrites}
              max={nextUnderwriteTarget}
              color="#00C6FF"
            />
          </div>
        )}

        {/* All tiers */}
        <div>
          <span className={labelCls}>All Tiers</span>
          <div className="space-y-1 mt-1">
            {RANK_THRESHOLDS.map((tier) => {
              const isCurrent = tier.rank === rank
              return (
                <div
                  key={tier.rank}
                  className="flex items-center justify-between px-3 py-2 rounded-sm"
                  style={{
                    background: isCurrent
                      ? 'rgba(246,196,69,0.08)'
                      : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isCurrent ? 'rgba(246,196,69,0.25)' : 'rgba(255,255,255,0.05)'}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#F6C445', boxShadow: '0 0 6px #F6C44580' }}
                      />
                    )}
                    {!isCurrent && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                    <RankBadge rank={tier.rank} size="sm" />
                  </div>
                  <span className="text-[10px] font-heading text-text-dim/40 uppercase tracking-wider">
                    {tier.minUnderwrites}+ writes
                    {tier.minDeals > 0 ? ` / ${tier.minDeals}+ deals` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div>
            <span className={labelCls}>Earned Badges</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {earnedBadges.map((id) => (
                <ActivityBadge key={id} id={id} size="md" />
              ))}
            </div>
          </div>
        )}
        {earnedBadges.length === 0 && (
          <p className="text-xs text-text-dim/40 font-body italic">
            No badges earned yet. Stay active to unlock them.
          </p>
        )}
      </div>
    )
  }

  const renderSupport = () => (
    <div className="space-y-0">
      <div className="mb-4">
        <span className={labelCls}>FAQ</span>
      </div>
      {FAQ.map((item, i) => (
        <FaqItem key={i} q={item.q} a={item.a} />
      ))}
      <div className="pt-5">
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
          Contact Support
        </a>
      </div>
    </div>
  )

  const TAB_RENDERERS = {
    identity: renderIdentity,
    ninja:    renderNinja,
    contact:  renderContact,
    account:  renderAccount,
    rank:     renderRank,
    support:  renderSupport,
  }

  const hasPendingChanges = Object.keys(draft).length > 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="qs-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)' }}
          />

          {/* Panel */}
          <motion.div
            key="qs-panel"
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32, mass: 0.9 }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
            style={{
              width: 380,
              background: 'linear-gradient(180deg, #111B24 0%, #0D1520 100%)',
              borderLeft: '1px solid rgba(246,196,69,0.12)',
              boxShadow: '-8px 0 48px rgba(0,0,0,0.7), -2px 0 12px rgba(0,198,255,0.04)',
            }}
          >
            {/* Top grain texture overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                opacity: 0.5,
              }}
            />

            {/* Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 flex-shrink-0 relative"
              style={{
                borderBottom: '1px solid rgba(246,196,69,0.1)',
                background: 'rgba(0,0,0,0.25)',
              }}
            >
              <NinjaAvatar
                config={mergedAvatar}
                size={36}
                rank={rank}
                showAura={false}
              />
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-parchment truncate leading-tight">
                  {merged.displayName || user?.name || 'Ninja'}
                </p>
                <div className="mt-0.5">
                  <RankBadge rank={rank} size="sm" />
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-sm flex items-center justify-center text-text-dim/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40 active:scale-90"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#F4F7FA' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '' }}
                aria-label="Close settings"
              >
                <X size={15} />
              </button>
            </div>

            {/* Tab bar */}
            <div
              className="flex flex-shrink-0 overflow-x-auto"
              style={{
                borderBottom: '1px solid rgba(246,196,69,0.08)',
                background: 'rgba(0,0,0,0.15)',
                scrollbarWidth: 'none',
              }}
            >
              {TABS.map(({ id, label, Icon }) => {
                const isActive = activeTab === id
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className="flex flex-col items-center gap-1 px-3 py-2.5 flex-shrink-0 relative transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#F6C445]/40"
                    style={{
                      color: isActive ? '#00C6FF' : 'rgba(200,209,218,0.45)',
                      background: isActive ? 'rgba(0,198,255,0.06)' : 'transparent',
                      minWidth: 60,
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(200,209,218,0.75)' }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'rgba(200,209,218,0.45)' }}
                  >
                    <Icon size={14} />
                    <span className="text-[9px] font-heading font-semibold tracking-widest uppercase">
                      {label}
                    </span>
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                        style={{
                          background: 'linear-gradient(90deg, transparent, #00C6FF, transparent)',
                          boxShadow: '0 0 6px rgba(0,198,255,0.5)',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto px-4 py-5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(246,196,69,0.15) transparent' }}
            >
              {TAB_RENDERERS[activeTab]?.()}
            </div>

            {/* Footer — Save button on identity/ninja/contact tabs */}
            {SAVE_TABS.has(activeTab) && (
              <div
                className="flex-shrink-0 px-4 py-3"
                style={{
                  borderTop: '1px solid rgba(246,196,69,0.08)',
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={saving || !hasPendingChanges}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/50 active:scale-[0.98]"
                  style={{
                    background: hasPendingChanges
                      ? 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)'
                      : 'rgba(255,255,255,0.05)',
                    color: hasPendingChanges ? '#F4F7FA' : 'rgba(200,209,218,0.3)',
                    border: `1px solid ${hasPendingChanges ? 'rgba(0,198,255,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    boxShadow: hasPendingChanges ? '0 4px 16px rgba(0,198,255,0.25)' : 'none',
                    opacity: saving ? 0.7 : 1,
                    cursor: hasPendingChanges && !saving ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
