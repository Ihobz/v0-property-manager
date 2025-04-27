import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { logUploadEvent, logError } from "@/lib/logging"
import { addTenantIdDocument } from "@/app/api/bookings/actions"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const filename = formData.get("filename") as string
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      logError("Missing BLOB_READ_WRITE_TOKEN environment variable", {})
      return NextResponse.json({ error: "Storage configuration error" }, { status: 500 })
    }

    // Upload to Vercel Blob with explicit token
    const blob = await put(filename, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Handle different types of uploads
    if (type === "id") {
      const bookingId = formData.get("bookingId") as string
      if (!bookingId) {
        return NextResponse.json({ error: "Booking ID is required for ID documents" }, { status: 400 })
      }

      // Add document URL to booking record
      const result = await addTenantIdDocument(bookingId, blob.url)
      if (!result.success) {
        logError(`Failed to add tenant ID document to booking: ${result.error}`, { bookingId })
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      logUploadEvent(`ID document uploaded and linked to booking ${bookingId}`, "info", { url: blob.url })
    } else if (type === "property") {
      const propertyId = formData.get("propertyId") as string
      if (!propertyId) {
        return NextResponse.json({ error: "Property ID is required for property images" }, { status: 400 })
      }

      logUploadEvent(`Property image uploaded for property ${propertyId}`, "info", { url: blob.url })
    }

    return NextResponse.json({
      url: blob.url,
      success: true,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error during upload"
    logError(`Upload error: ${errorMessage}`, { error })
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
