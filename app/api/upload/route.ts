import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"
import { logError, logInfo } from "@/lib/logging"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      logError("Upload failed", "No file provided in request")
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    logInfo(
      "Upload started",
      `Processing upload: ${file.name}, size: ${file.size}, type: ${file.type}, folder: ${folder}`,
    )

    // Check if file is valid
    if (file.size === 0) {
      logError("Upload failed", "File is empty")
      return NextResponse.json({ success: false, error: "File is empty" }, { status: 400 })
    }

    // Generate a unique filename
    const uniqueFilename = `${nanoid()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const fullPath = `${folder}/${uniqueFilename}`

    // Upload to Vercel Blob with more detailed error handling
    try {
      const blob = await put(fullPath, file, {
        access: "public",
      })

      logInfo("Upload successful", `File uploaded to ${blob.url}`)

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
