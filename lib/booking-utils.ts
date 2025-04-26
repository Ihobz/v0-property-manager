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
 * Note: We're now using the raw ID directly without encoding
 * since Next.js handles URL parameter encoding/decoding
 */
export function encodeBookingId(id: string | null | undefined): string | null {
  const normalizedId = normalizeBookingId(id)
  if (!normalizedId) return null

  // Return the normalized ID directly without encoding
  return normalizedId
}

/**
 * Safely decodes a booking ID from a URL
 * Note: We're now assuming the ID is already decoded by Next.js
 */
export function decodeBookingId(encodedId: string | null | undefined): string | null {
  if (!encodedId) return null

  // Return the ID directly without decoding
  return normalizeBookingId(encodedId)
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
