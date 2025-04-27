"use server"

import { createAdminDatabaseClient } from "@/lib/database/client"
import { revalidatePath } from "next/cache"
import { logError, logInfo } from "@/lib/logging"

/**
 * Deletes all bookings and properties from the database
 * This is a destructive operation and should be used with caution
 * @returns Object with success status and optional error message
 */
export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminDatabaseClient()

  try {
    logInfo("Starting database reset operation")

    // Step 1: Delete all bookings first (due to foreign key constraints)
    logInfo("Deleting all bookings")
    // Use a simple delete without filtering by ID since we want to delete all records
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (bookingsError) {
      logError("Error deleting bookings during reset", { error: bookingsError })
      return {
        success: false,
        error: `Failed to delete bookings: ${bookingsError.message}`,
      }
    }

    // Step 2: Delete all property images (due to foreign key constraints)
    logInfo("Deleting all property images")
    const { error: imagesError } = await supabase
      .from("property_images")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (imagesError) {
      logError("Error deleting property images during reset", { error: imagesError })
      // Continue anyway as this might not be critical
      logInfo("Continuing despite error with property images")
    }

    // Step 3: Delete all blocked dates (if they exist)
    logInfo("Deleting all blocked dates")
    const { error: blockedDatesError } = await supabase
      .from("blocked_dates")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (blockedDatesError) {
      logError("Error deleting blocked dates during reset", { error: blockedDatesError })
      // Continue anyway as this might not be critical
      logInfo("Continuing despite error with blocked dates")
    }

    // Step 4: Delete all properties
    logInfo("Deleting all properties")
    const { error: propertiesError } = await supabase
      .from("properties")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (propertiesError) {
      logError("Error deleting properties during reset", { error: propertiesError })
      return {
        success: false,
        error: `Failed to delete properties: ${propertiesError.message}`,
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
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    logError("Unexpected error during database reset", { error })
    return { success: false, error: errorMessage }
  }
}
