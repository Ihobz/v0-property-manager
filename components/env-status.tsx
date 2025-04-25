"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { checkEnvironmentConfig } from "@/lib/check-env-config"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

export function EnvironmentStatus() {
  const [status, setStatus] = useState<{
    isConfigured: boolean
    missing: string[]
    message: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await checkEnvironmentConfig()
      setStatus(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check environment configuration")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkConfig()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Environment Variables
          <Button variant="outline" size="sm" onClick={checkConfig} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : status ? (
          <>
            <div className="flex items-center mb-4">
              <Badge variant={status.isConfigured ? "success" : "destructive"} className="mr-2">
                {status.isConfigured ? "Configured" : "Missing Variables"}
              </Badge>
              <span className="text-sm text-gray-500">{status.message}</span>
            </div>

            {!status.isConfigured && status.missing.length > 0 && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Missing Environment Variables</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-2">
                    {status.missing.map((variable) => (
                      <li key={variable}>{variable}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {status.isConfigured && (
              <Alert variant="success" className="mt-4 bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>All Required Variables Configured</AlertTitle>
                <AlertDescription>Your application is properly configured.</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
