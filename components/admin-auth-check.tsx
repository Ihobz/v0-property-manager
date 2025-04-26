"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-provider"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface AdminAuthCheckProps {
  children: React.ReactNode
}

export function AdminAuthCheck({ children }: AdminAuthCheckProps) {
  const { isAuthenticated, isAdmin, isLoading, error, checkSession } = useAuth()
  const router = useRouter()

  // Immediate redirect if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Use window.location for a hard redirect instead of router.push
      window.location.href = "/admin/login"
    }
  }, [isLoading, isAuthenticated, router])

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
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => (window.location.href = "/admin/login")}>
              Go to Login
            </Button>
            <Button onClick={() => checkSession()}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Immediate redirect using window.location for a hard redirect
    window.location.href = "/admin/login"
    return null
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
            <Button onClick={() => (window.location.href = "/")} className="w-full">
              Go to Homepage
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
