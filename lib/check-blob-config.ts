"use client"

/**
 * Checks if the Vercel Blob configuration is properly set up
 * This is a client-side utility to help diagnose configuration issues
 */
export async function checkBlobConfiguration() {
  try {
    // Make a simple request to check if the Blob token is configured
    const response = await fetch("/api/check-blob-config")
    const data = await response.json()

    return {
      isConfigured: data.isConfigured,
      message: data.message,
    }
  } catch (error) {
    console.error("Error checking Blob configuration:", error)
    return {
      isConfigured: false,
      message: error instanceof Error ? error.message : "Failed to check Blob configuration",
    }
  }
}
