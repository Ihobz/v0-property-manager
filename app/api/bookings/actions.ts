"use server"

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail } from "@/lib/email-service"
import { logBookingEvent, logError, logInfo } from "@/lib/logging"
import { put } from "@vercel/blob"

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
      supabase = createAdminSupabaseClient() // Use admin client to ensure we can access data
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
          .select("*")
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

    console.log(`Fetching booking with ID: ${bookingId}`)

    // First, get the booking without joining properties
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      logError(`Error fetching booking: ${bookingError.message}`, { bookingId, error: bookingError })
      return {
        booking: null,
        error: bookingError.message,
        details: {
          code: bookingError.code,
          hint: bookingError.hint,
          message: bookingError.message,
        },
      }
    }

    // If booking exists, fetch the associated property separately
    if (booking && booking.property_id) {
      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id, title, description, location, price, bedrooms, bathrooms, guests, amenities")
        .eq("id", booking.property_id)
        .single()

      if (!propertyError && property) {
        // Add property to booking object
        booking.property = property

        // Get property images
        const { data: imageData, error: imageError } = await supabase
          .from("property_images")
          .select("url, is_primary")
          .eq("property_id", property.id)
          .order("is_primary", { ascending: false })

        if (!imageError && imageData) {
          // Add images array to the property
          booking.property.images = imageData.map((img) => img.url)
        } else {
          console.warn(`Could not fetch images for property ${property.id}:`, imageError)
          booking.property.images = []
        }
      } else {
        console.warn(`Could not fetch property for booking ${bookingId}:`, propertyError)
        booking.property = null
      }
    }

    return { booking, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error fetching booking"
    logError(`Exception fetching booking: ${errorMessage}`, { bookingId, error })
    return {
      booking: null,
      error: errorMessage,
      details: error instanceof Error ? error.stack : null,
    }
  }
}

