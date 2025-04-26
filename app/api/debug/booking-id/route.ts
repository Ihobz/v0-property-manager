import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get the first few bookings to examine their IDs
    const { data: bookings, error } = await supabase.from("bookings").select("id").limit(5)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return detailed information about the booking IDs
    return NextResponse.json({
      message: "Booking ID debug information",
      bookings: bookings.map((booking) => ({
        id: booking.id,
        type: typeof booking.id,
        length: booking.id.toString().length,
        firstChars: booking.id.toString().substring(0, 8),
        lastChars: booking.id.toString().substring(booking.id.toString().length - 8),
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
