import { NextResponse } from "next/server"
import { initializeDatabase } from "@/lib/database/init"
import { logError } from "@/lib/logging"

export async function POST() {
  try {
    const result = await initializeDatabase()

    return NextResponse.json(result)
  } catch (error) {
    logError("Error in database initialization endpoint", { error })
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error in database initialization endpoint",
      },
      { status: 500 },
    )
  }
}
