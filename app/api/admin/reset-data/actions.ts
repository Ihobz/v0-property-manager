"use server"

import { createAdminDatabaseClient } from "@/lib/database/client"
import { revalidatePath } from "next/cache"
import { logError, logInfo } from "@/lib/logging"

/**
 * Deletes all bookings and properties from the database
 * This is a destructive operation and should be used with caution
 */
export async function resetAllData() {
  try {
    logInfo("Starting database reset operation")
    const supabase = createAdminDatabaseClient()

    // Get table information to determine what tables exist
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")

    if (tableError) {
      logError("Error fetching table information", { error: tableError })
      return { success: false, error: `Failed to fetch table information: ${tableError.message}` }
    }

    const tables = tableInfo?.map((t) => t.table_name) || []
    logInfo("Found tables", { tables })

    // Step 1: Delete all bookings first (due to foreign key constraints)
    if (tables.includes("bookings")) {
      logInfo("Deleting all bookings")
      const { error: bookingsError } = await supabase.from("bookings").delete().neq("id", 0)

      if (bookingsError) {
        logError("Error deleting bookings during reset", { error: bookingsError })
        return { success: false, error: `Failed to delete bookings: ${bookingsError.message}` }
      }
    }

    // Step 2: Delete all availability records if they exist
    if (tables.includes("availability")) {
      logInfo("Deleting all availability records")
      const { error: availabilityError } = await supabase.from("availability").delete().neq("id", 0)

      if (availabilityError) {
        logError("Error deleting availability records", { error: availabilityError })
        // Continue anyway as this might not be critical
      }
    }

    // Step 3: Delete all blocked dates if they exist
    if (tables.includes("blocked_dates")) {
      logInfo("Deleting all blocked dates")
      const { error: blockedDatesError } = await supabase.from("blocked_dates").delete().neq("id", 0)

      if (blockedDatesError) {
        logError("Error deleting blocked dates", { error: blockedDatesError })
        // Continue anyway as this might not be critical
      }
    }

    // Step 4: Delete all property images if they're in a separate table
    if (tables.includes("property_images")) {
      logInfo("Deleting all property images")
      const { error: imagesError } = await supabase.from("property_images").delete().neq("id", 0)

      if (imagesError) {
        logError("Error deleting property images during reset", { error: imagesError })
        // Continue anyway as this might not be critical
      }
    }

    // Step 5: Delete all properties
    if (tables.includes("properties")) {
      logInfo("Deleting all properties")

      // Try with RLS bypass first
      const { error: propertiesError } = await supabase.from("properties").delete().neq("id", 0)

      if (propertiesError) {
        logError("Error deleting properties during reset", { error: propertiesError })

        // Try with direct SQL as a fallback
        const { error: sqlError } = await supabase.rpc("delete_all_properties")

        if (sqlError) {
          logError("Error deleting properties with RPC", { error: sqlError })

          // One more attempt with raw SQL
          const { error: rawSqlError } = await supabase.rpc("execute_sql", {
            sql_query: "DELETE FROM properties WHERE id != 0",
          })

          if (rawSqlError) {
            return { success: false, error: `Failed to delete properties: ${rawSqlError.message}` }
          }
        }
      }
    }

    // Revalidate all relevant paths
    revalidatePath("/admin")
    revalidatePath("/admin/properties")
    revalidatePath("/admin/bookings")
    revalidatePath("/properties")

    logInfo("Database reset completed successfully")
    return { success: true }
  } catch (error) {
    logError("Unexpected error during database reset", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred during database reset",
    }
  }
}
