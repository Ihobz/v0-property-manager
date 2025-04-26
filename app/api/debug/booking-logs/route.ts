import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the user is authenticated and is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin status
    const { data: adminData } = await supabase.from("admins").select("*").eq("email", user.email).single()

    if (!adminData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch logs from the system_logs table
    const { data: logs, error } = await supabase
      .from("system_logs")
      .select("*")
      .eq("category", "booking")
      .order("timestamp", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching logs:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error in booking logs API:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
