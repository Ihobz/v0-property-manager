import { NextResponse } from "next/server"

export async function GET() {
  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN

    if (!blobToken) {
      return NextResponse.json({
        isConfigured: false,
        message: "BLOB_READ_WRITE_TOKEN is not configured",
      })
    }

    return NextResponse.json({
      isConfigured: true,
      message: "Vercel Blob is properly configured",
    })
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
