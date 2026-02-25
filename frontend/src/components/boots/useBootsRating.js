import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../../lib/firebase'

// ─── Shared Rating Cache ────────────────────────────────────────────────────
// Prevents N+1 Firestore listeners when multiple cards share the same userId.
// One Firestore listener per unique userId, shared across all hook consumers.

const cache = new Map() // userId → { avg, count, loading, listeners, unsub }

function subscribe(userId, callback) {
  if (cache.has(userId)) {
    const entry = cache.get(userId)
    entry.listeners.add(callback)
    // Immediately deliver current cached value
    callback({ avg: entry.avg, count: entry.count, loading: entry.loading })
    return () => {
      entry.listeners.delete(callback)
      if (entry.listeners.size === 0) {
        entry.unsub?.()
        cache.delete(userId)
      }
    }
  }

  // Create new entry
  const entry = { avg: 0, count: 0, loading: true, listeners: new Set([callback]), unsub: null }
  cache.set(userId, entry)

  const q = query(
    collection(db, 'boots_reviews'),
    where('revieweeId', '==', userId),
  )
  entry.unsub = onSnapshot(q, (snap) => {
    const reviews = snap.docs.map((d) => d.data())
    const count = reviews.length
    const avg =
      count > 0
        ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count) * 10) / 10
        : 0
    entry.avg = avg
    entry.count = count
    entry.loading = false
    entry.listeners.forEach((cb) => cb({ avg, count, loading: false }))
  })

  // Deliver initial loading state
  callback({ avg: 0, count: 0, loading: true })

  return () => {
    entry.listeners.delete(callback)
    if (entry.listeners.size === 0) {
      entry.unsub?.()
      cache.delete(userId)
    }
  }
}

// ─── useBootsRating ─────────────────────────────────────────────────────────

export default function useBootsRating(userId) {
  const [data, setData] = useState({ avg: 0, count: 0, loading: true })

  useEffect(() => {
    if (!userId) {
      setData({ avg: 0, count: 0, loading: false })
      return
    }
    return subscribe(userId, setData)
  }, [userId])

  return data
}
