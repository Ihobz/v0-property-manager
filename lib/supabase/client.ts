import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/types/database.types"

// Create a singleton instance for client-side usage
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export function createClientSupabaseClient() {
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return supabaseClient
}

// Add the missing export as an alias
export const getSupabaseBrowserClient = createClientSupabaseClient

// For backward compatibility
// Removing the conflicting declaration
// export const createClient = createClientSupabaseClient
