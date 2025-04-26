"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { addDays, format, isWithinInterval, parseISO } from "date-fns"
import { revalidatePath } from "next/cache"

// Check if a property is available for the given date range
export async function checkPropertyAvailability(propertyId: string, checkIn: string, checkOut: string) {
  try {
    if (!propertyId || propertyId === "undefined") {
      return { available: false, error: "Invalid property ID" }
    }

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

    // Check if any of the dates are blocked
    const { data: blockedDates, error: blockedError } = await supabase
      .from("blocked_dates")
      .select("date")
      .eq("property_id", propertyId)
      .gte("date", checkIn)
      .lte("date", checkOut)

    if (blockedError) {
      console.error("Error checking blocked dates:", blockedError)
      return { available: false, error: blockedError.message }
    }

    // If there are any blocked dates in the range, the property is not available
    const hasBlockedDates = blockedDates && blockedDates.length > 0

    return { available: !isOverlapping && !hasBlockedDates, error: null }
  } catch (error) {
    console.error("Error in checkPropertyAvailability:", error)
    return { available: false, error: "Failed to check availability" }
  }
}

// Get all booked dates for a property
export async function getPropertyBookedDates(propertyId: string) {
  try {
    // Validate propertyId
    if (!propertyId || propertyId === "undefined") {
      console.error("Invalid property ID provided:", propertyId)
      return {
        bookedDates: [],
        confirmedDates: [],
        pendingDates: [],
        awaitingPaymentDates: [],
        blockedDates: [],
        error: "Invalid property ID",
      }
    }

    const supabase = createServerSupabaseClient()

    // Get all bookings for this property
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("check_in, check_out, status")
      .eq("property_id", propertyId)
      .not("status", "eq", "cancelled") // Exclude cancelled bookings

    if (error) {
      console.error("Error fetching booked dates:", error)
      return { bookedDates: [], error: error.message }
    }

    // Generate all booked dates
    const bookedDates: string[] = []
    const confirmedDates: string[] = []
    const pendingDates: string[] = []
    const awaitingPaymentDates: string[] = []

    bookings.forEach((booking) => {
      const checkIn = parseISO(booking.check_in)
      const checkOut = parseISO(booking.check_out)

      // Add all dates between check-in and check-out (inclusive)
      let currentDate = checkIn
      while (currentDate <= checkOut) {
        const formattedDate = format(currentDate, "yyyy-MM-dd")
        bookedDates.push(formattedDate)

        // Also track dates by status
        if (booking.status === "confirmed") {
          confirmedDates.push(formattedDate)
        } else if (booking.status === "awaiting_confirmation") {
          pendingDates.push(formattedDate)
        } else if (booking.status === "awaiting_payment") {
          awaitingPaymentDates.push(formattedDate)
        }

        currentDate = addDays(currentDate, 1)
      }
    })

    // Get all blocked dates for this property
    const { data: blockedDates, error: blockedError } = await supabase
      .from("blocked_dates")
      .select("date")
      .eq("property_id", propertyId)

    if (blockedError) {
      console.error("Error fetching blocked dates:", blockedError)
      return {
        bookedDates,
        confirmedDates,
        pendingDates,
        awaitingPaymentDates,
        blockedDates: [],
        error: blockedError.message,
      }
    }

    // Extract blocked dates
    const blockedDatesList = blockedDates ? blockedDates.map((item) => item.date) : []

    // Add blocked dates to the booked dates array
    bookedDates.push(...blockedDatesList)

    return {
      bookedDates,
      confirmedDates,
      pendingDates,
      awaitingPaymentDates,
      blockedDates: blockedDatesList,
      error: null,
    }
  } catch (error) {
    console.error("Error in getPropertyBookedDates:", error)
    return {
      bookedDates: [],
      confirmedDates: [],
      pendingDates: [],
      awaitingPaymentDates: [],
      blockedDates: [],
      error: "Failed to fetch booked dates",
    }
  }
}

// Get all bookings and blocked dates for a property
export async function getPropertyBookings(propertyId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get all bookings for this property
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, name, email, check_in, check_out, status")
      .eq("property_id", propertyId)
      .order("check_in", { ascending: true })

    if (bookingsError) {
      console.error("Error fetching property bookings:", bookingsError)
      return { bookings: [], blockedDates: [], error: bookingsError.message }
    }

    // Get all blocked dates for this property
    const { data: blockedDates, error: blockedError } = await supabase
      .from("blocked_dates")
      .select("id, date, reason")
      .eq("property_id", propertyId)
      .order("date", { ascending: true })

    if (blockedError) {
      console.error("Error fetching blocked dates:", blockedError)
      return { bookings, blockedDates: [], error: blockedError.message }
    }

    return { bookings, blockedDates, error: null }
  } catch (error) {
    console.error("Error in getPropertyBookings:", error)
    return { bookings: [], blockedDates: [], error: "Failed to fetch property calendar data" }
  }
}

