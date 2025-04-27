import { createAdminSupabaseClient } from "@/lib/supabase/server"

/**
 * Gets the column information for a specific table by examining a sample row
 */
export async function getTableSchema(tableName: string) {
  try {
    const supabase = createAdminSupabaseClient()

    // Get a sample row to determine the columns
    const { data, error } = await supabase.from(tableName).select("*").limit(1).maybeSingle()

    if (error) {
      console.error(`Error fetching sample row from ${tableName}:`, error)
      return { columns: [], error: error.message }
    }

    // If we have data, extract column names and types
    if (data) {
      const columns = Object.keys(data).map((columnName) => ({
        column_name: columnName,
        data_type: typeof data[columnName],
        is_nullable: "UNKNOWN", // We can't determine this from a sample row
      }))

      return { columns, error: null }
    }

    return { columns: [], error: "No data found in table" }
  } catch (error) {
    console.error(`Unexpected error getting schema for ${tableName}:`, error)
    return {
      columns: [],
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

/**
 * Gets a sample row from a table to inspect its structure
 */
export async function getSampleRow(tableName: string) {
  try {
    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase.from(tableName).select("*").limit(1).maybeSingle()

    if (error) {
      console.error(`Error fetching sample row from ${tableName}:`, error)
      return { row: null, error: error.message }
    }

    return { row: data, error: null }
  } catch (error) {
    console.error(`Unexpected error getting sample row from ${tableName}:`, error)
    return {
      row: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
