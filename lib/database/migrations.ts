import { createAdminDatabaseClient } from "./client"
import { logError, logInfo } from "@/lib/logging"

/**
 * Runs a database migration
 * @param migration The migration SQL
 * @returns Success status and any errors
 */
export async function runMigration(migration: string) {
  try {
    const supabase = createAdminDatabaseClient()

    // Run the migration
    const { error } = await supabase.rpc("run_sql", { sql: migration })

    if (error) {
      logError("Migration failed", { error, migration })
      return { success: false, error: error.message }
    }

    logInfo("Migration successful", { migration })
    return { success: true }
  } catch (error) {
    logError("Error running migration", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error running migration",
    }
  }
}

/**
 * Adds the tenant_id column to the bookings table if it doesn't exist
 */
export async function addTenantIdColumn() {
  try {
    const migration = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'bookings' AND column_name = 'tenant_id'
        ) THEN
          ALTER TABLE bookings ADD COLUMN tenant_id TEXT[];
        END IF;
      END
      $$;
    `

    return await runMigration(migration)
  } catch (error) {
    logError("Error adding tenant_id column", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error adding tenant_id column",
    }
  }
}

/**
 * Adds the payment_proof column to the bookings table if it doesn't exist
 */
export async function addPaymentProofColumn() {
  try {
    const migration = `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'bookings' AND column_name = 'payment_proof'
        ) THEN
          ALTER TABLE bookings ADD COLUMN payment_proof TEXT;
        END IF;
      END
      $$;
    `

    return await runMigration(migration)
  } catch (error) {
    logError("Error adding payment_proof column", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error adding payment_proof column",
    }
  }
}

/**
 * Runs all necessary migrations to ensure the database schema is up to date
 */
export async function runAllMigrations() {
  try {
    const results = []

    // Add tenant_id column
    const tenantIdResult = await addTenantIdColumn()
    results.push({ migration: "addTenantIdColumn", ...tenantIdResult })

    // Add payment_proof column
    const paymentProofResult = await addPaymentProofColumn()
    results.push({ migration: "addPaymentProofColumn", ...paymentProofResult })

    // Check for any failures
    const failures = results.filter((result) => !result.success)

    if (failures.length > 0) {
      logError("Some migrations failed", { failures })
      return { success: false, results }
    }

    logInfo("All migrations successful", { results })
    return { success: true, results }
  } catch (error) {
    logError("Error running all migrations", { error })
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error running all migrations",
      results: [],
    }
  }
}
