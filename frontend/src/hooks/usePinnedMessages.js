import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { awardCommunityXp } from '../lib/userProfile'

export default function usePinnedMessages(channelId, ready = true) {
  const [pinnedMessages, setPinnedMessages] = useState([])

  useEffect(() => {
    if (!ready) return
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      where('isPinned', '==', true),
      orderBy('pinnedAt', 'desc'),
    )
    const unsub = onSnapshot(q, (snap) => {
      setPinnedMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.warn('Pinned messages listener error:', err)
    })
    return unsub
  }, [channelId, ready])

  const pinMessage = useCallback(async (messageId, authorId) => {
    const uid = auth.currentUser?.uid
    await updateDoc(doc(db, 'messages', messageId), {
      isPinned: true,
      pinnedAt: serverTimestamp(),
      pinnedBy: uid,
    })
    if (authorId) {
      awardCommunityXp(authorId, 'MESSAGE_PINNED').catch(console.error)
    }
  }, [])

  const unpinMessage = useCallback(async (messageId) => {
    await updateDoc(doc(db, 'messages', messageId), {
      isPinned: false,
      pinnedAt: null,
      pinnedBy: null,
    })
  }, [])

  return { pinnedMessages, pinMessage, unpinMessage }
}
