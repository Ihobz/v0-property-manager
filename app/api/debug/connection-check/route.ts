import { NextResponse } from "next/server"
import { checkDatabaseConnection } from "@/lib/database/connection-check"
import { isAdmin } from "@/lib/auth-utils"

export async function GET(request: Request) {
  try {
    // Check if user is admin
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await checkDatabaseConnection()

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in connection check endpoint:", error)
    return NextResponse.json(
      {
        error: "Failed to check database connection",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
