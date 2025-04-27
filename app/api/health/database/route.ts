import { NextResponse } from "next/server"
import { checkDatabaseConfiguration } from "@/lib/database/init"
import { logError } from "@/lib/logging"

export async function GET() {
  try {
    const result = await checkDatabaseConfiguration()

    if (!result.configured) {
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    logError("Error in database health check endpoint", { error })
    return NextResponse.json(
      {
        configured: false,
        error: error instanceof Error ? error.message : "Unknown error in database health check endpoint",
      },
      { status: 500 },
    )
  }
}
