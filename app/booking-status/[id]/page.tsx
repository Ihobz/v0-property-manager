import { getBookingById } from "@/app/api/bookings/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Calendar, Clock, MapPin, Users, Home, Phone, Mail, AlertCircle, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { decodeBookingId, formatBookingIdForDisplay } from "@/lib/booking-utils"

export default async function BookingStatusPage({ params }: { params: { id: string } }) {
  // Decode the booking ID from the URL
  const encodedId = params.id
  const bookingId = decodeBookingId(encodedId)

  if (!bookingId) {
    return notFound()
  }

  const { booking, error } = await getBookingById(bookingId)

  if (error || !booking) {
    return notFound()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Alert className="bg-green-50 border-green-200 mt-4">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-800">Your booking is confirmed!</AlertTitle>
            <AlertDescription className="text-green-700">
              We look forward to welcoming you. You'll receive check-in instructions closer to your arrival date.
            </AlertDescription>
          </Alert>
        )
      case "awaiting_confirmation":
        return booking.payment_proof ? (
          <Alert className="bg-amber-50 border-amber-200 mt-4">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-800">Payment received, awaiting confirmation</AlertTitle>
            <AlertDescription className="text-amber-700">
              We've received your payment proof and are reviewing it. You'll receive a confirmation email soon.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-amber-50 border-amber-200 mt-4">
            <Clock className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-800">Awaiting payment</AlertTitle>
            <AlertDescription className="text-amber-700">
              Please upload your payment proof to confirm your booking.
              <div className="mt-2">
                <Link href={`/upload/${booking.id}`}>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Upload Payment
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )
      case "cancelled":
        return (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Booking cancelled</AlertTitle>
            <AlertDescription>
              This booking has been cancelled. If you have any questions, please contact us.
            </AlertDescription>
          </Alert>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-gouna-blue-dark">Booking Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-gouna-blue text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Booking #{formatBookingIdForDisplay(booking.id)}</CardTitle>
                  <CardDescription className="text-gray-200">
                    Booked on {formatDate(booking.created_at)}
                  </CardDescription>
                </div>
                {getStatusBadge(booking.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {getStatusMessage(booking.status)}

              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Stay Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Check-in</p>
                        <p className="font-medium">{formatDate(booking.check_in)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Check-out</p>
                        <p className="font-medium">{formatDate(booking.check_out)}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Guests</p>
                        <p className="font-medium">
                          {booking.guests} {booking.guests === 1 ? "guest" : "guests"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Property</p>
                        <p className="font-medium">{booking.properties?.title || "Property"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Guest Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{booking.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 mr-2 text-gouna-blue" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{booking.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Payment Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="font-medium">${booking.base_price.toFixed(2)}</p>
                    </div>
                    {booking.cleaning_fee && (
                      <div>
                        <p className="text-sm text-gray-500">Cleaning Fee</p>
                        <p className="font-medium">${booking.cleaning_fee.toFixed(2)}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Total Price</p>
                      <p className="font-medium text-lg">${booking.total_price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 rounded-b-lg flex justify-between">
              <p className="text-sm text-gray-500">Need help? Contact us at support@elgounarentals.com</p>
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to Home
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.properties?.images && booking.properties.images[0] && (
                <div className="relative h-48 mb-4 rounded-md overflow-hidden">
                  <Image
                    src={booking.properties.images[0] || "/placeholder.svg"}
                    alt={booking.properties.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <h3 className="font-medium text-lg mb-2">{booking.properties?.title || "Property"}</h3>

              {booking.properties?.location && (
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{booking.properties.location}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border rounded-md p-2">
                  <p className="text-xs text-gray-500">Bedrooms</p>
                  <p className="font-medium">{booking.properties?.bedrooms || "-"}</p>
                </div>
                <div className="border rounded-md p-2">
                  <p className="text-xs text-gray-500">Bathrooms</p>
                  <p className="font-medium">{booking.properties?.bathrooms || "-"}</p>
                </div>
                <div className="border rounded-md p-2">
                  <p className="text-xs text-gray-500">Max Guests</p>
                  <p className="font-medium">{booking.properties?.guests || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {booking.status === "awaiting_confirmation" && !booking.payment_proof && (
            <div className="mt-4">
              <Link href={`/upload/${booking.id}`} className="w-full">
                <Button className="w-full bg-gouna-sand hover:bg-gouna-sand-dark">Upload Payment Proof</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
