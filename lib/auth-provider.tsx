"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { createClientSupabaseClient } from "./supabase/client"
import { useRouter, usePathname } from "next/navigation"

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
const AuthContext = createContext<AuthContextType | undefined>(undefined)

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
  const router = useRouter()
  const pathname = usePathname()

  // Check if the user is authenticated and is an admin
  const checkSession = async () => {
    try {
      setError(null)
      const supabase = createClientSupabaseClient()

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
        setIsAuthenticated(false)
        setIsAdmin(false)
        return
      }

      setIsAuthenticated(true)

      // Check if the user is an admin
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (adminError) {
          console.error("AuthProvider: Error checking admin status:", adminError)
          setError(`Admin check error: ${adminError.message}`)
          setIsAdmin(false)
          return
        }

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
      const supabase = createClientSupabaseClient()

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
      await checkSession()

      return { success: true }
    } catch (error) {
      console.error("AuthProvider: Unexpected error during login:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown login error"
      setError(`Login failed: ${errorMessage}`)
      return { success: false, error: errorMessage }
    }
  }

  // Logout function
  const logout = async () => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setIsAdmin(false)
      router.push("/admin/login")
    } catch (error) {
      console.error("AuthProvider: Error during logout:", error)
      setError(`Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Check session on mount and when pathname changes
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
  }, [pathname])

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