// Block dates for a property
export async function blockPropertyDates(propertyId: string, startDate: string, endDate: string, reason?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if any of the dates are already booked
    const { available, error: availabilityError } = await checkPropertyAvailability(propertyId, startDate, endDate)

    if (availabilityError) {
      console.error("Error checking availability:", availabilityError)
      return { success: false, error: availabilityError }
    }

    if (!available) {
      return { success: false, error: "Some of the selected dates are already booked" }
    }

    // Generate all dates between start and end
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const dates = []
    let currentDate = start

    while (currentDate <= end) {
      dates.push({
        property_id: propertyId,
        date: format(currentDate, "yyyy-MM-dd"),
        reason: reason || null,
      })
      currentDate = addDays(currentDate, 1)
    }

    // Insert blocked dates
    const { error } = await supabase.from("blocked_dates").insert(dates)

    if (error) {
      console.error("Error blocking dates:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in blockPropertyDates:", error)
    return { success: false, error: "Failed to block dates" }
  }
}

// Unblock a date for a property
export async function unblockPropertyDates(propertyId: string, date: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete the blocked date
    const { error } = await supabase.from("blocked_dates").delete().eq("property_id", propertyId).eq("date", date)

    if (error) {
      console.error("Error unblocking date:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error("Error in unblockPropertyDates:", error)
    return { success: false, error: "Failed to unblock date" }
  }
}

// Block individual date
export async function blockDate(propertyId: string, date: string, reason?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if the date is already blocked
    const { data: existingBlock } = await supabase
      .from("blocked_dates")
      .select("id")
      .eq("property_id", propertyId)
      .eq("date", date)
      .single()

    if (existingBlock) {
      return { success: false, error: "Date is already blocked" }
    }

    // Check if the date has a booking
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id")
      .eq("property_id", propertyId)
      .lte("check_in", date)
      .gte("check_out", date)
      .not("status", "eq", "cancelled")

    if (bookings && bookings.length > 0) {
      return { success: false, error: "Date has an existing booking" }
    }

    // Block the date
    const { error } = await supabase.from("blocked_dates").insert({
      property_id: propertyId,
      date,
      reason: reason || "Manually blocked",
    })

    if (error) {
      throw new Error(error.message)
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error("Error blocking date:", error)
    return { success: false, error: "Failed to block date" }
  }
}

// Unblock individual date
export async function unblockDate(propertyId: string, date: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("blocked_dates").delete().eq("property_id", propertyId).eq("date", date)

    if (error) {
      throw new Error(error.message)
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return { success: true }
  } catch (error) {
    console.error("Error unblocking date:", error)
    return { success: false, error: "Failed to unblock date" }
  }
}

// Block multiple dates
export async function blockMultipleDates(propertyId: string, dates: string[], reason?: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Check if any dates are already blocked or booked
    const existingBlocks = await Promise.all(
      dates.map(async (date) => {
        // Check if already blocked
        const { data: existingBlock } = await supabase
          .from("blocked_dates")
          .select("id")
          .eq("property_id", propertyId)
          .eq("date", date)
          .single()

        if (existingBlock) return { date, blocked: true, booked: false }

        // Check if booked
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id")
          .eq("property_id", propertyId)
          .lte("check_in", date)
          .gte("check_out", date)
          .not("status", "eq", "cancelled")

        if (bookings && bookings.length > 0) return { date, blocked: false, booked: true }

        return { date, blocked: false, booked: false }
      }),
    )

    // Filter out dates that are already blocked or booked
    const datesToBlock = existingBlocks
      .filter((item) => !item.blocked && !item.booked)
      .map((item) => ({
        property_id: propertyId,
        date: item.date,
        reason: reason || "Manually blocked",
      }))

    if (datesToBlock.length === 0) {
      return {
        success: false,
        error: "All selected dates are already blocked or booked",
        blockedCount: 0,
        totalCount: dates.length,
      }
    }

    // Block the dates
    const { error } = await supabase.from("blocked_dates").insert(datesToBlock)

    if (error) {
      throw new Error(error.message)
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return {
      success: true,
      blockedCount: datesToBlock.length,
      totalCount: dates.length,
    }
  } catch (error) {
    console.error("Error blocking multiple dates:", error)
    return {
      success: false,
      error: "Failed to block dates",
      blockedCount: 0,
      totalCount: dates.length,
    }
  }
}

// Unblock date range
export async function unblockDateRange(propertyId: string, startDate: string, endDate: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete all blocked dates in the range
    const { data, error } = await supabase
      .from("blocked_dates")
      .delete()
      .eq("property_id", propertyId)
      .gte("date", startDate)
      .lte("date", endDate)
      .select("id")

    if (error) {
      throw new Error(error.message)
    }

    // Revalidate paths
    revalidatePath(`/admin/properties/calendar/${propertyId}`)
    revalidatePath(`/properties/${propertyId}`)

    return {
      success: true,
      unblockedCount: data?.length || 0,
    }
  } catch (error) {
    console.error("Error unblocking date range:", error)
    return {
      success: false,
      error: "Failed to unblock dates",
      unblockedCount: 0,
    }
  }
}

export async function getPropertyAvailability(propertyId: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, check_in, check_out, status")
      .eq("property_id", propertyId)
      .not("status", "eq", "cancelled")

    if (bookingsError) {
      throw new Error(bookingsError.message)
    }

    // Get blocked dates
    const { data: blockedDates, error: blockedDatesError } = await supabase
      .from("blocked_dates")
      .select("id, date, reason")
      .eq("property_id", propertyId)

    if (blockedDatesError) {
      throw new Error(blockedDatesError.message)
    }

    return {
      success: true,
      bookings: bookings || [],
      blockedDates: blockedDates || [],
    }
  } catch (error) {
    console.error("Error getting property availability:", error)
    return { success: false, error: "Failed to get property availability" }
  }
}
