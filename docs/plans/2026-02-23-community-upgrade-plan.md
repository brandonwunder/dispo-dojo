# Community Page Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the Community page from a broken skeleton to a production-grade real-time chat platform with reactions, GIFs, file uploads, pinned messages, typing indicators, online presence, @mentions, and message editing/deletion.

**Architecture:** Component Library + Custom Hooks (Approach B). All Firestore logic lives in reusable hooks under `frontend/src/hooks/`. UI is decomposed into focused components under `frontend/src/components/community/`. The existing monolithic `Community.jsx` is replaced with a thin layout shell that composes these parts.

**Tech Stack:** React 19, Firestore (real-time listeners), Firebase Storage (file uploads), Firebase Anonymous Auth (existing), Giphy API (free beta key), Framer Motion (animations), Lucide React (icons), Tailwind CSS v4.

---

## Task 1: Add Firebase Storage Export + Giphy Env Var

**Files:**
- Modify: `frontend/src/lib/firebase.js`
- Modify: `frontend/.env`

**Step 1: Add Firebase Storage export**

In `frontend/src/lib/firebase.js`, add `getStorage` import and export:

```js
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export default app
```

**Step 2: Add Giphy API key to .env**

Add to `frontend/.env` (do NOT commit this file):

```
VITE_GIPHY_API_KEY=<user-provides-key>
```

Use Giphy's public beta key for development: `GlVGYHkr3WSBnllca54iNt0yFTz7OUdkr` (this is the well-known public beta key).

**Step 3: Commit**

```bash
git add frontend/src/lib/firebase.js
git commit -m "feat(community): add Firebase Storage export + Giphy env var"
```

---

## Task 2: Store Firebase UID on Auth Context

The current auth system uses localStorage and anonymous Firebase auth, but never exposes the Firebase UID. We need it for message ownership (edit/delete).

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`

**Step 1: Track Firebase anonymous UID in auth state**

Add a `firebaseUid` field to the user object. After every `signInAnonymously(auth)` call succeeds, read `auth.currentUser.uid` and merge it into the user state.

In `AuthContext.jsx`, update the initial anonymous auth effect (line 48-52):

```js
// Sign in anonymously to Firebase when user is already logged in from localStorage
useEffect(() => {
  if (user) {
    signInAnonymously(auth).then((cred) => {
      setUser(prev => prev ? { ...prev, firebaseUid: cred.user.uid } : prev)
    }).catch(console.error)
  }
}, [])
```

Do the same for `login`, `signup`, and `quickLogin` — after each `signInAnonymously(auth)` call, chain `.then()` to set `firebaseUid`:

```js
const login = (identifier, password) => {
  // Admin login
  if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const adminUser = { email: ADMIN_EMAIL, name: 'Admin', isAdmin: true }
    setUser(adminUser)
    signInAnonymously(auth).then((cred) => {
      setUser(prev => prev ? { ...prev, firebaseUid: cred.user.uid } : prev)
    }).catch(console.error)
    return { success: true }
  }

  // ... existing user lookup code stays the same ...

  setUser({
    email: existing.email,
    name: existing.name,
    username: existing.username,
    isAdmin: false,
  })
  signInAnonymously(auth).then((cred) => {
    setUser(prev => prev ? { ...prev, firebaseUid: cred.user.uid } : prev)
  }).catch(console.error)
  return { success: true }
}
```

Apply the same `.then()` pattern to `signup` and `quickLogin`.

**Step 2: Expose firebaseUid in context value**

No extra changes needed — `user` object already flows through the context. Components access `user.firebaseUid`.

**Step 3: Commit**

```bash
git add frontend/src/context/AuthContext.jsx
git commit -m "feat(community): expose Firebase UID in auth context for message ownership"
```

---

## Task 3: Create `useMessages` Hook

**Files:**
- Create: `frontend/src/hooks/useMessages.js`

**Step 1: Create the hooks directory**

```bash
mkdir -p frontend/src/hooks
```

**Step 2: Write the hook**

```js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy, limit,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useMessages(channelId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Real-time listener
  useEffect(() => {
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
  }, [channelId])

  // Send message
  const sendMessage = useCallback(async (body, gifUrl = null, gifTitle = null, attachments = []) => {
    const uid = auth.currentUser?.uid
    if (!uid) throw new Error('Not authenticated')
    const trimmed = body.trim()
    if (!trimmed && !gifUrl && attachments.length === 0) return

    await addDoc(collection(db, 'messages'), {
      channelId,
      authorId: uid,
      authorName: auth.currentUser.displayName || 'Guest',
      authorEmail: '',
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
    })
  }, [channelId])

  // Edit message (ownership check done by caller or Firestore rules)
  const editMessage = useCallback(async (messageId, newBody) => {
    await updateDoc(doc(db, 'messages', messageId), {
      body: newBody,
      isEdited: true,
      editedAt: serverTimestamp(),
    })
  }, [])

  // Soft-delete message
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
```

**Important:** The `sendMessage` function takes `authorName` and `authorEmail` from the caller (the Community component will pass these). Update signature:

Actually, the hook doesn't have access to the display name from our localStorage-based auth. The caller needs to pass author info. Update `sendMessage`:

```js
const sendMessage = useCallback(async (body, authorName, authorEmail, gifUrl = null, gifTitle = null, attachments = []) => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  const trimmed = body.trim()
  if (!trimmed && !gifUrl && attachments.length === 0) return

  await addDoc(collection(db, 'messages'), {
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
  })
}, [channelId])
```

**Step 3: Commit**

```bash
git add frontend/src/hooks/useMessages.js
git commit -m "feat(community): add useMessages hook with send/edit/delete"
```

---

## Task 4: Create `useReplies` Hook

**Files:**
- Create: `frontend/src/hooks/useReplies.js`

**Step 1: Write the hook**

```js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc, increment,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

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

  const sendReply = useCallback(async (body, authorName, authorEmail, gifUrl = null, gifTitle = null, attachments = []) => {
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
    // Increment reply count on parent message
    await updateDoc(doc(db, 'messages', messageId), {
      replyCount: increment(1),
    })
  }, [messageId])

  return { replies, sendReply, loading }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useReplies.js
