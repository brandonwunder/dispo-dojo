import { useCallback } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import { awardCommunityXp, incrementStat } from '../lib/userProfile'

export default function useReactions() {
  const toggleReaction = useCallback(async (messageId, emoji, currentReactions, authorId) => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const usersWhoReacted = currentReactions?.[emoji] || []
    const hasReacted = usersWhoReacted.includes(uid)

    const ref = doc(db, 'messages', messageId)

    if (hasReacted) {
      await updateDoc(ref, {
        [`reactions.${emoji}`]: arrayRemove(uid),
      })
    } else {
      await updateDoc(ref, {
        [`reactions.${emoji}`]: arrayUnion(uid),
      })
      if (authorId && authorId !== auth.currentUser?.uid) {
        awardCommunityXp(authorId, 'REACTION_RECEIVED').catch(console.error)
        incrementStat(authorId, 'totalReactionsReceived').catch(console.error)
      }
    }
  }, [])

  return { toggleReaction }
}
