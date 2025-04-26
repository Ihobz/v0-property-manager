// Client-safe logging implementation
// This version doesn't use next/headers and can be imported in client components

// Define log levels
export type LogLevel = "info" | "warning" | "error" | "debug"

// Define log categories
export type LogCategory = "system" | "booking" | "property" | "user" | "payment" | "upload" | "auth"

// Client-side logging function that sends logs to the server
async function logToServer(level: LogLevel, message: string, details?: any) {
  try {
    // Always log to console first
    console[level === "error" ? "error" : level === "warning" ? "warn" : "log"](
      `[${level.toUpperCase()}] ${message}`,
      details || "",
    )

    // Don't attempt to send logs to server during SSR
    if (typeof window === "undefined") {
      return
    }

    // Prepare the log data
    const logData = {
      level,
      message: message.substring(0, 1000), // Truncate long messages
      details: details || {},
      timestamp: new Date().toISOString(),
    }

    // Use fetch to send logs to a server endpoint
    const response = await fetch("/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.warn(`Log server returned error (${response.status}):`, errorData)
    }
  } catch (error) {
    // Just log to console if the server request fails
    console.warn(`Failed to send log to server: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Convenience functions for common log levels
export async function logInfo(message: string, details?: any) {
  return logToServer("info", message, details)
}

export async function logError(message: string, details?: any) {
  return logToServer("error", message, details)
}

export async function logWarning(message: string, details?: any) {
  return logToServer("warning", message, details)
}

export async function logDebug(message: string, details?: any) {
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
