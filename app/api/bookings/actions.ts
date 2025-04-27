"use server"

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail } from "@/lib/email-service"
import { normalizeBookingId } from "@/lib/booking-utils"
import { logBookingEvent, logError, logInfo } from "@/lib/logging"

// Type for booking data
type BookingData = {
  property_id?: string
  propertyId?: string
  name: string
  email: string
  phone: string
  check_in?: string
  checkIn?: string
  check_out?: string
  checkOut?: string
  guests?: number
  base_price?: number
  total_price?: number
  totalPrice?: number
  notes?: string // We'll keep this in the type but won't send it to the database
}

// Create a new booking - handles both FormData and direct object inputs
export async function createBooking(input: FormData | BookingData) {
  try {
    await logBookingEvent("Creating new booking", "info", {
      inputType: input instanceof FormData ? "FormData" : "Object",
    })

    // Use admin client to bypass RLS policies
    const supabase = createAdminSupabaseClient()

    // Determine if input is FormData or BookingData
    let normalizedData: any = {}

    if (input instanceof FormData) {
      // Handle FormData input
      normalizedData = {
        property_id: input.get("propertyId") || input.get("property_id"),
        name: input.get("name"),
        email: input.get("email"),
        phone: input.get("phone"),
        check_in: input.get("checkIn") || input.get("check_in"),
        check_out: input.get("checkOut") || input.get("check_out"),
        guests: Number(input.get("guests") || 2),
        base_price: Number(input.get("basePrice") || input.get("base_price") || 0),
        total_price: Number(input.get("totalPrice") || input.get("total_price") || 0),
        notes: input.get("notes") || input.get("specialRequests"),
      }
    } else {
      // Handle BookingData object input
      normalizedData = {
        property_id: input.property_id || input.propertyId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        check_in: input.check_in || input.checkIn,
        check_out: input.check_out || input.checkOut,
        guests: input.guests || 2, // Default to 2 guests if not specified
        base_price: input.base_price || (input.total_price || input.totalPrice || 0) * 0.9, // Estimate base price if not provided
        total_price: input.total_price || input.totalPrice,
        notes: input.notes,
      }
    }

    // Validate the booking data
    if (
      !normalizedData.property_id ||
      !normalizedData.name ||
      !normalizedData.email ||
      !normalizedData.check_in ||
      !normalizedData.check_out
    ) {
      const errorMsg = "Missing required booking fields"
      await logBookingEvent(errorMsg, "error", { normalizedData })
      return { booking: null, error: errorMsg }
    }

    // Insert the booking - make sure we only include fields that exist in the database
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        property_id: normalizedData.property_id,
        name: normalizedData.name,
        email: normalizedData.email,
        phone: normalizedData.phone,
        check_in: normalizedData.check_in,
        check_out: normalizedData.check_out,
        guests: normalizedData.guests,
        base_price: normalizedData.base_price,
        total_price: normalizedData.total_price,
        status: "awaiting_payment", // Default status
        created_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      await logBookingEvent("Error creating booking", "error", { error, bookingData: normalizedData })
      console.error("Error creating booking:", error)
      return { booking: null, error: error.message }
    }

    // Check if we got data back and it's an array with at least one element
    if (!data || data.length === 0) {
      const errorMsg = "Booking was created but no data was returned"
      await logBookingEvent(errorMsg, "error", { bookingData: normalizedData })
      return { booking: null, error: errorMsg }
    }

    // Use the first booking from the array
    const booking = data[0]
    await logBookingEvent("Booking created successfully", "info", { bookingId: booking.id })

    // Get property details for the email
    const { data: property, error: propertyError } = await supabase
      .from("properties")
      .select("name, location")
      .eq("id", normalizedData.property_id)
      .maybeSingle()

    if (propertyError) {
      await logBookingEvent("Error fetching property details for email", "warning", {
        propertyError,
        bookingId: booking.id,
      })
    }

    if (!propertyError && property) {
      // Send confirmation email
      try {
        await sendBookingConfirmationEmail({
          email: normalizedData.email,
          name: normalizedData.name,
          bookingId: booking.id,
          propertyTitle: property.name,
          checkIn: normalizedData.check_in,
          checkOut: normalizedData.check_out,
          totalPrice: normalizedData.total_price,
        })
        await logBookingEvent("Booking confirmation email sent", "info", {
          bookingId: booking.id,
          email: normalizedData.email,
        })
      } catch (emailError) {
        await logBookingEvent("Error sending confirmation email", "warning", { emailError, bookingId: booking.id })
        console.error("Error sending confirmation email:", emailError)
        // Continue even if email fails
      }
    }

    // Revalidate paths
    revalidatePath(`/properties/${normalizedData.property_id}`)

    return { booking, error: null }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to create booking"
    await logBookingEvent("Unexpected error in createBooking", "error", { error })
    console.error("Error in createBooking:", error)
    return { booking: null, error: errorMsg }
  }
}

