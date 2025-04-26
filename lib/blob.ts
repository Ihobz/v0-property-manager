import { logError, logInfo } from "@/lib/logging"

// Helper function for all uploads
async function uploadFile(file: File, folder: string) {
  try {
    logInfo("Upload attempt", `Uploading ${file.name} (${file.size} bytes) to ${folder}`)

    // Validate file
    if (!file || file.size === 0) {
      throw new Error("Invalid or empty file")
    }

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", folder)

    // Use the API route with better error handling
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    // Check for non-OK responses
    if (!response.ok) {
      let errorMessage = `Upload failed with status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.error || errorMessage
      } catch (e) {
        // If we can't parse the error JSON, use the default message
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    logInfo("Upload success", `File uploaded successfully to ${result.url}`)

    return { url: result.url, success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown upload error"
    logError("Upload error", `Error uploading ${file.name}: ${errorMessage}`)
    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}

export async function uploadPropertyImage(file: File) {
  return uploadFile(file, "property-images")
}

export async function uploadPaymentProof(file: File) {
  return uploadFile(file, "payment-proofs")
}

export async function uploadTenantDocument(file: File) {
  return uploadFile(file, "tenant-documents")
}
