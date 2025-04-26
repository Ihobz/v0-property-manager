/**
 * Utility functions for handling booking IDs consistently throughout the application
 */

/**
 * Normalizes a booking ID to ensure consistent format
 * This helps prevent issues with different ID formats across the application
 */
export function normalizeBookingId(id: string | null | undefined): string | null {
  if (!id) return null

  // Remove any whitespace and ensure string format
  return String(id).trim()
}

/**
 * Safely encodes a booking ID for use in URLs
 */
export function encodeBookingId(id: string | null | undefined): string | null {
  const normalizedId = normalizeBookingId(id)
  if (!normalizedId) return null

  return encodeURIComponent(normalizedId)
}

/**
 * Safely decodes a booking ID from a URL
 */
export function decodeBookingId(encodedId: string | null | undefined): string | null {
  if (!encodedId) return null

  try {
    return decodeURIComponent(encodedId)
  } catch (error) {
    console.error("Error decoding booking ID:", error)
    return encodedId // Return the original if decoding fails
  }
}

/**
 * Formats a booking ID for display (e.g., truncating for UI)
 */
export function formatBookingIdForDisplay(id: string | null | undefined): string {
  const normalizedId = normalizeBookingId(id)
  if (!normalizedId) return "Unknown"

  // If ID is long, truncate it for display
  if (normalizedId.length > 8) {
    return normalizedId.substring(0, 8)
  }

  return normalizedId
}

/**
 * Validates if a string is a valid booking ID
 */
export function isValidBookingId(id: string | null | undefined): boolean {
  const normalizedId = normalizeBookingId(id)
  return normalizedId !== null && normalizedId.length > 0
}
