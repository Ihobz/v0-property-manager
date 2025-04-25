import config from "@/lib/config"

/**
 * Gets the full URL for auth redirects
 * Ensures the URL is absolute and includes the site URL
 */
export function getAuthRedirectUrl(path: string): string {
  // Use the site URL from config
  const baseUrl = config.public.SITE_URL || "http://localhost:3000"

  // Ensure path starts with a slash
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  // Return the full URL
  return `${baseUrl}${normalizedPath}`
}
