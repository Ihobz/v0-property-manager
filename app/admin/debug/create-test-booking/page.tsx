"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createTestBooking } from "@/app/api/bookings/actions"
import { toast } from "@/components/ui/use-toast"

export default function CreateTestBookingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreateTestBooking = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await createTestBooking()

      if (!response.success) {
        throw new Error(response.error || "Failed to create test booking")
      }

      setResult(response)
      toast({
        title: "Success",
        description: response.message || "Test booking created successfully",
      })
    } catch (err) {
      console.error("Error creating test booking:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create test booking",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/debug")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            This tool creates a test booking with sample data to help debug the booking system.
          </p>

          <Button onClick={handleCreateTestBooking} disabled={isLoading} className="mb-6">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Test Booking...
              </>
            ) : (
              "Create Test Booking"
            )}
          </Button>

          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-700 font-medium mb-2">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="text-green-700 font-medium mb-2">Success</h3>
              <p>{result.message}</p>

              {result.booking && (
                <div className="mt-4">
                  <h4 className="font-medium">Booking Details:</h4>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60 text-xs">
                    {JSON.stringify(result.booking, null, 2)}
                  </pre>

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/admin/bookings/${result.booking.id}`)}>
                      View Booking
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => router.push("/admin/bookings")}>
                      Go to Bookings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
