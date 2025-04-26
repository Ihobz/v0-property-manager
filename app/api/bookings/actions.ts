"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from "@/lib/email-service"
import { normalizeBookingId } from "@/lib/booking-utils"
import { logBookingEvent } from "@/lib/logging"

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
export async function createBooking(bookingData: any) {
  try {
    await logBookingEvent("Creating new booking", "info", { bookingData })
    const supabase = createServerSupabaseClient()

    // Validate the booking data
    if (
      !bookingData.property_id ||
      !bookingData.name ||
      !bookingData.email ||
      !bookingData.check_in ||
      !bookingData.check_out
    ) {
      const errorMsg = "Missing required booking fields"
      await logBookingEvent(errorMsg, "error", { bookingData })
      return { booking: null, error: errorMsg }
    }

    // Insert the booking
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...bookingData,
        status: "awaiting_payment", // Default status
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      await logBookingEvent("Error creating booking", "error", { error, bookingData })
      console.error("Error creating booking:", error)
      return { booking: null, error: error.message }
    }

    await logBookingEvent("Booking created successfully", "info", { bookingId: data.id })

    // Get property details for the email
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("title, location")
      .eq("id", bookingData.property_id)
      .single()

    if (propertyError) {
      await logBookingEvent("Error fetching property details for email", "warning", {
        propertyError,
        bookingId: data.id,
      })
    }

    if (!propertyError && property) {
      // Send confirmation email
      try {
        await sendBookingConfirmationEmail({
          email: bookingData.email,
          name: bookingData.name,
          bookingId: data.id,
          propertyTitle: property.title,
          checkIn: bookingData.check_in,
          checkOut: bookingData.check_out,
          totalPrice: bookingData.total_price,
        })
        await logBookingEvent("Booking confirmation email sent", "info", {
          bookingId: data.id,
          email: bookingData.email,
        })
      } catch (emailError) {
        await logBookingEvent("Error sending confirmation email", "warning", { emailError, bookingId: data.id })
        console.error("Error sending confirmation email:", emailError)
        // Continue even if email fails
      }
    }

    // Revalidate paths
    revalidatePath(`/properties/${bookingData.property_id}`)

    return { booking: data, error: null }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create booking"
    await logBookingEvent("Unexpected error in createBooking", "error", { error })
    console.error("Error in createBooking:", error)
    return { booking: null, error: errorMsg }
  }
}

