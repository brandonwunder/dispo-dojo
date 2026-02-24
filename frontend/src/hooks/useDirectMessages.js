import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc, getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useDirectMessages(activeConversationId) {
  const [conversations, setConversations] = useState([])
  const [activeMessages, setActiveMessages] = useState([])
  const [loading, setLoading] = useState(true)

  // Listen to conversations where current user is a participant
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
    )
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      // Sort client-side by lastMessage.createdAt desc
      convos.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt?.toMillis?.() || 0
        const bTime = b.lastMessage?.createdAt?.toMillis?.() || 0
        return bTime - aTime
      })
      setConversations(convos)
      setLoading(false)
    }, (err) => {
      console.warn('Conversations listener error:', err)
      setLoading(false)
    })
    return unsub
  }, [])

  // Listen to messages for active conversation
  useEffect(() => {
    if (!activeConversationId) { setActiveMessages([]); return }
    const q = query(
      collection(db, 'directMessages'),
      where('conversationId', '==', activeConversationId),
      orderBy('createdAt', 'asc'),
      limit(100),
    )
    const unsub = onSnapshot(q, (snap) => {
      setActiveMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }, (err) => console.warn('DM messages error:', err))
    return unsub
  }, [activeConversationId])

  // Find or create conversation between two users
  const startConversation = useCallback(async (otherUid, otherName) => {
    const uid = auth.currentUser?.uid
    if (!uid) return null

    // Check if conversation already exists
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', uid),
    )
    const snap = await getDocs(q)
    const existing = snap.docs.find((d) => {
      const participants = d.data().participants || []
      return participants.includes(otherUid)
    })

    if (existing) return existing.id

    // Create new conversation
    const docRef = await addDoc(collection(db, 'conversations'), {
      participants: [uid, otherUid],
      participantNames: { [uid]: 'You', [otherUid]: otherName },
      lastMessage: null,
      unreadCount: { [uid]: 0, [otherUid]: 0 },
      createdAt: serverTimestamp(),
    })
    return docRef.id
  }, [])

  // Send a DM
  const sendDirectMessage = useCallback(async (conversationId, body, authorName, gifUrl = null, gifTitle = null, attachments = []) => {
    const uid = auth.currentUser?.uid
    if (!uid || !conversationId) return
    const trimmed = body.trim()
    if (!trimmed && !gifUrl && attachments.length === 0) return

    await addDoc(collection(db, 'directMessages'), {
      conversationId,
      authorId: uid,
      authorName: authorName || 'Guest',
      body: trimmed,
      gifUrl,
      gifTitle,
      attachments,
      createdAt: serverTimestamp(),
    })

    // Update conversation's last message
    // Get the other participant's uid
    const convo = conversations.find((c) => c.id === conversationId)
    const otherUid = convo?.participants?.find((p) => p !== uid)

    const updateData = {
      lastMessage: { body: trimmed || (gifUrl ? 'GIF' : 'Attachment'), authorId: uid, createdAt: serverTimestamp() },
    }
    if (otherUid) {
      updateData[`unreadCount.${otherUid}`] = (convo?.unreadCount?.[otherUid] || 0) + 1
    }
    await updateDoc(doc(db, 'conversations', conversationId), updateData)
  }, [conversations])

  // Mark conversation as read
  const markConversationRead = useCallback(async (conversationId) => {
    const uid = auth.currentUser?.uid
    if (!uid || !conversationId) return
    await updateDoc(doc(db, 'conversations', conversationId), {
      [`unreadCount.${uid}`]: 0,
    }).catch(() => {})
  }, [])

  return { conversations, activeMessages, loading, startConversation, sendDirectMessage, markConversationRead }
}
