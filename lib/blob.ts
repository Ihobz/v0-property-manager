import { put } from "@vercel/blob"
import { logError, logUploadEvent } from "./logging"

// Define types for upload parameters
interface UploadParams {
  file: File
  bookingId?: string
  type?: string
  folder?: string
}

/**
 * Generic file upload function that handles both object and direct parameters
 * @param fileOrParams File object or upload parameters
 * @param optionalFolder Optional folder parameter when using direct parameters
 * @returns Object containing success status, URL if successful, and error message if failed
 */
export async function uploadFile(
  fileOrParams: File | UploadParams,
  optionalFolder?: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let file: File
    let folder = "uploads"

    // Handle both object and direct parameters
    if (fileOrParams instanceof File) {
      file = fileOrParams
      if (optionalFolder) folder = optionalFolder
    } else if (typeof fileOrParams === "object" && fileOrParams.file instanceof File) {
      file = fileOrParams.file
      folder = fileOrParams.folder || "uploads"

      // Handle legacy calls with bookingId and type
      if (fileOrParams.bookingId && fileOrParams.type) {
        if (fileOrParams.type === "payment") {
          return uploadPaymentProof(file, fileOrParams.bookingId)
        } else if (fileOrParams.type === "id") {
          return uploadTenantDocument(file, fileOrParams.bookingId)
        }
      }
    } else {
      throw new Error("Invalid file parameter")
    }

    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `${folder}/${timestamp}-${file.name}`

    // Upload the file to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent(`File uploaded to ${folder}`, "info", {
      folder,
      filename,
      fileSize: file.size,
      fileType: file.type,
    })

    return {
      success: true,
      url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during file upload"
    await logError(`Failed to upload file: ${errorMessage}`, {
      fileType: fileOrParams instanceof File ? fileOrParams.type : (fileOrParams as any)?.file?.type || "unknown",
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a payment proof file to Vercel Blob storage
 * @param file The file to upload
 * @param bookingId The ID of the booking associated with this payment proof
 * @returns Object containing success status, URL if successful, and error message if failed
 */
export async function uploadPaymentProof(file: File, bookingId: string) {
  try {
    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `payment-proofs/${bookingId}/${timestamp}-${file.name}`

    // Upload the file to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent(`Payment proof uploaded for booking ${bookingId}`, "info", {
      bookingId,
      filename,
      fileSize: file.size,
      fileType: file.type,
    })

    return {
      success: true,
      url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during file upload"
    await logError(`Failed to upload payment proof: ${errorMessage}`, {
      bookingId,
      fileType: file.type,
      fileSize: file.size,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a tenant document (ID, passport, etc.) to Vercel Blob storage
 * @param file The file to upload
 * @param bookingId The ID of the booking associated with this tenant document
 * @returns Object containing success status, URL if successful, and error message if failed
 */
export async function uploadTenantDocument(file: File, bookingId: string) {
  try {
    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `tenant-documents/${bookingId}/${timestamp}-${file.name}`

    // Upload the file to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent(`Tenant document uploaded for booking ${bookingId}`, "info", {
      bookingId,
      filename,
      fileSize: file.size,
      fileType: file.type,
    })

    return {
      success: true,
      url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during file upload"
    await logError(`Failed to upload tenant document: ${errorMessage}`, {
      bookingId,
      fileType: file.type,
      fileSize: file.size,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a property image to Vercel Blob storage
 * @param file The file to upload
 * @param propertyId The ID of the property associated with this image
 * @returns Object containing success status, URL if successful, and error message if failed
 */
export async function uploadPropertyImage(file: File, propertyId: string) {
  try {
    // Create a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `property-images/${propertyId}/${timestamp}-${file.name}`

    // Upload the file to Vercel Blob
    const { url } = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent(`Property image uploaded for property ${propertyId}`, "info", {
      propertyId,
      filename,
      fileSize: file.size,
      fileType: file.type,
    })

    return {
      success: true,
      url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during file upload"
    await logError(`Failed to upload property image: ${errorMessage}`, {
      propertyId,
      fileType: file.type,
      fileSize: file.size,
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}
