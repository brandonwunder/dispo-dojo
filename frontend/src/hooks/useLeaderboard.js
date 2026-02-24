import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useLeaderboard(count = 10) {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('stats.communityXp', 'desc'),
      limit(count),
    )
    const unsub = onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => console.warn('Leaderboard error:', err))
    return unsub
  }, [count])

  return { leaders }
}
