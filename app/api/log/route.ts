import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { level, message, details, timestamp } = await request.json()

    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("system_logs").insert({
      message,
      level,
      category: details?.category || "system",
      details,
      timestamp: timestamp || new Date().toISOString(),
    })

    if (error) {
      console.error("Failed to log system event:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in log API route:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