// Get all bookings
export async function getBookings() {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        properties:property_id (
          id,
          title,
          location,
          price
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      await logBookingEvent("Error fetching all bookings", "error", { error })
      console.error("Error fetching bookings:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings: data, error: null }
  } catch (error) {
    await logBookingEvent("Unexpected error in getBookings", "error", { error })
    console.error("Error in getBookings:", error)
    return { bookings: [], error: "Failed to fetch bookings" }
  }
}

// Get booking by ID with improved error handling
export async function getBookingById(id: string) {
  try {
    // Normalize the booking ID
    const bookingId = normalizeBookingId(id)
    console.log(`Server Action: Fetching booking with raw ID: "${id}", normalized ID: "${bookingId}"`)
    await logBookingEvent(`Fetching booking by ID: ${id}`, "info", { rawId: id, normalizedId: bookingId })

    if (!bookingId) {
      console.error("Server Action: No valid booking ID provided")
      await logBookingEvent("No valid booking ID provided", "error", { rawId: id })
      return { booking: null, error: "No valid booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    // Log the exact query we're about to make
    console.log(`Server Action: Executing query for booking ID: "${bookingId}"`)

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        properties:property_id (
          id,
          title,
          location,
          price,
          images,
          bedrooms,
          bathrooms,
          guests
        )
      `)
      .eq("id", bookingId)
      .single()

    if (error) {
      console.error(`Server Action: Error fetching booking with ID "${bookingId}":`, error)
      await logBookingEvent(`Error fetching booking with ID: ${bookingId}`, "error", { error })
      return {
        booking: null,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
      }
    }

    if (!data) {
      console.error(`Server Action: No booking found with ID "${bookingId}"`)
      await logBookingEvent(`No booking found with ID: ${bookingId}`, "warning")
      return { booking: null, error: "Booking not found" }
    }

    console.log(`Server Action: Successfully retrieved booking with ID "${bookingId}"`)
    await logBookingEvent(`Successfully retrieved booking with ID: ${bookingId}`, "info")
    return { booking: data, error: null }
  } catch (error) {
    console.error("Server Action: Unexpected error:", error)
    await logBookingEvent("Unexpected error in getBookingById", "error", { error })
    return {
      booking: null,
      error: "Failed to fetch booking",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

// Get bookings by email
export async function getBookingsByEmail(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        check_in,
        check_out,
        created_at,
        properties:property_id (
          title,
          location
        )
      `)
      .eq("email", email)
      .order("created_at", { ascending: false })

    if (error) {
      await logBookingEvent(`Error checking bookings by email: ${email}`, "error", { error })
      console.error("Error checking bookings by email:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings: data, error: null }
  } catch (error) {
    await logBookingEvent("Unexpected error in getBookingsByEmail", "error", { error })
    console.error("Error in checkBookingByEmail:", error)
    return { bookings: [], error: "Failed to check bookings" }
  }
}

// Update booking status
export async function updateBookingStatus(id: string, status: string) {
  try {
    // Normalize the booking ID
    const bookingId = normalizeBookingId(id)
    await logBookingEvent(`Updating booking status: ${id} to ${status}`, "info", { bookingId, status })

    if (!bookingId) {
      await logBookingEvent("No valid booking ID provided for status update", "error", { rawId: id })
      return { success: false, error: "No valid booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    // Get the booking first to have the email and property info
    const { booking, error: fetchError } = await getBookingById(bookingId)

    if (fetchError || !booking) {
      await logBookingEvent("Error fetching booking for status update", "error", { fetchError, bookingId })
      console.error("Error fetching booking for status update:", fetchError)
      return { success: false, error: fetchError || "Booking not found" }
    }

    // Update the booking status
    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    if (error) {
      await logBookingEvent("Error updating booking status", "error", { error, bookingId, status })
      console.error("Error updating booking status:", error)
      return { success: false, error: error.message }
    }

    await logBookingEvent(`Booking status updated successfully to ${status}`, "info", { bookingId })

    // Send email notification
    try {
      await sendBookingStatusUpdateEmail({
        email: booking.email,
        name: booking.name,
        bookingId: booking.id,
        propertyTitle: booking.properties.title,
        checkIn: booking.check_in,
        checkOut: booking.check_out,
        status,
      })
      await logBookingEvent("Status update email sent", "info", { bookingId, email: booking.email, status })
    } catch (emailError) {
      await logBookingEvent("Error sending status update email", "warning", { emailError, bookingId })
      console.error("Error sending status update email:", emailError)
      // Continue even if email fails
    }

    // Revalidate paths
    revalidatePath(`/admin/bookings`)
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath(`/booking-status/${bookingId}`)

    return { success: true }
  } catch (error) {
    await logBookingEvent("Unexpected error in updateBookingStatus", "error", { error })
    console.error("Error in updateBookingStatus:", error)
    return { success: false, error: "Failed to update booking status" }
  }
}

/**
 * Updates the cleaning fee for a booking
 */
export async function updateBookingCleaningFee(bookingId: string, cleaningFee: number) {
  console.log(`Updating cleaning fee for booking ID: "${bookingId}" to $${cleaningFee}`)
  await logBookingEvent(`Updating cleaning fee for booking ID: ${bookingId} to $${cleaningFee}`, "info")

  try {
    if (!bookingId) {
      await logBookingEvent("No booking ID provided for cleaning fee update", "error")
      return { success: false, error: "No booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    // First get the current booking to calculate the new total price
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("base_price")
      .eq("id", bookingId)
      .single()

    if (fetchError) {
      await logBookingEvent("Error fetching booking for cleaning fee update", "error", { fetchError, bookingId })
      console.error("Error fetching booking for cleaning fee update:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Calculate new total price
    const basePrice = booking.base_price || 0
    const totalPrice = basePrice + cleaningFee

    // Update the booking with new cleaning fee and total price
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        cleaning_fee: cleaningFee,
        total_price: totalPrice,
      })
      .eq("id", bookingId)

    if (updateError) {
      await logBookingEvent("Error updating cleaning fee", "error", { updateError, bookingId })
      console.error("Error updating cleaning fee:", updateError)
      return { success: false, error: updateError.message }
    }

    await logBookingEvent("Cleaning fee updated successfully", "info", { bookingId, cleaningFee, totalPrice })

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${bookingId}`)

    return { success: true }
  } catch (error) {
    await logBookingEvent("Unexpected error updating cleaning fee", "error", { error, bookingId })
    console.error("Unexpected error updating cleaning fee:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}

// Update booking payment proof
export async function updatePaymentProof(id: string, paymentProofUrl: string) {
  try {
    // Normalize the booking ID
    const bookingId = normalizeBookingId(id)
    await logBookingEvent(`Updating payment proof for booking: ${id}`, "info", { bookingId })

    if (!bookingId) {
      await logBookingEvent("No valid booking ID provided for payment proof update", "error", { rawId: id })
      return { success: false, error: "No valid booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("bookings")
      .update({
        payment_proof: paymentProofUrl,
        status: "awaiting_confirmation", // Update status when payment proof is uploaded
      })
      .eq("id", bookingId)

    if (error) {
      await logBookingEvent("Error updating payment proof", "error", { error, bookingId })
      console.error("Error updating payment proof:", error)
      return { success: false, error: error.message }
    }

    await logBookingEvent("Payment proof updated successfully", "info", { bookingId })

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath(`/upload/${bookingId}`)

    return { success: true }
  } catch (error) {
    await logBookingEvent("Unexpected error in updatePaymentProof", "error", { error })
    console.error("Error in updatePaymentProof:", error)
    return { success: false, error: "Failed to update payment proof" }
  }
}

// Add tenant ID document
export async function addTenantIdDocument(id: string, documentUrl: string) {
  try {
    // Normalize the booking ID
    const bookingId = normalizeBookingId(id)
    await logBookingEvent(`Adding tenant ID document for booking: ${id}`, "info", { bookingId })

    if (!bookingId) {
      await logBookingEvent("No valid booking ID provided for tenant ID document", "error", { rawId: id })
      return { success: false, error: "No valid booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    // First get the current booking to check existing tenant IDs
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("tenant_id")
      .eq("id", bookingId)
      .single()

    if (fetchError) {
      await logBookingEvent("Error fetching booking for tenant ID document", "error", { fetchError, bookingId })
      console.error("Error fetching booking:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Create or update the tenant_id array
    let tenantIds: string[] = []

    if (booking.tenant_id) {
      // If tenant_id exists and is an array, add the new document URL
      if (Array.isArray(booking.tenant_id)) {
        tenantIds = [...booking.tenant_id, documentUrl]
      } else if (typeof booking.tenant_id === "string") {
        // If it's a string (single URL), convert to array with both URLs
        tenantIds = [booking.tenant_id, documentUrl]
      }
    } else {
      // If no tenant_id exists yet, create a new array with this document
      tenantIds = [documentUrl]
    }

    // Update the booking with the new tenant_id array
    const { error } = await supabase.from("bookings").update({ tenant_id: tenantIds }).eq("id", bookingId)

    if (error) {
      await logBookingEvent("Error adding tenant ID document", "error", { error, bookingId })
      console.error("Error adding tenant ID document:", error)
      return { success: false, error: error.message }
    }

    await logBookingEvent("Tenant ID document added successfully", "info", { bookingId })

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath(`/upload/${bookingId}`)

    return { success: true }
  } catch (error) {
    await logBookingEvent("Unexpected error in addTenantIdDocument", "error", { error })
    console.error("Error in addTenantIdDocument:", error)
    return { success: false, error: "Failed to add tenant ID document" }
  }
}

/**
 * Verifies if a booking ID exists in the database
 */
export async function verifyBookingId(bookingId: string) {
  console.log(`Verifying booking ID: "${bookingId}"`)
  await logBookingEvent(`Verifying booking ID: ${bookingId}`, "info")

  try {
    if (!bookingId) {
      await logBookingEvent("No booking ID provided for verification", "error")
      return { exists: false, error: "No booking ID provided" }
    }

    const supabase = createServerSupabaseClient()

    // Check if the booking exists
    const { data, error } = await supabase.from("bookings").select("id, status").eq("id", bookingId).maybeSingle()

    if (error) {
      await logBookingEvent("Error verifying booking ID", "error", { error, bookingId })
      console.error("Error verifying booking ID:", error)
      return {
        exists: false,
        error: error.message,
        details: {
          code: error.code,
          hint: error.hint,
          details: error.details,
        },
      }
    }

    await logBookingEvent(`Booking verification result: ${!!data}`, "info", { bookingId, exists: !!data })

    return {
      exists: !!data,
      bookingId: data?.id || null,
      status: data?.status || null,
    }
  } catch (error) {
    await logBookingEvent("Unexpected error verifying booking ID", "error", { error, bookingId })
    console.error("Unexpected error verifying booking ID:", error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
