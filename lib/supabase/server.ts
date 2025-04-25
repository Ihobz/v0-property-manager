import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "../types/database.types"

export function createServerSupabaseClient() {
  return createServerComponentClient<Database>({ cookies })
}

// Also export as createClient for backward compatibility
export const createClient = createServerSupabaseClient
