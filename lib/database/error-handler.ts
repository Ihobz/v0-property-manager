import { logError } from "../logging"

export enum DatabaseErrorType {
  RowLevelSecurity = "row_level_security_violation",
  ForeignKeyViolation = "foreign_key_violation",
  UniqueViolation = "unique_violation",
  NotNullViolation = "not_null_violation",
  CheckViolation = "check_violation",
  ConnectionError = "connection_error",
  Unknown = "unknown_error",
}

interface DatabaseError {
  type: DatabaseErrorType
  message: string
  details?: string
  hint?: string
  code?: string
}

export function handleDatabaseError(error: any): DatabaseError {
  console.error("Database error:", error)

  // Log the error for monitoring
  logError("Database error", {
    error: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    stack: error.stack,
  })

  // PostgreSQL error codes
  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  if (error.code === "42501") {
    return {
      type: DatabaseErrorType.RowLevelSecurity,
      message: "You do not have permission to perform this action.",
      details: "This operation violates the row-level security policy.",
      hint: "Contact an administrator if you believe this is an error.",
      code: error.code,
    }
  }

  if (error.code === "23503") {
    return {
      type: DatabaseErrorType.ForeignKeyViolation,
      message: "This operation references data that does not exist.",
      details: error.detail || "Foreign key constraint violation.",
      hint: "Ensure all referenced records exist before performing this operation.",
      code: error.code,
    }
  }

  if (error.code === "23505") {
    return {
      type: DatabaseErrorType.UniqueViolation,
      message: "This record already exists.",
      details: error.detail || "Unique constraint violation.",
      hint: "Try updating the existing record instead of creating a new one.",
      code: error.code,
    }
  }

  if (error.code === "23502") {
    return {
      type: DatabaseErrorType.NotNullViolation,
      message: "Required information is missing.",
      details: error.detail || "Not null constraint violation.",
      hint: "Please provide all required fields.",
      code: error.code,
    }
  }

  if (error.code === "23514") {
    return {
      type: DatabaseErrorType.CheckViolation,
      message: "The provided data is invalid.",
      details: error.detail || "Check constraint violation.",
      hint: "Please ensure all data meets the required format and constraints.",
      code: error.code,
    }
  }

  if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return {
      type: DatabaseErrorType.ConnectionError,
      message: "Unable to connect to the database.",
      details: "The database server is unreachable.",
      hint: "Check your internet connection and database configuration.",
      code: error.code,
    }
  }

  // Default case for unknown errors
  return {
    type: DatabaseErrorType.Unknown,
    message: "An unexpected database error occurred.",
    details: error.message || "Unknown error.",
    hint: "Please try again later or contact support if the issue persists.",
    code: error.code,
  }
}

export function formatDatabaseErrorForClient(error: DatabaseError): {
  message: string
  status: number
} {
  // Map error types to appropriate HTTP status codes
  const statusMap: Record<DatabaseErrorType, number> = {
    [DatabaseErrorType.RowLevelSecurity]: 403, // Forbidden
    [DatabaseErrorType.ForeignKeyViolation]: 400, // Bad Request
    [DatabaseErrorType.UniqueViolation]: 409, // Conflict
    [DatabaseErrorType.NotNullViolation]: 400, // Bad Request
    [DatabaseErrorType.CheckViolation]: 400, // Bad Request
    [DatabaseErrorType.ConnectionError]: 503, // Service Unavailable
    [DatabaseErrorType.Unknown]: 500, // Internal Server Error
  }

  return {
    message: error.message,
    status: statusMap[error.type],
  }
}

export function isRowLevelSecurityError(error: any): boolean {
  return error?.code === "42501" || (error?.message && error.message.includes("row-level security"))
}

export function isUniqueViolationError(error: any): boolean {
  return error?.code === "23505"
}

export function isForeignKeyViolationError(error: any): boolean {
  return error?.code === "23503"
}

export function isNotNullViolationError(error: any): boolean {
  return error?.code === "23502"
}

export function isCheckViolationError(error: any): boolean {
  return error?.code === "23514"
}

export function isConnectionError(error: any): boolean {
  return ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(error?.code)
}
