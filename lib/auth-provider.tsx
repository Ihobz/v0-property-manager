"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"

type AuthContextType = {
  isAdmin: boolean | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: null,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClientSupabaseClient()

        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // Check if user is an admin
          const { data: admin } = await supabase.from("admins").select("*").eq("email", session.user.email).single()

          setIsAdmin(!!admin)
        } else {
          setIsAdmin(false)
        }
      } catch (error) {
        console.error("Error checking auth session:", error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const supabase = createClientSupabaseClient()

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }
      return { success: false, error: error.message }

      // Check if user is an admin
      const { data: admin } = await supabase.from("admins").select("*").eq("email", email).single()

      if (!admin) {
        // Sign out if not an admin
        await supabase.auth.signOut()
        return { success: false, error: "Not authorized as admin" }
      }

      setIsAdmin(true)
      return { success: true }
    } catch (error) {
      console.error("Error signing in:", error)
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setIsAdmin(false)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ isAdmin, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
