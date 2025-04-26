import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN

    if (!blobToken) {
      return NextResponse.json({
        isConfigured: false,
        message: "BLOB_READ_WRITE_TOKEN is not configured in environment variables",
      })
    }

    // Perform a test upload to verify the token works
    try {
      // Create a small test file
      const testData = new Uint8Array([0, 1, 2, 3])
      const testFile = new Blob([testData])

      // Try to upload it
      const blob = await put(`test/blob-config-test-${Date.now()}.bin`, testFile, {
        access: "public",
      })

      return NextResponse.json({
        isConfigured: true,
        message: "Vercel Blob is properly configured and working",
        testUrl: blob.url,
      })
    } catch (uploadError) {
      console.error("Error testing Blob upload:", uploadError)
      return NextResponse.json({
        isConfigured: false,
        message:
          uploadError instanceof Error
            ? `Blob token exists but is invalid: ${uploadError.message}`
            : "Blob token exists but is invalid",
      })
    }
  } catch (error) {
    console.error("Error checking Blob configuration:", error)
    return NextResponse.json(
      {
        isConfigured: false,
        message: error instanceof Error ? error.message : "Unknown error checking Blob configuration",
      },
      { status: 500 },
    )
  }
}
