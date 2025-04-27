"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Calendar,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  User,
  Bed,
  Bath,
  Loader2,
  AlertTriangle,
  Info,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "@/components/ui/use-toast"
import {
  updateBookingStatus,
  getBookingById,
  updateBookingCleaningFee,
  getIdDocuments,
} from "@/app/api/bookings/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  // Use the ID directly from params without additional decoding
  const bookingId = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<any>(null)
  const [cleaningFee, setCleaningFee] = useState(0)
  const [confirmationMessage, setConfirmationMessage] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [idDocuments, setIdDocuments] = useState<string[]>([])

  // State for confirmation dialogs
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isUpdatingCleaningFee, setIsUpdatingCleaningFee] = useState(false)

  const { isAuthenticated } = useAuth()

  // Function to load booking data with retry capability
  const loadBookingData = async () => {
    if (!bookingId) {
      setError("No booking ID provided")
      setDebugInfo({
        rawBookingId: bookingId,
        error: "No booking ID provided",
      })
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setErrorDetails(null)

    try {
      console.log(`Loading booking data for ID: "${bookingId}" (Attempt ${retryCount + 1})`)

      // Use the server action to get booking data
      const { booking: fetchedBooking, error: fetchError, details: errorDetails } = await getBookingById(bookingId)

      if (fetchError) {
        setErrorDetails(errorDetails)
        throw new Error(fetchError)
      }

      if (!fetchedBooking) {
        throw new Error("Booking not found")
      }

      console.log("Setting booking data:", fetchedBooking)
      setBooking(fetchedBooking)

      // Extract property from the booking response
      // The property might be in property or property_data depending on the query
      const propertyData = fetchedBooking.property || fetchedBooking.property_data
      setProperty(propertyData)
      setCleaningFee(fetchedBooking.cleaning_fee || 0)
      setRetryCount(0) // Reset retry count on success

      // Set debug info
      setDebugInfo({
        rawBookingId: bookingId,
        bookingIdType: typeof bookingId,
        bookingIdLength: bookingId.length,
        fetchedId: fetchedBooking.id,
        fetchedIdType: typeof fetchedBooking.id,
        fetchedIdLength: fetchedBooking.id.length,
        match: bookingId === fetchedBooking.id,
        propertyData: propertyData,
      })

      // Load ID documents
      loadIdDocuments(bookingId)
    } catch (err) {
      console.error("Error loading booking:", err)
      setError(err instanceof Error ? err.message : "Failed to load booking details")

      // Set debug info for error case
      setDebugInfo({
        rawBookingId: bookingId,
        bookingIdType: typeof bookingId,
        bookingIdLength: bookingId ? bookingId.length : 0,
        error: err instanceof Error ? err.message : String(err),
        errorDetails,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to load ID documents
  const loadIdDocuments = async (id: string) => {
    try {
      const { success, documents } = await getIdDocuments(id)
      if (success && documents.length > 0) {
        setIdDocuments(documents)
      }
    } catch (err) {
      console.error("Error loading ID documents:", err)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/admin/login")
      return
    }

    loadBookingData()
  }, [isAuthenticated, router, bookingId, retryCount])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleConfirmBooking = async () => {
    if (!bookingId) return

    setIsProcessing(true)
    try {
      const result = await updateBookingStatus(bookingId, "confirmed")
      if (result.success) {
        toast({
          title: "Booking confirmed",
          description: "The booking has been confirmed successfully.",
        })
        setBooking({ ...booking, status: "confirmed" })
        setConfirmationMessage("Booking confirmed successfully!")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to confirm booking. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error confirming booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsProcessing(false)
      setIsConfirmDialogOpen(false)
    }
  }

  const handleCancelBooking = async () => {
    if (!bookingId) return

    setIsProcessing(true)
    try {
      const result = await updateBookingStatus(bookingId, "cancelled")
      if (result.success) {
        toast({
          title: "Booking cancelled",
          description: "The booking has been cancelled successfully.",
        })
        setBooking({ ...booking, status: "cancelled" })
        setConfirmationMessage("Booking cancelled successfully!")
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to cancel booking. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsProcessing(false)
      setIsCancelDialogOpen(false)
    }
  }

  const handleUpdateCleaningFee = async () => {
    if (!bookingId) return

    setIsUpdatingCleaningFee(true)
    try {
      const result = await updateBookingCleaningFee(bookingId, cleaningFee)
      if (result.success) {
        toast({
          title: "Cleaning fee updated",
          description: "The cleaning fee has been updated successfully.",
        })

        // Update the local state to reflect the change
        const newTotalPrice = booking.base_price + cleaningFee
        setBooking({
          ...booking,
          cleaning_fee: cleaningFee,
          total_price: newTotalPrice,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update cleaning fee. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error updating cleaning fee:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsUpdatingCleaningFee(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue mb-4" />
        <p className="text-gray-600">Loading booking details...</p>
        <p className="text-sm text-gray-500 mt-2">Booking ID: {formatBookingIdForDisplay(bookingId)}</p>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="container py-12">
        <Button
          variant="ghost"
          className="mb-6 text-gouna-blue hover:text-gouna-blue-dark"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
        </Button>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-red-700">Error Loading Booking</h2>
            </div>
            <p className="text-red-600 mb-4">{error || "Booking not found"}</p>

            {/* Debug information */}
            <div className="bg-white p-4 rounded-md mb-4 border border-red-200">
              <h3 className="font-medium mb-2 flex items-center">
                <Info className="h-4 w-4 mr-1" /> Debug Information
              </h3>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>

              {errorDetails && (
                <div className="mt-2">
                  <h4 className="font-medium text-sm mb-1">Error Details:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/bookings")}>
                Return to Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

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

  // Safely access property data
  const propertyTitle = property?.title || property?.name || "Unknown Property"
  const propertyLocation = property?.location || "Unknown Location"
  const propertyBedrooms = property?.bedrooms || 0
  const propertyBathrooms = property?.bathrooms || 0
  const propertyGuests = property?.guests || 0
  const propertyImages = property?.images || []

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6 text-gouna-blue hover:text-gouna-blue-dark" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gouna-blue-dark">Booking #{formatBookingIdForDisplay(booking.id)}</h1>
          <p className="text-gray-600">Created on {new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
        <Badge className={`${getStatusColor(booking.status)} text-sm px-3 py-1 mt-2 md:mt-0`}>
          {booking.status.replace("_", " ").charAt(0).toUpperCase() + booking.status.replace("_", " ").slice(1)}
        </Badge>
      </div>

      {confirmationMessage && (
        <div className="bg-green-100 text-green-800 p-4 rounded-md mb-8">{confirmationMessage}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Booking Details</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="debug">Debug Info</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gouna-blue-dark">Booking Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Property</h3>
                      <p className="font-semibold">{propertyTitle}</p>
                      <p className="text-sm text-gray-600">{propertyLocation}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Guest</h3>
                      <p className="font-semibold">{booking.name}</p>
                      <p className="text-sm text-gray-600">{booking.email}</p>
                      <p className="text-sm text-gray-600">{booking.phone}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Check-in</h3>
                        <p className="font-semibold">{new Date(booking.check_in).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Check-out</h3>
                        <p className="font-semibold">{new Date(booking.check_out).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Users className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Guests</h3>
                        <p className="font-semibold">{booking.guests}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Pricing</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Base Price</span>
                        <span>${booking.base_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cleaning Fee</span>
                        <span>${booking.cleaning_fee || 0}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${booking.total_price}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gouna-blue-dark">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {booking.payment_proof ? (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-3">Payment Proof</h3>
                      <div className="relative h-80 rounded-md overflow-hidden border">
                        <Image
                          src={booking.payment_proof || "/placeholder.svg"}
                          alt="Payment Proof"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="mt-4 flex justify-end">
                        <a
                          href={booking.payment_proof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Button variant="outline" className="flex items-center">
                            <Download className="h-4 w-4 mr-2" /> Download
                          </Button>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Payment Proof Uploaded</h3>
                      <p className="text-gray-500">The guest has not uploaded payment proof yet.</p>
                    </div>
                  )}

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Add Cleaning Fee</h3>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <Label htmlFor="cleaning-fee">Cleaning Fee ($)</Label>
                        <Input
                          id="cleaning-fee"
                          type="number"
                          value={cleaningFee}
                          onChange={(e) => setCleaningFee(Number(e.target.value))}
                        />
                      </div>
                      <Button
                        className="bg-gouna-blue hover:bg-gouna-blue-dark text-white"
                        onClick={handleUpdateCleaningFee}
                        disabled={isUpdatingCleaningFee}
                      >
                        {isUpdatingCleaningFee ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                          </>
                        ) : (
                          "Update Fee"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gouna-blue-dark">Tenant Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  {idDocuments.length > 0 ? (
                    <div className="space-y-6">
                      {idDocuments.map((url, index) => (
                        <div key={index}>
                          <h3 className="text-sm font-medium text-gray-500 mb-3">Tenant ID #{index + 1}</h3>
                          <div className="relative h-80 rounded-md overflow-hidden border">
                            <Image
                              src={url || "/placeholder.svg"}
                              alt={`Tenant ID ${index + 1}`}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="mt-4 flex justify-end">
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex">
                              <Button variant="outline" className="flex items-center">
                                <Download className="h-4 w-4 mr-2" /> Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No IDs Uploaded</h3>
                      <p className="text-gray-500">The guest has not uploaded any identification documents yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="debug">
              <Card>
                <CardHeader>
                  <CardTitle className="text-gouna-blue-dark">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="font-medium mb-2">Booking ID Details</h3>
                    <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(
                        {
                          encodedBookingId: bookingId,
                          decodedBookingId: bookingId,
                          bookingIdType: typeof bookingId,
                          bookingIdLength: bookingId ? bookingId.length : 0,
                          fetchedId: booking.id,
                          fetchedIdType: typeof booking.id,
                          fetchedIdLength: booking.id ? booking.id.length : 0,
                          match: bookingId === booking.id,
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md mt-4">
                    <h3 className="font-medium mb-2">Property Data</h3>
                    <pre className="text-xs bg-white p-3 rounded border overflow-auto">
                      {JSON.stringify(property, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-gouna-blue-dark">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.status === "awaiting_confirmation" && (
                <>
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setIsConfirmDialogOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Confirm Booking
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => setIsCancelDialogOpen(true)}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Reject Booking
                  </Button>
                </>
              )}

              {booking.status === "confirmed" && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => setIsCancelDialogOpen(true)}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancel Booking
                </Button>
              )}

              {booking.status === "awaiting_payment" && (
                <div className="text-center p-4 bg-yellow-50 rounded-md">
                  <p className="text-yellow-800 mb-2">Waiting for payment proof</p>
                  <p className="text-sm text-yellow-700">The guest has been notified to upload payment proof.</p>
                </div>
              )}

              <Button variant="outline" className="w-full">
                Send Message to Guest
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-gouna-blue-dark">Property Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative h-48 rounded-md overflow-hidden mb-4">
                <Image
                  src={propertyImages?.[0] || "/placeholder.svg?height=600&width=800"}
                  alt={propertyTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold mb-1">{propertyTitle}</h3>
              <p className="text-sm text-gray-600 mb-4">{propertyLocation}</p>
              <div className="grid grid-cols-3 gap-2 text-sm text-gray-600">
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                  <Bed className="h-4 w-4 mb-1" />
                  <span>{propertyBedrooms}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                  <Bath className="h-4 w-4 mb-1" />
                  <span>{propertyBathrooms}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-gray-50 rounded">
                  <Users className="h-4 w-4 mb-1" />
                  <span>{propertyGuests}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Booking Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this booking? This will notify the guest that their booking has been
              confirmed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBooking}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Confirm Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Booking Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>No, keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Yes, cancel booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