git commit -m "feat(community): add useReplies hook"
```

---

## Task 5: Create `useReactions` Hook

**Files:**
- Create: `frontend/src/hooks/useReactions.js`

**Step 1: Write the hook**

Reactions are stored as a map on the message doc: `{ "🔥": ["uid1", "uid2"] }`. This hook provides a `toggleReaction` function that adds/removes the current user's UID.

```js
import { useCallback } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function useReactions() {
  const toggleReaction = useCallback(async (messageId, emoji, currentReactions) => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const usersWhoReacted = currentReactions?.[emoji] || []
    const hasReacted = usersWhoReacted.includes(uid)

    const ref = doc(db, 'messages', messageId)

    if (hasReacted) {
      // Remove reaction
      await updateDoc(ref, {
        [`reactions.${emoji}`]: arrayRemove(uid),
      })
    } else {
      // Add reaction
      await updateDoc(ref, {
        [`reactions.${emoji}`]: arrayUnion(uid),
      })
    }
  }, [])

  return { toggleReaction }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useReactions.js
git commit -m "feat(community): add useReactions hook with toggle"
```

---

## Task 6: Create `usePresence` Hook (Write-Only)

**Files:**
- Create: `frontend/src/hooks/usePresence.js`

**Step 1: Write the hook**

This hook manages the current user's presence document. It sets `isOnline: true` on mount, tracks typing state, and sets `isOnline: false` on unmount/beforeunload.

```js
import { useEffect, useCallback, useRef } from 'react'
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function usePresence(displayName, channelId) {
  const typingTimeout = useRef(null)
  const uid = auth.currentUser?.uid

  // Set online on mount, offline on unmount
  useEffect(() => {
    if (!uid) return

    const presenceRef = doc(db, 'presence', uid)

    // Go online
    setDoc(presenceRef, {
      odId: uid,
      displayName: displayName || 'Guest',
      isOnline: true,
      lastSeen: serverTimestamp(),
      currentChannel: channelId || null,
      isTyping: false,
      typingIn: null,
    }, { merge: true })

    // Handle tab close
    const handleUnload = () => {
      // Use navigator.sendBeacon or just update — best effort
      // Firestore doesn't support sendBeacon, so we rely on TTL or next login
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
  }, [uid, displayName, channelId])

  // Update current channel when it changes
  useEffect(() => {
    if (!uid) return
    updateDoc(doc(db, 'presence', uid), {
      currentChannel: channelId || null,
      isTyping: false,
      typingIn: null,
    }).catch(() => {})
  }, [uid, channelId])

  // Typing indicator — call this on input change
  const setTyping = useCallback((isTyping) => {
    if (!uid) return
    const presenceRef = doc(db, 'presence', uid)

    if (isTyping) {
      updateDoc(presenceRef, {
        isTyping: true,
        typingIn: channelId,
      }).catch(() => {})

      // Auto-clear after 3 seconds
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
  }, [uid, channelId])

  return { setTyping }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/usePresence.js
git commit -m "feat(community): add usePresence hook for online status + typing"
```

---

## Task 7: Create `useOnlineUsers` Hook (Read-Only)

**Files:**
- Create: `frontend/src/hooks/useOnlineUsers.js`

**Step 1: Write the hook**

```js
import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function useOnlineUsers(channelId) {
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])

  useEffect(() => {
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
  }, [channelId])

  return { onlineUsers, typingUsers }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useOnlineUsers.js
git commit -m "feat(community): add useOnlineUsers hook for presence list"
```

---

## Task 8: Create `useGifSearch` Hook

**Files:**
- Create: `frontend/src/hooks/useGifSearch.js`

**Step 1: Write the hook**

Uses the Giphy API with the free beta key. Debounces search input. Tracks rate limit usage client-side.

```js
import { useState, useCallback, useRef } from 'react'

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || ''
const GIPHY_BASE = 'https://api.giphy.com/v1/gifs'

export default function useGifSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)
  const callCount = useRef(0)
  const callResetRef = useRef(null)

  // Track hourly rate limit (100/hour)
  const trackCall = () => {
    callCount.current += 1
    if (!callResetRef.current) {
      callResetRef.current = setTimeout(() => {
        callCount.current = 0
        callResetRef.current = null
      }, 3600000) // 1 hour
    }
  }

  const fetchGifs = async (url) => {
    if (callCount.current >= 95) {
      setError('GIF search rate limit nearly reached. Try again later.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      trackCall()
      const res = await fetch(url)
      const data = await res.json()
      setResults(
        (data.data || []).map((g) => ({
          id: g.id,
          title: g.title,
          url: g.images.fixed_height.url,
          preview: g.images.fixed_height_small.url,
          width: parseInt(g.images.fixed_height.width, 10),
          height: parseInt(g.images.fixed_height.height, 10),
        }))
      )
    } catch (err) {
      setError('Failed to load GIFs')
      console.error('Giphy error:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchGifs = useCallback((searchTerm) => {
    clearTimeout(debounceRef.current)
    if (!searchTerm.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => {
      fetchGifs(
        `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=r`
      )
    }, 400)
  }, [])

  const trendingGifs = useCallback(() => {
    fetchGifs(
      `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&rating=r`
    )
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { results, loading, error, searchGifs, trendingGifs, clearResults, callsRemaining: 100 - callCount.current }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useGifSearch.js
git commit -m "feat(community): add useGifSearch hook with Giphy API integration"
```

---

## Task 9: Create `useFileUpload` Hook

**Files:**
- Create: `frontend/src/hooks/useFileUpload.js`

**Step 1: Write the hook**

```js
import { useState, useCallback } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../lib/firebase'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function useFileUpload(channelId) {
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file) => {
    if (!file) return null

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Max ${MAX_FILE_SIZE / 1024 / 1024}MB.`)
      return null
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('File type not supported.')
      return null
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storageRef = ref(storage, `community/${channelId}/${timestamp}-${safeName}`)

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100))
        },
        (err) => {
          setError('Upload failed')
          setUploading(false)
          console.error('Upload error:', err)
          reject(err)
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref)
          const attachment = {
            url,
            name: file.name,
            type: file.type,
            size: file.size,
          }
          setUploading(false)
          setProgress(100)
          resolve(attachment)
        },
      )
    })
  }, [channelId])

  const clearError = useCallback(() => setError(null), [])

  return { upload, progress, uploading, error, clearError }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useFileUpload.js
git commit -m "feat(community): add useFileUpload hook with Firebase Storage"
```

---

## Task 10: Create `usePinnedMessages` Hook

**Files:**
- Create: `frontend/src/hooks/usePinnedMessages.js`

**Step 1: Write the hook**

```js
import { useState, useEffect, useCallback } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

export default function usePinnedMessages(channelId) {
  const [pinnedMessages, setPinnedMessages] = useState([])

  useEffect(() => {
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
  }, [channelId])

  const pinMessage = useCallback(async (messageId) => {
    const uid = auth.currentUser?.uid
    await updateDoc(doc(db, 'messages', messageId), {
      isPinned: true,
      pinnedAt: serverTimestamp(),
      pinnedBy: uid,
    })
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
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/usePinnedMessages.js
git commit -m "feat(community): add usePinnedMessages hook"
```

---

## Task 11: Create Community Sub-Components — MessageBubble

**Files:**
- Create: `frontend/src/components/community/MessageBubble.jsx`

**Step 1: Create the community components directory**

```bash
mkdir -p frontend/src/components/community
```

**Step 2: Write MessageBubble**

This is the core message display component. It renders:
- Author avatar (initials), name, timestamp
- Message body (with @mention highlighting)
- Inline GIF if present
- Attachment previews
- Reaction bar
- Hover action menu (reply, react, edit, delete, pin)
- Soft-deleted state (admin sees content, others see placeholder)

```jsx
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reply, Smile, Pencil, Trash2, Pin, MoreHorizontal } from 'lucide-react'
import ReactionBar from './ReactionBar'
import AttachmentPreview from './AttachmentPreview'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Render body with @mention highlights
function renderBody(body) {
  if (!body) return null
  const parts = body.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="rounded-sm bg-[rgba(0,198,255,0.15)] px-1 text-[#00C6FF] font-medium">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

export default function MessageBubble({
  msg,
  isOwn,
  isAdmin,
  onReply,
  onReact,
  onEdit,
  onDelete,
  onPin,
  onToggleReaction,
  onAuthorClick,
  currentUid,
}) {
  const [showActions, setShowActions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(msg.body)

  // Soft-deleted message
  if (msg.isDeleted && !isAdmin) {
    return (
      <div className="flex gap-3 py-1 opacity-50">
        <div className="h-8 w-8 shrink-0" />
        <p className="text-sm italic text-text-dim/40">This message was deleted</p>
      </div>
    )
  }

  const handleEditSave = () => {
    if (editBody.trim() && editBody.trim() !== msg.body) {
      onEdit(msg.id, editBody.trim())
    }
    setEditing(false)
  }

  const handleEditKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      setEditing(false)
      setEditBody(msg.body)
    }
  }

  return (
    <div
      className={`group relative flex gap-3 rounded-sm px-1 py-1.5 transition-colors duration-100 hover:bg-white/[0.02] ${
        msg.isDeleted ? 'opacity-40' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
        {initials(msg.authorName)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <button
            onClick={() => onAuthorClick(msg)}
            className="font-heading text-sm font-semibold text-parchment hover:text-gold transition-colors cursor-pointer"
          >
            {msg.authorName}
          </button>
          <span className="text-[10px] text-text-dim/30">
            {fmtDate(msg.createdAt)} {fmtTime(msg.createdAt)}
          </span>
          {msg.isEdited && (
            <span className="text-[9px] text-text-dim/25">(edited)</span>
          )}
          {msg.isDeleted && isAdmin && (
            <span className="text-[9px] text-red-400/60">(Deleted)</span>
          )}
        </div>

        {/* Body — editable or static */}
        {editing ? (
          <div className="mt-1">
            <input
              type="text"
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={handleEditKey}
              onBlur={handleEditSave}
              autoFocus
              className="w-full rounded-sm border border-[rgba(246,196,69,0.2)] bg-black/30 px-2 py-1 text-sm text-parchment focus:outline-none focus:border-gold/40"
            />
            <p className="mt-0.5 text-[9px] text-text-dim/30">Enter to save, Esc to cancel</p>
          </div>
        ) : (
          <p className={`mt-0.5 text-sm leading-relaxed break-words ${msg.isDeleted ? 'line-through text-text-dim/30' : 'text-text-dim'}`}>
            {renderBody(msg.body)}
          </p>
        )}

        {/* Inline GIF */}
        {msg.gifUrl && (
          <div className="mt-2 max-w-[300px] overflow-hidden rounded-sm">
            <img
              src={msg.gifUrl}
              alt={msg.gifTitle || 'GIF'}
              className="w-full rounded-sm"
              loading="lazy"
            />
          </div>
        )}

        {/* Attachments */}
        {msg.attachments?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {msg.attachments.map((att, i) => (
              <AttachmentPreview key={i} attachment={att} />
            ))}
          </div>
        )}

        {/* Reactions */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <ReactionBar
            reactions={msg.reactions}
            currentUid={currentUid}
            onToggle={(emoji) => onToggleReaction(msg.id, emoji, msg.reactions)}
          />
        )}

        {/* Reply count */}
        <button
          onClick={() => onReply(msg)}
          className="mt-1 flex items-center gap-1 text-[11px] text-text-dim/30 opacity-0 transition-opacity duration-150 hover:text-[#00C6FF] group-hover:opacity-100 focus-visible:opacity-100 active:scale-95"
        >
          <Reply className="h-3 w-3" />
          {msg.replyCount > 0
            ? `${msg.replyCount} ${msg.replyCount === 1 ? 'reply' : 'replies'}`
            : 'Reply'}
        </button>
      </div>

      {/* Hover Actions */}
      <AnimatePresence>
        {showActions && !msg.isDeleted && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.1 }}
            className="absolute -top-3 right-2 flex items-center gap-0.5 rounded-sm border border-[rgba(246,196,69,0.12)] bg-[#111B24] px-1 py-0.5 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
          >
            <button
              onClick={() => onReact(msg.id)}
              className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-gold transition-colors"
              title="React"
            >
              <Smile className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onReply(msg)}
              className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-[#00C6FF] transition-colors"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>
            {isOwn && (
              <button
                onClick={() => { setEditing(true); setEditBody(msg.body) }}
                className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-gold transition-colors"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {(isOwn || isAdmin) && (
              <button
                onClick={() => onDelete(msg.id)}
                className="rounded-sm p-1 text-text-dim/40 hover:bg-white/[0.06] hover:text-red-400 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onPin(msg.id)}
                className={`rounded-sm p-1 transition-colors hover:bg-white/[0.06] ${
                  msg.isPinned ? 'text-gold' : 'text-text-dim/40 hover:text-gold'
                }`}
                title={msg.isPinned ? 'Unpin' : 'Pin'}
              >
                <Pin className="h-3.5 w-3.5" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/community/MessageBubble.jsx
git commit -m "feat(community): add MessageBubble component with actions, edit, delete"
```

---

## Task 12: Create ReactionBar + AttachmentPreview Components

**Files:**
- Create: `frontend/src/components/community/ReactionBar.jsx`
- Create: `frontend/src/components/community/AttachmentPreview.jsx`

**Step 1: Write ReactionBar**

```jsx
import { SmilePlus } from 'lucide-react'

export default function ReactionBar({ reactions, currentUid, onToggle, onAddNew }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {Object.entries(reactions).map(([emoji, uids]) => {
        if (!uids || uids.length === 0) return null
        const hasReacted = uids.includes(currentUid)
        return (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors duration-100 active:scale-95 ${
              hasReacted
                ? 'border-[rgba(0,198,255,0.3)] bg-[rgba(0,198,255,0.08)] text-[#00C6FF]'
                : 'border-[rgba(246,196,69,0.1)] bg-white/[0.03] text-text-dim/50 hover:bg-white/[0.06]'
            }`}
            title={`${uids.length} reaction${uids.length > 1 ? 's' : ''}`}
          >
            <span>{emoji}</span>
            <span className="text-[10px] font-medium">{uids.length}</span>
          </button>
        )
      })}
    </div>
  )
}
```

**Step 2: Write AttachmentPreview**

```jsx
import { FileText, Download, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function AttachmentPreview({ attachment }) {
  const [lightbox, setLightbox] = useState(false)
  const isImage = attachment.type?.startsWith('image/')

  if (isImage) {
    return (
      <>
        <button
          onClick={() => setLightbox(true)}
          className="max-w-[260px] overflow-hidden rounded-sm border border-[rgba(246,196,69,0.08)] transition-opacity hover:opacity-80"
        >
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-full rounded-sm"
            loading="lazy"
          />
        </button>
        {/* Lightbox */}
        {lightbox && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightbox(false)}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
              className="max-h-[85vh] max-w-[90vw] rounded-sm"
            />
          </div>
        )}
      </>
    )
  }

  // Non-image file card
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.1)] bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06]"
    >
      <FileText className="h-5 w-5 text-text-dim/40" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-parchment">{attachment.name}</p>
        <p className="text-[10px] text-text-dim/30">{formatSize(attachment.size)}</p>
      </div>
      <Download className="h-3.5 w-3.5 text-text-dim/30" />
    </a>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/community/ReactionBar.jsx frontend/src/components/community/AttachmentPreview.jsx
git commit -m "feat(community): add ReactionBar and AttachmentPreview components"
```

---

## Task 13: Create GifPicker Component

**Files:**
- Create: `frontend/src/components/community/GifPicker.jsx`

**Step 1: Write GifPicker**

Popover component with search bar and grid of GIF thumbnails. Uses `useGifSearch` hook.

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import useGifSearch from '../../hooks/useGifSearch'

export default function GifPicker({ onSelect, onClose }) {
  const { results, loading, error, searchGifs, trendingGifs, clearResults } = useGifSearch()
  const [searchTerm, setSearchTerm] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Load trending on mount
  useEffect(() => {
    trendingGifs()
  }, [trendingGifs])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const handleSearch = (val) => {
    setSearchTerm(val)
    if (val.trim()) {
      searchGifs(val)
    } else {
      trendingGifs()
    }
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-12 left-0 z-50 w-[340px] overflow-hidden rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(246,196,69,0.08)] px-3 py-2">
        <span className="text-xs font-heading font-semibold text-parchment">GIFs</span>
        <button onClick={onClose} className="text-text-dim/40 hover:text-parchment">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border-b border-[rgba(246,196,69,0.06)] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-text-dim/30" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search GIFs..."
          className="flex-1 bg-transparent text-xs text-parchment placeholder:text-text-dim/30 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => handleSearch('')} className="text-text-dim/30 hover:text-parchment">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Results Grid */}
      <div className="h-[280px] overflow-y-auto p-2">
        {loading && results.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-text-dim/30" />
          </div>
        ) : error ? (
          <p className="text-center text-xs text-red-400/60 py-8">{error}</p>
        ) : results.length === 0 ? (
          <p className="text-center text-xs text-text-dim/30 py-8">No GIFs found</p>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {results.map((gif) => (
              <button
                key={gif.id}
                onClick={() => { onSelect(gif.url, gif.title); onClose() }}
                className="overflow-hidden rounded-sm transition-opacity hover:opacity-75 active:scale-[0.98]"
              >
                <img
                  src={gif.preview || gif.url}
                  alt={gif.title}
                  className="h-[100px] w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Giphy attribution */}
      <div className="border-t border-[rgba(246,196,69,0.06)] px-3 py-1.5 text-center">
        <span className="text-[9px] text-text-dim/20">Powered by GIPHY</span>
      </div>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/GifPicker.jsx
git commit -m "feat(community): add GifPicker component with Giphy search"
```

---

## Task 14: Create EmojiPicker Component (Upgraded)

**Files:**
- Create: `frontend/src/components/community/EmojiPicker.jsx`

**Step 1: Write categorized EmojiPicker**

```jsx
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const CATEGORIES = {
  'Smileys': ['😀','😂','🤣','😊','😍','🥰','😎','🤩','😤','😱','🤯','😭','🥺','😈','🤗','🫡'],
  'Hands': ['👍','👎','👊','✊','🤝','👏','🙌','💪','🤞','✌️','🤙','👋','🫶','🤘','👆','👇'],
  'Fire': ['🔥','⚡','💯','💰','🏠','📈','🎯','🏆','💎','🚀','💥','✅','❌','⭐','🎉','🎊'],
  'Objects': ['📊','📋','🔑','💼','📱','💻','📝','📌','🔔','💡','⏰','📍','🏷️','📎','🗂️','📂'],
}

export default function EmojiPicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 6, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute bottom-8 right-0 z-50 w-[260px] rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
    >
      {/* Category tabs */}
      <div className="flex gap-1 border-b border-[rgba(246,196,69,0.08)] px-2 py-1.5">
        {Object.keys(CATEGORIES).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-sm px-2 py-0.5 text-[10px] font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[rgba(0,198,255,0.1)] text-[#00C6FF]'
                : 'text-text-dim/40 hover:text-text-dim/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-0.5 p-2">
        {CATEGORIES[activeCategory].map((em) => (
          <button
            key={em}
            onClick={() => { onSelect(em); onClose() }}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-base transition-transform duration-100 hover:scale-125 hover:bg-white/[0.06] active:scale-95"
          >
            {em}
          </button>
        ))}
      </div>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/EmojiPicker.jsx
git commit -m "feat(community): add categorized EmojiPicker component"
```

---

## Task 15: Create TypingIndicator + PinnedMessagesBar Components

**Files:**
- Create: `frontend/src/components/community/TypingIndicator.jsx`
- Create: `frontend/src/components/community/PinnedMessagesBar.jsx`

**Step 1: Write TypingIndicator**

```jsx
import { motion, AnimatePresence } from 'framer-motion'

export default function TypingIndicator({ typingUsers, currentUid }) {
  // Filter out current user
  const others = typingUsers.filter((u) => u.odId !== currentUid)
  if (others.length === 0) return null

  const text =
    others.length === 1
      ? `${others[0].displayName} is typing`
      : others.length === 2
        ? `${others[0].displayName} and ${others[1].displayName} are typing`
        : `${others[0].displayName} and ${others.length - 1} others are typing`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-5 py-1"
      >
        <div className="flex items-center gap-2 text-[11px] text-text-dim/40">
          <span className="flex gap-0.5">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="h-1 w-1 rounded-full bg-[#00C6FF]" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-1 w-1 rounded-full bg-[#00C6FF]" />
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-1 w-1 rounded-full bg-[#00C6FF]" />
          </span>
          <span>{text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```

**Step 2: Write PinnedMessagesBar**

```jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pin, ChevronDown, ChevronUp, X } from 'lucide-react'

function fmtTime(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function PinnedMessagesBar({ pinnedMessages, isAdmin, onUnpin, onScrollTo }) {
  const [expanded, setExpanded] = useState(false)

  if (!pinnedMessages || pinnedMessages.length === 0) return null

  return (
    <div className="border-b border-[rgba(246,196,69,0.08)]">
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-5 py-2 text-left transition-colors hover:bg-white/[0.02]"
      >
        <Pin className="h-3 w-3 text-gold/60" />
        <span className="text-xs font-medium text-gold/70">
          {pinnedMessages.length} pinned message{pinnedMessages.length > 1 ? 's' : ''}
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-3 w-3 text-text-dim/30" />
        ) : (
          <ChevronDown className="ml-auto h-3 w-3 text-text-dim/30" />
        )}
      </button>

      {/* Expanded list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-[200px] overflow-y-auto"
          >
            {pinnedMessages.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-2 border-t border-[rgba(246,196,69,0.04)] px-5 py-2 hover:bg-white/[0.02]"
              >
                <button
                  onClick={() => onScrollTo(msg.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-heading font-semibold text-parchment">
                      {msg.authorName}
                    </span>
                    <span className="text-[9px] text-text-dim/25">{fmtTime(msg.createdAt)}</span>
                  </div>
                  <p className="truncate text-xs text-text-dim/50">{msg.body}</p>
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onUnpin(msg.id)}
                    className="shrink-0 text-text-dim/30 hover:text-red-400 transition-colors"
                    title="Unpin"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/community/TypingIndicator.jsx frontend/src/components/community/PinnedMessagesBar.jsx
git commit -m "feat(community): add TypingIndicator and PinnedMessagesBar components"
```

---

## Task 16: Create MessageInput Component (with GIF, Emoji, File Upload toolbar)

**Files:**
- Create: `frontend/src/components/community/MessageInput.jsx`

**Step 1: Write MessageInput**

This is the composable input bar that includes the text field, emoji picker, GIF picker, file upload button, and send button. Used in both the main feed and the thread panel.

```jsx
import { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Send, SmilePlus, Image, Paperclip, X, Loader2 } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import GifPicker from './GifPicker'

export default function MessageInput({
  placeholder,
  onSend,
  onTyping,
  fileUpload, // { upload, progress, uploading, error, clearError }
}) {
  const [body, setBody] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showGif, setShowGif] = useState(false)
  const [pendingGif, setPendingGif] = useState(null) // { url, title }
  const [pendingAttachments, setPendingAttachments] = useState([])
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    const trimmed = body.trim()
    if (!trimmed && !pendingGif && pendingAttachments.length === 0) return
    onSend(
      trimmed,
      pendingGif?.url || null,
      pendingGif?.title || null,
      pendingAttachments,
    )
    setBody('')
    setPendingGif(null)
    setPendingAttachments([])
    inputRef.current?.focus()
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleChange = (e) => {
    setBody(e.target.value)
    onTyping?.(true)
  }

  const handleEmojiSelect = (emoji) => {
    setBody((prev) => prev + emoji)
    inputRef.current?.focus()
  }

  const handleGifSelect = (url, title) => {
    setPendingGif({ url, title })
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !fileUpload) return
    const attachment = await fileUpload.upload(file)
    if (attachment) {
      setPendingAttachments((prev) => [...prev, attachment])
    }
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingGif = () => setPendingGif(null)
  const removePendingAttachment = (idx) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const hasContent = body.trim() || pendingGif || pendingAttachments.length > 0

  return (
    <div className="border-t border-[rgba(246,196,69,0.10)] px-5 py-3">
      {/* Pending previews */}
      {(pendingGif || pendingAttachments.length > 0 || fileUpload?.uploading) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {pendingGif && (
            <div className="relative inline-block">
              <img src={pendingGif.url} alt={pendingGif.title} className="h-16 rounded-sm" />
              <button
                onClick={removePendingGif}
                className="absolute -top-1 -right-1 rounded-full bg-black/70 p-0.5 text-white hover:bg-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {pendingAttachments.map((att, i) => (
            <div key={i} className="relative flex items-center gap-1 rounded-sm border border-[rgba(246,196,69,0.1)] bg-white/[0.03] px-2 py-1">
              <span className="text-[10px] text-parchment truncate max-w-[120px]">{att.name}</span>
              <button
                onClick={() => removePendingAttachment(i)}
                className="text-text-dim/40 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {fileUpload?.uploading && (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin text-[#00C6FF]" />
              <span className="text-[10px] text-text-dim/40">{fileUpload.progress}%</span>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div className="relative flex items-center gap-2 rounded-sm border border-[rgba(246,196,69,0.12)] bg-black/30 px-3 py-2 focus-within:border-[rgba(246,196,69,0.25)]">
        {/* File upload */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx"
        />

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={body}
          onChange={handleChange}
          onKeyDown={handleKey}
          placeholder={placeholder || 'Type a message...'}
          className="min-w-0 flex-1 bg-transparent text-sm text-parchment placeholder:text-text-dim/30 focus:outline-none"
        />

        {/* GIF button */}
        <div className="relative">
          <button
            onClick={() => { setShowGif((v) => !v); setShowEmoji(false) }}
            className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
            title="GIF"
          >
            <Image className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showGif && (
              <GifPicker
                onSelect={(url, title) => { handleGifSelect(url, title); setShowGif(false) }}
                onClose={() => setShowGif(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => { setShowEmoji((v) => !v); setShowGif(false) }}
            className="text-text-dim/40 transition-colors duration-150 hover:text-gold focus-visible:outline-none active:scale-90"
            title="Emoji"
          >
            <SmilePlus className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {showEmoji && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmoji(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!hasContent}
          className={`transition-colors duration-150 focus-visible:outline-none active:scale-90 ${
            hasContent ? 'text-[#00C6FF]' : 'text-text-dim/20'
          }`}
          title="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* File upload error */}
      {fileUpload?.error && (
        <p className="mt-1 text-[10px] text-red-400/70">
          {fileUpload.error}
          <button onClick={fileUpload.clearError} className="ml-1 underline">dismiss</button>
        </p>
      )}
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/MessageInput.jsx
git commit -m "feat(community): add MessageInput with GIF, emoji, file upload toolbar"
```

---

## Task 17: Create OnlineUsersList Component

**Files:**
- Create: `frontend/src/components/community/OnlineUsersList.jsx`

**Step 1: Write OnlineUsersList**

```jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function OnlineUsersList({ onlineUsers, currentUid }) {
  const [expanded, setExpanded] = useState(false)
  const others = onlineUsers.filter((u) => u.odId !== currentUid)

  return (
    <div className="border-t border-[rgba(246,196,69,0.10)] px-3 py-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left"
      >
        <div className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-dim/40">
          Online — {others.length + 1}
        </span>
        {expanded ? (
          <ChevronUp className="ml-auto h-3 w-3 text-text-dim/25" />
        ) : (
          <ChevronDown className="ml-auto h-3 w-3 text-text-dim/25" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="mt-2 max-h-[150px] space-y-1 overflow-y-auto"
          >
            {others.map((u) => (
              <div key={u.odId} className="flex items-center gap-2">
                <div className="relative">
                  <div className="hanko-seal flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold">
                    {initials(u.displayName)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#0B0F14] bg-green-400" />
                </div>
                <span className="truncate text-[10px] text-text-dim/60">{u.displayName}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/community/OnlineUsersList.jsx
git commit -m "feat(community): add OnlineUsersList component"
```

---

## Task 18: Create MentionAutocomplete Component

**Files:**
- Create: `frontend/src/components/community/MentionAutocomplete.jsx`

**Step 1: Write MentionAutocomplete**

A dropdown that shows when user types `@` in the input. Lists online users for selection.

```jsx
import { motion } from 'framer-motion'

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function MentionAutocomplete({ query, users, onSelect, visible }) {
  if (!visible || !query) return null

  const filtered = users.filter((u) =>
    u.displayName?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5)

  if (filtered.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute bottom-full left-0 mb-1 w-[200px] rounded-sm border border-[rgba(246,196,69,0.15)] bg-[#111B24] py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
    >
      {filtered.map((u) => (
        <button
          key={u.odId}
          onClick={() => onSelect(u.displayName)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-text-dim hover:bg-white/[0.06] hover:text-parchment transition-colors"
        >
          <div className="hanko-seal flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold">
            {initials(u.displayName)}
          </div>
          {u.displayName}
        </button>
      ))}
    </motion.div>
  )
}
```

**Note:** This component is rendered inside MessageInput. Task 19 will wire it up when we update MessageInput to support @mentions.

**Step 2: Commit**

```bash
git add frontend/src/components/community/MentionAutocomplete.jsx
git commit -m "feat(community): add MentionAutocomplete dropdown component"
```

---

## Task 19: Rewrite Community.jsx as Layout Shell

**Files:**
- Modify: `frontend/src/pages/Community.jsx` (full rewrite)

**Step 1: Rewrite Community.jsx**

Replace the entire 559-line monolith with a thin layout shell that composes all the new hooks and components.

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Hash, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../lib/firebase'
import UserProfileCard from '../components/UserProfileCard'

// Hooks
import useMessages from '../hooks/useMessages'
import useReplies from '../hooks/useReplies'
import useReactions from '../hooks/useReactions'
import usePresence from '../hooks/usePresence'
import useOnlineUsers from '../hooks/useOnlineUsers'
import useFileUpload from '../hooks/useFileUpload'
import usePinnedMessages from '../hooks/usePinnedMessages'

// Components
import MessageBubble from '../components/community/MessageBubble'
import MessageInput from '../components/community/MessageInput'
import TypingIndicator from '../components/community/TypingIndicator'
import PinnedMessagesBar from '../components/community/PinnedMessagesBar'
import OnlineUsersList from '../components/community/OnlineUsersList'
import EmojiPicker from '../components/community/EmojiPicker'

/* ── constants ─────────────────────────────────────────── */
const CHANNELS = [
  { id: 'general', name: 'General', desc: 'Hang out and chat with the community' },
  { id: 'wins', name: 'Wins', desc: 'Share your wins and celebrate together' },
  { id: 'deal-talk', name: 'Deal Talk', desc: 'Discuss deals, comps, and strategy' },
  { id: 'questions', name: 'Questions', desc: 'Ask anything and get help' },
  { id: 'resources', name: 'Resources', desc: 'Share useful links and tools' },
]

const QUICK_REACTIONS = ['👍','🔥','💯','😂','❤️','🎯']

function initials(name) {
  if (!name) return '??'
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

/* ── component ─────────────────────────────────────────── */
export default function Community() {
  const { user, isAdmin } = useAuth()
  const [activeChannel, setActiveChannel] = useState('general')
  const [activeThread, setActiveThread] = useState(null)
  const [profilePopover, setProfilePopover] = useState(null)
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null)

  const feedEnd = useRef(null)
  const replyEnd = useRef(null)
  const messageRefs = useRef({})

  const displayName = user?.name || user?.username || 'Guest'
  const displayEmail = user?.email || 'guest@dispodojo.com'
  const currentUid = user?.firebaseUid || auth.currentUser?.uid
  const channelMeta = CHANNELS.find((c) => c.id === activeChannel)

  // Hooks
  const { messages, sendMessage, editMessage, deleteMessage, loading, error } = useMessages(activeChannel)
  const { replies, sendReply, loading: repliesLoading } = useReplies(activeThread?.id)
  const { toggleReaction } = useReactions()
  const { setTyping } = usePresence(displayName, activeChannel)
  const { onlineUsers, typingUsers } = useOnlineUsers(activeChannel)
  const fileUpload = useFileUpload(activeChannel)
  const replyFileUpload = useFileUpload(activeChannel)
  const { pinnedMessages, pinMessage, unpinMessage } = usePinnedMessages(activeChannel)

  // Auto-scroll
  useEffect(() => {
    feedEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    replyEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies])

  // Channel switch
  const switchChannel = useCallback((id) => {
    setActiveChannel(id)
    setActiveThread(null)
    setProfilePopover(null)
    setReactionPickerMsgId(null)
  }, [])

  // Send handlers
  const handleSendMessage = useCallback((body, gifUrl, gifTitle, attachments) => {
    sendMessage(body, displayName, displayEmail, gifUrl, gifTitle, attachments)
    setTyping(false)
  }, [sendMessage, displayName, displayEmail, setTyping])

  const handleSendReply = useCallback((body, gifUrl, gifTitle, attachments) => {
    sendReply(body, displayName, displayEmail, gifUrl, gifTitle, attachments)
  }, [sendReply, displayName, displayEmail])

  // Pin toggle
  const handlePinToggle = useCallback((messageId) => {
    const msg = messages.find((m) => m.id === messageId)
    if (msg?.isPinned) {
      unpinMessage(messageId)
    } else {
      pinMessage(messageId)
    }
  }, [messages, pinMessage, unpinMessage])

  // Scroll to pinned message
  const scrollToMessage = useCallback((messageId) => {
    const el = messageRefs.current[messageId]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-1', 'ring-gold/30')
      setTimeout(() => el.classList.remove('ring-1', 'ring-gold/30'), 2000)
    }
  }, [])

  // Author click for profile popover
  const handleAuthorClick = useCallback((msg) => {
    setProfilePopover(
      profilePopover?.id === msg.id
        ? null
        : { id: msg.id, name: msg.authorName, email: msg.authorEmail }
    )
  }, [profilePopover])

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">

      {/* ── LEFT: Channel sidebar ──────────────────────────────── */}
      <aside className="lacquer-deep flex w-[220px] shrink-0 flex-col border-r border-[rgba(246,196,69,0.10)]">
        <div className="px-4 pt-5 pb-3">
          <h2 className="font-display text-lg tracking-wide text-gold">Community</h2>
        </div>

        <div className="px-4 pb-1">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-text-dim/50">
            Channels
          </span>
          <div className="katana-line mt-1.5" />
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-1">
          {CHANNELS.map((ch) => (
            <button
              key={ch.id}
              onClick={() => switchChannel(ch.id)}
              className={`flex w-full items-center gap-2 rounded-sm px-2.5 py-1.5 text-left text-sm transition-colors duration-150
                ${
                  activeChannel === ch.id
                    ? 'bg-[rgba(0,198,255,0.08)] font-medium text-[#00C6FF]'
                    : 'text-text-dim hover:bg-white/[0.04] hover:text-parchment'
                }
              `}
            >
              <Hash className="h-3.5 w-3.5 shrink-0 opacity-60" />
              {ch.name}
            </button>
          ))}
        </nav>

        {/* Online users */}
        <OnlineUsersList onlineUsers={onlineUsers} currentUid={currentUid} />

        {/* User card */}
        <div className="border-t border-[rgba(246,196,69,0.10)] px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                {initials(displayName)}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0F14] bg-green-400" />
            </div>
            <span className="truncate text-xs font-heading font-semibold text-parchment">
              {displayName}
            </span>
          </div>
        </div>
      </aside>

      {/* ── CENTER: Message feed ───────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Channel header */}
        <header className="lacquer-bar flex items-center gap-2 border-b border-[rgba(246,196,69,0.10)] px-5 py-3">
          <Hash className="h-4 w-4 text-text-dim/50" />
          <span className="font-heading text-sm font-semibold text-parchment">
            {channelMeta?.name}
          </span>
          <span className="ml-2 text-xs text-text-dim/40">
            {channelMeta?.desc}
          </span>
        </header>

        {/* Pinned messages */}
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          isAdmin={isAdmin}
          onUnpin={unpinMessage}
          onScrollTo={scrollToMessage}
        />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00C6FF] border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-red-400/50">
              <p className="text-sm">Failed to load messages</p>
              <p className="text-xs">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-text-dim/30">
              <MessageSquare className="h-10 w-10" />
              <p className="text-sm">No messages yet. Be the first to post!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  ref={(el) => { messageRefs.current[msg.id] = el }}
                  className="relative transition-all duration-500"
                >
                  <MessageBubble
                    msg={msg}
                    isOwn={msg.authorId === currentUid}
                    isAdmin={isAdmin}
                    currentUid={currentUid}
                    onReply={(m) => setActiveThread(m)}
                    onReact={(id) => setReactionPickerMsgId(reactionPickerMsgId === id ? null : id)}
                    onEdit={editMessage}
                    onDelete={deleteMessage}
                    onPin={handlePinToggle}
                    onToggleReaction={toggleReaction}
                    onAuthorClick={handleAuthorClick}
                  />

                  {/* Quick reaction picker */}
                  <AnimatePresence>
                    {reactionPickerMsgId === msg.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute -top-8 right-12 z-50 flex gap-0.5 rounded-full border border-[rgba(246,196,69,0.15)] bg-[#111B24] px-2 py-1 shadow-[0_4px_16px_rgba(0,0,0,0.5)]"
                      >
                        {QUICK_REACTIONS.map((em) => (
                          <button
                            key={em}
                            onClick={() => {
                              toggleReaction(msg.id, em, msg.reactions)
                              setReactionPickerMsgId(null)
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-sm hover:scale-125 hover:bg-white/[0.08] transition-transform active:scale-95"
                          >
                            {em}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Profile popover */}
                  <AnimatePresence>
                    {profilePopover?.id === msg.id && (
                      <div className="absolute left-11 top-0 z-40">
                        <UserProfileCard
                          name={profilePopover.name}
                          email={profilePopover.email}
                          onClose={() => setProfilePopover(null)}
                        />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
              <div ref={feedEnd} />
            </div>
          )}
        </div>

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} currentUid={currentUid} />

        {/* Message input */}
        <MessageInput
          placeholder={`Message #${channelMeta?.name || 'general'}...`}
          onSend={handleSendMessage}
          onTyping={setTyping}
          fileUpload={fileUpload}
        />
      </main>

      {/* ── RIGHT: Thread panel ────────────────────────────────── */}
      <AnimatePresence>
        {activeThread && (
          <motion.aside
            key="thread-panel"
            initial={{ x: 350, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 350, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="flex w-[350px] shrink-0 flex-col border-l border-[rgba(246,196,69,0.10)] bg-[#0B0F14]"
          >
            {/* Thread header */}
            <header className="flex items-center justify-between border-b border-[rgba(246,196,69,0.10)] px-4 py-3">
              <span className="font-heading text-sm font-semibold text-parchment">Thread</span>
              <button
                onClick={() => setActiveThread(null)}
                className="text-text-dim/40 transition-colors duration-150 hover:text-parchment focus-visible:outline-none active:scale-90"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Parent message */}
            <div className="border-b border-[rgba(246,196,69,0.06)] px-4 py-3">
              <div className="flex gap-3">
                <div className="hanko-seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[9px] font-bold">
                  {initials(activeThread.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-heading text-sm font-semibold text-parchment">
                    {activeThread.authorName}
                  </span>
                  <p className="mt-0.5 text-sm leading-relaxed text-text-dim break-words">
                    {activeThread.body}
                  </p>
                  {activeThread.gifUrl && (
                    <img src={activeThread.gifUrl} alt={activeThread.gifTitle || 'GIF'} className="mt-2 max-w-[250px] rounded-sm" />
                  )}
                </div>
              </div>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {replies.length === 0 ? (
                <p className="text-center text-xs text-text-dim/25">No replies yet</p>
              ) : (
                <div className="space-y-3">
                  {replies.map((r) => (
                    <div key={r.id} className="flex gap-2.5">
                      <div className="hanko-seal flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold">
                        {initials(r.authorName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-heading text-xs font-semibold text-parchment">
                          {r.authorName}
                        </span>
                        {r.isDeleted && !isAdmin ? (
                          <p className="text-xs italic text-text-dim/30">This reply was deleted</p>
                        ) : (
                          <>
                            <p className={`mt-0.5 text-xs leading-relaxed break-words ${r.isDeleted ? 'line-through text-text-dim/30' : 'text-text-dim'}`}>
                              {r.body}
                            </p>
                            {r.gifUrl && (
                              <img src={r.gifUrl} alt={r.gifTitle || 'GIF'} className="mt-1 max-w-[200px] rounded-sm" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={replyEnd} />
                </div>
              )}
            </div>

            {/* Reply input */}
            <MessageInput
              placeholder="Reply..."
              onSend={handleSendReply}
              fileUpload={replyFileUpload}
            />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  )
}
```

**Step 2: Verify the app compiles**

```bash
cd frontend && npm run build
```

**Step 3: Commit**

```bash
git add frontend/src/pages/Community.jsx
git commit -m "feat(community): rewrite Community.jsx as composable layout shell with all hooks + components"
```

---

## Task 20: Wire @Mentions into MessageInput

**Files:**
- Modify: `frontend/src/components/community/MessageInput.jsx`

**Step 1: Add mention state and autocomplete**

Add to MessageInput imports:
```jsx
import MentionAutocomplete from './MentionAutocomplete'
```

Add a prop `onlineUsers` to the component. Add state:
```jsx
const [mentionQuery, setMentionQuery] = useState('')
const [showMentions, setShowMentions] = useState(false)
```

Update `handleChange`:
```jsx
const handleChange = (e) => {
  const val = e.target.value
  setBody(val)
  onTyping?.(true)

  // Detect @mention
  const lastAt = val.lastIndexOf('@')
  if (lastAt !== -1 && lastAt === val.length - 1) {
    setShowMentions(true)
    setMentionQuery('')
  } else if (lastAt !== -1 && !val.slice(lastAt).includes(' ')) {
    setShowMentions(true)
    setMentionQuery(val.slice(lastAt + 1))
  } else {
    setShowMentions(false)
  }
}
```

Add mention select handler:
```jsx
const handleMentionSelect = (name) => {
  const lastAt = body.lastIndexOf('@')
  setBody(body.slice(0, lastAt) + `@${name} `)
  setShowMentions(false)
  inputRef.current?.focus()
}
```

Render `MentionAutocomplete` above the input bar (inside the `relative` container):
```jsx
<MentionAutocomplete
  query={mentionQuery}
  users={onlineUsers || []}
  onSelect={handleMentionSelect}
  visible={showMentions}
/>
```

**Step 2: Pass onlineUsers from Community.jsx to MessageInput**

In Community.jsx, update the MessageInput usage:
```jsx
<MessageInput
  placeholder={`Message #${channelMeta?.name || 'general'}...`}
  onSend={handleSendMessage}
  onTyping={setTyping}
  fileUpload={fileUpload}
  onlineUsers={onlineUsers}
/>
```

**Step 3: Commit**

```bash
git add frontend/src/components/community/MessageInput.jsx frontend/src/pages/Community.jsx
git commit -m "feat(community): wire @mentions autocomplete into MessageInput"
```

---

## Task 21: Verify, Fix, and Polish

**Step 1: Run the dev server and verify all features**

```bash
cd frontend && npm run dev
```

Test checklist:
- [ ] Can send a message and it appears in real-time
- [ ] Can switch channels and see different messages
- [ ] Can open a thread and send replies
- [ ] Emoji picker works (inserts emoji into input)
- [ ] GIF picker opens, shows trending, search works
- [ ] Can select a GIF and it sends with the message
- [ ] File upload button opens file picker
- [ ] Image uploads show inline, non-images show download card
- [ ] Emoji reactions on messages (click to toggle)
- [ ] Quick reaction picker appears on hover → react button
- [ ] Message hover actions show (reply, react, edit, delete, pin)
- [ ] Edit own message (pencil icon → inline edit → Enter to save)
- [ ] Delete own message (trash icon → soft delete)
- [ ] Admin sees deleted messages with "(Deleted)" tag
- [ ] Regular user sees "This message was deleted" placeholder
- [ ] Admin can pin/unpin messages
- [ ] Pinned messages bar shows at top of feed
- [ ] Click pinned message scrolls to it
- [ ] Typing indicator shows when other users type
- [ ] Online users list in sidebar with green dots
- [ ] @mention autocomplete appears when typing @
- [ ] User profile popover on author name click

**Step 2: Fix any compilation or runtime errors found during testing**

**Step 3: Run production build to verify**

```bash
cd frontend && npm run build
```

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(community): polish and fix issues from integration testing"
```

---

## Task 22: Deploy

**Step 1: Push to GitHub**

```bash
git push origin master
```

**Step 2: Deploy to Vercel**

```bash
cd frontend && npx vercel --prod
```

---

## Summary of Files Created/Modified

### New files (16):
- `frontend/src/hooks/useMessages.js`
- `frontend/src/hooks/useReplies.js`
- `frontend/src/hooks/useReactions.js`
- `frontend/src/hooks/usePresence.js`
- `frontend/src/hooks/useOnlineUsers.js`
- `frontend/src/hooks/useGifSearch.js`
- `frontend/src/hooks/useFileUpload.js`
- `frontend/src/hooks/usePinnedMessages.js`
- `frontend/src/components/community/MessageBubble.jsx`
- `frontend/src/components/community/ReactionBar.jsx`
- `frontend/src/components/community/AttachmentPreview.jsx`
- `frontend/src/components/community/GifPicker.jsx`
- `frontend/src/components/community/EmojiPicker.jsx`
- `frontend/src/components/community/TypingIndicator.jsx`
- `frontend/src/components/community/PinnedMessagesBar.jsx`
- `frontend/src/components/community/MessageInput.jsx`
- `frontend/src/components/community/OnlineUsersList.jsx`
- `frontend/src/components/community/MentionAutocomplete.jsx`

### Modified files (3):
- `frontend/src/lib/firebase.js` (add Storage export)
- `frontend/src/context/AuthContext.jsx` (expose Firebase UID)
- `frontend/src/pages/Community.jsx` (full rewrite as layout shell)
