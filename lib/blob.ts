// Update the uploadPropertyImage function to use the API route
export async function uploadPropertyImage(file: File) {
  try {
    console.log("Starting image upload to Vercel Blob:", file.name, file.type, file.size)

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "property-images")

    // Use the API route instead of direct Blob access
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
    }

    const result = await response.json()

    return { url: result.url, success: true }
  } catch (error) {
    console.error("Error uploading property image:", error)
    const errorMessage = error instanceof Error ? `Upload error: ${error.message}` : "Unknown error during upload"
    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}

// Update the other upload functions similarly
export async function uploadPaymentProof(file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "payment-proofs")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
    }

    const result = await response.json()
    return { url: result.url, success: true }
  } catch (error) {
    console.error("Error uploading payment proof:", error)
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
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "tenant-documents")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Upload failed with status: ${response.status}`)
    }

    const result = await response.json()
    return { url: result.url, success: true }
  } catch (error) {
    console.error("Error uploading tenant document:", error)
    const errorMessage = error instanceof Error ? `Upload error: ${error.message}` : "Unknown error during upload"
    return {
      url: null,
      success: false,
      error: errorMessage,
    }
  }
}
