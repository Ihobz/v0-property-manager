"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Database, BookOpen, Upload, Bug, Server, Shield } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useEffect } from "react"

export default function DebugPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (isAdmin === false) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  if (isAdmin === null) {
    return (
      <div className="container py-12">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <h1 className="text-3xl font-bold text-gouna-blue-dark mb-6">Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" /> Database Connection
            </CardTitle>
            <CardDescription>Test the database connection and view table information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/debug/database-connection")}>Test Connection</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" /> Bookings
            </CardTitle>
            <CardDescription>Debug and test booking functionality</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" onClick={() => router.push("/admin/debug/create-test-booking")}>
              Create Test Booking
            </Button>
            <Button className="w-full" variant="outline" onClick={() => router.push("/admin/debug/verify-bookings")}>
              Verify Bookings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" /> File Uploads
            </CardTitle>
            <CardDescription>Test and debug file upload functionality</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/debug/blob-test")}>Test Blob Storage</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="h-5 w-5 mr-2" /> Error Logs
            </CardTitle>
            <CardDescription>View system error logs and debug information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/debug/booking-logs")}>View Booking Logs</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" /> Environment
            </CardTitle>
            <CardDescription>Check environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/debug/env-check")}>Check Environment</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" /> Authentication
            </CardTitle>
            <CardDescription>Test authentication and user sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/admin/debug/auth-test")}>Test Authentication</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
