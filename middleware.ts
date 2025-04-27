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

  // Don't redirect for API routes or static assets
  const url = req.nextUrl.clone()
  const isApiRoute = url.pathname.startsWith("/api/")
  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)

  if (isApiRoute || isStaticAsset) {
    return res
  }

  // Check if the route is an admin route
  const isAdminRoute =
    url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/admin/login") &&
    !url.pathname.startsWith("/admin-login")

  if (isAdminRoute) {
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and trying to access admin routes, redirect to login
    if (!session) {
      console.log("No session found, redirecting to login")
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Log successful access
    console.log("Session found, allowing access to admin route")
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
