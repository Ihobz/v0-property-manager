import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import { logInfo, logError } from "@/lib/logging"

/**
 * Generic file upload function
 * @param file The file to upload
 * @param folder The folder to upload to (default: "uploads")
 * @returns Object containing success status, URL, and error message if any
 */
export async function uploadFile(file: File, folder = "uploads") {
  try {
    logInfo("Blob", `Starting upload of ${file.name} to ${folder}`)

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const uniqueId = nanoid(6)
    const fileName = `${folder}/${timestamp}-${uniqueId}-${file.name}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    logInfo("Blob", `Successfully uploaded ${file.name} to ${url}`)

    return {
      success: true,
      url,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError("Blob", `Error uploading file ${file.name}: ${errorMessage}`)

    return {
      success: false,
      url: null,
      error: `Failed to upload file: ${errorMessage}`,
    }
  }
}

/**
 * Upload payment proof document
 * @param file The file to upload
 * @param bookingId The booking ID
 * @returns Object containing success status, URL, and error message if any
 */
export async function uploadPaymentProof(file: File, bookingId: string) {
  try {
    logInfo("Blob", `Starting payment proof upload for booking ${bookingId}`)

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `payment-proofs/${bookingId}-${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    logInfo("Blob", `Successfully uploaded payment proof for booking ${bookingId} to ${url}`)

    return {
      success: true,
      url,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError("Blob", `Error uploading payment proof for booking ${bookingId}: ${errorMessage}`)

    return {
      success: false,
      url: null,
      error: `Failed to upload payment proof: ${errorMessage}`,
    }
  }
}

/**
 * Upload tenant document (ID, passport, etc.)
 * @param file The file to upload
 * @param bookingId The booking ID
 * @returns Object containing success status, URL, and error message if any
 */
export async function uploadTenantDocument(file: File, bookingId: string) {
  try {
    logInfo("Blob", `Starting tenant document upload for booking ${bookingId}`)

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `tenant-documents/${bookingId}-${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    logInfo("Blob", `Successfully uploaded tenant document for booking ${bookingId} to ${url}`)

    return {
      success: true,
      url,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError("Blob", `Error uploading tenant document for booking ${bookingId}: ${errorMessage}`)

    return {
      success: false,
      url: null,
      error: `Failed to upload tenant document: ${errorMessage}`,
    }
  }
}

/**
 * Upload property image
 * @param file The file to upload
 * @param propertyId The property ID
 * @returns Object containing success status, URL, and error message if any
 */
export async function uploadPropertyImage(file: File, propertyId: string) {
  try {
    logInfo("Blob", `Starting property image upload for property ${propertyId}`)

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const fileName = `property-images/${propertyId}-${timestamp}-${file.name}`

    // Upload to Vercel Blob
    const { url } = await put(fileName, file, {
      access: "public",
    })

    logInfo("Blob", `Successfully uploaded image for property ${propertyId} to ${url}`)

    return {
      success: true,
      url,
      error: null,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logError("Blob", `Error uploading image for property ${propertyId}: ${errorMessage}`)

    return {
      success: false,
      url: null,
      error: `Failed to upload property image: ${errorMessage}`,
    }
  }
}
