/**
 * Client-side error handler to catch and report errors
 */

// Function to report errors to our API
export async function reportError(error: Error, additionalInfo?: any) {
  try {
    const errorData = {
      error: error.message,
      stack: error.stack,
      info: additionalInfo || {},
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    // Send error to our API endpoint
    await fetch("/api/debug/client-errors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(errorData),
    })
  } catch (reportError) {
    // If reporting fails, log to console as fallback
    console.error("Failed to report error:", reportError)
    console.error("Original error:", error)
  }
}

// Global error handler setup
export function setupGlobalErrorHandler() {
  if (typeof window !== "undefined") {
    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      reportError(event.reason, { type: "unhandledRejection" })
    })

    // Capture regular errors
    window.addEventListener("error", (event) => {
      reportError(event.error, { type: "error", message: event.message })
    })
  }
}
