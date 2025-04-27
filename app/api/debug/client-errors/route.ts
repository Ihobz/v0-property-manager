import { NextResponse } from "next/server"
import { logError } from "@/lib/logging"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { error, info, url } = data

    // Log the client error
    logError("Client-side error", {
      errorMessage: error,
      additionalInfo: info,
      url,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error logging client error:", error)
    return NextResponse.json({ success: false, error: "Failed to log error" }, { status: 500 })
  }
}
