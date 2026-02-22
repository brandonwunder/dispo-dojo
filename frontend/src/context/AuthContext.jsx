import { createContext, useContext, useState, useEffect } from 'react'

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState(loadUsers)

  useEffect(() => {
    saveUsers(users)
  }, [users])

  const login = (identifier, password) => {
    // Admin login
    if (identifier === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setUser({ email: ADMIN_EMAIL, name: 'Admin', isAdmin: true })
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

    setUser({
      email: existing.email,
      name: existing.name,
      username: existing.username,
      isAdmin: false,
    })
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
    setUser({ email, name, username, isAdmin: false })
    return { success: true }
  }

  const quickLogin = () => {
    setUser({ email: 'guest@dispodojo.com', name: 'Guest', username: 'guest', isAdmin: false })
    return { success: true }
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isLoggedIn: !!user,
        isAdmin: user?.isAdmin || false,
        login,
        signup,
        quickLogin,
        logout,
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
