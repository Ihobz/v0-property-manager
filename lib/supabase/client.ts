import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/types/database.types"

// Create a singleton instance to avoid multiple instances
let supabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseClient) {
    // Use environment variables directly instead of the config object
    supabaseClient = createClientComponentClient<Database>()
  }
  return supabaseClient
}

// For backward compatibility
export const createClient = getSupabaseBrowserClient
