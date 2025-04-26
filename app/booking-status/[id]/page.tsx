"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getBookingById } from "@/app/api/bookings/actions"
import { getPropertyById } from "@/app/api/properties/actions"
import { Calendar, MapPin, Users, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function BookingStatusPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadBookingAndProperty() {
      try {
        setIsLoading(true)
        const { booking, error: bookingError } = await getBookingById(bookingId)

        if (bookingError || !booking) {
          throw new Error("Booking not found")
        }

        setBooking(booking)

        const { property, error: propertyError } = await getPropertyById(booking.property_id)

        if (propertyError || !property) {
          throw new Error("Property not found")
        }

        setProperty(property)
      } catch (err: any) {
        setError(err.message || "An error occurred")
        console.error("Error loading booking:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (bookingId) {
      loadBookingAndProperty()
    }
  }, [bookingId])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "awaiting_payment":
        return "bg-yellow-100 text-yellow-800"
      case "awaiting_confirmation":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Your booking has been confirmed! We look forward to hosting you."
      case "awaiting_payment":
        return "We're waiting for your payment. Please upload your payment proof."
      case "awaiting_confirmation":
        return "We've received your payment and are reviewing your booking."
      case "cancelled":
        return "This booking has been cancelled."
      default:
        return "Your booking is being processed."
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  if (error || !booking || !property) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gouna-blue-dark mb-2">Booking Not Found</h2>
            <p className="text-gray-600">The booking you're looking for doesn't exist or has expired.</p>
            <Button className="mt-6" onClick={() => router.push("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle className="text-2xl font-bold text-gouna-blue-dark">Booking Status</CardTitle>
            <Badge className={`${getStatusColor(booking.status)} text-sm px-3 py-1 mt-2 md:mt-0`}>
              {booking.status.replace("_", " ").charAt(0).toUpperCase() + booking.status.replace("_", " ").slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-gray-700">{getStatusMessage(booking.status)}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gouna-blue-dark mb-3">Booking Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-in</p>
                  <p>{new Date(booking.check_in).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Check-out</p>
                  <p>{new Date(booking.check_out).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-gouna-blue-dark mb-3">Property</h3>
            <div className="flex items-start">
              <div className="flex-1">
                <p className="font-medium">{property.title}</p>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{property.location}</span>
                </div>
                <div className="flex items-center text-gray-500 text-sm mt-1">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{booking.guests} guests</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold text-gouna-blue-dark mb-3">Payment</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Base Price</span>
                <span>${booking.base_price}</span>
              </div>
              {booking.cleaning_fee && (
                <div className="flex justify-between">
                  <span>Cleaning Fee</span>
                  <span>${booking.cleaning_fee}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${booking.total_price}</span>
              </div>
            </div>
          </div>

          {booking.status === "awaiting_payment" && (
            <div className="pt-4">
              <Button asChild className="w-full bg-gouna-blue hover:bg-gouna-blue-dark text-white">
                <Link href={`/upload/${booking.id}`}>Upload Payment & Documents</Link>
              </Button>
            </div>
          )}

          {booking.status === "awaiting_confirmation" && booking.payment_proof && (
            <div className="bg-blue-50 p-4 rounded-md text-blue-800">
              <p>Your payment proof has been received and is being reviewed. We'll confirm your booking shortly.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
