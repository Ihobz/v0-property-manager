"use client"

import { useState, useEffect } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, X } from "lucide-react"
import { checkEnvironmentConfig } from "@/lib/check-env-config"

export function EnvironmentWarning() {
  const [showWarning, setShowWarning] = useState(false)
  const [missing, setMissing] = useState<string[]>([])

  useEffect(() => {
    const checkEnv = async () => {
      const result = await checkEnvironmentConfig()
      if (!result.isConfigured) {
        setMissing(result.missing)
        setShowWarning(true)
      }
    }

    checkEnv()
  }, [])

  if (!showWarning) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4 relative">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Environment Configuration Issue</AlertTitle>
      <AlertDescription>
        <p>The application is missing required environment variables:</p>
        <ul className="list-disc pl-5 mt-2">
          {missing.map((variable) => (
            <li key={variable}>{variable}</li>
          ))}
        </ul>
        <p className="mt-2">Please check your environment configuration. Some features may not work correctly.</p>
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0"
        onClick={() => setShowWarning(false)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  )
}
