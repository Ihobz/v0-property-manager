"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

interface AdminAuthCheckProps {
  children: React.ReactNode
}

export function AdminAuthCheck({ children }: AdminAuthCheckProps) {
  const { isAuthenticated, isAdmin, isLoading, error, checkSession } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [redirected, setRedirected] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showRetryButton, setShowRetryButton] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Prevent redirect loops
  const isLoginPage = pathname === "/admin/login"
  const MAX_RETRIES = 3

  // Handle retry logic for network errors
  useEffect(() => {
    if (error && error.includes("Failed to fetch") && retryCount < MAX_RETRIES) {
      const timer = setTimeout(
        () => {
          console.log(`Retrying authentication check (${retryCount + 1}/${MAX_RETRIES})...`)
          setRetryCount((prev) => prev + 1)
          checkSession()
        },
        2000 * (retryCount + 1),
      ) // Exponential backoff

      return () => clearTimeout(timer)
    }

    if (retryCount >= MAX_RETRIES && error) {
      setShowRetryButton(true)
    }
  }, [error, retryCount, checkSession])

  useEffect(() => {
    // Only redirect if:
    // 1. We're not already on the login page
    // 2. We're not loading
    // 3. The user is not authenticated
    // 4. We haven't already triggered a redirect
    // 5. We're not in a retry cycle
    if (!isLoginPage && !isLoading && !isAuthenticated && !redirected && retryCount >= MAX_RETRIES) {
      console.log("Redirecting to login page")
      setRedirected(true)
      router.push("/admin/login")
    }
  }, [isLoading, isAuthenticated, isLoginPage, redirected, router, retryCount])

  const handleRetry = () => {
    setRetryCount(0)
    setShowRetryButton(false)
    setLocalError(null)
    checkSession()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Loading</CardTitle>
            <CardDescription>Checking authentication status...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[450px]">
          <CardHeader>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>There was a problem checking your authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {retryCount > 0 && retryCount < MAX_RETRIES && (
              <p className="mt-4 text-sm text-center">
                Retrying... ({retryCount}/{MAX_RETRIES})
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/admin/login" passHref>
              <Button variant="outline">Go to Login</Button>
            </Link>
            {showRetryButton && <Button onClick={handleRetry}>Retry</Button>}
          </CardFooter>
        </Card>
      </div>
    )
  }

  // If we're on the login page, don't check authentication
  if (isLoginPage) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Not Authenticated</CardTitle>
            <CardDescription>You need to log in to access this page</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please log in to continue.</p>
          </CardContent>
          <CardFooter>
            <Link href="/admin/login" passHref>
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have admin privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your account doesn't have the necessary permissions to access the admin area.</p>
          </CardContent>
          <CardFooter>
            <Link href="/" passHref>
              <Button className="w-full">Go to Homepage</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
