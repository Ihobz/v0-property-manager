"use client"

import config from "@/lib/config"

/**
 * Checks if all required environment variables are configured
 * This is a client-side utility to help diagnose configuration issues
 */
export async function checkEnvironmentConfig() {
  try {
    // Make a request to the server to check environment variables
    const response = await fetch("/api/check-env-config")
    const data = await response.json()

    return {
      isConfigured: data.isConfigured,
      missing: data.missing || [],
      message: data.message,
    }
  } catch (error) {
    console.error("Error checking environment configuration:", error)

    // Fallback to client-side check
    const clientConfig = {
      SUPABASE_URL: config.public.SUPABASE_URL,
      SUPABASE_ANON_KEY: config.public.SUPABASE_ANON_KEY,
      BLOB_READ_WRITE_TOKEN: "Cannot check from client",
    }

    const missing = Object.entries(clientConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key)

    return {
      isConfigured: missing.length === 0,
      missing,
      message: error instanceof Error ? error.message : "Failed to check environment configuration",
    }
  }
}
