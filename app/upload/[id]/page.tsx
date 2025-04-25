"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/file-upload"
import { uploadPaymentProof, uploadTenantDocument } from "@/lib/blob"
import { updatePaymentProof, addTenantIdDocument, getBookingById } from "@/app/api/bookings/actions"
import { getPropertyById } from "@/app/api/properties/actions"
import { Check, AlertCircle, Loader2 } from "lucide-react"

export default function UploadDocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [paymentProof, setPaymentProof] = useState<File | null>(null)
  const [tenantIds, setTenantIds] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  useEffect(() => {
    async function loadBookingAndProperty() {
      try {
        const { booking, error: bookingError } = await getBookingById(bookingId)

        if (bookingError || !booking) {
          throw new Error("Booking not found")
        }

        setBooking(booking)

        // If payment proof already exists, mark as submitted
        if (booking.payment_proof_url) {
          setIsSubmitted(true)
        }

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

  const handlePaymentProofSelect = (file: File) => {
    setPaymentProof(file)
  }

  const handleTenantIdSelect = (file: File) => {
    setTenantIds((prev) => [...prev, file])
  }

  const handleRemoveTenantId = (index: number) => {
    setTenantIds((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!paymentProof) {
      setError("Please upload payment proof")
      return
    }

    if (tenantIds.length === 0) {
      setError("Please upload at least one tenant ID")
      return
    }

    setIsSubmitting(true)

    try {
      // Upload payment proof
      const paymentProofResult = await uploadPaymentProof(paymentProof)

      if (!paymentProofResult.success || !paymentProofResult.url) {
        throw new Error("Failed to upload payment proof")
      }

      // Update booking with payment proof
      const updateResult = await updatePaymentProof(bookingId, paymentProofResult.url)

      if (!updateResult.success) {
        throw new Error("Failed to update booking with payment proof")
      }

      // Upload tenant IDs
      for (const tenantId of tenantIds) {
        const tenantIdResult = await uploadTenantDocument(tenantId)

        if (!tenantIdResult.success || !tenantIdResult.url) {
          throw new Error("Failed to upload tenant ID")
        }

        // Add tenant ID to booking
        await addTenantIdDocument(bookingId, tenantIdResult.url)
      }

      setIsSubmitted(true)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error submitting documents:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  if (!booking || !property) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gouna-blue-dark mb-2">Booking Not Found</h2>
            <p className="text-gray-600">The booking you're looking for doesn't exist or has expired.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="container py-12 max-w-3xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gouna-blue-dark mb-4">Documents Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Thank you for submitting your payment proof and ID documents. We'll review them shortly and confirm your
              booking.
            </p>
            <div className="bg-gray-50 p-4 rounded-md text-left mb-6">
              <h3 className="font-semibold text-gouna-blue-dark mb-2">Booking Details</h3>
              <p className="text-sm text-gray-600">Property: {property.title}</p>
              <p className="text-sm text-gray-600">Check-in: {new Date(booking.check_in).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Check-out: {new Date(booking.check_out).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600">Total: ${booking.total_price}</p>
            </div>
            <p className="text-sm text-gray-500">
              If you have any questions, please contact us at support@elgounarentals.com
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gouna-blue-dark mb-2">Upload Documents</h1>
      <p className="text-gray-600 mb-8">Please upload your payment proof and ID documents to complete your booking.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Booking Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Property</h3>
                <p className="font-semibold">{property.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-in</h3>
                  <p>{new Date(booking.check_in).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Check-out</h3>
                  <p>{new Date(booking.check_out).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                <p className="font-semibold">${booking.total_price}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Payment Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Please send the total amount via Instapay to:</p>
            <div className="bg-gray-50 p-3 rounded-md text-center mb-4">
              <p className="font-semibold">+20 123 456 7890</p>
              <p className="text-xs text-gray-500">Monzer El Gouna</p>
            </div>
            <p className="text-xs text-gray-500">
              After sending the payment, take a screenshot of the confirmation and upload it below.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gouna-blue-dark">Upload Documents</CardTitle>
          <CardDescription>Please upload your payment proof and ID documents for all adult guests.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="payment-proof" className="text-base font-semibold block mb-2">
                Payment Proof
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Upload a screenshot or photo of your Instapay payment confirmation.
              </p>

              <FileUpload
                onFileSelect={handlePaymentProofSelect}
                selectedFile={paymentProof}
                accept="image/*,.pdf"
                label="Upload payment proof"
                variant="image"
              />
            </div>

            <div>
              <Label htmlFor="tenant-ids" className="text-base font-semibold block mb-2">
                Tenant ID Documents
              </Label>
              <p className="text-sm text-gray-600 mb-4">
                Upload ID documents (passport or national ID) for all adult guests. These are required for El Gouna
                entry permits.
              </p>

              {tenantIds.length > 0 && (
                <div className="mb-4 space-y-4">
                  {tenantIds.map((file, index) => (
                    <div key={index} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium truncate">ID Document {index + 1}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTenantId(index)}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                        >
                          <AlertCircle className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600">{file.name}</div>
                    </div>
                  ))}
                </div>
              )}

              <FileUpload
                onFileSelect={handleTenantIdSelect}
                selectedFile={null}
                onFileRemove={() => {}}
                accept="image/*,.pdf"
                label="Upload ID document"
                variant="image"
              />
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full bg-gouna-sand hover:bg-gouna-sand-dark text-white"
                disabled={isSubmitting || !paymentProof || tenantIds.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Documents"
                )}
              </Button>
              <p className="text-xs text-gray-500 text-center mt-4">
                By submitting these documents, you agree to our terms and conditions regarding data privacy and
                security.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
