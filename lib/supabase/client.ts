import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/types/database.types"

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    try {
      // Use environment variables directly instead of the config object
      supabaseClient = createClientComponentClient<Database>({
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      })
    } catch (error) {
      console.error("Error initializing Supabase client:", error)
      throw error
    }
  }
  return supabaseClient
}

// For backward compatibility
export const createClient = getSupabaseBrowserClient
