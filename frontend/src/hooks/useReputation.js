import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import {
  awardCommunityXp,
  computeCommunityRank,
  COMMUNITY_BADGES,
} from '../lib/userProfile'

export default function useReputation() {
  const [xp, setXp] = useState(0)
  const [rank, setRank] = useState(null)
  const [badges, setBadges] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      const s = data.stats || {}
      setXp(s.communityXp || 0)
      setRank(computeCommunityRank(s.communityXp || 0))
      setBadges(data.communityBadges || [])
      setStats(s)
    }, (err) => console.warn('Reputation listener error:', err))
    return unsub
  }, [])

  const awardXp = useCallback((action) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    awardCommunityXp(uid, action)
  }, [])

  const badgeDetails = COMMUNITY_BADGES.filter((b) => badges.includes(b.id))

  return { xp, rank, badges, badgeDetails, stats, awardXp }
}
