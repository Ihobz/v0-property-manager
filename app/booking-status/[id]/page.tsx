"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"
import { FileUpload } from "@/components/file-upload"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Bed,
  Bath,
  CheckCircle,
  XCircle,
  HelpCircle,
  Download,
  Upload,
  AlertTriangle,
  Bug,
  FileText,
  File,
} from "lucide-react"
import { getBookingById } from "@/app/api/bookings/actions"

// Helper function to extract ID documents from booking object
function getIdDocuments(booking: any): string[] {
  // First check metadata field which is our fallback solution
  if (booking.metadata && booking.metadata.id_documents) {
    if (Array.isArray(booking.metadata.id_documents)) {
      return booking.metadata.id_documents
    }
    if (typeof booking.metadata.id_documents === "string") {
      return [booking.metadata.id_documents]
    }
  }

  // Then check all possible column names for ID documents
  const possibleColumns = ["tenant_id", "id_documents", "id_document", "documents", "identity_documents"]

  for (const column of possibleColumns) {
    if (booking[column]) {
      // Convert to array if it's a string
      if (typeof booking[column] === "string") {
        return [booking[column]]
      }
      // Return as is if it's already an array
      if (Array.isArray(booking[column])) {
        return booking[column]
      }
    }
  }

  // Return empty array if no documents found
  return []
}

// Helper function to determine file type icon
function getFileIcon(url: string) {
  if (url.endsWith(".pdf")) {
    return <FileText className="h-5 w-5 text-red-500" />
  }
  return <File className="h-5 w-5 text-blue-500" />
}

// Helper function to get file name from URL
function getFileName(url: string) {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split("/")
    return pathParts[pathParts.length - 1] || "Document"
  } catch (e) {
    return "Document"
  }
}

