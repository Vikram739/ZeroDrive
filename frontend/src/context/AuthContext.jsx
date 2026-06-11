import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../config/firebase'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle as googleSignIn,
  signOut as firebaseSignOut,
  getCurrentUserProfile,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getCurrentUserProfile()
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: profile.name ?? firebaseUser.displayName ?? firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL ?? null,
            storage_used_bytes: profile.storage_used_bytes ?? 0,
            created_at: profile.created_at ?? null,
          })
        } catch {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName ?? firebaseUser.email.split('@')[0],
            photoURL: firebaseUser.photoURL ?? null,
            storage_used_bytes: 0,
            created_at: null,
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signUp = async (name, email, password) => {
    setError(null)
    await signUpWithEmail(name, email, password)
  }

  const signIn = async (email, password) => {
    setError(null)
    await signInWithEmail(email, password)
  }

  const signInWithGoogle = async () => {
    setError(null)
    await googleSignIn()
  }

  const signOut = async () => {
    setError(null)
    await firebaseSignOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        error,
        setError,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
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
