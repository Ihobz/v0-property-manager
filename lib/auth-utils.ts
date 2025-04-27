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

/**
 * Checks if a user has admin privileges
 * @param user The user object to check
 * @returns boolean indicating if the user is an admin
 */
export function isAdmin(user: any): boolean {
  // Check if user exists and has the admin role
  if (!user) return false

  // Check for admin role in user object
  // This implementation depends on your user data structure
  // Adjust according to your actual user data structure
  return user.role === "admin" || user.is_admin === true
}
