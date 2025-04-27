import { type NextRequest, NextResponse } from "next/server"
import { initializeRLSProcedures, setupPropertiesRLS, setupBookingsRLS } from "@/lib/database/rls-policies"
import { logError, logInfo } from "@/lib/logging"
import { isAdmin } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Check if the user is an admin
    const adminCheck = await isAdmin()
    if (!adminCheck.isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 })
    }

    // Initialize RLS procedures
    await initializeRLSProcedures()

    // Set up RLS policies for properties and bookings
    await setupPropertiesRLS()
    await setupBookingsRLS()

    logInfo("RLS initialization completed successfully")

    return NextResponse.json({ message: "RLS initialization completed successfully" }, { status: 200 })
  } catch (error) {
    logError("Error initializing RLS", { error })

    return NextResponse.json({ error: "Failed to initialize RLS", details: error.message }, { status: 500 })
  }
}
