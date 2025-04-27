"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Database,
  BookOpen,
  Upload,
  Bug,
  Server,
  Shield,
  FileText,
  Settings,
  AlertTriangle,
} from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useEffect, useState } from "react"

export default function DebugPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (isAdmin === false) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  if (!isClient) {
    return (
      <div className="container py-12">
        <p>Loading...</p>
      </div>
    )
  }

  if (isAdmin === false) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-12">
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-gouna-blue-dark">Debug Tools</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" /> Database Connection
            </CardTitle>
            <CardDescription>Test the database connection and view table information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/database-connection")} className="w-full">
              Test Connection
            </Button>
            <Button onClick={() => router.push("/admin/debug/database-columns")} className="w-full" variant="outline">
              View Table Columns
            </Button>
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
            <Button className="w-full" variant="outline" onClick={() => router.push("/debug/booking-logs")}>
              View Booking Logs
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
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/blob-test")} className="w-full">
              Test Blob Storage
            </Button>
            <Button onClick={() => router.push("/admin/debug/upload-test")} className="w-full" variant="outline">
              Test File Upload
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bug className="h-5 w-5 mr-2" /> Error Logs
            </CardTitle>
            <CardDescription>View system error logs and debug information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/debug/booking-logs")} className="w-full">
              View Booking Logs
            </Button>
            <Button onClick={() => router.push("/admin/debug/client-errors")} className="w-full" variant="outline">
              View Client Errors
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" /> Environment
            </CardTitle>
            <CardDescription>Check environment configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/env-check")} className="w-full">
              Check Environment
            </Button>
            <Button onClick={() => router.push("/admin/debug/blob-config")} className="w-full" variant="outline">
              Check Blob Config
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" /> Authentication
            </CardTitle>
            <CardDescription>Test authentication and user sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/auth-test")} className="w-full">
              Test Authentication
            </Button>
            <Button onClick={() => router.push("/admin/debug/auth-status")} className="w-full" variant="outline">
              Check Auth Status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" /> Schema
            </CardTitle>
            <CardDescription>View and validate database schema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/database-schema")} className="w-full">
              View Schema
            </Button>
            <Button onClick={() => router.push("/admin/debug/schema-validator")} className="w-full" variant="outline">
              Validate Schema
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" /> Admin
            </CardTitle>
            <CardDescription>Manage admin users and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/manage-admins")} className="w-full">
              Manage Admins
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" /> Troubleshooting
            </CardTitle>
            <CardDescription>Advanced troubleshooting tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/debug/booking-structure")} className="w-full">
              Booking Structure
            </Button>
            <Button onClick={() => router.push("/admin/debug/fix-schema")} className="w-full" variant="outline">
              Fix Schema Issues
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
