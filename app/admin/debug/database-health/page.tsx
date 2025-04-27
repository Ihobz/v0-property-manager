"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import AdminAuthCheck from "@/components/admin-auth-check"

interface HealthStatus {
  status: "healthy" | "unhealthy" | "loading"
  message: string
  details?: any
}

export default function DatabaseHealthPage() {
  const [databaseStatus, setDatabaseStatus] = useState<HealthStatus>({
    status: "loading",
    message: "Checking database connection...",
  })

  const [rlsStatus, setRlsStatus] = useState<HealthStatus>({
    status: "loading",
    message: "Checking RLS policies...",
  })

  const [blobStatus, setBlobStatus] = useState<HealthStatus>({
    status: "loading",
    message: "Checking Blob storage...",
  })

  const checkDatabaseHealth = async () => {
    setDatabaseStatus({
      status: "loading",
      message: "Checking database connection...",
    })

    try {
      const response = await fetch("/api/health/database")
      const data = await response.json()

      if (response.ok) {
        setDatabaseStatus({
          status: "healthy",
          message: "Database connection is healthy",
          details: data,
        })
      } else {
        setDatabaseStatus({
          status: "unhealthy",
          message: data.error || "Database connection failed",
          details: data,
        })
      }
    } catch (error) {
      setDatabaseStatus({
        status: "unhealthy",
        message: "Failed to check database health",
        details: error,
      })
    }
  }

  const checkRlsPolicies = async () => {
    setRlsStatus({
      status: "loading",
      message: "Checking RLS policies...",
    })

    try {
      const response = await fetch("/api/debug/database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "checkRlsPolicies" }),
      })

      const data = await response.json()

      if (response.ok) {
        setRlsStatus({
          status: "healthy",
          message: "RLS policies are properly configured",
          details: data,
        })
      } else {
        setRlsStatus({
          status: "unhealthy",
          message: data.error || "RLS policy check failed",
          details: data,
        })
      }
    } catch (error) {
      setRlsStatus({
        status: "unhealthy",
        message: "Failed to check RLS policies",
        details: error,
      })
    }
  }

  const checkBlobStorage = async () => {
    setBlobStatus({
      status: "loading",
      message: "Checking Blob storage...",
    })

    try {
      const response = await fetch("/api/debug/blob-test")
      const data = await response.json()

      if (response.ok) {
        setBlobStatus({
          status: "healthy",
          message: "Blob storage is properly configured",
          details: data,
        })
      } else {
        setBlobStatus({
          status: "unhealthy",
          message: data.error || "Blob storage check failed",
          details: data,
        })
      }
    } catch (error) {
      setBlobStatus({
        status: "unhealthy",
        message: "Failed to check Blob storage",
        details: error,
      })
    }
  }

  const initializeRls = async () => {
    try {
      const response = await fetch("/api/debug/init-rls", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        alert("RLS initialization completed successfully")
        checkRlsPolicies()
      } else {
        alert(`Failed to initialize RLS: ${data.error}`)
      }
    } catch (error) {
      alert(`Error initializing RLS: ${error.message}`)
    }
  }

  const runDatabaseMigrations = async () => {
    try {
      const response = await fetch("/api/debug/migrations", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        alert("Database migrations completed successfully")
        checkDatabaseHealth()
      } else {
        alert(`Failed to run migrations: ${data.error}`)
      }
    } catch (error) {
      alert(`Error running migrations: ${error.message}`)
    }
  }

  const initializeDatabase = async () => {
    try {
      const response = await fetch("/api/debug/init-db", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        alert("Database initialization completed successfully")
        checkDatabaseHealth()
      } else {
        alert(`Failed to initialize database: ${data.error}`)
      }
    } catch (error) {
      alert(`Error initializing database: ${error.message}`)
    }
  }

  useEffect(() => {
    checkDatabaseHealth()
    checkRlsPolicies()
    checkBlobStorage()
  }, [])

  const renderStatusCard = (title: string, status: HealthStatus, onRefresh: () => void) => {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            {status.status === "healthy" ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : status.status === "unhealthy" ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
            )}
          </CardTitle>
          <CardDescription>{status.message}</CardDescription>
        </CardHeader>
        <CardContent>
          {status.status === "unhealthy" && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {typeof status.details === "object" ? JSON.stringify(status.details, null, 2) : String(status.details)}
              </AlertDescription>
            </Alert>
          )}
          {status.status === "healthy" && status.details && (
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(status.details, null, 2)}
            </pre>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button variant="outline" onClick={onRefresh} disabled={status.status === "loading"}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <AdminAuthCheck>
      <div>
        <h1 className="text-2xl font-bold mb-4">Database Health</h1>
        {renderStatusCard("Database Connection", databaseStatus, checkDatabaseHealth)}
        {renderStatusCard("RLS Policies", rlsStatus, checkRlsPolicies)}
        {renderStatusCard("Blob Storage", blobStatus, checkBlobStorage)}

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Admin Actions</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={initializeDatabase}>Initialize Database</Button>
            <Button onClick={runDatabaseMigrations}>Run Database Migrations</Button>
            <Button onClick={initializeRls}>Initialize RLS</Button>
          </div>
        </div>
      </div>
    </AdminAuthCheck>
  )
}
