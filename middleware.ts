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

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  const sessionResult = await supabase.auth.getSession()

  // Log session status for debugging
  if (sessionResult.error) {
    console.error(`[Middleware] Error getting session: ${sessionResult.error.message}`)
  } else {
    console.log(`[Middleware] Session exists: ${!!sessionResult.data.session}`)
    if (sessionResult.data.session) {
      console.log(`[Middleware] User email: ${sessionResult.data.session.user.email}`)
    }
  }

  // Don't redirect for API routes or static assets
  const isApiRoute = url.pathname.startsWith("/api/")
  const isStaticAsset = url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/)
  const isDebugRoute = url.pathname.startsWith("/admin/debug/auth-status")

  if (isApiRoute || isStaticAsset || isDebugRoute) {
    console.log(`[Middleware] Skipping auth check for: ${url.pathname}`)
    return res
  }

  // Check if the route is an admin route
  const isAdminRoute =
    url.pathname.startsWith("/admin") &&
    !url.pathname.startsWith("/admin/login") &&
    !url.pathname.startsWith("/admin-login")

  if (isAdminRoute) {
    console.log(`[Middleware] Admin route detected: ${url.pathname}`)

    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session and trying to access admin routes, redirect to login
    if (!session) {
      console.log(`[Middleware] No session found, redirecting to login`)
      url.pathname = "/admin/login"
      return NextResponse.redirect(url)
    }

    // Check if user is in admins table
    try {
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("email", session.user.email)
        .single()

      if (adminError && adminError.code !== "PGRST116") {
        console.error(`[Middleware] Error checking admin status: ${adminError.message}`)
      }

      if (!adminData) {
        console.log(`[Middleware] User is not an admin, redirecting to login`)
        url.pathname = "/admin/login"
        return NextResponse.redirect(url)
      }

      console.log(`[Middleware] Admin access granted for: ${session.user.email}`)
    } catch (error) {
      console.error(
        `[Middleware] Exception checking admin status: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
      // On error, redirect to login as a safety measure
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
