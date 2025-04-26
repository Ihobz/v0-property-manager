import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        properties:property_id (*)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Error fetching booking:", error)
      return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error("Error in booking API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
