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

    // Query to get column information
    const { data, error } = await supabase.rpc("get_table_info", { table_name: tableName })

    if (error) {
      logError(`Error getting table info for ${tableName}:`, { error })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If the RPC function doesn't exist, try a direct query to information_schema
    if (!data || data.length === 0) {
      const { data: schemaData, error: schemaError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_name", tableName)

      if (schemaError) {
        logError(`Error querying information_schema for ${tableName}:`, { error: schemaError })
        return NextResponse.json({ error: schemaError.message }, { status: 500 })
      }

      return NextResponse.json({ columns: schemaData || [] })
    }

    return NextResponse.json({ columns: data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logError(`Unexpected error in table-info route:`, { error })
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
