import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the booking ID from the request body
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "No booking ID provided" }, { status: 400 })
    }

    console.log(`Verify API: Checking if booking ID exists: "${bookingId}"`)

    // Just check if the booking exists
    const { data, error } = await supabase.from("bookings").select("id").eq("id", bookingId).single()

    if (error) {
      console.error(`Verify API: Error verifying booking ID "${bookingId}":`, error)
      return NextResponse.json({
        exists: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      exists: !!data,
      bookingId: data?.id || null,
    })
  } catch (error) {
    console.error("Verify API: Unexpected error:", error)
    return NextResponse.json(
      {
        exists: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
