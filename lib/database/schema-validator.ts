import { createAdminDatabaseClient } from "./client"
import { logError, logInfo } from "@/lib/logging"

/**
 * Validates that the database schema matches the expected schema
 * @returns Success status and any errors
 */
export async function validateDatabaseSchema() {
  try {
    const supabase = createAdminDatabaseClient()
    const errors = []

    // Check if properties table exists
    const { data: propertiesTable, error: propertiesError } = await supabase.from("properties").select("id").limit(1)

    if (propertiesError) {
      errors.push(`Properties table error: ${propertiesError.message}`)
    }

    // Check if property_images table exists
    const { data: imagesTable, error: imagesError } = await supabase.from("property_images").select("id").limit(1)

    if (imagesError) {
      errors.push(`Property images table error: ${imagesError.message}`)
    }

    // Check if bookings table exists
    const { data: bookingsTable, error: bookingsError } = await supabase.from("bookings").select("id").limit(1)

    if (bookingsError) {
      errors.push(`Bookings table error: ${bookingsError.message}`)
    }

    // Check if blocked_dates table exists
    const { data: blockedDatesTable, error: blockedDatesError } = await supabase
      .from("blocked_dates")
      .select("id")
      .limit(1)

    if (blockedDatesError) {
      errors.push(`Blocked dates table error: ${blockedDatesError.message}`)
    }

    // Check if admins table exists
    const { data: adminsTable, error: adminsError } = await supabase.from("admins").select("id").limit(1)

    if (adminsError) {
      errors.push(`Admins table error: ${adminsError.message}`)
    }

    if (errors.length > 0) {
      logError("Database schema validation failed", { errors })
      return { valid: false, errors }
    }

    logInfo("Database schema validation successful")
    return { valid: true, errors: [] }
  } catch (error) {
    logError("Error validating database schema", { error })
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : "Unknown error validating database schema"],
    }
  }
}

/**
 * Gets the column information for a specific table
 * @param tableName The name of the table
 * @returns Column information or error
 */
export async function getTableColumns(tableName: string) {
  try {
    const supabase = createAdminDatabaseClient()

    // Query to get column information
    const { data, error } = await supabase
      .rpc("get_table_info", { table_name: tableName })
      .select("column_name, data_type, is_nullable")

    if (error) {
      logError(`Error getting column information for ${tableName}`, { error })
      return { columns: [], error: error.message }
    }

    return { columns: data || [], error: null }
  } catch (error) {
    logError(`Error in getTableColumns for ${tableName}`, { error })
    return {
      columns: [],
      error: error instanceof Error ? error.message : "Unknown error getting table columns",
    }
  }
}

/**
 * Gets a sample row from a table to inspect its structure
 * @param tableName The name of the table
 * @returns A sample row or error
 */
export async function getSampleRow(tableName: string) {
  try {
    const supabase = createAdminDatabaseClient()

    const { data, error } = await supabase.from(tableName).select("*").limit(1).maybeSingle()

    if (error) {
      logError(`Error getting sample row from ${tableName}`, { error })
      return { row: null, error: error.message }
    }

    return { row: data, error: null }
  } catch (error) {
    logError(`Error in getSampleRow for ${tableName}`, { error })
    return {
      row: null,
      error: error instanceof Error ? error.message : "Unknown error getting sample row",
    }
  }
}

/**
 * Creates a debug endpoint to check database schema
 */
export async function createDebugEndpoint() {
  try {
    const schemaValidation = await validateDatabaseSchema()
    const tables = ["properties", "property_images", "bookings", "blocked_dates", "admins"]
    const tableInfo = {}

    for (const table of tables) {
      const { columns } = await getTableColumns(table)
      const { row } = await getSampleRow(table)
      tableInfo[table] = { columns, sampleRow: row }
    }

    return {
      schemaValid: schemaValidation.valid,
      schemaErrors: schemaValidation.errors,
      tables: tableInfo,
    }
  } catch (error) {
    logError("Error creating debug endpoint", { error })
    return {
      schemaValid: false,
      schemaErrors: [error instanceof Error ? error.message : "Unknown error creating debug endpoint"],
      tables: {},
    }
  }
}
