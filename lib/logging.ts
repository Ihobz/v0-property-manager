// Client-safe logging implementation
// This version doesn't use next/headers and can be imported in client components

// Define log levels
export type LogLevel = "info" | "warning" | "error" | "debug"

// Define log categories
export type LogCategory = "system" | "booking" | "property" | "user" | "payment" | "upload"

// Client-side logging function that sends logs to the server
async function logToServer(level: LogLevel, message: string, details?: any) {
  try {
    // Use fetch to send logs to a server endpoint
    await fetch("/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        level,
        message,
        details,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Fall back to console logging if the server request fails
    console[level === "error" ? "error" : level === "warning" ? "warn" : "log"](
      `[${level.toUpperCase()}] ${message}`,
      details,
    )
  }
}

// Convenience functions for common log levels
export async function logInfo(message: string, details?: any) {
  console.log(`[INFO] ${message}`, details)
  return logToServer("info", message, details)
}

export async function logError(message: string, details?: any) {
  console.error(`[ERROR] ${message}`, details)
  return logToServer("error", message, details)
}

export async function logWarning(message: string, details?: any) {
  console.warn(`[WARNING] ${message}`, details)
  return logToServer("warning", message, details)
}

export async function logDebug(message: string, details?: any) {
  console.debug(`[DEBUG] ${message}`, details)
  return logToServer("debug", message, details)
}

// Domain-specific logging functions
export async function logBookingEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "booking" })
}

export async function logPropertyEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "property" })
}

export async function logAuthEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "auth" })
}

export async function logPaymentEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "payment" })
}

export async function logUploadEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "upload" })
}

// Legacy function for backward compatibility
export async function logSystemEvent(message: string, level: LogLevel = "info", category = "system", details?: any) {
  return logToServer(level, message, { ...details, category })
}
