import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient()

    // Get a sample booking to examine its structure
    const { data: booking, error } = await supabase.from("bookings").select("*").limit(1).maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!booking) {
      return NextResponse.json({ error: "No bookings found in database" }, { status: 404 })
    }

    // Return the booking structure
    return NextResponse.json({
      columns: Object.keys(booking),
      hasMetadata: "metadata" in booking,
      metadataType: booking.metadata ? typeof booking.metadata : null,
      metadataStructure: booking.metadata ? Object.keys(booking.metadata || {}) : null,
      sampleBooking: booking,
    })
  } catch (error) {
    console.error("Error in booking-structure route:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