export default function BookingStatusPage({ params }: { params: { id: string } }) {
  const bookingId = params.id
  const [booking, setBooking] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("details")
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [idDocuments, setIdDocuments] = useState<string[]>([])
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null)

  // Function to refresh booking data
  const refreshBookingData = async () => {
    try {
      setLoading(true)
      console.log("Fetching booking data for ID:", bookingId)
      const result = await getBookingById(bookingId)

      // Store debug info
      setDebugInfo(result)

      if (result.error || !result.booking) {
        setError(result.error || "Could not fetch booking details")
        setBooking(null)
      } else {
        setBooking(result.booking)

        // Extract ID documents using the helper function
        const documents = getIdDocuments(result.booking)
        setIdDocuments(documents)

        // Set the first document as selected if available
        if (documents.length > 0 && !selectedDocument) {
          setSelectedDocument(documents[0])
        }

        setError(null)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error("Error fetching booking:", err)
      setDebugInfo({ error: err instanceof Error ? err.message : String(err) })
    } finally {
      setLoading(false)
    }
  }

  // Load booking data on initial render and when refreshKey changes
  useEffect(() => {
    refreshBookingData()
  }, [bookingId, refreshKey])

  // Handle successful upload
  const handleUploadSuccess = () => {
    // Refresh the booking data to show the updated files
    setRefreshKey((prev) => prev + 1)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gouna-blue mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !booking) {
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

            {/* Debug information (hidden in production) */}
            {debugInfo && process.env.NODE_ENV !== "production" && (
              <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                <details>
                  <summary className="cursor-pointer font-medium">Debug Info</summary>
                  <pre className="mt-2 overflow-auto max-h-40">{JSON.stringify(debugInfo, null, 2)}</pre>
                </details>
              </div>
            )}
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

  // Get property data safely
  const property = booking.property || {}
  const propertyTitle = property.title || "Property"
  const propertyLocation = property.location || "El Gouna"
  const propertyImages = property.images || []
  const propertyBedrooms = property.bedrooms || 0
  const propertyBathrooms = property.bathrooms || 0
  const propertyGuests = property.guests || 0

  // Format dates
  const formatFullDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch (e) {
      return "Invalid Date"
    }
  }

  const checkInDate = formatFullDate(booking.check_in)
  const checkOutDate = formatFullDate(booking.check_out)

  // Check for payment proof in various possible column names
  const hasPaymentProof = booking.payment_proof || booking.payment_proof_url || booking.payment_url

  // Function to switch to the documents tab
  const switchToDocumentsTab = () => {
    setActiveTab("documents")
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gouna-blue-dark">Booking Status</h1>
            <p className="text-gray-600">Booking #{formatBookingIdForDisplay(bookingId)}</p>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Booking Details</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="property">Property</TabsTrigger>
                {process.env.NODE_ENV !== "production" && <TabsTrigger value="debug">Debug</TabsTrigger>}
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle>Booking Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Guest</h3>
                        <p className="font-semibold">{booking.name}</p>
                        <p className="text-sm text-gray-600">{booking.email}</p>
                        <p className="text-sm text-gray-600">{booking.phone}</p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Property</h3>
                        <p className="font-semibold">{propertyTitle}</p>
                        <p className="text-sm text-gray-600">{propertyLocation}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Check-in</h3>
                          <p className="font-semibold">{checkInDate}</p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 text-gouna-blue mr-2 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Check-out</h3>
                          <p className="font-semibold">{checkOutDate}</p>
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

              <TabsContent value="documents">
                <Card>
                  <CardHeader>
                    <CardTitle>Required Documents</CardTitle>
                    <CardDescription>Please upload the required documents to complete your booking</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Payment Proof</h3>
                      {hasPaymentProof ? (
                        <div>
                          <div className="relative h-60 rounded-md overflow-hidden border">
                            <Image
                              src={hasPaymentProof || "/placeholder.svg"}
                              alt="Payment Proof"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="mt-4 flex justify-end">
                            <a href={hasPaymentProof} target="_blank" rel="noopener noreferrer" className="inline-flex">
                              <Button variant="outline" className="flex items-center">
                                <Download className="h-4 w-4 mr-2" /> Download
                              </Button>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-amber-800">Payment Proof Required</h3>
                              <div className="mt-2 text-sm text-amber-700">
                                <p>Please upload a screenshot or photo of your payment confirmation.</p>
                                <div className="mt-4">
                                  <FileUpload
                                    bookingId={bookingId}
                                    uploadType="payment"
                                    maxSizeMB={5}
                                    allowedTypes={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                                    onUploadSuccess={handleUploadSuccess}
                                    multiple={false}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator className="my-6" />

                      <h3 className="text-lg font-medium">ID Documents for Entry Permits</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Please upload a clear photo or scan of the passport or ID for each guest. These are required for
                        entry permits to El Gouna.
                      </p>

                      {idDocuments.length > 0 ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {idDocuments.map((docUrl, index) => (
                              <div
                                key={index}
                                className={`border rounded-md p-3 cursor-pointer ${selectedDocument === docUrl ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
                                onClick={() => setSelectedDocument(docUrl)}
                              >
                                <div className="flex items-center">
                                  {getFileIcon(docUrl)}
                                  <span className="ml-2 text-sm font-medium truncate">ID Document #{index + 1}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 truncate">{getFileName(docUrl)}</p>
                              </div>
                            ))}
                          </div>

                          {selectedDocument && (
                            <div>
                              <div className="relative h-60 rounded-md overflow-hidden border">
                                <Image
                                  src={selectedDocument || "/placeholder.svg"}
                                  alt="ID Document"
                                  fill
                                  className="object-contain"
                                />
                              </div>
                              <div className="mt-4 flex justify-end">
                                <a
                                  href={selectedDocument}
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
                          )}

                          {/* Option to upload additional IDs */}
                          <div className="mt-6">
                            <h4 className="text-sm font-medium mb-2">Upload Additional ID Documents</h4>
                            <FileUpload
                              bookingId={bookingId}
                              uploadType="id"
                              maxSizeMB={5}
                              allowedTypes={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                              onUploadSuccess={handleUploadSuccess}
                              multiple={true}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <Upload className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-blue-800">ID Documents Required</h3>
                              <div className="mt-2 text-sm text-blue-700">
                                <p>Please upload ID documents for all guests to process entry permits.</p>
                                <div className="mt-4">
                                  <FileUpload
                                    bookingId={bookingId}
                                    uploadType="id"
                                    maxSizeMB={5}
                                    allowedTypes={["image/jpeg", "image/png", "image/jpg", "application/pdf"]}
                                    onUploadSuccess={handleUploadSuccess}
                                    multiple={true}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="property">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-64 rounded-md overflow-hidden mb-4">
                      <Image
                        src={propertyImages[0] || "/placeholder.svg?height=600&width=800&query=property"}
                        alt={propertyTitle}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{propertyTitle}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{propertyLocation}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                        <Bed className="h-5 w-5 text-gouna-blue mb-1" />
                        <span className="text-sm font-medium">{propertyBedrooms} Bedrooms</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                        <Bath className="h-5 w-5 text-gouna-blue mb-1" />
                        <span className="text-sm font-medium">{propertyBathrooms} Bathrooms</span>
                      </div>
                      <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                        <Users className="h-5 w-5 text-gouna-blue mb-1" />
                        <span className="text-sm font-medium">Up to {propertyGuests} Guests</span>
                      </div>
                    </div>

                    {property.amenities && property.amenities.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium mb-2">Amenities</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {property.amenities.map((amenity: string, index: number) => (
                            <div key={index} className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              <span className="text-sm">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {process.env.NODE_ENV !== "production" && (
                <TabsContent value="debug">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Bug className="h-5 w-5 mr-2" /> Debug Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Booking Object</h3>
                          <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-96">
                            {JSON.stringify(booking, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">ID Documents</h3>
                          <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-96">
                            {JSON.stringify(idDocuments, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">API Response</h3>
                          <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto max-h-96">
                            {JSON.stringify(debugInfo, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Booking Status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusCard
                  status={booking.status}
                  bookingId={bookingId}
                  hasPaymentProof={!!hasPaymentProof}
                  onSwitchTab={switchToDocumentsTab}
                />

                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    If you have any questions or need assistance with your booking, please contact us.
                  </p>
                  <Button variant="outline" className="w-full">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Important Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium">Check-in Time</h3>
                  <p className="text-gray-600">From 3:00 PM</p>
                </div>
                <div>
                  <h3 className="font-medium">Check-out Time</h3>
                  <p className="text-gray-600">By 11:00 AM</p>
                </div>
                <div>
                  <h3 className="font-medium">Entry Permits</h3>
                  <p className="text-gray-600">
                    All guests must have valid ID documents uploaded for entry permits to El Gouna.
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Cancellation Policy</h3>
                  <p className="text-gray-600">
                    Free cancellation up to 7 days before check-in. After that, the booking is non-refundable.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-green-500">Confirmed</Badge>
    case "awaiting_confirmation":
      return <Badge className="bg-blue-500">Awaiting Confirmation</Badge>
    case "awaiting_payment":
      return <Badge className="bg-yellow-500">Awaiting Payment</Badge>
    case "cancelled":
      return <Badge className="bg-red-500">Cancelled</Badge>
    default:
      return <Badge className="bg-gray-500">{status || "Unknown"}</Badge>
  }
}

function StatusCard({
  status,
  bookingId,
  hasPaymentProof,
  onSwitchTab,
}: {
  status: string
  bookingId: string
  hasPaymentProof: boolean
  onSwitchTab: () => void
}) {
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
    case "awaiting_payment":
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
                  We're waiting for your payment confirmation. Please upload your payment proof in the Documents tab.
                </p>
                {!hasPaymentProof && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-600 border-amber-600 hover:bg-amber-50"
                      onClick={onSwitchTab}
                    >
                      Go to Documents
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    case "awaiting_confirmation":
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Awaiting Confirmation</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Your payment proof has been received and is being verified. We'll confirm your booking shortly.</p>
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
              <h3 className="text-sm font-medium text-gray-800">Status: {status || "Unknown"}</h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>Please contact our support team for more information about your booking status.</p>
              </div>
            </div>
          </div>
        </div>
      )
  }
}
