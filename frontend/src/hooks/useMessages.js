import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { incrementStat } from '../lib/userProfile'

export default function useMessages(channelId, ready = true) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    setError(null)
    const q = query(
      collection(db, 'messages'),
      where('channelId', '==', channelId),
      orderBy('createdAt', 'asc'),
      limit(100),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Messages listener error:', err)
        setError(err.message)
        setLoading(false)
      },
    )
    return unsub
  }, [channelId, ready])

  const sendMessage = useCallback(async (body, authorName, authorEmail, gifUrl = null, gifTitle = null, attachments = [], type = null, dealData = null, replyTo = null) => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const trimmed = body.trim()
    if (!trimmed && !gifUrl && attachments.length === 0 && !dealData) return

    const messageDoc = {
      channelId,
      authorId: uid,
      authorName: authorName || 'Guest',
      authorEmail: authorEmail || '',
      body: trimmed,
      gifUrl,
      gifTitle,
      attachments,
      replyCount: 0,
      reactions: {},
      isPinned: false,
      pinnedAt: null,
      pinnedBy: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      isEdited: false,
      editedAt: null,
      createdAt: serverTimestamp(),
    }

    if (type) messageDoc.type = type
    if (dealData) messageDoc.dealData = dealData
    if (replyTo) messageDoc.replyTo = replyTo

    await addDoc(collection(db, 'messages'), messageDoc)
    incrementStat(uid, 'messages').catch(console.error)
    incrementStat(uid, 'totalMessages').catch(console.error)
  }, [channelId])

  const editMessage = useCallback(async (messageId, newBody) => {
    await updateDoc(doc(db, 'messages', messageId), {
      body: newBody,
      isEdited: true,
      editedAt: serverTimestamp(),
    })
  }, [])

  const deleteMessage = useCallback(async (messageId) => {
    const uid = auth.currentUser?.uid
    await updateDoc(doc(db, 'messages', messageId), {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: uid,
    })
  }, [])

  return { messages, sendMessage, editMessage, deleteMessage, loading, error }
}
