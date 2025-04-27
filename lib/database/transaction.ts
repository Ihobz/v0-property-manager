import type { createClient } from "@supabase/supabase-js"
import { logError, logInfo } from "../logging"
import { handleDatabaseError } from "./error-handler"
import { getSupabaseServerClient } from "../supabase/server"

/**
 * Executes a database transaction with proper error handling
 * @param operations - Function containing the database operations to execute in a transaction
 * @returns Result of the transaction operations
 */
export async function executeTransaction<T>(
  operations: (client: ReturnType<typeof createClient>) => Promise<T>,
): Promise<T> {
  const supabase = getSupabaseServerClient()

  try {
    // Start transaction
    logInfo("Starting database transaction")

    // Execute the operations
    const result = await operations(supabase)

    logInfo("Transaction completed successfully")
    return result
  } catch (error) {
    // Handle and log the error
    const formattedError = handleDatabaseError(error)
    logError("Transaction failed", { error: formattedError })
    throw formattedError
  }
}

/**
 * Executes multiple database operations in a transaction
 * @param operations - Array of database operations to execute
 * @returns Results of all operations
 */
export async function batchOperations<T>(
  operations: ((client: ReturnType<typeof createClient>) => Promise<T>)[],
): Promise<T[]> {
  return executeTransaction(async (client) => {
    const results: T[] = []

    for (const operation of operations) {
      const result = await operation(client)
      results.push(result)
    }

    return results
  })
}

/**
 * Retries a database operation with exponential backoff
 * @param operation - Database operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param initialDelay - Initial delay in milliseconds
 * @returns Result of the operation
 */
export async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, initialDelay = 300): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error

      // Don't retry certain errors
      if (
        error.type === "row_level_security_violation" ||
        error.type === "unique_violation" ||
        error.type === "not_null_violation" ||
        error.type === "check_violation"
      ) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt)
      logInfo(`Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // If we've exhausted all retries, throw the last error
  throw lastError
}
