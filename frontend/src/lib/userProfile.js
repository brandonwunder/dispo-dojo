import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from './firebase'

export const DEFAULT_AVATAR = {
  base: 'male',
  maskColor: '#1a1a2e',
  headbandColor: '#ffffff',
  beltColor: '#ffffff',
  eyeColor: '#00C6FF',
  gear: [],
  effects: [],
}

export const RANK_THRESHOLDS = [
  { rank: 'initiate',      name: 'Initiate',      minUnderwrites: 0,  minDeals: 0 },
  { rank: 'scout',         name: 'Scout',         minUnderwrites: 1,  minDeals: 0 },
  { rank: 'shinobi',       name: 'Shinobi',       minUnderwrites: 3,  minDeals: 0 },
  { rank: 'shadow',        name: 'Shadow',        minUnderwrites: 5,  minDeals: 0 },
  { rank: 'blade',         name: 'Blade',         minUnderwrites: 10, minDeals: 0 },
  { rank: 'jonin',         name: 'Jonin',         minUnderwrites: 15, minDeals: 0 },
  { rank: 'shadow-master', name: 'Shadow Master', minUnderwrites: 20, minDeals: 0 },
  { rank: 'kage',          name: 'Kage',          minUnderwrites: 20, minDeals: 5 },
]

export const BADGE_DEFS = [
  { id: 'active-voice',     label: 'Active Voice',     check: (s) => s.messages >= 100  },
  { id: 'community-pillar', label: 'Community Pillar', check: (s) => s.messages >= 500  },
  { id: 'deal-hunter',      label: 'Deal Hunter',      check: (s) => s.underwrites >= 10 },
  { id: 'ink-slinger',      label: 'Ink Slinger',      check: (s) => s.lois >= 5        },
  { id: 'first-blood',      label: 'First Blood',      check: (s) => s.dealsSubmitted >= 1 },
  { id: 'closer',           label: 'Closer',           check: (s) => s.dealsClosed >= 3  },
  { id: 'top-closer',       label: 'Top Closer',       check: (s) => s.dealsClosed >= 10 },
]

// ── Community XP System ──────────────────────────────
export const COMMUNITY_XP_ACTIONS = {
  REACTION_RECEIVED: 5,
  MESSAGE_PINNED: 50,
  THREAD_REPLY_RECEIVED: 3,
  REPLY_REACTION_RECEIVED: 3,
  BADGE_EARNED: 25,
}

export const COMMUNITY_RANKS = [
  { level: 1, xpRequired: 0,    name: 'Academy Student', color: '#9CA3AF' },
  { level: 2, xpRequired: 50,   name: 'Genin',           color: '#22C55E' },
  { level: 3, xpRequired: 200,  name: 'Chunin',          color: '#00C6FF' },
  { level: 4, xpRequired: 500,  name: 'Jonin',           color: '#7F00FF' },
  { level: 5, xpRequired: 1000, name: 'ANBU',            color: '#E53935' },
  { level: 6, xpRequired: 2500, name: 'Kage',            color: '#F6C445' },
]

export const COMMUNITY_BADGES = [
  { id: 'first-blood',       label: 'First Blood',       icon: '\u{1FA78}', check: (s) => s.totalMessages >= 1 },
  { id: 'crowd-favorite',    label: 'Crowd Favorite',    icon: '\u2B50', check: (s) => s.maxReactionsOnMessage >= 10 },
  { id: 'sensei',            label: 'Sensei',            icon: '\u{1F393}', check: (s) => s.totalThreadRepliesReceived >= 50 },
  { id: 'on-fire',           label: 'On Fire',           icon: '\u{1F525}', check: (s) => s.postingStreak >= 7 },
  { id: 'community-pillar',  label: 'Community Pillar',  icon: '\u{1F3DB}\uFE0F', check: (s) => computeCommunityRank(s.communityXp).level >= 4 },
  { id: 'legendary',         label: 'Legendary',         icon: '\u{1F451}', check: (s) => computeCommunityRank(s.communityXp).level >= 6 },
]

