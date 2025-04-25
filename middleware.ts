import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateConfig } from "@/lib/config"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Check if required environment variables are configured
  const { valid, missing } = validateConfig()

  // Log missing environment variables in development
  if (!valid && process.env.NODE_ENV === "development") {
    console.warn(`⚠️ Missing required environment variables: ${missing.join(", ")}`)
  }

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
