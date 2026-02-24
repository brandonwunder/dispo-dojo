import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc, increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { awardCommunityXp, incrementStat } from '../lib/userProfile'

export default function useReplies(messageId) {
  const [replies, setReplies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!messageId) {
      setReplies([])
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'replies'),
      where('messageId', '==', messageId),
      orderBy('createdAt', 'asc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReplies(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Replies listener error:', err)
        setLoading(false)
      },
    )
    return unsub
  }, [messageId])

  const sendReply = useCallback(async (body, authorName, authorEmail, gifUrl = null, gifTitle = null, attachments = [], parentAuthorId = null) => {
    if (!messageId) return
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const trimmed = body.trim()
    if (!trimmed && !gifUrl && attachments.length === 0) return

    await addDoc(collection(db, 'replies'), {
      messageId,
      authorId: uid,
      authorName: authorName || 'Guest',
      authorEmail: authorEmail || '',
      body: trimmed,
      gifUrl,
      gifTitle,
      attachments,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      isEdited: false,
      editedAt: null,
      createdAt: serverTimestamp(),
    })
    await updateDoc(doc(db, 'messages', messageId), {
      replyCount: increment(1),
    })
    if (parentAuthorId && parentAuthorId !== uid) {
      awardCommunityXp(parentAuthorId, 'THREAD_REPLY_RECEIVED').catch(console.error)
      incrementStat(parentAuthorId, 'totalThreadRepliesReceived').catch(console.error)
    }
  }, [messageId])

  return { replies, sendReply, loading }
}
