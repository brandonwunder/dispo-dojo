import { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useUserProfile(uid) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) { setLoading(false); return }
    setLoading(true)
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      setLoading(false)
    }, (err) => {
      console.warn('Profile listener error:', err)
      setLoading(false)
    })
    return unsub
  }, [uid])

  const updatePhotoURL = async (userId, photoURL) => {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, { photoURL })
  }

  return { profile, loading, updatePhotoURL }
}
