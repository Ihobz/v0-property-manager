import { put } from "@vercel/blob"
import { logUploadEvent, logError } from "@/lib/logging"

/**
 * Uploads a file to Vercel Blob storage with proper error handling
 * @param file The file to upload
 * @param path The path to store the file at
 * @param token Optional token override
 * @returns Success status and URL or error
 */
async function uploadToBlob(file: File, path: string, token?: string) {
  try {
    // Check if blob token is available
    const blobToken = token || process.env.BLOB_READ_WRITE_TOKEN

    if (!blobToken) {
      logError("Missing BLOB_READ_WRITE_TOKEN for upload", { path })
      return {
        success: false,
        error: "Storage configuration error: Missing token",
      }
    }

    // Upload to Vercel Blob with explicit token
    const blob = await put(path, file, {
      access: "public",
      token: blobToken,
    })

    return {
      success: true,
      url: blob.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error"
    logError(`Blob upload error: ${errorMessage}`, { path, error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a payment proof for a booking
 * @param file The payment proof file
 * @param bookingId The booking ID
 * @returns Success status and URL or error
 */
export async function uploadPaymentProof(file: File, bookingId: string) {
  try {
    logUploadEvent(`Uploading payment proof for booking ${bookingId}`, "info")

    // Create a unique filename with booking ID and timestamp
    const filename = `payment-proof-${bookingId}-${Date.now()}.${file.name.split(".").pop()}`

    // Use the API route for uploading to ensure server-side token access
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "payment-proofs")
    formData.append("bookingId", bookingId)
    formData.append("type", "payment")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload payment proof")
    }

    const data = await response.json()
    logUploadEvent(`Payment proof uploaded successfully for booking ${bookingId}`, "info", { url: data.url })

    return {
      success: true,
      url: data.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error uploading payment proof"
    logError(`Error uploading payment proof: ${errorMessage}`, { bookingId, error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a tenant ID document
 * @param file The ID document file
 * @param bookingId The booking ID
 * @returns Success status and URL or error
 */
export async function uploadTenantDocument(file: File, bookingId: string) {
  try {
    // Create a unique filename with booking ID and timestamp
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split(".").pop()
    const fileName = `tenant-id-${bookingId}-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob via API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "tenant-ids")
    formData.append("bookingId", bookingId)
    formData.append("type", "id")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload tenant document")
    }

    const data = await response.json()
    return { success: true, url: data.url }
  } catch (error) {
    console.error("Error uploading tenant document:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload tenant document",
    }
  }
}

/**
 * Generic file upload function
 * @param file The file to upload
 * @param path The path to store the file at
 * @returns Success status and URL or error
 */
export async function uploadFile(file: File, path: string) {
  try {
    // Upload to Vercel Blob via API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("path", path)
    formData.append("type", "generic")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload file")
    }

    const data = await response.json()
    return { success: true, url: data.url }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error uploading file"
    logError(`Error uploading file: ${errorMessage}`, { path, error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Uploads a property image
 * @param file The image file
 * @param propertyId The property ID
 * @returns Success status and URL or error
 */
export async function uploadPropertyImage(file: File) {
  try {
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split(".").pop()
    const fileName = `property-image-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob via API route
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "property-images")
    formData.append("filename", fileName)
    formData.append("type", "property")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to upload property image")
    }

    const data = await response.json()
    return {
      success: true,
      url: data.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error uploading property image"
    logError(`Error uploading property image: ${errorMessage}`, { error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Export the internal function for testing
export { uploadToBlob }
