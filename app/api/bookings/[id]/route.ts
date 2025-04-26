import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { normalizeBookingId } from "@/lib/booking-utils"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get and normalize the booking ID
    const rawBookingId = params.id
    const bookingId = normalizeBookingId(rawBookingId)

    console.log(`API Route: Fetching booking with raw ID: "${rawBookingId}", normalized ID: "${bookingId}"`)

    if (!bookingId) {
      console.error("API Route: No valid booking ID provided")
      return NextResponse.json({ error: "No valid booking ID provided" }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Log the exact query we're about to make
    console.log(`API Route: Executing query for booking ID: "${bookingId}"`)

    const { data: booking, error } = await supabase
      .from("bookings")
      .select(`
        *,
        properties:property_id (*)
      `)
      .eq("id", bookingId)
      .single()

    if (error) {
      console.error(`API Route: Error fetching booking with ID "${bookingId}":`, error)
      return NextResponse.json(
        {
          error: error.message,
          details: {
            code: error.code,
            hint: error.hint,
            details: error.details,
          },
        },
        { status: 500 },
      )
    }

    if (!booking) {
      console.error(`API Route: No booking found with ID "${bookingId}"`)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    console.log(`API Route: Successfully retrieved booking with ID "${bookingId}"`)
    return NextResponse.json({ booking })
  } catch (error) {
    console.error("API Route: Unexpected error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
