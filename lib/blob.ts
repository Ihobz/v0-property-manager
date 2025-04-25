import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import config from "@/lib/config"

export async function uploadPropertyImage(file: File) {
  try {
    console.log("Starting image upload to Vercel Blob:", file.name, file.type, file.size)

    // Check if BLOB_READ_WRITE_TOKEN is available using our config
    if (!config.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined")
      return { url: null, success: false, error: "Blob token is not configured" }
    }

    const blob = await put(`property-images/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    console.log("Image upload successful:", blob.url)
    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading property image:", error)
    // Return more detailed error information
    return {
      url: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during upload",
    }
  }
}

export async function uploadPaymentProof(file: File) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available using our config
    if (!config.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined")
      return { url: null, success: false, error: "Blob token is not configured" }
    }

    const blob = await put(`payment-proofs/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading payment proof:", error)
    return { url: null, success: false, error }
  }
}

export async function uploadTenantDocument(file: File) {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available using our config
    if (!config.BLOB_READ_WRITE_TOKEN) {
      console.error("BLOB_READ_WRITE_TOKEN is not defined")
      return { url: null, success: false, error: "Blob token is not configured" }
    }

    const blob = await put(`tenant-documents/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    return { url: blob.url, success: true }
  } catch (error) {
    console.error("Error uploading tenant document:", error)
    return { url: null, success: false, error }
  }
}
