import { NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function GET() {
  try {
    // Check if BLOB_READ_WRITE_TOKEN is available
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN

    if (!blobToken) {
      return NextResponse.json({
        success: false,
        error: "BLOB_READ_WRITE_TOKEN is not configured",
        envVars: {
          hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
          tokenLength: process.env.BLOB_READ_WRITE_TOKEN?.length || 0,
        },
      })
    }

    // Create a small test file
    const testData = new Uint8Array([0, 1, 2, 3, 4, 5])
    const testFile = new Blob([testData])

    // Try to upload it
    const blob = await put(`debug/blob-test-${Date.now()}.bin`, testFile, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      message: "Test upload successful",
      url: blob.url,
      details: {
        size: testFile.size,
        type: testFile.type,
        blobId: blob.url.split("/").pop(),
      },
    })
  } catch (error) {
    console.error("Debug blob test error:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })
  }
}
