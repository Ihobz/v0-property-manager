import type { createClient } from "@supabase/supabase-js"
import { logError, logInfo } from "../logging"

type QueryOptions = {
  limit?: number
  offset?: number
  orderBy?: string
  orderDirection?: "asc" | "desc"
  filters?: Record<string, any>
}

/**
 * Builds a query with common options like filtering, pagination, and sorting
 * @param table - Table name to query
 * @param options - Query options
 * @returns Supabase query builder
 */
export function buildQuery(client: ReturnType<typeof createClient>, table: string, options: QueryOptions = {}) {
  const { limit = 100, offset = 0, orderBy, orderDirection = "asc", filters = {} } = options

  logInfo("Building database query", { table, options })

  let query = client.from(table).select("*")

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else if (typeof value === "object") {
        // Handle range queries
        if (value.gt !== undefined) query = query.gt(key, value.gt)
        if (value.gte !== undefined) query = query.gte(key, value.gte)
        if (value.lt !== undefined) query = query.lt(key, value.lt)
        if (value.lte !== undefined) query = query.lte(key, value.lte)
        if (value.like !== undefined) query = query.like(key, value.like)
        if (value.ilike !== undefined) query = query.ilike(key, value.ilike)
      } else {
        query = query.eq(key, value)
      }
    }
  })

  // Apply sorting
  if (orderBy) {
    query = query.order(orderBy, { ascending: orderDirection === "asc" })
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  return query
}

/**
 * Executes a count query to get the total number of records
 * @param table - Table name to query
 * @param filters - Query filters
 * @returns Total count of records
 */
export async function getCount(
  client: ReturnType<typeof createClient>,
  table: string,
  filters: Record<string, any> = {},
): Promise<number> {
  try {
    let query = client.from(table).select("*", { count: "exact", head: true })

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value)
        } else if (typeof value === "object") {
          // Handle range queries
          if (value.gt !== undefined) query = query.gt(key, value.gt)
          if (value.gte !== undefined) query = query.gte(key, value.gte)
          if (value.lt !== undefined) query = query.lt(key, value.lt)
          if (value.lte !== undefined) query = query.lte(key, value.lte)
          if (value.like !== undefined) query = query.like(key, value.like)
          if (value.ilike !== undefined) query = query.ilike(key, value.ilike)
        } else {
          query = query.eq(key, value)
        }
      }
    })

    const { count, error } = await query

    if (error) {
      throw error
    }

    return count || 0
  } catch (error) {
    logError("Error getting count", { table, filters, error })
    throw error
  }
}
