import { useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MessageSquare, Heart, Award, Calendar,
  X, Plus, Save, CheckCircle, Binoculars, TrendingUp, Target, Pencil,
  Navigation2, Briefcase,
} from 'lucide-react'
import useUserProfile from '../hooks/useUserProfile'
import { useAuth } from '../context/AuthContext'
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

const inputCls =
  'w-full bg-black/40 border border-[rgba(246,196,69,0.15)] rounded-sm px-3 py-2 text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none focus:border-[rgba(246,196,69,0.4)] transition-colors duration-150'
const labelCls =
  'block text-[10px] font-heading font-semibold tracking-widest uppercase text-text-dim/50 mb-1'

// ---------------------------------------------------------------------------
// Bird Dog methods & deal types constants
// ---------------------------------------------------------------------------
const BIRD_DOG_METHODS = [
  'Driving for Dollars',
  'Door Knocking',
  'Cold Calling',
  'Texting / SMS',
  'Skip Tracing',
  'Bandit Signs',
  'Networking',
  'Online Research',
]

const INVESTOR_DEAL_TYPES = [
  'Wholesale',
  'Fix & Flip',
  'Buy & Hold',
  'Creative Finance',
  'Subject To',
  'Seller Finance',
  'Lease Option',
  'Land',
]

// ---------------------------------------------------------------------------
// Boots on Ground constants
// ---------------------------------------------------------------------------
const BOOTS_TASK_TYPES = [
  { id: 'photos', label: 'Property Photos' },
  { id: 'walkthrough', label: 'Video Walkthroughs' },
  { id: 'lockbox', label: 'Lockbox Access' },
  { id: 'sign', label: 'Sign Placement' },
  { id: 'occupant', label: 'Occupant Check' },
  { id: 'hoa', label: 'HOA Docs' },
  { id: 'other', label: 'Other' },
]

const BOOTS_DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
]