// Get all bookings with improved debugging
export async function getBookings() {
  try {
    console.log("Server Action: getBookings - Starting to fetch bookings")

    // Check if environment variables are configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Server Action: getBookings - Missing Supabase environment variables")
      return {
        bookings: [],
        error: "Database configuration error: Missing Supabase environment variables",
        details: {
          hasSupabaseUrl: !!process.env.SUPABASE_URL,
          hasSupabaseKey: !!process.env.SUPABASE_ANON_KEY,
        },
      }
    }

    let supabase
    try {
      supabase = createServerSupabaseClient()
      console.log("Server Action: getBookings - Supabase client created successfully")
    } catch (clientError) {
      console.error("Server Action: getBookings - Failed to create Supabase client:", clientError)
      return {
        bookings: [],
        error: "Failed to initialize database client",
        details: clientError instanceof Error ? clientError.message : String(clientError),
      }
    }

    // Set a timeout for the database query
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database query timed out")), 5000)
    })

    // Try to fetch bookings with a timeout
    try {
      // First, get all bookings
      const bookingsPromise = supabase.from("bookings").select("*").order("created_at", { ascending: false })

      // Race the query against the timeout
      const { data: bookingsData, error: bookingsError } = (await Promise.race([
        bookingsPromise,
        timeoutPromise.then(() => ({ data: null, error: { message: "Query timed out" } })),
      ])) as any

      if (bookingsError) {
        console.error("Server Action: getBookings - Error fetching bookings:", bookingsError)
        await logBookingEvent("Error fetching all bookings", "error", { error: bookingsError })
        return {
          bookings: [],
          error: bookingsError.message,
          details: {
            code: bookingsError.code,
            hint: bookingsError.hint,
            details: bookingsError.details,
          },
        }
      }

      // If we have bookings, fetch the associated properties
      if (bookingsData && bookingsData.length > 0) {
        // Get unique property IDs
        const propertyIds = [...new Set(bookingsData.map((booking: any) => booking.property_id))]

        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from("properties")
          .select("id, name, location, price")
          .in("id", propertyIds)

        if (propertiesError) {
          console.error("Server Action: getBookings - Error fetching properties:", propertiesError)
          await logBookingEvent("Error fetching properties for bookings", "error", { error: propertiesError })

          // Return bookings without property details
          return {
            bookings: bookingsData,
            error: "Could not fetch property details",
            details: {
              code: propertiesError.code,
              hint: propertiesError.hint,
              details: propertiesError.details,
            },
          }
        }

        // Create a map of property data by ID for quick lookup
        const propertiesMap = (propertiesData || []).reduce((map: any, property: any) => {
          map[property.id] = property
          return map
        }, {})

        // Combine booking data with property data
        const combinedBookings = bookingsData.map((booking: any) => {
          return {
            ...booking,
            properties: propertiesMap[booking.property_id] || null,
          }
        })

        console.log(
          `Server Action: getBookings - Successfully fetched ${combinedBookings.length} bookings with property details`,
        )
        return { bookings: combinedBookings, error: null }
      }

      console.log(
        `Server Action: getBookings - Successfully fetched ${bookingsData?.length || 0} bookings (no properties)`,
      )
      return { bookings: bookingsData || [], error: null }
    } catch (queryError) {
      console.error("Server Action: getBookings - Query error:", queryError)
      return {
        bookings: [],
        error: "Database query error",
        details: queryError instanceof Error ? queryError.message : String(queryError),
      }
    }
  } catch (error) {
    console.error("Server Action: getBookings - Unexpected error:", error)
    await logBookingEvent("Unexpected error in getBookings", "error", { error })
    return {
      bookings: [],
      error: "Failed to fetch bookings",
      details: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function getBookingById(bookingId: string) {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        property:property_id (
          id,
          name,
          location,
          price_per_night,
          images
        )
      `)
      .eq("id", bookingId)
      .single()

    if (error) {
      logError(`Error fetching booking: ${error.message}`, { bookingId, error })
      return { booking: null, error: error.message }
    }

    return { booking: data, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching booking"
    logError(`Exception fetching booking: ${errorMessage}`, { bookingId, error })
    return { booking: null, error: errorMessage }
  }
}

// Get bookings by email
export async function getBookingsByEmail(email: string) {
  try {
    const supabase = createServerSupabaseClient()

    // First, get bookings by email
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, status, check_in, check_out, created_at, property_id")
      .eq("email", email)
      .order("created_at", { ascending: false })

    if (bookingsError) {
      await logBookingEvent(`Error checking bookings by email: ${email}`, "error", { error: bookingsError })
      console.error("Error checking bookings by email:", bookingsError)
      return { bookings: [], error: bookingsError.message }
    }

    // If we have bookings, fetch the associated properties
    if (bookings && bookings.length > 0) {
      // Get unique property IDs
      const propertyIds = [...new Set(bookings.map((booking) => booking.property_id))]

      // Fetch properties
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("id, name, location")
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("Error fetching properties for email bookings:", propertiesError)

        // Return bookings without property details
        return {
          bookings,
          error: "Could not fetch property details",
        }
      }

      // Create a map of property data by ID for quick lookup
      const propertiesMap = (properties || []).reduce((map: any, property: any) => {
        map[property.id] = property
        return map
      }, {})

      // Combine booking data with property data
      const combinedBookings = bookings.map((booking) => {
        return {
          ...booking,
          properties: propertiesMap[booking.property_id] || null,
        }
      })

      return { bookings: combinedBookings, error: null }
    }

    return { bookings, error: null }
  } catch (error) {
    await logBookingEvent("Unexpected error in getBookingsByEmail", "error", { error })
    console.error("Error in checkBookingByEmail:", error)
    return { bookings: [], error: "Failed to check bookings" }
  }
}

export async function updateBookingStatus(bookingId: string, status: string) {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminSupabaseClient()

    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    if (error) {
      logError(`Error updating booking status: ${error.message}`, { bookingId, status, error })
      return { success: false, error: error.message }
    }

    // Revalidate relevant paths
    revalidatePath(`/booking-status/${bookingId}`)
    revalidatePath(`/admin/bookings/${bookingId}`)
    revalidatePath("/admin/bookings")

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error updating booking status"
    logError(`Exception updating booking status: ${errorMessage}`, { bookingId, status, error })
    return { success: false, error: errorMessage }
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
      .maybeSingle()

    if (fetchError) {
      await logBookingEvent("Error fetching booking for cleaning fee update", "error", { fetchError, bookingId })
      console.error("Error fetching booking for cleaning fee update:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Calculate new total price
    const basePrice = booking?.base_price || 0
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
        payment_proof_url: paymentProofUrl,
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
      .maybeSingle()

    if (fetchError) {
      await logBookingEvent("Error fetching booking for tenant ID document", "error", { fetchError, bookingId })
      console.error("Error fetching booking:", fetchError)
      return { success: false, error: fetchError.message }
    }

    // Create or update the tenant_id array
    let tenantIds: string[] = []

    if (booking?.tenant_id) {
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

export async function verifyBookingId(bookingId: string) {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminSupabaseClient()

    // Log the verification attempt
    logInfo(`Verifying booking ID: ${bookingId}`)

    const { data, error } = await supabase.from("bookings").select("id, status").eq("id", bookingId).single()

    if (error) {
      logError(`Error verifying booking ID: ${error.message}`, { bookingId, error })
      return { exists: false, error: error.message }
    }

    if (!data) {
      logInfo(`Booking ID not found: ${bookingId}`)
      return { exists: false, error: "Booking not found" }
    }

    logInfo(`Booking ID verified: ${bookingId}, status: ${data.status}`)
    return { exists: true, status: data.status }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error verifying booking ID"
    logError(`Exception verifying booking ID: ${errorMessage}`, { bookingId, error })
    return { exists: false, error: errorMessage }
  }
}

export async function createTestBooking() {
  try {
    // Use admin client to bypass RLS
    const supabase = createAdminSupabaseClient()

    // Get the first property from the database
    const { data: properties, error: propertiesError } = await supabase.from("properties").select("id").limit(1)

    if (propertiesError || !properties || properties.length === 0) {
      return { success: false, error: "No properties found" }
    }

    const propertyId = properties[0].id

    // Create a test booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        property_id: propertyId,
        check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
        check_out: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 14 days from now
        guests: 2,
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        phone: "+1234567890",
        special_requests: "This is a test booking",
        status: "pending",
      })
      .select()
      .single()

    if (bookingError) {
      return { success: false, error: bookingError.message }
    }

    return {
      success: true,
      bookingId: booking.id,
      message: "Test booking created successfully",
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error creating test booking"
    return { success: false, error: errorMessage }
  }
}

// Add a function to get table information for debugging
export async function getTableInfo(tableName: string) {
  try {
    console.log(`Getting table info for: ${tableName}`)
    const supabase = createServerSupabaseClient()

    // Query to get column information
    const { data, error } = await supabase.rpc("get_table_info", { table_name: tableName })

    if (error) {
      console.error(`Error getting table info for ${tableName}:`, error)
      return { columns: [], error: error.message }
    }

    return { columns: data || [], error: null }
  } catch (error) {
    console.error(`Unexpected error getting table info for ${tableName}:`, error)
    return {
      columns: [],
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    }
  }
}
