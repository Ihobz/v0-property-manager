import { verifyBookingId } from "@/app/api/bookings/actions"
import { FileUpload } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"
import { logError } from "@/lib/logging"

export default async function UploadPage({ params }: { params: { id: string } }) {
  const bookingId = params.id

  try {
    // Verify the booking ID exists
    const { exists, status, error } = await verifyBookingId(bookingId)

    if (error) {
      logError(`Error verifying booking for upload page: ${error}`, { bookingId })
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
                There was an error verifying your booking. Please check the booking ID or contact support.
              </p>
              <p className="text-sm text-gray-500 mt-2">Error details: {error}</p>
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

    if (!exists) {
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
                The booking ID you provided does not exist in our system. Please check the booking ID or contact
                support.
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

    // If the booking is already confirmed, redirect to the booking status page
    if (status === "confirmed") {
      return (
        <div className="container mx-auto py-12 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Payment Already Confirmed</CardTitle>
              <CardDescription>
                Your booking #{formatBookingIdForDisplay(bookingId)} has already been confirmed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-green-600">
                Your payment has been verified and your booking is confirmed. No further action is needed.
              </p>
            </CardContent>
            <CardFooter>
              <Link href={`/booking-status/${bookingId}`} className="w-full">
                <Button className="w-full">View Booking Status</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center text-gouna-blue-dark">Upload Payment Proof</h1>

          <Card>
            <CardHeader>
              <CardTitle>Payment Proof for Booking #{formatBookingIdForDisplay(bookingId)}</CardTitle>
              <CardDescription>
                Please upload a screenshot or photo of your payment confirmation to verify your booking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
                  <p className="font-medium mb-1">Payment Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Make a bank transfer to the account details provided in your confirmation email.</li>
                    <li>Take a screenshot or photo of the payment confirmation.</li>
                    <li>Upload the image below.</li>
                    <li>Once verified, you'll receive a confirmation email.</li>
                  </ol>
                </div>

                <FileUpload
                  bookingId={bookingId}
                  uploadType="payment"
                  maxSizeMB={5}
                  allowedTypes={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/booking-status/${bookingId}`}>
                <Button variant="outline">View Booking Status</Button>
              </Link>
              <Link href="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    // Handle any unexpected errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    logError(`Unexpected error in upload page: ${errorMessage}`, { bookingId, error })

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
