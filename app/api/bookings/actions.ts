"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Type for booking data
type BookingData = {
  property_id: string
  name: string
  email: string
  phone: string
  check_in: string
  check_out: string
  guests: number
  base_price: number
  total_price: number
}

// Create a new booking
export async function createBooking(data: BookingData) {
  try {
    const supabase = createServerSupabaseClient()

    // Set default status to "awaiting_confirmation"
    const bookingData = {
      ...data,
      status: "awaiting_confirmation",
    }

    // Insert booking
    const { data: booking, error } = await supabase.from("bookings").insert([bookingData]).select().single()

    if (error) {
      console.error("Error creating booking:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin/bookings")

    return { success: true, booking }
  } catch (error) {
    console.error("Error in createBooking:", error)
    return { success: false, error: "Failed to create booking" }
  }
}

// Get all bookings
export async function getBookings() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*, properties(title, location, images)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings, error: null }
  } catch (error) {
    console.error("Error in getBookings:", error)
    return { bookings: [], error: "Failed to fetch bookings" }
  }
}

// Get booking by ID
export async function getBookingById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("*, properties(title, location, images, bedrooms, bathrooms, guests)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching booking:", error)
      return { booking: null, error: error.message }
    }

    return { booking, error: null }
  } catch (error) {
    console.error("Error in getBookingById:", error)
    return { booking: null, error: "Failed to fetch booking" }
  }
}

// Update booking status
export async function updateBookingStatus(id: string, status: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase.from("bookings").update({ status }).eq("id", id)

    if (error) {
      console.error("Error updating booking status:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error in updateBookingStatus:", error)
    return { success: false, error: "Failed to update booking status" }
  }
}

// Update booking cleaning fee
export async function updateBookingCleaningFee(id: string, cleaningFee: number) {
  try {
    const supabase = createServerSupabaseClient()

    // First get the current booking to calculate new total price
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("base_price")
      .eq("id", id)
      .single()

    if (fetchError) {
      console.error("Error fetching booking:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Calculate new total price
    const totalPrice = booking.base_price + cleaningFee

    // Update booking
    const { error } = await supabase
      .from("bookings")
      .update({
        cleaning_fee: cleaningFee,
        total_price: totalPrice,
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating booking cleaning fee:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error in updateBookingCleaningFee:", error)
    return { success: false, error: "Failed to update booking cleaning fee" }
  }
}
