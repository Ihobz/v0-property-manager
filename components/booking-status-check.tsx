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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSearched(true)

    try {
      const { bookings, error } = await getBookingsByEmail(email)

      if (error) {
        setError(error)
        setBookings([])
      } else {
        setBookings(bookings || [])
        if (bookings.length === 0) {
          setError("No bookings found for this email address.")
        }
      }
    } catch (err) {
      setError("An error occurred while checking your booking status.")
      setBookings([])
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
      case "cancelled":
        return <Badge className="bg-red-500">Cancelled</Badge>
      case "completed":
        return <Badge className="bg-blue-500">Completed</Badge>
      default:
        return <Badge className="bg-gray-500">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

                  return (
                    <div key={booking.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{booking.properties?.title || "Property"}</h3>
                        {getStatusBadge(booking.status)}
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {formatDate(booking.check_in)} - {formatDate(booking.check_out)}
                          </span>
                        </div>
                        {booking.properties?.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{booking.properties.location}</span>
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
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 rounded-b-lg text-xs text-gray-500 flex justify-center">
        Need help? Contact us at support@elgounarentals.com
      </CardFooter>
    </Card>
  )
}
