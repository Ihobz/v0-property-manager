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

    // Step 1: Delete all bookings first (due to foreign key constraints)
    logInfo("Deleting all bookings")
    const { error: bookingsError } = await supabase.from("bookings").delete().gt("id", 0)

    if (bookingsError) {
      logError("Error deleting bookings during reset", { error: bookingsError })
      return { success: false, error: `Failed to delete bookings: ${bookingsError.message}` }
    }

    // Step 2: Delete all properties
    logInfo("Deleting all properties")
    const { error: propertiesError } = await supabase.from("properties").delete().gt("id", 0)

    if (propertiesError) {
      logError("Error deleting properties during reset", { error: propertiesError })
      return { success: false, error: `Failed to delete properties: ${propertiesError.message}` }
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