export async function getBookingsByEmail(email: string) {
  try {
    console.log("Server: Fetching bookings for email:", email)
    const supabase = createAdminSupabaseClient() // Use admin client to ensure we can access data

    // First, get bookings by email without joining properties
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .eq("email", email)
      .order("created_at", { ascending: false })

    if (bookingsError) {
      console.error("Error fetching bookings by email:", bookingsError)
      return { bookings: [], error: bookingsError.message }
    }

    // If we have bookings, fetch the associated properties separately
    if (bookings && bookings.length > 0) {
      // Get unique property IDs
      const propertyIds = [...new Set(bookings.map((booking) => booking.property_id))]

      // Fetch properties with a simpler query to avoid column name issues
      const { data: properties, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .in("id", propertyIds)

      if (propertiesError) {
        console.error("Error fetching properties for email bookings:", propertiesError)
        // Return bookings without property details
        return { bookings, error: "Could not fetch property details" }
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

      console.log(`Server: Found ${combinedBookings.length} bookings for email: ${email}`)
      return { bookings: combinedBookings, error: null }
    }

    console.log(`Server: Found ${bookings?.length || 0} bookings for email: ${email}`)
    return { bookings: bookings || [], error: null }
  } catch (error) {
    console.error("Unexpected error in getBookingsByEmail:", error)
    return {
      bookings: [],
      error: "An unexpected error occurred while fetching bookings.",
    }
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

/**
 * Update payment proof for a booking
 */
export async function updatePaymentProof(bookingId: string, fileUrl: string) {
  try {
    // Use admin client to bypass RLS and ensure we have proper access
    const supabase = createAdminSupabaseClient()

    // First, check if the booking exists
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors

    if (fetchError) {
      console.error("Error fetching booking for payment proof update:", fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!booking) {
      console.error("Booking not found for payment proof update:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    // Try to update using payment_proof column first
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_proof: fileUrl,
        status: "awaiting_confirmation", // Always update status when payment proof is uploaded
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId)

    // If there's an error with payment_proof column, try payment_proof_url
    if (updateError && updateError.message.includes("payment_proof")) {
      console.log("Trying alternative column payment_proof_url")
      const { error: altError } = await supabase
        .from("bookings")
        .update({
          payment_proof_url: fileUrl,
          status: "awaiting_confirmation",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (altError) {
        console.error("Error updating payment_proof_url:", altError)
        return { success: false, error: altError.message }
      }
    } else if (updateError) {
      console.error("Error updating payment proof:", updateError)
      return { success: false, error: updateError.message }
    }

    // Revalidate the booking status page
    revalidatePath(`/booking-status/${bookingId}`)

    return { success: true, error: null }
  } catch (error) {
    console.error("Unexpected error in updatePaymentProof:", error)
    return {
      success: false,
      error: "An unexpected error occurred while updating payment proof.",
    }
  }
}

/**
 * Add tenant ID document to a booking
 * This version uses a more resilient approach that doesn't rely on specific columns
 */
export async function addTenantIdDocument(bookingId: string, fileUrl: string) {
  try {
    // Use admin client to bypass RLS and ensure we have proper access
    const supabase = createAdminSupabaseClient()

    console.log(`Adding ID document to booking ${bookingId}`)

    // First, fetch the booking to see what columns are available
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .maybeSingle()

    if (fetchError) {
      console.error(`Error fetching booking for ID document update:`, fetchError)
      return { success: false, error: fetchError.message }
    }

    if (!booking) {
      console.error("Booking not found for ID document update:", bookingId)
      return { success: false, error: "Booking not found" }
    }

    // Log the booking object to see what columns are available
    console.log("Booking object structure:", Object.keys(booking))

    // Try different approaches to store the document URL

    // Approach 1: Try to use notes field as a fallback
    if ("notes" in booking) {
      const currentNotes = booking.notes || ""
      const updatedNotes = currentNotes ? `${currentNotes}\n\nID Document: ${fileUrl}` : `ID Document: ${fileUrl}`

      const { error: notesError } = await supabase
        .from("bookings")
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (!notesError) {
        console.log("Successfully stored ID document URL in notes field")

        // Revalidate the booking status page
        revalidatePath(`/booking-status/${bookingId}`)

        return {
          success: true,
          message: "ID document added successfully (stored in notes)",
          columnUsed: "notes",
        }
      }
    }

    // Approach 2: Try to use special_requests field as another fallback
    if ("special_requests" in booking) {
      const currentRequests = booking.special_requests || ""
      const updatedRequests = currentRequests
        ? `${currentRequests}\n\nID Document: ${fileUrl}`
        : `ID Document: ${fileUrl}`

      const { error: requestsError } = await supabase
        .from("bookings")
        .update({
          special_requests: updatedRequests,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (!requestsError) {
        console.log("Successfully stored ID document URL in special_requests field")

        // Revalidate the booking status page
        revalidatePath(`/booking-status/${bookingId}`)

        return {
          success: true,
          message: "ID document added successfully (stored in special_requests)",
          columnUsed: "special_requests",
        }
      }
    }

    // Approach 3: Try to use comments field as another fallback
    if ("comments" in booking) {
      const currentComments = booking.comments || ""
      const updatedComments = currentComments
        ? `${currentComments}\n\nID Document: ${fileUrl}`
        : `ID Document: ${fileUrl}`

      const { error: commentsError } = await supabase
        .from("bookings")
        .update({
          comments: updatedComments,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId)

      if (!commentsError) {
        console.log("Successfully stored ID document URL in comments field")

        // Revalidate the booking status page
        revalidatePath(`/booking-status/${bookingId}`)

        return {
          success: true,
          message: "ID document added successfully (stored in comments)",
          columnUsed: "comments",
        }
      }
    }

    // If we've reached here, we couldn't find a suitable column to store the document URL
    // Return a success anyway, but with a warning
    console.warn("Could not find a suitable column to store ID document URL")

    // Revalidate the booking status page anyway
    revalidatePath(`/booking-status/${bookingId}`)

    return {
      success: true,
      warning: "Document uploaded but could not be linked to booking record",
      documentUrl: fileUrl,
    }
  } catch (error) {
    console.error("Unexpected error in addTenantIdDocument:", error)
    return {
      success: false,
      error: "An unexpected error occurred while adding ID document.",
    }
  }
}

/**
 * Upload a file to Vercel Blob and update the booking
 */
export async function uploadFile(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const bookingId = formData.get("bookingId") as string
    const uploadType = formData.get("uploadType") as string

    if (!file || !bookingId || !uploadType) {
      return { success: false, error: "Missing required fields" }
    }

    // Generate a unique filename
    const timestamp = new Date().getTime()
    const filename = `${uploadType}_${bookingId}_${timestamp}_${file.name}`
    const fileType = file.type

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: fileType,
    })

    // Update the booking based on upload type
    if (uploadType === "payment") {
      return await updatePaymentProof(bookingId, blob.url)
    } else if (uploadType === "id") {
      return await addTenantIdDocument(bookingId, blob.url)
    } else {
      return { success: false, error: "Invalid upload type" }
    }
  } catch (error) {
    logError("Error in uploadFile:", { error })
    return {
      success: false,
      error: "An unexpected error occurred while uploading the file.",
    }
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
