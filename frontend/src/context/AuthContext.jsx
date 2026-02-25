import { createContext, useContext, useState, useEffect } from 'react'
import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { getOrCreateProfile, updateProfile as fsUpdateProfile } from '../lib/userProfile'

const AuthContext = createContext(null)

const ADMIN_EMAIL = 'admin@dispodojo.com'
const ADMIN_PASSWORD = 'GodFirst2026!'

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem('dispo_users') || '[]')
  } catch {
    return []
  }
}

function saveUsers(users) {
  localStorage.setItem('dispo_users', JSON.stringify(users))
}

function loadUser() {
  try {
    const stored = localStorage.getItem('dispo_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [users, setUsers] = useState(loadUsers)
  const [firebaseReady, setFirebaseReady] = useState(false)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    if (user) {
      localStorage.setItem('dispo_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('dispo_user')
    }
  }, [user])

  useEffect(() => {
    saveUsers(users)
  }, [users])

  // Sign in anonymously to Firebase when user is already logged in from localStorage
  useEffect(() => {
    if (user) {
      signInAnonymously(auth)
        .then((cred) => {
          const uid = cred.user.uid
          setUser((prev) => (prev ? { ...prev, firebaseUid: uid } : prev))
          setFirebaseReady(true)
          return getOrCreateProfile(uid, user)
        })
        .then((prof) => setProfile(prof))
        .catch(console.error)
    }
  }, [])

  const login = (identifier, password) => {
    // Admin login
    if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { email: ADMIN_EMAIL, name: 'Admin', isAdmin: true }
      setUser(adminUser)
      signInAnonymously(auth)
        .then((cred) => {
          const uid = cred.user.uid
          setUser((prev) => (prev ? { ...prev, firebaseUid: uid } : prev))
          setFirebaseReady(true)
          return getOrCreateProfile(uid, adminUser)
        })
        .then((prof) => setProfile(prof))
        .catch(console.error)
      return { success: true }
    }

    if (identifier === ADMIN_EMAIL) {
      return { success: false, error: 'Invalid admin credentials' }
    }

    // Find user by email or username
    const existing = users.find(
      (u) => u.email === identifier || u.username === identifier
    )

    if (!existing) {
      return { success: false, error: 'No account found. Please sign up first.' }
    }

    if (existing.password !== password) {
      return { success: false, error: 'Incorrect password' }
    }

    const loggedInUser = {
      email: existing.email,
      name: existing.name,
      username: existing.username,
      isAdmin: false,
    }
    setUser(loggedInUser)
    signInAnonymously(auth)
      .then((cred) => {
        const uid = cred.user.uid
        setUser((prev) => (prev ? { ...prev, firebaseUid: uid } : prev))
        setFirebaseReady(true)
        return getOrCreateProfile(uid, loggedInUser)
      })
      .then((prof) => setProfile(prof))
      .catch(console.error)
    return { success: true }
  }

  const signup = (name, email, phone, username, password) => {
    const emailExists = users.find((u) => u.email === email)
    if (emailExists) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const usernameExists = users.find((u) => u.username === username)
    if (usernameExists) {
      return { success: false, error: 'This username is already taken' }
    }

    const newUser = {
      name,
      email,
      phone,
      username,
      password,
      createdAt: new Date().toISOString(),
    }
    setUsers((prev) => [...prev, newUser])
    const signedUpUser = { email, name, username, isAdmin: false }
    setUser(signedUpUser)
    signInAnonymously(auth)
      .then((cred) => {
        const uid = cred.user.uid
        setUser((prev) => (prev ? { ...prev, firebaseUid: uid } : prev))
        setFirebaseReady(true)
        return getOrCreateProfile(uid, signedUpUser)
      })
      .then((prof) => setProfile(prof))
      .catch(console.error)
    return { success: true }
  }

  const quickLogin = () => {
    const guestUser = { email: 'guest@dispodojo.com', name: 'Guest', username: 'guest', isAdmin: false }
    setUser(guestUser)
    signInAnonymously(auth)
      .then((cred) => {
        const uid = cred.user.uid
        setUser((prev) => (prev ? { ...prev, firebaseUid: uid } : prev))
        setFirebaseReady(true)
        return getOrCreateProfile(uid, guestUser)
      })
      .then((prof) => setProfile(prof))
      .catch(console.error)
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    setProfile(null)
    setFirebaseReady(false)
    firebaseSignOut(auth).catch(console.error)
  }

  const updateProfile = async (data) => {
    if (!user?.firebaseUid) return
    await fsUpdateProfile(user.firebaseUid, data)
    setProfile((prev) => (prev ? { ...prev, ...data } : prev))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoggedIn: !!user,
        isAdmin: user?.isAdmin || false,
        firebaseUid: user?.firebaseUid || null,
        firebaseReady,
        profile,
        login,
        signup,
        quickLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