export function computeCommunityRank(xp = 0) {
  let current = COMMUNITY_RANKS[0]
  for (const rank of COMMUNITY_RANKS) {
    if (xp >= rank.xpRequired) current = rank
  }
  const nextIdx = COMMUNITY_RANKS.indexOf(current) + 1
  const next = nextIdx < COMMUNITY_RANKS.length ? COMMUNITY_RANKS[nextIdx] : null
  return { ...current, next, progress: next ? (xp - current.xpRequired) / (next.xpRequired - current.xpRequired) : 1 }
}

export function computeCommunityBadges(stats) {
  return COMMUNITY_BADGES.filter((b) => b.check(stats || {})).map((b) => b.id)
}

export function computeRank(stats) {
  const s = stats || {}
  const underwrites = s.underwrites || 0
  const dealsClosed = s.dealsClosed || 0
  let current = RANK_THRESHOLDS[0]
  for (const tier of RANK_THRESHOLDS) {
    if (underwrites >= tier.minUnderwrites && dealsClosed >= tier.minDeals) {
      current = tier
    }
  }
  return current.rank
}

export function computeBadges(stats) {
  return BADGE_DEFS.filter((b) => b.check(stats || {})).map((b) => b.id)
}

export function unlockedGear(rank) {
  const order = ['initiate','scout','shinobi','shadow','blade','jonin','shadow-master','kage']
  const idx = order.indexOf(rank)
  const gear = []
  if (idx >= 1) gear.push('mask-colors')
  if (idx >= 2) gear.push('headband-colors')
  if (idx >= 3) gear.push('smoke-wisps')
  if (idx >= 4) gear.push('katana')
  if (idx >= 5) gear.push('red-headband')
  if (idx >= 6) gear.push('glow-eyes', 'black-gi')
  if (idx >= 7) gear.push('full-aura', 'golden-trim')
  return gear
}

export async function getOrCreateProfile(uid, localUser) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data()

  const newProfile = {
    displayName: localUser.name || 'Ninja',
    username: localUser.username || uid.slice(0, 8),
    email: localUser.email || '',
    phone: localUser.phone || '',
    bio: '',
    market: '',
    role: localUser.isAdmin ? 'admin' : 'member',
    avatarConfig: DEFAULT_AVATAR,
    stats: {
      underwrites: 0, lois: 0, contracts: 0, messages: 0,
      dealsSubmitted: 0, dealsClosed: 0, birdDogLeads: 0, bootsTasksCompleted: 0,
      communityXp: 0,
      totalMessages: 0,
      totalReactionsReceived: 0,
      totalThreadRepliesReceived: 0,
      maxReactionsOnMessage: 0,
      postingStreak: 0,
      lastPostDate: null,
    },
    rank: 'initiate',
    badges: [],
    communityRank: 'Academy Student',
    communityBadges: [],
    createdAt: new Date().toISOString(),
    notificationPrefs: { communityReplies: true, dealUpdates: true, taskAssignments: true },
  }
  await setDoc(ref, newProfile)
  return newProfile
}

export async function updateProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), data)
}

export async function incrementStat(uid, field) {
  if (!uid) return
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { [`stats.${field}`]: increment(1) })
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const stats = snap.data().stats || {}
  const rank = computeRank(stats)
  const badges = computeBadges(stats)
  await updateDoc(ref, { rank, badges })
}

export async function awardCommunityXp(uid, action, extraData = {}) {
  if (!uid) return
  const xpAmount = COMMUNITY_XP_ACTIONS[action]
  if (!xpAmount) return
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { 'stats.communityXp': increment(xpAmount) })
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const stats = snap.data().stats || {}
  const rank = computeCommunityRank(stats.communityXp)
  const badges = computeCommunityBadges(stats)
  await updateDoc(ref, { communityRank: rank.name, communityBadges: badges })
}
