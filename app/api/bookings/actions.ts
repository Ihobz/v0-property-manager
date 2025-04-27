"use server"

import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { sendBookingConfirmationEmail } from "@/lib/email-service"
import { logBookingEvent, logError, logInfo } from "@/lib/logging"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { v4 as uuidv4 } from "uuid"

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

    // Increase timeout for the database query to 15 seconds (from 5)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Database query timed out")), 15000)
    })

    // Try to fetch bookings with a timeout
    try {
      // First, get all bookings - limit to 100 most recent for performance
      const bookingsPromise = supabase.from("bookings").select("*").order("created_at", { ascending: false }).limit(100) // Add limit to improve performance

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

// Function to get a booking by ID with enhanced debugging and error handling
export async function getBookingById(id: string) {
  try {
    // Log the attempt to fetch the booking
    logInfo(`Fetching booking ${id}`, { bookingId: id })

    // Use admin client to bypass RLS policies
    const supabase = createAdminSupabaseClient()

    // Log the query we're about to execute
    console.log(`Executing query for booking ID: ${id}`)

    // First, check if the booking exists in the database
    const { data: bookingExists, error: existsError } = await supabase
      .from("bookings")
      .select("id")
      .eq("id", id)
      .maybeSingle()

    if (existsError) {
      logError(`Error checking if booking ${id} exists`, existsError)
      return {
        booking: null,
        error: `Error checking booking: ${existsError.message}`,
        details: {
          error: existsError,
          query: "SELECT id FROM bookings WHERE id = ?",
          params: [id],
        },
      }
    }

    if (!bookingExists) {
      logError(`Booking ${id} not found during existence check`)
      return {
        booking: null,
        error: "Booking not found",
        details: {
          id,
          message: "No booking with this ID exists in the database",
          suggestion: "Verify the booking ID is correct",
        },
      }
    }

    // Now fetch the full booking details
    const { data: booking, error: bookingError } = await supabase.from("bookings").select("*").eq("id", id).single()

    if (bookingError) {
      logError(`Error fetching booking ${id} details`, bookingError)
      return {
        booking: null,
        error: `Error fetching booking details: ${bookingError.message}`,
        details: bookingError,
      }
    }

    // Then, get the property details separately
    let property = null
    if (booking.property_id) {
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        // Replace this line:
        // .select("id, title, name, location, bedrooms, bathrooms, guests, images")
        // With this line that removes the "name" column:
        .select("id, title, location, bedrooms, bathrooms, guests")
        .eq("id", booking.property_id)
        .maybeSingle()

      if (propertyError) {
        logError(`Error fetching property for booking ${id}`, propertyError)
        // Continue without property data
      } else {
        property = propertyData
      }
    }

    // Return the booking with property data
    return {
      booking: {
        ...booking,
        property: property,
      },
      error: null,
    }
  } catch (error: any) {
    logError(`Unexpected error in getBookingById for ${id}`, error)
    return {
      booking: null,
      error: `Failed to retrieve booking: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack,
        bookingId: id,
      },
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

// Function to update booking status
export async function updateBookingStatus(id: string, status: string) {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("bookings").update({ status }).eq("id", id).select().single()

    if (error) {
      logError(`Error updating booking status for ${id}`, error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)

    return { success: true, data }
  } catch (error: any) {
    logError(`Error in updateBookingStatus for ${id}`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Updates the cleaning fee for a booking
 */
// Function to update cleaning fee
export async function updateBookingCleaningFee(id: string, cleaningFee: number) {
  try {
    const supabase = createClient()

    // First get the current booking to calculate the new total price
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("base_price")
      .eq("id", id)
      .single()

    if (fetchError) {
      return { success: false, error: fetchError.message }
    }

    const totalPrice = booking.base_price + cleaningFee

    const { data, error } = await supabase
      .from("bookings")
      .update({
        cleaning_fee: cleaningFee,
        total_price: totalPrice,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      logError(`Error updating cleaning fee for ${id}`, error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/bookings")
    revalidatePath(`/admin/bookings/${id}`)

    return { success: true, data }
  } catch (error: any) {
    logError(`Error in updateBookingCleaningFee for ${id}`, error)
    return { success: false, error: error.message }
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
// Function to add tenant ID document
export async function addTenantIdDocument(bookingId: string, file: File) {
  try {
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Upload to Vercel Blob
    const filename = `tenant-id-${bookingId}-${uuidv4()}.${file.name.split(".").pop()}`
    const blob = await put(filename, file, { access: "public" })

    const supabase = createClient()

    // Check if the bookings table has a tenant_id column
    const { data: tableInfo } = await supabase.from("bookings").select("tenant_id").eq("id", bookingId).single()

    let updateResult

    // If tenant_id exists as a column
    if (tableInfo && "tenant_id" in tableInfo) {
      // Check if tenant_id is already an array
      if (Array.isArray(tableInfo.tenant_id)) {
        // Add to existing array
        updateResult = await supabase
          .from("bookings")
          .update({ tenant_id: [...tableInfo.tenant_id, blob.url] })
          .eq("id", bookingId)
      } else if (tableInfo.tenant_id) {
        // Convert existing string to array with new URL
        updateResult = await supabase
          .from("bookings")
          .update({ tenant_id: [tableInfo.tenant_id, blob.url] })
          .eq("id", bookingId)
      } else {
        // Set as first URL
        updateResult = await supabase
          .from("bookings")
          .update({ tenant_id: [blob.url] })
          .eq("id", bookingId)
      }
    } else {
      // Try to store in notes, special_requests, or comments field
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("notes, special_requests, comments")
        .eq("id", bookingId)
        .single()

      if (bookingData) {
        const idPrefix = "TENANT_ID_DOC:"
        const idUrl = `${idPrefix} ${blob.url}`

        if ("notes" in bookingData) {
          const notes = bookingData.notes ? `${bookingData.notes}\n${idUrl}` : idUrl
          updateResult = await supabase.from("bookings").update({ notes }).eq("id", bookingId)
        } else if ("special_requests" in bookingData) {
          const special_requests = bookingData.special_requests ? `${bookingData.special_requests}\n${idUrl}` : idUrl
          updateResult = await supabase.from("bookings").update({ special_requests }).eq("id", bookingId)
        } else if ("comments" in bookingData) {
          const comments = bookingData.comments ? `${bookingData.comments}\n${idUrl}` : idUrl
          updateResult = await supabase.from("bookings").update({ comments }).eq("id", bookingId)
        } else {
          return {
            success: false,
            error: "No suitable field found to store document URL",
          }
        }
      }
    }

    if (updateResult?.error) {
      logError(`Error updating tenant ID for booking ${bookingId}`, updateResult.error)
      return { success: false, error: updateResult.error.message }
    }

    revalidatePath(`/admin/bookings/${bookingId}`)
    return { success: true, url: blob.url }
  } catch (error: any) {
    logError(`Error in addTenantIdDocument for ${bookingId}`, error)
    return { success: false, error: error.message }
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
      // return await addTenantIdDocument(bookingId, blob.url)
      return { success: false, error: "Deprecated: Use new addTenantIdDocument function" }
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

// Function to get ID documents from a booking
export async function getIdDocuments(bookingId: string) {
  try {
    const supabase = createClient()

    // First try to get from tenant_id column
    const { data: booking } = await supabase
      .from("bookings")
      .select("tenant_id, notes, special_requests, comments")
      .eq("id", bookingId)
      .single()

    if (!booking) {
      return { success: false, documents: [] }
    }

    const documents: string[] = []

    // Check if tenant_id exists and has data
    if (booking.tenant_id) {
      if (Array.isArray(booking.tenant_id)) {
        documents.push(...booking.tenant_id)
      } else if (typeof booking.tenant_id === "string") {
        documents.push(booking.tenant_id)
      }
    }

    // If no documents found in tenant_id, check text fields
    if (documents.length === 0) {
      const idPrefix = "TENANT_ID_DOC:"
      const textFields = ["notes", "special_requests", "comments"]

      textFields.forEach((field) => {
        if (booking[field] && typeof booking[field] === "string") {
          const lines = booking[field].split("\n")
          lines.forEach((line) => {
            if (line.startsWith(idPrefix)) {
              const url = line.substring(idPrefix.length).trim()
              documents.push(url)
            }
          })
        }
      })
    }

    return { success: true, documents }
  } catch (error: any) {
    logError(`Error in getIdDocuments for ${bookingId}`, error)
    return { success: false, documents: [], error: error.message }
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

export async function logBookingActivity(bookingId: string, activity: string) {
  try {
    // Log the activity to the console
    console.log(`Booking ${bookingId}: ${activity}`)

    // You could also log to a database table if needed

    return { success: true }
  } catch (error) {
    console.error("Error logging booking activity:", error)
    return { success: false }
  }
}
