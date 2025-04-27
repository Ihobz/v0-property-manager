import { put } from "@vercel/blob"
import { logUploadEvent } from "@/lib/logging"

export async function uploadFile(file: File, folder = "uploads") {
  try {
    await logUploadEvent("Starting file upload", "info", { fileName: file.name, fileSize: file.size, folder })

    // Create a unique filename with timestamp
    const timestamp = new Date().getTime()
    const filename = `${folder}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent("File uploaded successfully", "info", { url: blob.url, folder })

    return { success: true, url: blob.url, filename: blob.url.split("/").pop() }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logUploadEvent("Error uploading file", "error", { error: errorMessage, folder })
    console.error(`Error uploading file to ${folder}:`, error)
    return { success: false, error: errorMessage }
  }
}

export async function uploadPaymentProof(file: File) {
  try {
    await logUploadEvent("Starting payment proof upload", "info", { fileName: file.name, fileSize: file.size })

    // Create a unique filename with timestamp
    const timestamp = new Date().getTime()
    const filename = `payment-proofs/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent("Payment proof uploaded successfully", "info", { url: blob.url })

    return { success: true, url: blob.url, filename: blob.url.split("/").pop() }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logUploadEvent("Error uploading payment proof", "error", { error: errorMessage })
    console.error("Error uploading payment proof:", error)
    return { success: false, error: errorMessage }
  }
}

export async function uploadTenantDocument(file: File) {
  try {
    await logUploadEvent("Starting tenant document upload", "info", { fileName: file.name, fileSize: file.size })

    // Create a unique filename with timestamp
    const timestamp = new Date().getTime()
    const filename = `tenant-ids/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent("Tenant document uploaded successfully", "info", { url: blob.url })

    return { success: true, url: blob.url, filename: blob.url.split("/").pop() }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logUploadEvent("Error uploading tenant document", "error", { error: errorMessage })
    console.error("Error uploading tenant document:", error)
    return { success: false, error: errorMessage }
  }
}

export async function uploadPropertyImage(file: File) {
  try {
    await logUploadEvent("Starting property image upload", "info", { fileName: file.name, fileSize: file.size })

    // Create a unique filename with timestamp
    const timestamp = new Date().getTime()
    const filename = `properties/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    await logUploadEvent("Property image uploaded successfully", "info", { url: blob.url })

    return { success: true, url: blob.url, filename: blob.url.split("/").pop() }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    await logUploadEvent("Error uploading property image", "error", { error: errorMessage })
    console.error("Error uploading property image:", error)
    return { success: false, error: errorMessage }
  }
}
