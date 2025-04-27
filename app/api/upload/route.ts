import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import { logError, logInfo } from "@/lib/logging"
import { addTenantIdDocument, updatePaymentProof } from "@/app/api/bookings/actions"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"
    const type = formData.get("type") as string
    const bookingId = formData.get("bookingId") as string

    if (!file) {
      logError("Upload failed", "No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // Check for blob token
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logError("Upload failed", "Missing BLOB_READ_WRITE_TOKEN environment variable")
      return NextResponse.json({ success: false, error: "Storage configuration error: Missing token" }, { status: 500 })
    }

    // Generate a unique filename
    const uniqueId = nanoid()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const uniqueFilename = `${folder}/${uniqueId}-${originalName}`

    // Upload to Vercel Blob with explicit token
    try {
      const blob = await put(uniqueFilename, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })

      logInfo("Upload successful", `File uploaded to ${blob.url}`)

      // Handle different types of uploads
      if (type === "payment" && bookingId) {
        const result = await updatePaymentProof(bookingId, blob.url)
        if (!result.success) {
          logError("Failed to update payment proof", { bookingId, error: result.error })
          // Continue anyway since the file was uploaded successfully
        }
      } else if (type === "id" && bookingId) {
        const result = await addTenantIdDocument(bookingId, blob.url)
        if (!result.success) {
          logError("Failed to add tenant ID document", { bookingId, error: result.error })
          // Continue anyway since the file was uploaded successfully
        }
      }

      return NextResponse.json({
        success: true,
        url: blob.url,
        filename: file.name,
        size: file.size,
        contentType: file.type,
      })
    } catch (blobError) {
      const errorMessage = blobError instanceof Error ? blobError.message : "Unknown blob error"
      logError("Blob upload error", errorMessage)
      return NextResponse.json({ success: false, error: `Blob upload failed: ${errorMessage}` }, { status: 500 })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    logError("Upload error", errorMessage)
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
