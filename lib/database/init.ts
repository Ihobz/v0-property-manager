import { createAdminDatabaseClient } from "./client"
import { logError, logInfo } from "@/lib/logging"
import { runAllMigrations } from "./migrations"

/**
 * Initializes the database with the necessary tables and data
 */
export async function initializeDatabase() {
  try {
    logInfo("Initializing database")

    // Run all migrations
    const migrationsResult = await runAllMigrations()

    if (!migrationsResult.success) {
      logError("Database migrations failed", { migrationsResult })
      return { success: false, error: "Database migrations failed" }
    }

    logInfo("Database initialized successfully")
    return { success: true }
  } catch (error) {
    logError("Error initializing database", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error initializing database",
    }
  }
}

/**
 * Checks if the database is properly configured
 */
export async function checkDatabaseConfiguration() {
  try {
    const supabase = createAdminDatabaseClient()

    // Try to query the database
    const { data, error } = await supabase.from("properties").select("id").limit(1)

    if (error) {
      logError("Database configuration check failed", { error })
      return {
        configured: false,
        error: error.message,
      }
    }

    logInfo("Database configuration check successful")
    return { configured: true }
  } catch (error) {
    logError("Error checking database configuration", { error })
    return {
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error checking database configuration",
    }
  }
}
