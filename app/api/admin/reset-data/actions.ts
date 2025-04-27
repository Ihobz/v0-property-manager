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
    const { error: bookingsError } = await supabase.from("bookings").delete().neq("id", "0")

    if (bookingsError) {
      logError("Error deleting bookings during reset", { error: bookingsError })
      return { success: false, error: `Failed to delete bookings: ${bookingsError.message}` }
    }

    // Step 2: Delete all property images (if they're in a separate table)
    logInfo("Deleting all property images")
    const { error: imagesError } = await supabase.from("property_images").delete().neq("id", "0")

    if (imagesError) {
      logError("Error deleting property images during reset", { error: imagesError })
      // Continue anyway, as this might not be critical
      logInfo("Continuing with reset despite image deletion error")
    }

    // Step 3: Delete all properties
    logInfo("Deleting all properties")
    const { error: propertiesError } = await supabase.from("properties").delete().neq("id", "0")

    if (propertiesError) {
      logError("Error deleting properties during reset", { error: propertiesError })
      return { success: false, error: `Failed to delete properties: ${propertiesError.message}` }
    }

    // Step 4: Delete all blocked dates (if they exist)
    logInfo("Deleting all blocked dates")
    const { error: blockedDatesError } = await supabase.from("blocked_dates").delete().neq("id", "0")

    if (blockedDatesError) {
      // This table might not exist, so we'll just log and continue
      logInfo("Note: Could not delete blocked dates, table might not exist", { error: blockedDatesError })
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
