import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateConfig } from "@/lib/config"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const url = req.nextUrl.clone()

  // Log the current path for debugging
  console.log(`[Middleware] Processing request for: ${url.pathname}`)

  // Check if required environment variables are configured
  const { valid, missing } = validateConfig()

  // Log missing environment variables in development
  if (!valid && process.env.NODE_ENV === "development") {
    console.warn(`⚠️ Missing required environment variables: ${missing.join(", ")}`)
  }

  // Don't redirect for API routes or static assets
  const isApiRoute = url.pathname.startsWith("/api/")
  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)
  const isDebugRoute = url.pathname.startsWith("/admin/debug")
  const isLoginRoute = url.pathname.startsWith("/admin/login") || url.pathname === "/admin-login"

  if (isApiRoute || isStaticAsset || isDebugRoute || isLoginRoute) {
    console.log(`[Middleware] Skipping auth check for: ${url.pathname}`)
    return res
  }

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Check if the route is an admin route
  const isAdminRoute = url.pathname.startsWith("/admin")

  if (isAdminRoute) {
    console.log(`[Middleware] Admin route detected: ${url.pathname}`)

    try {
      // Get the session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error(`[Middleware] Session error: ${sessionError.message}`)
        url.pathname = "/admin/login"
        return NextResponse.redirect(url)
      }

      // If no session and trying to access admin routes, redirect to login
      if (!session) {
        console.log(`[Middleware] No session found, redirecting to login`)
        url.pathname = "/admin/login"
        return NextResponse.redirect(url)
      }

      console.log(`[Middleware] Session found for user: ${session.user.email}`)

      // Allow access to admin routes if session exists
      return res
    } catch (error) {
      console.error(`[Middleware] Error checking session: ${error instanceof Error ? error.message : "Unknown error"}`)
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }
  }

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
