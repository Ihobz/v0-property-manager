import { createAdminSupabaseClient } from "./client"
import { logError, logInfo } from "../logging"

/**
 * Tests the database connection and returns diagnostic information
 */
export async function checkDatabaseConnection() {
  try {
    logInfo("Testing database connection")
    const startTime = Date.now()

    // Create a client
    const supabase = createAdminSupabaseClient()

    // Test a simple query with timeout
    const { data, error } = (await Promise.race([
      supabase.from("properties").select("count").limit(1),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Connection test timed out")), 5000)),
    ])) as any

    const endTime = Date.now()
    const responseTime = endTime - startTime

    if (error) {
      logError("Database connection test failed", { error })
      return {
        success: false,
        error: error.message,
        responseTime,
        details: {
          code: error.code,
          hint: error.hint,
        },
      }
    }

    logInfo("Database connection test successful", { responseTime })
    return {
      success: true,
      responseTime,
      details: {
        message: "Connection successful",
      },
    }
  } catch (error) {
    logError("Unexpected error in database connection test", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: {
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
