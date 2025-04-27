import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient()

    // Get the bookings table schema
    const { data: columns, error } = await supabase.rpc("get_table_info", { table_name: "bookings" })

    if (error) {
      console.error("Error fetching bookings table schema:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get a sample booking to see actual data
    const { data: sampleBooking, error: sampleError } = await supabase.from("bookings").select("*").limit(1).single()

    if (sampleError) {
      console.error("Error fetching sample booking:", sampleError)
    }

    return NextResponse.json({
      message: "Bookings table schema",
      columns,
      sampleBooking: sampleBooking || null,
      sampleColumns: sampleBooking ? Object.keys(sampleBooking) : [],
    })
  } catch (error) {
    console.error("Unexpected error in booking schema route:", error)
    return NextResponse.json({ error: "An unexpected error occurred while fetching the schema" }, { status: 500 })
  }
}
