/**
 * Centralized configuration management for environment variables
 *
 * This file provides:
 * 1. Type-safe access to environment variables
 * 2. Validation for required variables
 * 3. Default values for optional variables
 * 4. Clear documentation of all required configuration
 */

// Environment type
type Environment = "development" | "production" | "test"

// Configuration interface
interface Config {
  // Environment
  NODE_ENV: Environment
  VERCEL_ENV: Environment

  // URLs
  SITE_URL: string

  // Supabase
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // Database
  POSTGRES_URL: string
  POSTGRES_PRISMA_URL: string
  POSTGRES_URL_NON_POOLING: string
  POSTGRES_USER: string
  POSTGRES_PASSWORD: string
  POSTGRES_HOST: string
  POSTGRES_DATABASE: string

  // Storage
  BLOB_READ_WRITE_TOKEN: string

  // Client-side public variables
  public: {
    SUPABASE_URL: string
    SUPABASE_ANON_KEY: string
    SITE_URL: string
    VERCEL_ENV: Environment
  }
}

// Helper function to get environment variables with validation
function getEnvVar(key: string, required = true, defaultValue = ""): string {
  const value = process.env[key] || ""

  if (!value && required) {
    // In development, warn about missing variables
    if (process.env.NODE_ENV === "development") {
      console.warn(`⚠️ Missing required environment variable: ${key}`)
    }
    return defaultValue
  }

  return value
}

// Create and export the configuration object
const config: Config = {
  // Environment
  NODE_ENV: getEnvVar("NODE_ENV", false, "development") as Environment,
  VERCEL_ENV: getEnvVar("VERCEL_ENV", false, "development") as Environment,

  // URLs
  SITE_URL: getEnvVar("SITE_URL", false, "http://localhost:3000"),

  // Supabase
  SUPABASE_URL: getEnvVar("SUPABASE_URL"),
  SUPABASE_ANON_KEY: getEnvVar("SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar("SUPABASE_SERVICE_ROLE_KEY", false),

  // Database
  POSTGRES_URL: getEnvVar("POSTGRES_URL", false),
  POSTGRES_PRISMA_URL: getEnvVar("POSTGRES_PRISMA_URL", false),
  POSTGRES_URL_NON_POOLING: getEnvVar("POSTGRES_URL_NON_POOLING", false),
  POSTGRES_USER: getEnvVar("POSTGRES_USER", false),
  POSTGRES_PASSWORD: getEnvVar("POSTGRES_PASSWORD", false),
  POSTGRES_HOST: getEnvVar("POSTGRES_HOST", false),
  POSTGRES_DATABASE: getEnvVar("POSTGRES_DATABASE", false),

  // Storage
  BLOB_READ_WRITE_TOKEN: getEnvVar("BLOB_READ_WRITE_TOKEN"),

  // Client-side public variables
  public: {
    SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SITE_URL: getEnvVar("NEXT_PUBLIC_SITE_URL", false, "http://localhost:3000"),
    VERCEL_ENV: getEnvVar("NEXT_PUBLIC_VERCEL_ENV", false, "development") as Environment,
  },
}

// Validation function to check if all required variables are present
export function validateConfig(): { valid: boolean; missing: string[] } {
  const requiredVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ]

  const missing = requiredVars.filter((key) => {
    const parts = key.split("_")
    if (parts[0] === "NEXT" && parts[1] === "PUBLIC") {
      // Handle nested public variables
      const publicKey = parts.slice(2).join("_")
      return !config.public[publicKey as keyof typeof config.public]
    } else {
      return !config[key as keyof typeof config]
    }
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

// Export the config
export default config
