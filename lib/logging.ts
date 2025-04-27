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

    // Don't attempt to send logs to server during SSR or if we're in a server component
    if (typeof window === "undefined") {
      return
    }

    // Don't log if we're in the log endpoint itself (prevent circular logging)
    if (typeof window !== "undefined" && window.location?.pathname?.includes("/api/log")) {
      return
    }

    // Prepare the log data
    const logData = {
      level,
      message: message.substring(0, 1000), // Truncate long messages
      details: details || {},
      timestamp: new Date().toISOString(),
    }

    // Use fetch to send logs to a server endpoint, but don't await it
    // This prevents blocking the UI while logging
    fetch("/api/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    }).catch((error) => {
      // Silently handle fetch errors - just log to console
      console.warn(`Failed to send log to server: ${error instanceof Error ? error.message : "Unknown error"}`)
    })
  } catch (error) {
    // Just log to console if the server request fails
    console.warn(`Failed to send log to server: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// Convenience functions for common log levels
export function logInfo(message: string, details?: any) {
  return logToServer("info", message, details).catch(() => {})
}

export function logError(message: string, details?: any) {
  return logToServer("error", message, details).catch(() => {})
}

export function logWarning(message: string, details?: any) {
  return logToServer("warning", message, details).catch(() => {})
}

export function logDebug(message: string, details?: any) {
  return logToServer("debug", message, details).catch(() => {})
}

// Domain-specific logging functions
export function logBookingEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "booking" }).catch(() => {})
}

export function logPropertyEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "property" }).catch(() => {})
}

export function logAuthEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "auth" }).catch(() => {})
}

export function logPaymentEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "payment" }).catch(() => {})
}

export function logUploadEvent(message: string, level: LogLevel = "info", details?: any) {
  return logToServer(level, message, { ...details, category: "upload" }).catch(() => {})
}

// Legacy function for backward compatibility
export function logSystemEvent(message: string, level: LogLevel = "info", category = "system", details?: any) {
  return logToServer(level, message, { ...details, category }).catch(() => {})
}
