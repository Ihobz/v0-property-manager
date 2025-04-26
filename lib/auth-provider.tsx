"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getSupabaseBrowserClient } from "./supabase/client"

// Define the auth context type
type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkSession: () => Promise<void>
}

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  error: null,
  login: async () => ({ success: false, error: "Not implemented" }),
  logout: async () => {},
  checkSession: async () => {},
})

// Auth provider props
interface AuthProviderProps {
  children: ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3

  // Check if the user is authenticated and is an admin
  const checkSession = async () => {
    try {
      setError(null)
      console.log("Checking session...")

      const supabase = getSupabaseBrowserClient()

      // Get the session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("AuthProvider: Error getting session:", sessionError)
        setError(`Authentication error: ${sessionError.message}`)
        setIsAuthenticated(false)
        setIsAdmin(false)
        return
      }

      if (!session) {
        console.log("No session found")
        setIsAuthenticated(false)
        setIsAdmin(false)
        return
      }

      console.log("Session found, user is authenticated")
      setIsAuthenticated(true)

      // Check if the user is an admin
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", session.user.email)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("AuthProvider: Error checking admin status:", adminError)

          // If this is a network error and we haven't exceeded max retries
          if (adminError.message.includes("fetch") && retryCount < MAX_RETRIES) {
            console.log(`Retrying admin check (${retryCount + 1}/${MAX_RETRIES})`)
            setRetryCount((prev) => prev + 1)
            // Don't update state yet, we'll retry
            return
          }

          setError(`Admin check error: ${adminError.message}`)
          setIsAdmin(false)
          return
        }

        console.log("Admin check result:", !!adminData)
        setIsAdmin(!!adminData)
      } catch (adminCheckError) {
        console.error("AuthProvider: Error checking admin status:", adminCheckError)
        setError(`Admin check failed: ${adminCheckError instanceof Error ? adminCheckError.message : "Unknown error"}`)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("AuthProvider: Unexpected error in checkSession:", error)
      setError(`Session check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      setIsAuthenticated(false)
      setIsAdmin(false)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      console.log("Attempting login for:", email)

      const supabase = getSupabaseBrowserClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("AuthProvider: Login error:", error)
        setError(`Login failed: ${error.message}`)
        return { success: false, error: error.message }
      }

      if (!data.session) {
        setError("No session returned after login")
        return { success: false, error: "Authentication failed" }
      }

      setIsAuthenticated(true)

      // Check if the user is an admin
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", email)
          .single()

        if (adminError && adminError.code !== "PGRST116") {
          console.error("AuthProvider: Error checking admin status:", adminError)
          setError(`Admin verification failed: ${adminError.message}`)
        }

        if (!adminData) {
          // Sign out if not an admin
          console.log("User is not an admin, signing out")
          setError("Not authorized as admin")
          await supabase.auth.signOut()
          setIsAuthenticated(false)
          setIsAdmin(false)
          return { success: false, error: "Not authorized as admin" }
        }

        console.log("Login successful for admin:", email)
        setIsAdmin(true)
        setError(null)
        return { success: true }
      } catch (err) {
        console.error("AuthProvider: Exception checking admin status:", err)
        setError(`Admin verification error: ${err instanceof Error ? err.message : "Unknown error"}`)
        await supabase.auth.signOut()
        setIsAuthenticated(false)
        setIsAdmin(false)
        return { success: false, error: "Error checking admin status" }
      }
    } catch (error) {
      console.error("AuthProvider: Unexpected error during login:", error)
      setError(`Login failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseBrowserClient()
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setIsAdmin(false)
      console.log("User logged out successfully")
      // Use window.location for a hard redirect
      window.location.href = "/admin/login"
    } catch (error) {
      console.error("AuthProvider: Error during logout:", error)
      setError(`Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check session on mount and when retryCount changes
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        await checkSession()
      } catch (error) {
        console.error("AuthProvider: Error initializing auth:", error)
        setError(`Auth initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [retryCount])

  // Provide the auth context
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isLoading,
        error,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
