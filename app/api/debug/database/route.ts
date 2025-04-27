import { NextResponse } from "next/server"
import { createDebugEndpoint } from "@/lib/database/schema-validator"
import { logError } from "@/lib/logging"

export async function GET() {
  try {
    const debugInfo = await createDebugEndpoint()

    return NextResponse.json(debugInfo)
  } catch (error) {
    logError("Error in database debug endpoint", { error })
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error in database debug endpoint",
      },
      { status: 500 },
    )
  }
}
