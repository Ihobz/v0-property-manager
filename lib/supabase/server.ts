import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "../types/database.types"

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createSupabaseClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Cookie: cookieStore.toString(),
      },
    },
  })
}

// This function doesn't use cookies() from next/headers
// and can be safely imported in client components
export function createBrowserSupabaseClient() {
  return createSupabaseClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
}

// Export createClient as an alias for createServerSupabaseClient for backward compatibility
export const createClient = createServerSupabaseClient
