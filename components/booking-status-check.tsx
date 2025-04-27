"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, Clock, Calendar, MapPin } from "lucide-react"
import { getBookingsByEmail } from "@/app/api/bookings/actions"
import Link from "next/link"
import { encodeBookingId } from "@/lib/booking-utils"

export function BookingStatusCheck() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSearched(true)
    setDebugInfo(null)

    try {
      console.log("Fetching bookings for email:", email)
      const result = await getBookingsByEmail(email)

      // Store debug info
      setDebugInfo(result)
      console.log("API response:", result)

      if (result.error) {
        setError(result.error)
        setBookings([])
      } else {
        const fetchedBookings = result.bookings || []
        setBookings(fetchedBookings)

        if (fetchedBookings.length === 0) {
          setError("No bookings found for this email address.")
        }
      }
    } catch (err) {
      console.error("Error in booking status check:", err)
      setError("An error occurred while checking your booking status.")
      setBookings([])
      setDebugInfo({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>
      case "awaiting_confirmation":
        return <Badge className="bg-amber-500">Awaiting Confirmation</Badge>
      case "awaiting_payment":
        return <Badge className="bg-yellow-500">Awaiting Payment</Badge>
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      default:
        return <Badge className="bg-gray-500">{status || "Unknown"}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  // Helper function to get property name safely
  const getPropertyName = (booking: any) => {
    if (!booking || !booking.properties) return "Property"
    return booking.properties.title || booking.properties.name || "Property"
  }

  // Helper function to get property location safely
  const getPropertyLocation = (booking: any) => {
    if (!booking || !booking.properties) return null
    return booking.properties.location
  }

  return (
    <Card className="w-full">
      <CardHeader className="bg-gouna-blue text-white rounded-t-lg">
        <CardTitle>Check Booking Status</CardTitle>
        <CardDescription className="text-gray-200">Enter your email to check your booking status</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gouna-sand hover:bg-gouna-sand-dark text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
              </>
            ) : (
              "Check Status"
            )}
          </Button>
        </form>

        {searched && !isLoading && (
          <div className="mt-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => {
                  // Encode the booking ID for the URL
                  const encodedId = encodeBookingId(booking.id)
                  // Get property name safely
                  const propertyName = getPropertyName(booking)
                  // Get property location safely
                  const propertyLocation = getPropertyLocation(booking)

                  return (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{propertyName}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </span>
                        </div>
                        {propertyLocation && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{propertyLocation}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Booked on {formatDate(booking.created_at)}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link href={`/booking-status/${encodedId}`}>
                          <Button variant="outline" size="sm" className="text-gouna-blue">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Debug information (hidden in production) */}
            {debugInfo && process.env.NODE_ENV !== "production" && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <details>
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 rounded-b-lg text-xs text-gray-500 flex justify-center">
        Need help? Contact us at support@elgounarentals.com
      </CardFooter>
    </Card>
  )
}
