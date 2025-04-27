import { type NextRequest, NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"
import { logError } from "@/lib/logging"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json({ error: "Table name is required" }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()

    // Get a sample row from the table
    const { data, error } = await supabase.from(tableName).select("*").limit(1).single()

    if (error) {
      logError(`Error getting sample row from ${tableName}:`, { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ row: data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logError(`Unexpected error in sample-row route:`, { error })
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
