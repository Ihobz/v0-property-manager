import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "../types/database.types"

export function createServerSupabaseClient() {
  try {
    const cookieStore = cookies()

    // Check if environment variables are available
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables:", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      })
      throw new Error("Missing Supabase environment variables")
    }

    // Create the client with a timeout
    const client = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
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
    console.error("Error creating Supabase client:", error)
    throw error
  }
}

// This function doesn't use cookies() from next/headers
// and can be safely imported in client components
export function createBrowserSupabaseClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables for browser client")
      throw new Error("Missing Supabase environment variables")
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Error creating browser Supabase client:", error)
    throw error
  }
}

// Export createClient as an alias for createServerSupabaseClient for backward compatibility
export const createClient = createServerSupabaseClient

// Add the missing export that's required for deployment
export const getSupabaseServerClient = createServerSupabaseClient
