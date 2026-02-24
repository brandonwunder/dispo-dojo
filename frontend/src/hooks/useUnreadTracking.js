import { useState, useEffect, useCallback } from 'react'
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useUnreadTracking(activeChannelId) {
  const [channelReadState, setChannelReadState] = useState({})

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const unsub = onSnapshot(
      doc(db, 'userChannelState', uid),
      (snap) => setChannelReadState(snap.exists() ? snap.data() : {}),
      () => {},
    )
    return unsub
  }, [])

  const markChannelRead = useCallback((channelId) => {
    const uid = auth.currentUser?.uid
    if (!uid || !channelId) return
    setDoc(doc(db, 'userChannelState', uid), {
      [channelId]: { lastReadAt: serverTimestamp() }
    }, { merge: true }).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeChannelId) markChannelRead(activeChannelId)
  }, [activeChannelId, markChannelRead])

  return { channelReadState, markChannelRead }
}
