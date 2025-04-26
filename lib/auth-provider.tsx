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

// Create the auth context with default values
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

// Maximum number of retries for network operations
const MAX_RETRIES = 3
// Delay between retries (in ms)
const RETRY_DELAY = 1000

// Helper function to retry a promise-based operation
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY,
  retryCondition?: (error: any) => boolean,
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // If we have no more retries or the error doesn't meet the retry condition, throw
    if (retries <= 0 || (retryCondition && !retryCondition(error))) {
      throw error
    }

    console.log(`Operation failed, retrying in ${delay}ms... (${retries} retries left)`)
    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delay))
    // Retry the operation with one less retry
    return retryOperation(operation, retries - 1, delay, retryCondition)
  }
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initializationAttempted, setInitializationAttempted] = useState(false)

  // Check if the user is authenticated and is an admin
  const checkSession = async () => {
    // Prevent multiple simultaneous checks
    if (isLoading) return

    try {
      setIsLoading(true)
      setError(null)
      console.log("Checking session...")

      let supabase
      try {
        supabase = getSupabaseBrowserClient()
      } catch (clientError) {
        console.error("Failed to initialize Supabase client:", clientError)
        setError(
          `Failed to initialize authentication client: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
        )
        return
      }

      // Get the session with retry
      const {
        data: { session },
        error: sessionError,
      } = await retryOperation(
        () => supabase.auth.getSession(),
        MAX_RETRIES,
        RETRY_DELAY,
        (err) => err instanceof TypeError && err.message.includes("fetch"),
      )

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
        const { data: adminData, error: adminError } = await retryOperation(
          () => supabase.from("admins").select("*").eq("email", session.user.email).single(),
          MAX_RETRIES,
          RETRY_DELAY,
          (err) => err instanceof TypeError && err.message.includes("fetch"),
        )

        if (adminError && adminError.code !== "PGRST116") {
          // PGRST116 is "no rows returned"
          console.error("AuthProvider: Error checking admin status:", adminError)
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
    } finally {
      setIsLoading(false)
    }
  }

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      console.log("Attempting login for:", email)

      let supabase
      try {
        supabase = getSupabaseBrowserClient()
      } catch (clientError) {
        console.error("Failed to initialize Supabase client:", clientError)
        return {
          success: false,
          error: `Failed to initialize authentication client: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
        }
      }

      const { data, error } = await retryOperation(
        () =>
          supabase.auth.signInWithPassword({
            email,
            password,
          }),
        MAX_RETRIES,
        RETRY_DELAY,
        (err) => err instanceof TypeError && err.message.includes("fetch"),
      )

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
        const { data: adminData, error: adminError } = await retryOperation(
          () => supabase.from("admins").select("*").eq("email", email).single(),
          MAX_RETRIES,
          RETRY_DELAY,
          (err) => err instanceof TypeError && err.message.includes("fetch"),
        )

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
      let supabase
      try {
        supabase = getSupabaseBrowserClient()
      } catch (clientError) {
        console.error("Failed to initialize Supabase client during logout:", clientError)
        setError(`Logout failed: ${clientError instanceof Error ? clientError.message : "Unknown error"}`)
        return
      }

      await supabase.auth.signOut()
      setIsAuthenticated(false)
      setIsAdmin(false)
      console.log("User logged out successfully")
    } catch (error) {
      console.error("AuthProvider: Error during logout:", error)
      setError(`Logout failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Check session only once on mount
  useEffect(() => {
    if (!isInitialized && !initializationAttempted) {
      setInitializationAttempted(true)

      const initAuth = async () => {
        try {
          setIsLoading(true)

          let supabase
          try {
            supabase = getSupabaseBrowserClient()
          } catch (clientError) {
            console.error("Failed to initialize Supabase client during initialization:", clientError)
            setError(
              `Authentication initialization failed: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
            )
            return
          }

          // Get the session with retry
          const {
            data: { session },
            error: sessionError,
          } = await retryOperation(
            () => supabase.auth.getSession(),
            MAX_RETRIES,
            RETRY_DELAY,
            (err) => err instanceof TypeError && err.message.includes("fetch"),
          )

          if (sessionError) {
            console.error("AuthProvider: Error getting session:", sessionError)
            setError(`Authentication error: ${sessionError.message}`)
            setIsAuthenticated(false)
            setIsAdmin(false)
            return
          }

          if (!session) {
            console.log("No session found during initialization")
            setIsAuthenticated(false)
            setIsAdmin(false)
            return
          }

          console.log("Session found during initialization, user is authenticated")
          setIsAuthenticated(true)

          // Check if the user is an admin with retry
          try {
            const { data: adminData, error: adminError } = await retryOperation(
              () => supabase.from("admins").select("*").eq("email", session.user.email).single(),
              MAX_RETRIES,
              RETRY_DELAY,
              (err) => err instanceof TypeError && err.message.includes("fetch"),
            )

            if (adminError && adminError.code !== "PGRST116") {
              console.error("AuthProvider: Error checking admin status:", adminError)
              setError(`Admin check error: ${adminError.message}`)
              setIsAdmin(false)
              return
            }

            console.log("Admin check result during initialization:", !!adminData)
            setIsAdmin(!!adminData)
          } catch (adminCheckError) {
            console.error("AuthProvider: Error checking admin status:", adminCheckError)
            setError(
              `Admin check failed: ${adminCheckError instanceof Error ? adminCheckError.message : "Unknown error"}`,
            )
            setIsAdmin(false)
          }
        } catch (error) {
          console.error("AuthProvider: Unexpected error in initialization:", error)
          setError(`Session check failed: ${error instanceof Error ? error.message : "Unknown error"}`)
          setIsAuthenticated(false)
          setIsAdmin(false)
        } finally {
          setIsLoading(false)
          setIsInitialized(true)
        }
      }

      initAuth()
    }
  }, [isInitialized, initializationAttempted])

  // Listen for auth state changes
  useEffect(() => {
    let supabase
    try {
      supabase = getSupabaseBrowserClient()
    } catch (clientError) {
      console.error("Failed to initialize Supabase client for auth listener:", clientError)
      setError(
        `Authentication listener failed: ${clientError instanceof Error ? clientError.message : "Unknown error"}`,
      )
      return () => {}
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event)

      if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true)
        // We'll check admin status separately to avoid complexity here
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false)
        setIsAdmin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
