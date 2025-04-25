"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { addDays, format, isWithinInterval, parseISO } from "date-fns"

// Check if a property is available for the given date range
export async function checkPropertyAvailability(propertyId: string, checkIn: string, checkOut: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all bookings for this property
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_in, check_out, status")
      .eq("property_id", propertyId)
      .not("status", "eq", "cancelled") // Exclude cancelled bookings

    if (error) {
      console.error("Error checking availability:", error)
      return { available: false, error: error.message }
    }

    // Parse the requested date range
    const requestedCheckIn = parseISO(checkIn)
    const requestedCheckOut = parseISO(checkOut)

    // Check if the requested dates overlap with any existing booking
    const isOverlapping = bookings.some((booking) => {
      const bookingCheckIn = parseISO(booking.check_in)
      const bookingCheckOut = parseISO(booking.check_out)

      // Check if there's an overlap
      return (
        // Requested check-in is during an existing booking
        isWithinInterval(requestedCheckIn, { start: bookingCheckIn, end: bookingCheckOut }) ||
        // Requested check-out is during an existing booking
        isWithinInterval(requestedCheckOut, { start: bookingCheckIn, end: bookingCheckOut }) ||
        // Existing booking is completely within the requested dates
        (requestedCheckIn <= bookingCheckIn && requestedCheckOut >= bookingCheckOut)
      )
    })

    return { available: !isOverlapping, error: null }
  } catch (error) {
    console.error("Error in checkPropertyAvailability:", error)
    return { available: false, error: "Failed to check availability" }
  }
}

// Get all booked dates for a property
export async function getPropertyBookedDates(propertyId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all bookings for this property
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_in, check_out")
      .eq("property_id", propertyId)
      .not("status", "eq", "cancelled") // Exclude cancelled bookings

    if (error) {
      console.error("Error fetching booked dates:", error)
      return { bookedDates: [], error: error.message }
    }

    // Generate all booked dates
    const bookedDates: string[] = []

    bookings.forEach((booking) => {
      const checkIn = parseISO(booking.check_in)
      const checkOut = parseISO(booking.check_out)

      // Add all dates between check-in and check-out (inclusive)
      let currentDate = checkIn
      while (currentDate <= checkOut) {
        bookedDates.push(format(currentDate, "yyyy-MM-dd"))
        currentDate = addDays(currentDate, 1)
      }
    })

    return { bookedDates, error: null }
  } catch (error) {
    console.error("Error in getPropertyBookedDates:", error)
    return { bookedDates: [], error: "Failed to fetch booked dates" }
  }
}
