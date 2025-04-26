import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

// Improved Blob upload function with better error handling
export async function uploadPropertyImage(file: File) {
  try {
    console.log("Starting image upload to Vercel Blob:", file.name, file.type, file.size)

    // Check if BLOB_READ_WRITE_TOKEN is available directly from process.env
    // This is more reliable than using the config object
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined in environment variables")
      return {
        url: null,
        success: false,
        error: "Blob token is not configured in environment variables",
      }
    }

    const blob = await put(`property-images/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    console.log("Image upload successful:", blob.url)
    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading property image:", error)

    // More detailed error information
    const errorMessage = error instanceof Error ? `Upload error: ${error.message}` : "Unknown error during upload"

    // Check for specific error types
    if (error instanceof Error && error.message.includes("token")) {
      return {
        url: null,
        success: false,
        error: "Authentication error with Blob token. Please check your BLOB_READ_WRITE_TOKEN.",
      }
    }

    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}

export async function uploadPaymentProof(file: File) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available directly
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined in environment variables")
      return {
        url: null,
        success: false,
        error: "Blob token is not configured in environment variables",
      }
    }

    const blob = await put(`payment-proofs/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading payment proof:", error)

    // More detailed error information
    const errorMessage = error instanceof Error ? `Upload error: ${error.message}` : "Unknown error during upload"

    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}

export async function uploadTenantDocument(file: File) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available directly
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined in environment variables")
      return {
        url: null,
        success: false,
        error: "Blob token is not configured in environment variables",
      }
    }

    const blob = await put(`tenant-documents/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading tenant document:", error)

    // More detailed error information
    const errorMessage = error instanceof Error ? `Upload error: ${error.message}` : "Unknown error during upload"

    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}
