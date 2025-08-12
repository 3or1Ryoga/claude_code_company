'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createBrowserSupabaseClient, getCurrentUser, signIn, signUp, signOut } from './supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createBrowserSupabaseClient())

  useEffect(() => {
    // 初期認証状態の取得
    const getInitialUser = async () => {
      try {
        const currentUser = await getCurrentUser(supabase)
        setUser(currentUser)
      } catch (error) {
        console.error('初期ユーザー取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialUser()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignIn = async (email, password) => {
    setLoading(true)
    try {
      const result = await signIn(supabase, email, password)
      if (result.user) {
        setUser(result.user)
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email, password) => {
    setLoading(true)
    try {
      const result = await signUp(supabase, email, password)
      if (result.user) {
        setUser(result.user)
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const result = await signOut(supabase)
      if (!result.error) {
        setUser(null)
      }
      return result
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    supabase
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}