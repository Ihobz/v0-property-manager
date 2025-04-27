import { NextResponse } from "next/server"
import { runAllMigrations } from "@/lib/database/migrations"
import { logError } from "@/lib/logging"

export async function POST() {
  try {
    const result = await runAllMigrations()

    return NextResponse.json(result)
  } catch (error) {
    logError("Error in migrations endpoint", { error })
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error in migrations endpoint",
      },
      { status: 500 },
    )
  }
}
