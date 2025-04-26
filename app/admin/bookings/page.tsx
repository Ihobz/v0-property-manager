"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { getBookings, updateBookingStatus, verifyBookingId } from "@/app/api/bookings/actions"
import { Loader2, Search, ArrowLeft, CheckCircle, XCircle, Eye, Calendar, AlertTriangle } from "lucide-react"
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
import { toast } from "@/components/ui/use-toast"
import { formatBookingIdForDisplay } from "@/lib/booking-utils"

export default function BookingsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status") || "all"

  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusValue, setStatusValue] = useState(statusFilter)

  // State for confirmation dialogs
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // State for booking verification
  const [isVerifyingBooking, setIsVerifyingBooking] = useState(false)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  // Fetch bookings directly in the component
  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true)
        const { bookings: fetchedBookings, error: fetchError } = await getBookings()

        if (fetchError) {
          throw new Error(fetchError)
        }

        setBookings(fetchedBookings || [])
        console.log("Fetched bookings:", fetchedBookings)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  useEffect(() => {
    if (bookings) {
      let filtered = [...bookings]

      // Apply status filter
      if (statusValue !== "all") {
        filtered = filtered.filter((booking) => booking.status === statusValue)
      }

      // Apply search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (booking) =>
            booking.name?.toLowerCase().includes(term) ||
            booking.email?.toLowerCase().includes(term) ||
            booking.properties?.title?.toLowerCase().includes(term) ||
            booking.id?.toLowerCase().includes(term),
        )
      }

      setFilteredBookings(filtered)
    }
  }, [bookings, statusValue, searchTerm])

  const handleStatusChange = (value: string) => {
    setStatusValue(value)
    router.push(`/admin/bookings${value !== "all" ? `?status=${value}` : ""}`)
  }

  const handleConfirmBooking = async () => {
    if (!selectedBookingId) return

    setIsProcessing(true)
    try {
      const result = await updateBookingStatus(selectedBookingId, "confirmed")
      if (result.success) {
        toast({
          title: "Booking confirmed",
          description: "The booking has been confirmed successfully.",
        })

        // Update the local state to reflect the change
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === selectedBookingId ? { ...booking, status: "confirmed" } : booking,
          ),
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to confirm booking. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsProcessing(false)
      setIsConfirmDialogOpen(false)
      setSelectedBookingId(null)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return

    setIsProcessing(true)
    try {
      const result = await updateBookingStatus(selectedBookingId, "cancelled")
      if (result.success) {
        toast({
          title: "Booking cancelled",
          description: "The booking has been cancelled successfully.",
        })

        // Update the local state to reflect the change
        setBookings((prevBookings) =>
          prevBookings.map((booking) =>
            booking.id === selectedBookingId ? { ...booking, status: "cancelled" } : booking,
          ),
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to cancel booking. Please try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      })
    } finally {
      setIsProcessing(false)
      setIsCancelDialogOpen(false)
      setSelectedBookingId(null)
    }
  }

  const handleViewBooking = async (bookingId: string) => {
    try {
      setIsVerifyingBooking(true)
      setVerificationError(null)

      // First verify the booking ID exists
      console.log("Verifying booking ID:", bookingId)
      const { exists, error } = await verifyBookingId(bookingId)

      if (error) {
        console.error("Error verifying booking ID:", error)
        setVerificationError(error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Could not verify booking ID: ${error}`,
        })
        return
      }

      if (!exists) {
        console.error("Booking ID does not exist:", bookingId)
        setVerificationError("Booking ID does not exist")
        toast({
          variant: "destructive",
          title: "Error",
          description: "This booking ID does not exist in the database.",
        })
        return
      }

      // If verification passes, navigate to the booking details page using direct URL
      window.location.href = `/admin/bookings/${bookingId}`
    } catch (error) {
      console.error("Error in handleViewBooking:", error)
      setVerificationError("An unexpected error occurred")
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred while trying to view the booking.",
      })
    } finally {
      setIsVerifyingBooking(false)
    }
  }

  const handleViewPropertyCalendar = (propertyId: string) => {
    window.location.href = `/admin/properties/calendar/${propertyId}`
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Bookings</h2>
            <p className="text-red-600">{error}</p>
            <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.reload()}>
              Try Again
            </Button>
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

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gouna-blue-dark mb-4 md:mb-0">Bookings</h1>

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>

          <Select value={statusValue} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="awaiting_confirmation">Awaiting Confirmation</SelectItem>
              <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredBookings.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Guest</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Dates</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Total</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b">
                      <td className="px-4 py-3 text-sm">{formatBookingIdForDisplay(booking.id)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>{booking.properties?.title || "Unknown Property"}</div>
                        <div className="text-xs text-gray-500">{booking.properties?.location}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{booking.name}</div>
                        <div className="text-xs text-gray-500">{booking.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{new Date(booking.check_in).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(booking.check_out).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">${booking.total_price}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                          {booking.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-2">
                          {/* Use a direct HTML anchor tag for navigation */}
                          <a href={`/admin/bookings/${booking.id}`} className="inline-block">
                            <Button variant="outline" size="sm" className="h-8 px-3" type="button">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </a>

                          {booking.status === "awaiting_confirmation" && booking.payment_proof && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => {
                                setSelectedBookingId(booking.id)
                                setIsConfirmDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Confirm
                            </Button>
                          )}

                          {(booking.status === "awaiting_confirmation" ||
                            booking.status === "awaiting_payment" ||
                            booking.status === "confirmed") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedBookingId(booking.id)
                                setIsCancelDialogOpen(true)
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          )}

                          {booking.property_id && (
                            <a href={`/admin/properties/calendar/${booking.property_id}`} className="inline-block">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                                type="button"
                              >
                                <Calendar className="h-4 w-4 mr-1" /> Calendar
                              </Button>
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No bookings found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or search criteria</p>
        </div>
      )}

      {verificationError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            <h3 className="font-medium text-red-700">Error Verifying Booking</h3>
          </div>
          <p className="mt-1 text-sm text-red-600">{verificationError}</p>
        </div>
      )}

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
