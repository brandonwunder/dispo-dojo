import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useOnlineUsers(channelId, ready = true) {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  useEffect(() => {
    if (!ready) return
    const q = query(
      collection(db, 'presence'),
      where('isOnline', '==', true),
    )
    const unsub = onSnapshot(q, (snap) => {
      const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setOnlineUsers(users)
      setTypingUsers(
        users.filter((u) => u.isTyping && u.typingIn === channelId)
      )
    }, (err) => {
      console.warn('Presence listener error:', err)
    })
    return unsub
  }, [channelId, ready])

  return { onlineUsers, typingUsers }
}
