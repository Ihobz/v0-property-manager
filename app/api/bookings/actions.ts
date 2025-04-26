"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail, sendBookingStatusUpdateEmail } from "@/lib/email-service"

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
    const supabase = createServerSupabaseClient()

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
      console.error("Error creating booking:", error)
      return { booking: null, error: error.message }
    }

    // Get property details for the email
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("title, location")
      .eq("id", bookingData.property_id)
      .single()

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
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError)
        // Continue even if email fails
      }
    }

    // Revalidate paths
    revalidatePath(`/properties/${bookingData.property_id}`)

    return { booking: data, error: null }
  } catch (error) {
    console.error("Error in createBooking:", error)
    return { booking: null, error: "Failed to create booking" }
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
      console.error("Error fetching bookings:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings: data, error: null }
  } catch (error) {
    console.error("Error in getBookings:", error)
    return { bookings: [], error: "Failed to fetch bookings" }
  }
}

// Get booking by ID
export async function getBookingById(id: string) {
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
          price,
          images,
          bedrooms,
          bathrooms,
          guests
        )
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching booking:", error)
      return { booking: null, error: error.message }
    }

    return { booking: data, error: null }
  } catch (error) {
    console.error("Error in getBookingById:", error)
    return { booking: null, error: "Failed to fetch booking" }
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
          title
        )
      `)
      .eq("email", email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error checking bookings by email:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings: data, error: null }
  } catch (error) {
    console.error("Error in checkBookingByEmail:", error)
    return { bookings: [], error: "Failed to check bookings" }
  }
}

// Update booking status
export async function updateBookingStatus(id: string, status: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the booking first to have the email and property info
    const { booking, error: fetchError } = await getBookingById(id)

    if (fetchError || !booking) {
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
      .eq("id", id)

    if (error) {
      console.error("Error updating booking status:", error)
      return { success: false, error: error.message }
    }

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
    } catch (emailError) {
      console.error("Error sending status update email:", emailError)
      // Continue even if email fails
    }

    // Revalidate paths
    revalidatePath(`/admin/bookings`)
    revalidatePath(`/admin/bookings/${id}`)
    revalidatePath(`/booking-status/${id}`)

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

// Update booking payment proof
export async function updatePaymentProof(id: string, paymentProofUrl: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from("bookings")
      .update({
        payment_proof: paymentProofUrl,
        status: "awaiting_confirmation", // Update status when payment proof is uploaded
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating payment proof:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)
    revalidatePath(`/upload/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error in updatePaymentProof:", error)
    return { success: false, error: "Failed to update payment proof" }
  }
}

// Add tenant ID document
export async function addTenantIdDocument(id: string, documentUrl: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First get the current booking to check existing tenant IDs
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("tenant_id")
      .eq("id", id)
      .single()

    if (fetchError) {
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
    const { error } = await supabase.from("bookings").update({ tenant_id: tenantIds }).eq("id", id)

    if (error) {
      console.error("Error adding tenant ID document:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)
    revalidatePath(`/upload/${id}`)

    return { success: true }
  } catch (error) {
    console.error("Error in addTenantIdDocument:", error)
    return { success: false, error: "Failed to add tenant ID document" }
  }
}
