// Remove any imports from next/headers
// import { cookies, headers } from 'next/headers'

// Import server actions if needed
// import { getRequestHeaders, getRequestCookies } from './server-actions'

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
      console.error("Upload error:", errorData)
      return { success: false, error: errorData.error || "Upload failed" }
    }

    const data = await response.json()
    return { success: true, url: data.url, filename: data.filename }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function uploadTenantDocument(file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "tenant-ids")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Upload error:", errorData)
      return { success: false, error: errorData.error || "Upload failed" }
    }

    const data = await response.json()
    return { success: true, url: data.url, filename: data.filename }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function uploadPropertyImage(file: File) {
  try {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "properties")

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Upload error:", errorData)
      return { success: false, error: errorData.error || "Upload failed" }
    }

    const data = await response.json()
    return { success: true, url: data.url, filename: data.filename }
  } catch (error) {
    console.error("Upload error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
