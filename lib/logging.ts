import { createClient } from "@/lib/supabase/server"

// Define log levels
export type LogLevel = "info" | "warning" | "error" | "debug"

// Define log categories
export type LogCategory = "system" | "booking" | "property" | "user" | "payment" | "upload"

// Log a system event
export async function logSystemEvent(
  level: LogLevel,
  title: string,
  details: string,
  metadata: Record<string, any> = {},
) {
  try {
    const supabase = createClient()

    await supabase.from("logs").insert({
      level,
      category: "system",
      title,
      details,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log system event:", error)
  }
}

// Log a booking-related event
export async function logBookingEvent(
  level: LogLevel,
  title: string,
  details: string,
  bookingId: string,
  metadata: Record<string, any> = {},
) {
  try {
    const supabase = createClient()

    await supabase.from("logs").insert({
      level,
      category: "booking",
      title,
      details,
      booking_id: bookingId,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log booking event:", error)
  }
}

// Log a property-related event
export async function logPropertyEvent(
  level: LogLevel,
  title: string,
  details: string,
  propertyId: string,
  metadata: Record<string, any> = {},
) {
  try {
    const supabase = createClient()

    await supabase.from("logs").insert({
      level,
      category: "property",
      title,
      details,
      property_id: propertyId,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log property event:", error)
  }
}

// Log a user-related event
export async function logUserEvent(
  level: LogLevel,
  title: string,
  details: string,
  userId: string,
  metadata: Record<string, any> = {},
) {
  try {
    const supabase = createClient()

    await supabase.from("logs").insert({
      level,
      category: "user",
      title,
      details,
      user_id: userId,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log user event:", error)
  }
}

// Log an upload-related event
export async function logUploadEvent(
  level: LogLevel,
  title: string,
  details: string,
  metadata: Record<string, any> = {},
) {
  try {
    const supabase = createClient()

    await supabase.from("logs").insert({
      level,
      category: "upload",
      title,
      details,
      metadata,
    })
  } catch (error) {
    console.error("Failed to log upload event:", error)
  }
}

// Convenience functions for common log levels
export async function logInfo(title: string, details: string, metadata: Record<string, any> = {}) {
  return logSystemEvent("info", title, details, metadata)
}

export async function logError(title: string, details: string, metadata: Record<string, any> = {}) {
  return logSystemEvent("error", title, details, metadata)
}

export async function logWarning(title: string, details: string, metadata: Record<string, any> = {}) {
  return logSystemEvent("warning", title, details, metadata)
}

export async function logDebug(title: string, details: string, metadata: Record<string, any> = {}) {
  return logSystemEvent("debug", title, details, metadata)
}
