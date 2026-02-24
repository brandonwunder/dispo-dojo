import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(
      collection(db, 'notifications', uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(20),
    )
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setNotifications(items)
      setUnreadCount(items.filter((n) => !n.read).length)
    }, (err) => console.warn('Notifications error:', err))
    return unsub
  }, [])

  const markRead = useCallback(async (notificationId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'notifications', uid, 'items', notificationId), { read: true }).catch(() => {})
  }, [])

  const markAllRead = useCallback(async () => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const batch = writeBatch(db)
    notifications.filter((n) => !n.read).forEach((n) => {
      batch.update(doc(db, 'notifications', uid, 'items', n.id), { read: true })
    })
    await batch.commit().catch(() => {})
  }, [notifications])

  return { notifications, unreadCount, markRead, markAllRead }
}

export async function createNotification(targetUid, data) {
  if (!targetUid) return
  await addDoc(collection(db, 'notifications', targetUid, 'items'), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  })
}
