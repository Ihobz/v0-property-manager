import { getBookingById } from "@/app/api/bookings/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"
import { FileUpload } from "@/components/file-upload"
import Link from "next/link"
import { logError } from "@/lib/logging"

export default async function BookingStatusPage({ params }: { params: { id: string } }) {
  const bookingId = params.id

  try {
    const { booking, error } = await getBookingById(bookingId)

    if (error || !booking) {
      // Instead of returning notFound(), show an error message
      return (
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Booking Not Found</CardTitle>
              <CardDescription>
                We couldn't find a booking with the ID: {formatBookingIdForDisplay(bookingId)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">
                {error ||
                  "The booking ID you provided does not exist in our system. Please check the booking ID or contact support."}
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/" className="w-full">
                <Button className="w-full">Return to Home</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )
    }

    const { property } = booking

    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gouna-blue-dark">Booking Status</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Booking #{formatBookingIdForDisplay(bookingId)}</CardTitle>
              <CardDescription>
                {property?.name} - {property?.location}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                  <p>{new Date(booking.check_in).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                  <p>{new Date(booking.check_out).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Guests</h3>
                  <p>{booking.guests}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className={`font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Booking Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p>
                      {booking.first_name} {booking.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{booking.email}</p>
                  </div>
                  {booking.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p>{booking.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {booking.special_requests && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Special Requests</h3>
                  <p className="text-sm">{booking.special_requests}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
                <StatusCard status={booking.status} bookingId={bookingId} />
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Back to Home
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {booking.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Payment Proof</CardTitle>
                <CardDescription>
                  Please upload a screenshot or photo of your payment confirmation to verify your booking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bookingId={bookingId}
                  uploadType="payment"
                  maxSizeMB={5}
                  allowedTypes={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    logError(`Unexpected error in booking status page: ${errorMessage}`, { bookingId, error })

    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>An unexpected error occurred while processing your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">
              We're sorry, but something went wrong. Please try again later or contact support.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "confirmed":
      return "text-green-600"
    case "pending":
      return "text-amber-600"
    case "cancelled":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

function StatusCard({ status, bookingId }: { status: string; bookingId: string }) {
  switch (status) {
    case "confirmed":
      return (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Payment Confirmed</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  Your payment has been verified and your booking is confirmed. Thank you for choosing El Gouna Rentals!
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    case "pending":
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">Payment Pending</h3>
              <div className="mt-2 text-sm text-amber-700">
                <p>
                  We're waiting for your payment confirmation. Please upload your payment proof if you haven't already.
                </p>
                <div className="mt-2">
                  <Link href={`/upload/${bookingId}`}>
                    <Button size="sm" variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50">
                      Upload Payment Proof
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    case "cancelled":
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Booking Cancelled</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  This booking has been cancelled. If you believe this is an error, please contact our support team.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    default:
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">Status: {status}</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>Please contact our support team for more information about your booking status.</p>
              </div>
            </div>
          </div>
        </div>
      )
  }
}

import { CheckCircle, Clock, XCircle, HelpCircle } from "lucide-react"
