import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ─── useBootsRating ─────────────────────────────────────────────────────────
// Fetches the average rating and review count for a user from boots_reviews.

export default function useBootsRating(userId) {
  const [data, setData] = useState({ avg: 0, count: 0, loading: true })

  useEffect(() => {
    if (!userId) {
      setData({ avg: 0, count: 0, loading: false })
      return
    }
    const q = query(
      collection(db, 'boots_reviews'),
      where('revieweeId', '==', userId),
    )
    const unsub = onSnapshot(q, (snap) => {
      const reviews = snap.docs.map((d) => d.data())
      const count = reviews.length
      const avg =
        count > 0
          ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count) * 10) / 10
          : 0
      setData({ avg, count, loading: false })
    })
    return unsub
  }, [userId])

  return data
}