// ---------------------------------------------------------------------------
// Tag Input sub-component
// ---------------------------------------------------------------------------
function TagInput({ tags, onChange, placeholder, maxTags = 10, accentColor = '#00C6FF' }) {
  const [inputValue, setInputValue] = useState('')

  const addTag = () => {
    const trimmed = inputValue.trim()
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return
    onChange([...tags, trimmed])
    setInputValue('')
  }

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-heading font-semibold tracking-wide"
            style={{
              background: `${accentColor}14`,
              border: `1px solid ${accentColor}33`,
              color: accentColor,
            }}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 hover:text-[#E53935] transition-colors duration-150 focus-visible:outline-none active:scale-90"
              aria-label={`Remove ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="flex items-center justify-center px-3 rounded-sm transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 active:scale-95"
          style={{
            background: inputValue.trim()
              ? `${accentColor}1F`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${inputValue.trim() ? `${accentColor}4D` : 'rgba(255,255,255,0.08)'}`,
            color: inputValue.trim() ? accentColor : 'rgba(200,209,218,0.3)',
            cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toggle Pill sub-component
// ---------------------------------------------------------------------------
function TogglePills({ options, selected, onChange }) {
  const toggle = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = selected.includes(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className="px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 active:scale-95"
            style={{
              background: isActive
                ? 'rgba(0,198,255,0.12)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? 'rgba(0,198,255,0.35)' : 'rgba(255,255,255,0.08)'}`,
              color: isActive ? '#00C6FF' : 'rgba(200,209,218,0.5)',
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Checkbox sub-component
// ---------------------------------------------------------------------------
function Checkbox({ checked, onChange, label, id }) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2.5 cursor-pointer group"
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40"
        style={{
          background: checked ? '#00C6FF' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${checked ? '#00C6FF' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="#0B0F14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span className="text-sm font-body text-text-dim/80 group-hover:text-parchment transition-colors duration-150">
        {label}
      </span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// BirdDogProfileEditor sub-component
// ---------------------------------------------------------------------------
function BirdDogProfileEditor({ birdDogProfile, onSave }) {
  const [draft, setDraft] = useState(() => ({
    role: birdDogProfile.role || 'bird_dog',
    serviceArea: birdDogProfile.serviceArea || [],
    methods: birdDogProfile.methods || [],
    markets: birdDogProfile.markets || [],
    dealTypes: birdDogProfile.dealTypes || [],
    bio: birdDogProfile.bio || '',
    availability: birdDogProfile.availability || 'available',
    contactPrefs: {
      showPhone: birdDogProfile.contactPrefs?.showPhone ?? false,
      showEmail: birdDogProfile.contactPrefs?.showEmail ?? false,
      dmsOnly: birdDogProfile.contactPrefs?.dmsOnly ?? true,
    },
  }))

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const patch = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const patchContactPref = useCallback((key, value) => {
    setDraft((prev) => ({
      ...prev,
      contactPrefs: { ...prev.contactPrefs, [key]: value },
    }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...draft,
        createdAt: birdDogProfile.createdAt || new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const isBirdDog = draft.role === 'bird_dog'
  const roleBadgeColor = isBirdDog ? '#00C6FF' : '#F6C445'
  const roleBadgeBg = isBirdDog ? 'rgba(0,198,255,0.1)' : 'rgba(246,196,69,0.1)'
  const roleBadgeBorder = isBirdDog ? 'rgba(0,198,255,0.3)' : 'rgba(246,196,69,0.3)'
  const roleLabel = isBirdDog ? 'Bird Dog' : 'Investor'
  const RoleIcon = isBirdDog ? Binoculars : TrendingUp

  return (
    <div className="space-y-5">
      {/* Role badge */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wider uppercase"
          style={{
            color: roleBadgeColor,
            background: roleBadgeBg,
            border: `1px solid ${roleBadgeBorder}`,
          }}
        >
          <RoleIcon size={12} />
          {roleLabel}
        </span>
      </div>

      {/* Bird Dog fields */}
      {isBirdDog && (
        <>
          {/* Service Area */}
          <div>
            <label className={labelCls}>Service Area</label>
            <TagInput
              tags={draft.serviceArea}
              onChange={(v) => patch('serviceArea', v)}
              placeholder="e.g. Dallas, TX"
            />
          </div>

          {/* Methods */}
          <div>
            <label className={labelCls}>Methods</label>
            <TogglePills
              options={BIRD_DOG_METHODS}
              selected={draft.methods}
              onChange={(v) => patch('methods', v)}
            />
          </div>
        </>
      )}

      {/* Investor fields */}
      {!isBirdDog && (
        <>
          {/* Markets */}
          <div>
            <label className={labelCls}>Markets</label>
            <TagInput
              tags={draft.markets}
              onChange={(v) => patch('markets', v)}
              placeholder="e.g. Houston, TX"
            />
          </div>

          {/* Deal Types */}
          <div>
            <label className={labelCls}>Deal Types</label>
            <TogglePills
              options={INVESTOR_DEAL_TYPES}
              selected={draft.dealTypes}
              onChange={(v) => patch('dealTypes', v)}
            />
          </div>
        </>
      )}

      {/* Bio / Pitch */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls + ' mb-0'}>
            {isBirdDog ? 'Bio / Pitch' : 'Bio'}
          </label>
          <span
            className="text-[10px] font-heading"
            style={{
              color: draft.bio.length > 260 ? '#E53935' : 'rgba(200,209,218,0.3)',
            }}
          >
            {draft.bio.length}/280
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={280}
          className={inputCls + ' resize-none'}
          value={draft.bio}
          onChange={(e) => patch('bio', e.target.value)}
          placeholder={
            isBirdDog
              ? 'Tell investors why they should work with you...'
              : 'Describe what deals you are looking for...'
          }
        />
      </div>

      {/* Availability (bird dog only) */}
      {isBirdDog && (
        <div>
          <label className={labelCls}>Availability</label>
          <div className="flex gap-2">
            {[
              { value: 'available', label: 'Available Now' },
              { value: 'unavailable', label: 'Not Available' },
            ].map(({ value, label }) => {
              const isActive = draft.availability === value
              const activeColor = value === 'available' ? '#00C6FF' : '#E53935'
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => patch('availability', value)}
                  className="flex-1 py-2 rounded-sm text-xs font-heading font-semibold tracking-widest uppercase transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C445]/40 active:scale-95"
                  style={{
                    background: isActive
                      ? `${activeColor}15`
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isActive ? `${activeColor}40` : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? activeColor : 'rgba(200,209,218,0.5)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Contact Preferences */}
      <div>
        <label className={labelCls}>Contact Preferences</label>
        <div className="space-y-3 mt-2">
          <Checkbox
            id="bd-showPhone"
            checked={draft.contactPrefs.showPhone}
            onChange={(v) => patchContactPref('showPhone', v)}
            label="Show Phone Number"
          />
          <Checkbox
            id="bd-showEmail"
            checked={draft.contactPrefs.showEmail}
            onChange={(v) => patchContactPref('showEmail', v)}
            label="Show Email Address"
          />
          <Checkbox
            id="bd-dmsOnly"
            checked={draft.contactPrefs.dmsOnly}
            onChange={(v) => patchContactPref('dmsOnly', v)}
            label="DMs Only"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/50 active:scale-[0.98]"
        style={{
          background: saved
            ? 'rgba(0,198,255,0.08)'
            : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
          color: saved ? '#00C6FF' : '#F4F7FA',
          border: `1px solid ${saved ? 'rgba(0,198,255,0.3)' : 'rgba(0,198,255,0.4)'}`,
          boxShadow: saved ? 'none' : '0 4px 16px rgba(0,198,255,0.25)',
          opacity: saving ? 0.7 : 1,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? (
          <>
            <CheckCircle size={14} />
            Saved
          </>
        ) : (
          <>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Boots Toggle Pills (accepts {id, label} objects)
// ---------------------------------------------------------------------------
function BootsTogglePills({ options, selected, onChange, accentColor = '#00C6FF' }) {
  const toggle = (optionId) => {
    if (selected.includes(optionId)) {
      onChange(selected.filter((s) => s !== optionId))
    } else {
      onChange([...selected, optionId])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(({ id, label }) => {
        const isActive = selected.includes(id)
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wide transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 active:scale-95"
            style={{
              background: isActive ? `${accentColor}20` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? `${accentColor}55` : 'rgba(255,255,255,0.08)'}`,
              color: isActive ? accentColor : 'rgba(200,209,218,0.5)',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Boots Day Toggles
// ---------------------------------------------------------------------------
function BootsDayToggles({ selected, onChange, accentColor = '#00C6FF' }) {
  const toggle = (dayId) => {
    onChange({ ...selected, [dayId]: !selected[dayId] })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BOOTS_DAYS.map(({ id, label }) => {
        const isActive = selected[id]
        return (
          <button
            key={id}
            type="button"
            onClick={() => toggle(id)}
            className="px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wider transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 active:scale-95"
            style={{
              background: isActive ? `${accentColor}20` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isActive ? `${accentColor}55` : 'rgba(255,255,255,0.08)'}`,
              color: isActive ? accentColor : 'rgba(200,209,218,0.5)',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BootsProfileEditor sub-component
// ---------------------------------------------------------------------------
function BootsProfileEditor({ bootsProfile, onSave }) {
  const [draft, setDraft] = useState(() => ({
    role: bootsProfile.role || 'operator',
    serviceArea: bootsProfile.serviceArea || [],
    taskTypes: bootsProfile.taskTypes || [],
    customTaskType: bootsProfile.customTaskType || '',
    markets: bootsProfile.markets || [],
    availability: bootsProfile.availability || {
      mon: false, tue: false, wed: false, thu: false,
      fri: false, sat: false, sun: false,
    },
    bio: bootsProfile.bio || '',
    contactPrefs: {
      showPhone: bootsProfile.contactPrefs?.showPhone ?? false,
      showEmail: bootsProfile.contactPrefs?.showEmail ?? false,
      dmsOnly: bootsProfile.contactPrefs?.dmsOnly ?? true,
    },
  }))

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const patch = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const patchContactPref = useCallback((key, value) => {
    setDraft((prev) => ({
      ...prev,
      contactPrefs: { ...prev.contactPrefs, [key]: value },
    }))
    setSaved(false)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...draft,
        customTaskType: draft.taskTypes.includes('other') ? draft.customTaskType : '',
        createdAt: bootsProfile.createdAt || new Date().toISOString(),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const isOperator = draft.role === 'operator'
  const roleBadgeColor = isOperator ? '#00C6FF' : '#F6C445'
  const roleBadgeBg = isOperator ? 'rgba(0,198,255,0.1)' : 'rgba(246,196,69,0.1)'
  const roleBadgeBorder = isOperator ? 'rgba(0,198,255,0.3)' : 'rgba(246,196,69,0.3)'
  const roleLabel = isOperator ? 'Boots Operator' : 'Investor'
  const RoleIcon = isOperator ? Navigation2 : Briefcase
  const accentColor = isOperator ? '#00C6FF' : '#F6C445'

  return (
    <div className="space-y-5">
      {/* Role badge */}
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-heading font-semibold tracking-wider uppercase"
          style={{
            color: roleBadgeColor,
            background: roleBadgeBg,
            border: `1px solid ${roleBadgeBorder}`,
          }}
        >
          <RoleIcon size={12} />
          {roleLabel}
        </span>
      </div>

      {/* Operator fields */}
      {isOperator && (
        <>
          {/* Service Area */}
          <div>
            <label className={labelCls}>Service Area</label>
            <TagInput
              tags={draft.serviceArea}
              onChange={(v) => patch('serviceArea', v)}
              placeholder="e.g. Dallas, TX"
            />
          </div>

          {/* Task Types */}
          <div>
            <label className={labelCls}>Task Types</label>
            <BootsTogglePills
              options={BOOTS_TASK_TYPES}
              selected={draft.taskTypes}
              onChange={(v) => patch('taskTypes', v)}
              accentColor={accentColor}
            />
            {draft.taskTypes.includes('other') && (
              <div className="mt-2.5">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Describe your custom service..."
                  value={draft.customTaskType}
                  onChange={(e) => patch('customTaskType', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Weekly Availability */}
          <div>
            <label className={labelCls}>Weekly Availability</label>
            <BootsDayToggles
              selected={draft.availability}
              onChange={(v) => patch('availability', v)}
              accentColor={accentColor}
            />
          </div>
        </>
      )}

      {/* Investor fields */}
      {!isOperator && (
        <>
          {/* Markets */}
          <div>
            <label className={labelCls}>Markets</label>
            <TagInput
              tags={draft.markets}
              onChange={(v) => patch('markets', v)}
              placeholder="e.g. Houston, TX"
              accentColor="#F6C445"
            />
          </div>

          {/* Task Types Commonly Needed */}
          <div>
            <label className={labelCls}>Task Types Commonly Needed</label>
            <BootsTogglePills
              options={BOOTS_TASK_TYPES}
              selected={draft.taskTypes}
              onChange={(v) => patch('taskTypes', v)}
              accentColor={accentColor}
            />
          </div>
        </>
      )}

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls + ' mb-0'}>Bio</label>
          <span
            className="text-[10px] font-heading"
            style={{
              color: draft.bio.length > 260 ? '#E53935' : 'rgba(200,209,218,0.3)',
            }}
          >
            {draft.bio.length}/280
          </span>
        </div>
        <textarea
          rows={3}
          maxLength={280}
          className={inputCls + ' resize-none'}
          value={draft.bio}
          onChange={(e) => patch('bio', e.target.value)}
          placeholder={
            isOperator
              ? 'Tell investors about your experience and availability...'
              : 'Describe what tasks you typically need boots on the ground for...'
          }
        />
      </div>

      {/* Contact Preferences */}
      <div>
        <label className={labelCls}>Contact Preferences</label>
        <div className="space-y-3 mt-2">
          <Checkbox
            id="boots-showPhone"
            checked={draft.contactPrefs.showPhone}
            onChange={(v) => patchContactPref('showPhone', v)}
            label="Show Phone Number"
          />
          <Checkbox
            id="boots-showEmail"
            checked={draft.contactPrefs.showEmail}
            onChange={(v) => patchContactPref('showEmail', v)}
            label="Show Email Address"
          />
          <Checkbox
            id="boots-dmsOnly"
            checked={draft.contactPrefs.dmsOnly}
            onChange={(v) => patchContactPref('dmsOnly', v)}
            label="DMs Only"
          />
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/50 active:scale-[0.98]"
        style={{
          background: saved
            ? 'rgba(0,198,255,0.08)'
            : 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
          color: saved ? '#00C6FF' : '#F4F7FA',
          border: `1px solid ${saved ? 'rgba(0,198,255,0.3)' : 'rgba(0,198,255,0.4)'}`,
          boxShadow: saved ? 'none' : '0 4px 16px rgba(0,198,255,0.25)',
          opacity: saving ? 0.7 : 1,
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saved ? (
          <>
            <CheckCircle size={14} />
            Saved
          </>
        ) : (
          <>
            <Save size={14} />
            {saving ? 'Saving...' : 'Save Changes'}
          </>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function CommunityProfile() {
  const { uid } = useParams()
  const navigate = useNavigate()
  const { profile, loading } = useUserProfile(uid)
  const { user, profile: authProfile, updateProfile } = useAuth()

  // Determine if the viewer is the profile owner
  const isOwnProfile = user?.firebaseUid && user.firebaseUid === uid

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

  // Use authProfile for bird dog data when viewing own profile (it's always fresh after saves)
  const birdDogSource = isOwnProfile ? authProfile : profile
  const birdDogProfile = birdDogSource?.birdDogProfile || null

  const handleBirdDogSave = async (updatedData) => {
    await updateProfile({ birdDogProfile: updatedData })
  }

  // Use authProfile for boots data when viewing own profile (it's always fresh after saves)
  const bootsSource = isOwnProfile ? authProfile : profile
  const bootsProfile = bootsSource?.bootsProfile || null

  const handleBootsSave = async (updatedData) => {
    await updateProfile({ bootsProfile: updatedData })
  }

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

        {/* Buy Box section */}
        <div className={`${cardClass} px-6 py-5`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gold/60" />
              <h3 className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
                Buy Box
              </h3>
            </div>
            {isOwnProfile && profile.buyBox && (
              <button
                onClick={() => navigate('/buy-boxes')}
                className="flex items-center gap-1 text-[10px] font-heading tracking-wider uppercase text-cyan/70 hover:text-cyan transition-colors duration-150"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>

          {profile.buyBox ? (
            <div className="space-y-3">
              {profile.buyBox.markets?.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Markets</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.buyBox.markets.map((m) => (
                      <span key={m} className="px-2 py-0.5 text-xs font-body text-parchment bg-white/[0.06] border border-white/[0.08] rounded-sm">
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
                    ${(profile.buyBox.minPrice || 0).toLocaleString()} – ${(profile.buyBox.maxPrice || 0).toLocaleString()}
                  </p>
                </div>
              ) : null}

              {profile.buyBox.propertyTypes?.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Property Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.buyBox.propertyTypes.map((t) => (
                      <span key={t} className="px-2 py-0.5 text-xs font-body text-cyan bg-[#00C6FF]/[0.08] border border-[#00C6FF]/[0.15] rounded-sm">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.buyBox.dealTypes?.length > 0 && (
                <div>
                  <p className="text-[10px] text-text-dim/40 uppercase tracking-wider font-heading mb-1">Deal Types</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.buyBox.dealTypes.map((d) => (
                      <span key={d} className="px-2 py-0.5 text-xs font-body text-gold bg-[#F6C445]/[0.08] border border-[#F6C445]/[0.15] rounded-sm">
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
                <p className="text-[9px] text-text-dim/25 pt-1">
                  Last updated {formatDate(profile.buyBox.updatedAt)}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-xs text-text-dim/40 font-body">No buy box submitted yet</p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/buy-boxes')}
                  className="mt-2 text-xs font-heading tracking-wider uppercase text-cyan hover:text-cyan/80 transition-colors duration-150"
                >
                  Set Up Your Buy Box
                </button>
              )}
            </div>
          )}
        </div>

        {/* Badges section */}
        <div className={`${cardClass} px-6 py-5`}>
          <h3 className="mb-3 text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
            Badges
          </h3>
          <BadgeShowcase earnedBadgeIds={profile.communityBadges || []} showAll={true} />
        </div>

        {/* Bird Dog Profile section — only on own profile */}
        {isOwnProfile && (
          <motion.div
            className={`${cardClass} px-6 py-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <h3 className="mb-4 text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
              Bird Dog Profile
            </h3>

            {birdDogProfile ? (
              <BirdDogProfileEditor
                key={JSON.stringify(birdDogProfile)}
                birdDogProfile={birdDogProfile}
                onSave={handleBirdDogSave}
              />
            ) : (
              /* CTA to join the Bird Dog Network */
              <div className="text-center py-4">
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: 'rgba(0,198,255,0.08)',
                    border: '1px solid rgba(0,198,255,0.15)',
                  }}
                >
                  <Binoculars size={20} className="text-[#00C6FF]" />
                </div>
                <h4 className="font-heading text-sm font-semibold text-parchment mb-1.5">
                  Join the Bird Dog Network
                </h4>
                <p className="text-xs text-text-dim/60 font-body leading-relaxed max-w-sm mx-auto mb-5">
                  Find motivated sellers, connect with investors, and earn referral fees.
                  Set up your Bird Dog profile to get started.
                </p>
                <Link
                  to="/bird-dog"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-heading text-sm font-semibold tracking-wider uppercase transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/50 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #0E5A88 0%, #00C6FF 100%)',
                    color: '#F4F7FA',
                    border: '1px solid rgba(0,198,255,0.4)',
                    boxShadow: '0 4px 16px rgba(0,198,255,0.25)',
                  }}
                >
                  <Binoculars size={14} />
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        )}

        {/* Boots on Ground Profile section — only on own profile */}
        {isOwnProfile && (
          <motion.div
            className={`${cardClass} px-6 py-5`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Navigation2 size={16} className="text-[#00C6FF]" />
              <h3 className="text-[10px] font-heading font-semibold uppercase tracking-widest text-text-dim/40">
                Boots on Ground Profile
              </h3>
            </div>

            {bootsProfile ? (
              <BootsProfileEditor
                key={JSON.stringify(bootsProfile)}
                bootsProfile={bootsProfile}
                onSave={handleBootsSave}
              />
            ) : (
              /* CTA to join Boots on Ground */
              <div>
                <p className="text-text-dim font-body text-sm mb-4">
                  Join the Boots on Ground marketplace to connect with operators and investors.
                </p>
                <Link
                  to="/boots-on-ground"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-heading tracking-wider text-[#00C6FF] border border-[rgba(0,198,255,0.3)] hover:bg-[rgba(0,198,255,0.15)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C6FF]/40 active:scale-95"
                  style={{ background: 'rgba(0,198,255,0.05)' }}
                >
                  <Navigation2 size={14} />
                  Get Started
                </Link>
              </div>
            )}
          </motion.div>
        )}

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
