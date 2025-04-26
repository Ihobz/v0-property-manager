import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check server-side environment variables
    const envVars = {
      // Database
      SUPABASE_URL: process.env.SUPABASE_URL ? "***" : null,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? "***" : null,
      POSTGRES_URL: process.env.POSTGRES_URL ? "***" : null,

      // Public variables
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "***" : null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***" : null,

      // Storage
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? "***" : null,

      // Node environment
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
    }

    // Check which variables are missing
    const missingVars = Object.entries(envVars)
      .filter(([_, value]) => value === null)
      .map(([key]) => key)

    return NextResponse.json({
      variables: envVars,
      missing: missingVars,
      allConfigured: missingVars.length === 0,
    })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
