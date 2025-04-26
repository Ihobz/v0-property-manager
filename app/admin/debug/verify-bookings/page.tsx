"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/components/ui/use-toast"
import { getBookings, verifyBookingId } from "@/app/api/bookings/actions"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"

export default function VerifyBookingsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()

  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [manualBookingId, setManualBookingId] = useState("")
  const [verificationResults, setVerificationResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
      return
    }

    async function fetchBookings() {
      try {
        setIsLoading(true)
        const { bookings: fetchedBookings, error: fetchError } = await getBookings()

        if (fetchError) {
          throw new Error(fetchError)
        }

        setBookings(fetchedBookings || [])
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [isAdmin, router])

  const verifyBooking = async (bookingId: string) => {
    setIsVerifying(true)
    setSelectedBookingId(bookingId)

    try {
      // Step 1: Verify the booking ID exists
      const { exists, error: verifyError } = await verifyBookingId(bookingId)

      // Add the result to our verification list
      setVerificationResults((prev) => [
        {
          id: bookingId,
          timestamp: new Date().toISOString(),
          originalId: bookingId,
          exists,
          error: verifyError,
          success: exists && !verifyError,
        },
        ...prev,
      ])

      if (!exists || verifyError) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: verifyError || "Booking ID does not exist",
        })
        return
      }

      toast({
        title: "Verification Successful",
        description: "Booking ID exists in the database",
      })
    } catch (error) {
      console.error("Error verifying booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during verification",
      })
    } finally {
      setIsVerifying(false)
      setSelectedBookingId(null)
    }
  }

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualBookingId) {
      verifyBooking(manualBookingId)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <h1 className="text-3xl font-bold text-gouna-blue-dark mb-8">Verify Booking View Functionality</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Test with Existing Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {bookings.length > 0 ? (
                bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex flex-col space-y-2 p-4 border rounded-md">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-sm text-gray-500">ID: {formatBookingIdForDisplay(booking.id)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => verifyBooking(booking.id)}
                          disabled={isVerifying && selectedBookingId === booking.id}
                        >
                          {isVerifying && selectedBookingId === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            "Verify"
                          )}
                        </Button>
                        <a href={`/admin/bookings/${booking.id}`} className="inline-block">
                          <Button variant="default" size="sm" type="button">
                            View <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">No bookings found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleManualVerify} className="space-y-4">
              <div>
                <Label htmlFor="booking-id">Booking ID</Label>
                <Input
                  id="booking-id"
                  value={manualBookingId}
                  onChange={(e) => setManualBookingId(e.target.value)}
                  placeholder="Enter booking ID to verify"
                />
              </div>
              <Button type="submit" disabled={!manualBookingId || isVerifying} className="w-full">
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...
                  </>
                ) : (
                  "Verify Booking ID"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Verification Results</CardTitle>
        </CardHeader>
        <CardContent>
          {verificationResults.length > 0 ? (
            <div className="space-y-4">
              {verificationResults.map((result, index) => (
                <div key={index} className={`p-4 border rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-center mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <h3 className="font-medium">
                      {result.success ? "Verification Successful" : "Verification Failed"}
                    </h3>
                    <span className="ml-auto text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Original ID:</p>
                      <p className="font-mono bg-gray-100 p-1 rounded">{result.originalId}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Exists in Database:</p>
                      <p>{result.exists ? "Yes" : "No"}</p>
                    </div>
                  </div>

                  {result.error && (
                    <div className="mt-2 text-sm text-red-600">
                      <p className="font-medium">Error:</p>
                      <p>{result.error}</p>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    {result.exists && (
                      <a href={`/admin/bookings/${result.originalId}`} className="inline-block">
                        <Button variant="outline" size="sm" type="button">
                          Test Navigation <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                      </a>
                    )}
                    {!result.exists && (
                      <Button variant="outline" size="sm" disabled>
                        Test Navigation <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500">No verification tests run yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
