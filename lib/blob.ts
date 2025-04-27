import { put } from "@vercel/blob"
import { logUploadEvent, logError } from "@/lib/logging"

// Upload payment proof for a booking
export async function uploadPaymentProof(file: File, bookingId: string) {
  try {
    logUploadEvent(`Uploading payment proof for booking ${bookingId}`, "info")

    // Create a unique filename with booking ID and timestamp
    const filename = `payment-proof-${bookingId}-${Date.now()}.${file.name.split(".").pop()}`

    // Upload to Vercel Blob
    const result = await put(filename, file, {
      access: "public",
    })

    logUploadEvent(`Payment proof uploaded successfully for booking ${bookingId}`, "info", { url: result.url })

    return {
      success: true,
      url: result.url,
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

// Upload tenant document
export async function uploadTenantDocument(file: File, bookingId: string) {
  try {
    // Check if blob token is available
    if (!process.env.NEXT_PUBLIC_SITE_URL || !process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("Missing environment variables for Blob storage")
      return { success: false, error: "Storage configuration error" }
    }

    // Create a unique filename with booking ID and timestamp
    const timestamp = new Date().getTime()
    const fileExtension = file.name.split(".").pop()
    const fileName = `tenant-id-${bookingId}-${timestamp}.${fileExtension}`

    // Upload to Vercel Blob
    const formData = new FormData()
    formData.append("file", file)
    formData.append("filename", fileName)
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

// Generic file upload function
export async function uploadFile(file: File, path: string) {
  try {
    // Upload to Vercel Blob
    const result = await put(path, file, {
      access: "public",
    })

    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error uploading file"
    logError(`Error uploading file: ${errorMessage}`, { path, error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

// Upload property image
export async function uploadPropertyImage(file: File, propertyId: string) {
  try {
    logUploadEvent(`Uploading property image for property ${propertyId}`, "info")

    // Create a unique filename with property ID and timestamp
    const filename = `property-image-${propertyId}-${Date.now()}.${file.name.split(".").pop()}`

    // Upload to Vercel Blob
    const result = await put(filename, file, {
      access: "public",
    })

    logUploadEvent(`Property image uploaded successfully for property ${propertyId}`, "info", { url: result.url })

    return {
      success: true,
      url: result.url,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error uploading property image"
    logError(`Error uploading property image: ${errorMessage}`, { propertyId, error })
    return {
      success: false,
      error: errorMessage,
    }
  }
}
