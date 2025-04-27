import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json().catch((err) => {
      console.error("Failed to parse log request body:", err)
      return null
    })

    if (!body) {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
    }

    const { level, message, details, timestamp } = body

    // Validate required fields
    if (!level || !message) {
      return NextResponse.json({ success: false, error: "Missing required fields: level and message" }, { status: 400 })
    }

    // Always log to console as a fallback
    console[level === "error" ? "error" : level === "warning" ? "warn" : "log"](
      `[${level.toUpperCase()}] ${message}`,
      details,
    )

    try {
      const supabase = createServerSupabaseClient()

      // Try to insert the log, but don't throw if it fails
      try {
        await supabase.from("system_logs").insert({
          message: message.substring(0, 1000), // Ensure message isn't too long
          level: level.toLowerCase(),
          category: (details?.category || "system").toLowerCase(),
          details: details || {},
          timestamp: timestamp || new Date().toISOString(),
        })
      } catch (dbError) {
        // Just log the error but don't fail the request
        console.error("Failed to insert log to database:", dbError)
      }

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error("Database error in log API route:", dbError)
      // Still return success since we logged to console
      return NextResponse.json({ success: true, warning: "Logged to console only" })
    }
  } catch (error) {
    console.error("Error in log API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        location: "request processing",
      },
      { status: 500 },
    )
  }
}
