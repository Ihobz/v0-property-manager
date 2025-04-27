import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Define paths that should be public (accessible without authentication)
const publicPaths = [
  "/",
  "/about",
  "/contact",
  "/properties",
  "/booking-status",
  "/upload",
  "/api/upload",
  "/api/bookings",
  "/api/availability",
  "/api/properties",
  "/api/log", // Make sure logging endpoint is public
]

// Define paths that should redirect to admin login if not authenticated
const adminPaths = ["/admin"]

// Define paths that should be excluded from authentication checks
const excludedPaths = ["/admin/login", "/admin/reset-password", "/admin/update-password", "/admin/debug", "/api/debug"]

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // Skip middleware for public paths and static files
    if (
      publicPaths.some((path) => pathname.startsWith(path)) ||
      pathname.includes("_next") ||
      pathname.includes("favicon.ico") ||
      pathname.includes(".png") ||
      pathname.includes(".jpg") ||
      pathname.includes(".svg")
    ) {
      return NextResponse.next()
    }

    // Skip middleware for excluded paths
    if (excludedPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // For admin paths, check if the user is authenticated
    if (adminPaths.some((path) => pathname.startsWith(path))) {
      try {
        // Create a Supabase client for the middleware
        const res = NextResponse.next()
        const supabase = createMiddlewareClient({ req: request, res })

        // Check if the user has a session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // If no session, redirect to login
        if (!session) {
          console.log("[Middleware] No session found, redirecting to login")
          const redirectUrl = new URL("/admin/login", request.url)
          return NextResponse.redirect(redirectUrl)
        }

        // User is authenticated, allow access
        console.log("[Middleware] Session found, allowing access to admin route")
        return res
      } catch (error) {
        // If there's an error checking the session, log it and redirect to login
        console.error("[Middleware] Error checking session:", error)
        const redirectUrl = new URL("/admin/login", request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // For any other routes, just proceed
    return NextResponse.next()
  } catch (error) {
    // If there's an error in the middleware, log it and proceed
    console.error("[Middleware] Unexpected error:", error)
    return NextResponse.next()
  }
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
