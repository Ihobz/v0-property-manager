"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { logAuthEvent } from "@/lib/logging"

type AuthContextType = {
  isAdmin: boolean | null
  user: any | null
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: null,
  user: null,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [user, setUser] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("AuthProvider: Checking session...")
        const supabase = createClientSupabaseClient()

        // Check if user is authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        console.log("AuthProvider: Session check result:", !!session)

        if (session) {
          setUser(session.user)

          // Check if user is an admin
          console.log("AuthProvider: Checking if user is admin:", session.user.email)
          const { data: admin, error: adminError } = await supabase
            .from("admins")
            .select("*")
            .eq("email", session.user.email)
            .single()

          if (adminError) {
            console.error("AuthProvider: Error checking admin status:", adminError)
          }

          console.log("AuthProvider: Admin check result:", !!admin)
          setIsAdmin(!!admin)

          try {
            await logAuthEvent(`User session found for ${session.user.email}`, "info")
          } catch (logError) {
            console.warn("Failed to log auth event:", logError)
          }
        } else {
          setUser(null)
          setIsAdmin(false)
          try {
            await logAuthEvent("No active user session", "info")
          } catch (logError) {
            console.warn("Failed to log auth event:", logError)
          }
        }
      } catch (error) {
        console.error("AuthProvider: Error checking auth session:", error)
        setUser(null)
        setIsAdmin(false)
        try {
          await logAuthEvent("Error checking auth session", "error", { error: String(error) })
        } catch (logError) {
          console.warn("Failed to log auth event:", logError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log("AuthProvider: Attempting sign in for:", email)
      try {
        await logAuthEvent(`Sign in attempt for ${email}`, "info")
      } catch (logError) {
        console.warn("Failed to log auth event:", logError)
      }

      const supabase = createClientSupabaseClient()

      // Sign in with email and password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("AuthProvider: Sign in error:", error)
        try {
          await logAuthEvent(`Sign in failed for ${email}`, "error", { error: error.message })
        } catch (logError) {
          console.warn("Failed to log auth event:", logError)
        }
        return { success: false, error: error.message }
      }

      // Check if user is an admin
      const { data: admin, error: adminError } = await supabase.from("admins").select("*").eq("email", email).single()

      if (adminError) {
        console.error("AuthProvider: Error checking admin status:", adminError)
        try {
          await logAuthEvent(`Error checking admin status for ${email}`, "error", { error: adminError.message })
        } catch (logError) {
          console.warn("Failed to log auth event:", logError)
        }
      }

      if (!admin) {
        // Sign out if not an admin
        console.log("AuthProvider: User is not an admin, signing out")
        try {
          await logAuthEvent(`User ${email} is not an admin, signing out`, "warning")
        } catch (logError) {
          console.warn("Failed to log auth event:", logError)
        }
        await supabase.auth.signOut()
        setUser(null)
        setIsAdmin(false)
        return { success: false, error: "Not authorized as admin" }
      }

      console.log("AuthProvider: Sign in successful for admin:", email)
      try {
        await logAuthEvent(`Admin sign in successful for ${email}`, "info")
      } catch (logError) {
        console.warn("Failed to log auth event:", logError)
      }
      setUser(data.user)
      setIsAdmin(true)
      return { success: true }
    } catch (error) {
      console.error("AuthProvider: Unexpected error during sign in:", error)
      try {
        await logAuthEvent("Unexpected error during sign in", "error", { error: String(error) })
      } catch (logError) {
        console.warn("Failed to log auth event:", logError)
      }
      return { success: false, error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      console.log("AuthProvider: Signing out")
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      setIsAdmin(false)
      try {
        await logAuthEvent("User signed out", "info")
      } catch (logError) {
        console.warn("Failed to log auth event:", logError)
      }
    } catch (error) {
      console.error("AuthProvider: Error signing out:", error)
      try {
        await logAuthEvent("Error signing out", "error", { error: String(error) })
      } catch (logError) {
        console.warn("Failed to log auth event:", logError)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ isAdmin, user, signIn, signOut }}>{!isLoading && children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
