"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"

export default function BookingLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/debug/booking-logs")
      if (!response.ok) {
        throw new Error(`Error fetching logs: ${response.status}`)
      }
      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error("Error fetching logs:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch logs")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="container py-12">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/admin/debug")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug Tools
        </Button>
        <Button onClick={fetchLogs} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Logs
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Booking System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-red-50 p-4 rounded-md text-red-700">{error}</div>
          ) : isLoading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No logs found</div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={index} className="border rounded-md p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        log.level === "error"
                          ? "bg-red-100 text-red-800"
                          : log.level === "warning"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {log.level}
                    </span>
                  </div>
                  <p className="text-gray-700">{log.message}</p>
                  {log.details && (
                    <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
