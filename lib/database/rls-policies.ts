import { logError, logInfo } from "../logging"
import { getSupabaseServerClient } from "../supabase/server"

/**
 * Creates or replaces a row-level security policy
 * @param table - Table name
 * @param policyName - Policy name
 * @param policyDefinition - SQL policy definition
 */
export async function createRLSPolicy(table: string, policyName: string, policyDefinition: string): Promise<void> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Creating RLS policy", { table, policyName })

    // First, check if the policy exists
    const { data: existingPolicies, error: checkError } = await supabase.rpc("get_policies_for_table", {
      table_name: table,
    })

    if (checkError) {
      throw checkError
    }

    const policyExists = existingPolicies.some((policy: any) => policy.policyname === policyName)

    // SQL to create or replace the policy
    const sql = policyExists
      ? `ALTER POLICY "${policyName}" ON "${table}" USING (${policyDefinition});`
      : `CREATE POLICY "${policyName}" ON "${table}" USING (${policyDefinition});`

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", { sql })

    if (error) {
      throw error
    }

    logInfo("RLS policy created successfully", { table, policyName })
  } catch (error) {
    logError("Error creating RLS policy", { table, policyName, error })
    throw error
  }
}

/**
 * Drops a row-level security policy
 * @param table - Table name
 * @param policyName - Policy name
 */
export async function dropRLSPolicy(table: string, policyName: string): Promise<void> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Dropping RLS policy", { table, policyName })

    // SQL to drop the policy
    const sql = `DROP POLICY IF EXISTS "${policyName}" ON "${table}";`

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", { sql })

    if (error) {
      throw error
    }

    logInfo("RLS policy dropped successfully", { table, policyName })
  } catch (error) {
    logError("Error dropping RLS policy", { table, policyName, error })
    throw error
  }
}

/**
 * Enables row-level security on a table
 * @param table - Table name
 */
export async function enableRLS(table: string): Promise<void> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Enabling RLS on table", { table })

    // SQL to enable RLS
    const sql = `ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", { sql })

    if (error) {
      throw error
    }

    logInfo("RLS enabled successfully", { table })
  } catch (error) {
    logError("Error enabling RLS", { table, error })
    throw error
  }
}

/**
 * Gets all policies for a table
 * @param table - Table name
 * @returns Array of policies
 */
export async function getPoliciesForTable(table: string): Promise<any[]> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Getting policies for table", { table })

    // Get policies
    const { data, error } = await supabase.rpc("get_policies_for_table", { table_name: table })

    if (error) {
      throw error
    }

    return data || []
  } catch (error) {
    logError("Error getting policies", { table, error })
    throw error
  }
}

/**
 * Creates a stored procedure to get policies for a table
 */
export async function createGetPoliciesProcedure(): Promise<void> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Creating get_policies_for_table procedure")

    // SQL to create the procedure
    const sql = `
      CREATE OR REPLACE FUNCTION get_policies_for_table(table_name text)
      RETURNS TABLE (
        tablename text,
        policyname text,
        permissive text,
        roles text[],
        cmd text,
        qual text,
        with_check text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          p.tablename::text,
          p.policyname::text,
          p.permissive::text,
          p.roles::text[],
          p.cmd::text,
          p.qual::text,
          p.with_check::text
        FROM
          pg_policies p
        WHERE
          p.tablename = table_name;
      END;
      $$;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", { sql })

    if (error) {
      throw error
    }

    logInfo("Procedure created successfully")
  } catch (error) {
    logError("Error creating procedure", { error })
    throw error
  }
}

/**
 * Creates a stored procedure to execute SQL
 */
export async function createExecuteSQLProcedure(): Promise<void> {
  const supabase = getSupabaseServerClient()

  try {
    logInfo("Creating execute_sql procedure")

    // SQL to create the procedure
    const sql = `
      CREATE OR REPLACE FUNCTION execute_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `

    // Execute the SQL
    const { error } = await supabase.rpc("execute_sql", { sql })

    if (error && !error.message.includes("already exists")) {
      throw error
    }

    logInfo("Procedure created successfully")
  } catch (error) {
    logError("Error creating procedure", { error })
    throw error
  }
}

/**
 * Initializes RLS procedures
 */
export async function initializeRLSProcedures(): Promise<void> {
  try {
    await createExecuteSQLProcedure()
    await createGetPoliciesProcedure()
    logInfo("RLS procedures initialized successfully")
  } catch (error) {
    logError("Error initializing RLS procedures", { error })
    throw error
  }
}

/**
 * Sets up RLS policies for the properties table
 */
export async function setupPropertiesRLS(): Promise<void> {
  try {
    // Enable RLS on the properties table
    await enableRLS("properties")

    // Create policies
    await createRLSPolicy(
      "properties",
      "properties_select_policy",
      "true", // Allow all users to select properties
    )

    await createRLSPolicy(
      "properties",
      "properties_insert_policy",
      "auth.uid() = created_by", // Only allow users to insert their own properties
    )

    await createRLSPolicy(
      "properties",
      "properties_update_policy",
      "auth.uid() = created_by", // Only allow users to update their own properties
    )

    await createRLSPolicy(
      "properties",
      "properties_delete_policy",
      "auth.uid() = created_by", // Only allow users to delete their own properties
    )

    logInfo("Properties RLS policies set up successfully")
  } catch (error) {
    logError("Error setting up properties RLS policies", { error })
    throw error
  }
}

/**
 * Sets up RLS policies for the bookings table
 */
export async function setupBookingsRLS(): Promise<void> {
  try {
    // Enable RLS on the bookings table
    await enableRLS("bookings")

    // Create policies
    await createRLSPolicy(
      "bookings",
      "bookings_select_policy",
      "auth.uid() = created_by OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.created_by = auth.uid())",
    )

    await createRLSPolicy(
      "bookings",
      "bookings_insert_policy",
      "true", // Allow all authenticated users to create bookings
    )

    await createRLSPolicy(
      "bookings",
      "bookings_update_policy",
      "auth.uid() = created_by OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.created_by = auth.uid())",
    )

    await createRLSPolicy(
      "bookings",
      "bookings_delete_policy",
      "auth.uid() = created_by OR EXISTS (SELECT 1 FROM properties p WHERE p.id = property_id AND p.created_by = auth.uid())",
    )

    logInfo("Bookings RLS policies set up successfully")
  } catch (error) {
    logError("Error setting up bookings RLS policies", { error })
    throw error
  }
}
