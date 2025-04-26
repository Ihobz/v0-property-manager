/**
 * Environment utility functions
 */

// Check if we're in a preview environment (Vercel Preview or local development)
export function isPreviewEnvironment(): boolean {
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV === "development"
}

// Check if we're in a production environment
export function isProductionEnvironment(): boolean {
  return process.env.VERCEL_ENV === "production"
}
