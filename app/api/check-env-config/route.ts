import { NextResponse } from "next/server"
import { validateConfig } from "@/lib/config"

export async function GET() {
  try {
    const { valid, missing } = validateConfig()

    if (!valid) {
      return NextResponse.json({
        isConfigured: false,
        missing,
        message: `Missing required environment variables: ${missing.join(", ")}`,
      })
    }

    return NextResponse.json({
      isConfigured: true,
      message: "All required environment variables are configured",
    })
  } catch (error) {
    console.error("Error checking environment configuration:", error)
    return NextResponse.json(
      {
        isConfigured: false,
        message: error instanceof Error ? error.message : "Unknown error checking environment configuration",
      },
      { status: 500 },
    )
  }
}
