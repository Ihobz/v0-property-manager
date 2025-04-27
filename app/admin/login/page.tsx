"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { logInfo, logError } from "@/lib/logging"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const { login, isAuthenticated, isAdmin } = useAuth()
  const router = useRouter()

  // Check current auth status on mount
  useEffect(() => {
    const checkCurrentAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking initial session:", error)
          return
        }

        if (data.session) {
          console.log("Initial session check: User is logged in", data.session.user.email)
        } else {
          console.log("Initial session check: No active session")
        }
      } catch (err) {
        console.error("Error in initial auth check:", err)
      }
    }

    checkCurrentAuth()
  }, [])

  // Redirect to admin dashboard if already authenticated and is admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      logInfo("Login", "User already authenticated, redirecting to admin dashboard")
      console.log("Auth state indicates user is authenticated and admin, redirecting")
      router.push("/admin")
    }
  }, [isAuthenticated, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDebugInfo(null)
    setIsLoading(true)

    try {
      logInfo("Login", `Attempting login for: ${email}`)
      console.log(`Login attempt for: ${email}`)

      const { success, error } = await login(email, password)

      if (success) {
        logInfo("Login", "Login successful, redirecting to admin dashboard")
        console.log("Login successful, preparing to redirect")

        // Check session after login
        const supabase = getSupabaseBrowserClient()
        const { data: sessionData } = await supabase.auth.getSession()

        setDebugInfo(`Login successful. Session exists: ${!!sessionData.session}`)
        console.log("Session after login:", sessionData.session ? "exists" : "missing")

        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          console.log("Redirecting to admin dashboard now")
          router.push("/admin")
        }, 1000)
      } else {
        logError("Login", `Login failed: ${error || "Unknown error"}`)
        console.error("Login failed:", error)
        setError(error || "Failed to sign in")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logError("Login", `Unexpected error during login: ${errorMessage}`)
      console.error("Login exception:", errorMessage)
      setError(`An unexpected error occurred: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDebugRedirect = () => {
    router.push("/admin/debug/auth-status")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>Sign in to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <Alert>
                <AlertDescription>{debugInfo}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="pt-2">
              <Button type="button" variant="outline" className="w-full" onClick={handleDebugRedirect}>
                Check Auth Status
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Forgot your password?{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => router.push("/admin/reset-password")}>
              Reset it here
            </Button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
