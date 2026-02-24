import { useEffect, useCallback, useRef } from 'react'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function usePresence(displayName, channelId) {
  const typingTimeout = useRef(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const presenceRef = doc(db, 'presence', uid)

    setDoc(presenceRef, {
      odId: uid,
      displayName: displayName || 'Guest',
      isOnline: true,
      lastSeen: serverTimestamp(),
      currentChannel: channelId || null,
      isTyping: false,
      typingIn: null,
    }, { merge: true })

    const handleUnload = () => {
      updateDoc(presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        isTyping: false,
        typingIn: null,
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      window.removeEventListener('beforeunload', handleUnload)
      handleUnload()
    }
  }, [displayName, channelId])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    updateDoc(doc(db, 'presence', uid), {
      currentChannel: channelId || null,
      isTyping: false,
      typingIn: null,
    }).catch(() => {})
  }, [channelId])

  const setTyping = useCallback((isTyping) => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const presenceRef = doc(db, 'presence', uid)

    if (isTyping) {
      updateDoc(presenceRef, {
        isTyping: true,
        typingIn: channelId,
      }).catch(() => {})

      clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => {
        updateDoc(presenceRef, {
          isTyping: false,
          typingIn: null,
        }).catch(() => {})
      }, 3000)
    } else {
      clearTimeout(typingTimeout.current)
      updateDoc(presenceRef, {
        isTyping: false,
        typingIn: null,
      }).catch(() => {})
    }
  }, [channelId])

  return { setTyping }
}
