import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { logError } from "@/lib/logging"
import type { Database } from "../types/database.types"

/**
 * Creates a Supabase client for server-side operations with proper error handling
 * and consistent configuration
 */
export function createServerDatabaseClient() {
  try {
    const cookieStore = cookies()

    // Check if environment variables are available
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      const error = new Error("Missing Supabase environment variables")
      logError("Database client creation failed", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      throw error
    }

    // Create the client with a timeout and proper configuration
    const client = createClient<Database>(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Cookie: cookieStore.toString(),
        },
      },
      auth: {
        persistSession: false,
      },
      db: {
        schema: "public",
      },
      // Add reasonable timeouts to avoid hanging requests
      realtime: {
        timeout: 10000, // 10 seconds
      },
    })

    return client
  } catch (error) {
    logError("Error creating Supabase client", { error })
    throw error
  }
}

/**
 * Creates a Supabase admin client with service role key
 * This bypasses RLS policies and should be used carefully
 */
export function createAdminDatabaseClient() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      const error = new Error("Missing Supabase environment variables for admin client")
      logError("Admin database client creation failed", {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey,
      })
      throw error
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      // Add reasonable timeouts to avoid hanging requests
      realtime: {
        timeout: 10000, // 10 seconds
      },
    })
  } catch (error) {
    logError("Error creating Supabase admin client", { error })
    throw error
  }
}

/**
 * Creates a Supabase client for client-side operations
 * This is a singleton to prevent multiple instances
 */
let clientSideDbClient: ReturnType<typeof createClient<Database>> | null = null

export function createClientDatabaseClient() {
  if (clientSideDbClient) return clientSideDbClient

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables for client-side")
      throw new Error("Database configuration is missing")
    }

    clientSideDbClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      // Add reasonable timeouts to avoid hanging requests
      realtime: {
        timeout: 10000, // 10 seconds
      },
    })

    return clientSideDbClient
  } catch (error) {
    console.error("Error creating client-side database client:", error)
    throw error
  }
}

// Export aliases for backward compatibility
export const createServerSupabaseClient = createServerDatabaseClient
export const createAdminSupabaseClient = createAdminDatabaseClient
export const createClientSupabaseClient = createClientDatabaseClient
export const getSupabaseServerClient = createServerDatabaseClient
export const getSupabaseBrowserClient = createClientDatabaseClient
