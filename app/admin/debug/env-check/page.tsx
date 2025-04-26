"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EnvCheckPage() {
  const router = useRouter()
  const [envVars, setEnvVars] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkEnv() {
      try {
        setIsLoading(true)

        // Check client-side environment variables
        const clientEnvVars = {
          NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "***" : null,
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || null,
        }

        // Check server-side environment variables via API
        const response = await fetch("/api/debug/env-check")
        const serverData = await response.json()

        setEnvVars({
          client: clientEnvVars,
          server: serverData,
        })
      } catch (err) {
        console.error("Error checking environment variables:", err)
        setError(err instanceof Error ? err.message : "Failed to check environment variables")
      } finally {
        setIsLoading(false)
      }
    }

    checkEnv()
  }, [])

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/debug")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Check</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gouna-blue" />
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-700 font-medium mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Client-Side Environment Variables:</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(envVars?.client || {}, null, 2)}</pre>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Server-Side Environment Variables:</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(envVars?.server || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
