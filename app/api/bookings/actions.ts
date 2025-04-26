"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail, generateBookingConfirmationEmail } from "@/lib/email-service"

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

    // Get property details for the email
    const { data: property } = await supabase
      .from("properties")
      .select("title, location, images")
      .eq("id", data.property_id)
      .single()

    // Send confirmation email
    if (property) {
      const emailData = generateBookingConfirmationEmail(booking, property)
      await sendEmail(emailData)
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

// Get bookings by email
export async function getBookingsByEmail(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: bookings, error } = await supabase
      .from("bookings")
      .select("*, properties(title, location, images)")
      .eq("email", email)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching bookings by email:", error)
      return { bookings: [], error: error.message }
    }

    return { bookings, error: null }
  } catch (error) {
    console.error("Error in getBookingsByEmail:", error)
    return { bookings: [], error: "Failed to fetch bookings by email" }
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

    // If status is confirmed, send confirmation email to guest
    if (status === "confirmed") {
      // Get booking details with property info
      const { data: booking } = await supabase
        .from("bookings")
        .select("*, properties(title, location, images)")
        .eq("id", id)
        .single()

      if (booking) {
        // Send confirmation email
        const emailData = {
          to: booking.email,
          subject: "Your El Gouna Rentals Booking is Confirmed!",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #1E88E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; }
                .details { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 4px; }
                .property-name { font-size: 18px; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Booking Confirmed!</h1>
                </div>
                <div class="content">
                  <p>Dear ${booking.name},</p>
                  <p>Great news! Your booking at El Gouna Rentals has been confirmed.</p>
                  
                  <div class="details">
                    <p class="property-name">${booking.properties?.title || "Your Property"}</p>
                    <p><strong>Check-in:</strong> ${new Date(booking.check_in).toLocaleDateString()}</p>
                    <p><strong>Check-out:</strong> ${new Date(booking.check_out).toLocaleDateString()}</p>
                    <p><strong>Guests:</strong> ${booking.guests}</p>
                    <p><strong>Total Price:</strong> $${booking.total_price}</p>
                  </div>
                  
                  <p>We're looking forward to welcoming you to El Gouna. You'll receive check-in instructions closer to your arrival date.</p>
                  
                  <p>If you have any questions or need assistance, please don't hesitate to contact us at support@elgounarentals.com.</p>
                  
                  <p>Best regards,<br>El Gouna Rentals Team</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} El Gouna Rentals. All rights reserved.</p>
                  <p>El Gouna, Red Sea Governorate, Egypt</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }
        await sendEmail(emailData)
      }
    }

    // If status is cancelled, send cancellation email to guest
    if (status === "cancelled") {
      // Get booking details
      const { data: booking } = await supabase
        .from("bookings")
        .select("name, email, check_in, check_out, properties(title)")
        .eq("id", id)
        .single()

      if (booking) {
        // Send cancellation email
        const emailData = {
          to: booking.email,
          subject: "Your El Gouna Rentals Booking has been Cancelled",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #1E88E5; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Booking Cancelled</h1>
                </div>
                <div class="content">
                  <p>Dear ${booking.name},</p>
                  <p>We regret to inform you that your booking at ${booking.properties?.title || "our property"} for ${new Date(booking.check_in).toLocaleDateString()} to ${new Date(booking.check_out).toLocaleDateString()} has been cancelled.</p>
                  
                  <p>If you have any questions about this cancellation or would like to make a new booking, please contact us at support@elgounarentals.com.</p>
                  
                  <p>Best regards,<br>El Gouna Rentals Team</p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} El Gouna Rentals. All rights reserved.</p>
                  <p>El Gouna, Red Sea Governorate, Egypt</p>
                </div>
              </div>
            </body>
            </html>
          `,
        }
        await sendEmail(emailData)
      }
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
