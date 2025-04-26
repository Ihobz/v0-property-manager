import { createServerSupabaseClient } from "@/lib/supabase/server"

type LogLevel = "info" | "warning" | "error"
type LogCategory = "booking" | "property" | "system" | "auth" | "payment" | "upload"

export async function logSystemEvent(
  message: string,
  level: LogLevel = "info",
  category: LogCategory = "system",
  details?: any,
) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("system_logs").insert({
      message,
      level,
      category,
      details,
      timestamp: new Date().toISOString(),
    })

    if (error) {
      console.error("Failed to log system event:", error)
    }
  } catch (error) {
    console.error("Error in logSystemEvent:", error)
  }
}

export async function logBookingEvent(message: string, level: LogLevel = "info", details?: any) {
  return logSystemEvent(message, level, "booking", details)
}

export async function logPropertyEvent(message: string, level: LogLevel = "info", details?: any) {
  return logSystemEvent(message, level, "property", details)
}

export async function logAuthEvent(message: string, level: LogLevel = "info", details?: any) {
  return logSystemEvent(message, level, "auth", details)
}

export async function logPaymentEvent(message: string, level: LogLevel = "info", details?: any) {
  return logSystemEvent(message, level, "payment", details)
}

// Add the missing exports that are used in other files
export async function logInfo(message: string, details?: any) {
  return logSystemEvent(message, "info", "system", details)
}

export async function logError(message: string, details?: any) {
  return logSystemEvent(message, "error", "system", details)
}

// Add a specific function for upload logs
export async function logUploadEvent(message: string, level: LogLevel = "info", details?: any) {
  return logSystemEvent(message, level, "upload", details)
}
