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

    try {
      const supabase = createServerSupabaseClient()

      // Check if the logs table exists
      const { error: checkError, data: tableExists } = await supabase
        .from("system_logs")
        .select("id")
        .limit(1)
        .maybeSingle()

      // If there's an error that's not just "no rows found", the table might not exist
      if (checkError && !checkError.message.includes("no rows")) {
        console.error("Error checking logs table:", checkError)
        // Fall back to console logging
        console[level === "error" ? "error" : level === "warning" ? "warn" : "log"](
          `[${level.toUpperCase()}] ${message}`,
          details,
        )
        return NextResponse.json(
          {
            success: false,
            error: "Failed to access logs table, logged to console instead",
            details: checkError.message,
          },
          { status: 500 },
        )
      }

      // Insert the log entry
      const { error } = await supabase.from("system_logs").insert({
        message: message.substring(0, 1000), // Ensure message isn't too long
        level: level.toLowerCase(),
        category: (details?.category || "system").toLowerCase(),
        details: details || {},
        timestamp: timestamp || new Date().toISOString(),
      })

      if (error) {
        console.error("Failed to log system event:", error)
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            code: error.code,
          },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error("Database error in log API route:", dbError)
      return NextResponse.json(
        {
          success: false,
          error: dbError instanceof Error ? dbError.message : "Unknown database error",
          location: "database operation",
        },
        { status: 500 },
      )
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
