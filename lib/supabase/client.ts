import { createClient } from "@supabase/supabase-js"
import type { Database } from "../types/database.types"

// Singleton pattern to avoid multiple instances
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function createClientSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables for client")
    throw new Error("Supabase configuration is missing")
  }

  try {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        fetch: (...args) => {
          return fetch(...args)
        },
      },
    })
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw new Error(`Failed to initialize Supabase client: ${error instanceof Error ? error.message : String(error)}`)
  }
}

// Add the missing export that's required for deployment
export const getSupabaseBrowserClient = createClientSupabaseClient
