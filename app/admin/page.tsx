"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { useProperties } from "@/hooks/use-properties"
import { useBookings } from "@/hooks/use-bookings"
import {
  Loader2,
  Plus,
  Home,
  CalendarDays,
  Settings,
  Database,
  ListFilter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react"
import { updateBookingStatus } from "@/app/api/bookings/actions"
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

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { properties, isLoading: propertiesLoading } = useProperties()
  const { bookings, isLoading: bookingsLoading } = useBookings()
  const [isLoading, setIsLoading] = useState(true)

  // State for confirmation dialogs
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    // Check if user is authenticated and admin
    if (!isLoading && !isAdmin) {
      router.push("/admin/login")
    } else {
      setIsLoading(false)
    }
  }, [user, isAdmin, router, isLoading])

  if (isLoading || propertiesLoading || bookingsLoading) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  // Count bookings by status
  const bookingCounts = {
    total: bookings?.length || 0,
    awaiting_confirmation: bookings?.filter((b) => b.status === "awaiting_confirmation").length || 0,
    awaiting_payment: bookings?.filter((b) => b.status === "awaiting_payment").length || 0,
    confirmed: bookings?.filter((b) => b.status === "confirmed").length || 0,
    cancelled: bookings?.filter((b) => b.status === "cancelled").length || 0,
  }

  // Handle view booking click
  const handleViewBooking = (bookingId: string) => {
    window.location.href = `/admin/bookings/${bookingId}`
  }

  // Handle view property calendar click
  const handleViewPropertyCalendar = (propertyId: string) => {
    window.location.href = `/admin/properties/calendar/${propertyId}`
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
        window.location.reload() // Reload to update the UI
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to confirm booking. Please try again.",
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
        window.location.reload() // Reload to update the UI
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to cancel booking. Please try again.",
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gouna-blue-dark">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-4">
          <Button asChild className="bg-gouna-blue hover:bg-gouna-blue-dark text-white">
            <a href="/admin/properties/new">
              <Plus className="h-4 w-4 mr-2" /> Add Property
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Properties</p>
                <h3 className="text-3xl font-bold text-gouna-blue-dark mt-1">{properties?.length || 0}</h3>
              </div>
              <div className="p-3 bg-gouna-blue/10 rounded-full">
                <Home className="h-6 w-6 text-gouna-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <h3 className="text-3xl font-bold text-gouna-blue-dark mt-1">{bookingCounts.total}</h3>
              </div>
              <div className="p-3 bg-gouna-blue/10 rounded-full">
                <CalendarDays className="h-6 w-6 text-gouna-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Awaiting Confirmation</p>
                <h3 className="text-3xl font-bold text-blue-500 mt-1">{bookingCounts.awaiting_confirmation}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Awaiting Payment</p>
                <h3 className="text-3xl font-bold text-yellow-500 mt-1">{bookingCounts.awaiting_payment}</h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Properties</CardTitle>
            <CardDescription>Manage your rental properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/admin/properties/new" className="block w-full">
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add New Property
              </Button>
            </a>
            <a href="/admin/properties" className="block w-full">
              <Button variant="outline" className="w-full">
                <ListFilter className="h-4 w-4 mr-2" /> Manage Properties
              </Button>
            </a>
            <a href="/properties" className="block w-full">
              <Button variant="outline" className="w-full">
                View Public Listings
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Bookings</CardTitle>
            <CardDescription>Manage your property bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/admin/bookings" className="block w-full">
              <Button className="w-full">View All Bookings</Button>
            </a>
            <a href="/admin/bookings?status=awaiting_confirmation" className="block w-full">
              <Button variant="outline" className="w-full">
                View Pending Bookings
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Tools</CardTitle>
            <CardDescription>Admin tools and utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <a href="/admin/seed" className="block w-full">
              <Button className="w-full">
                <Database className="h-4 w-4 mr-2" /> Seed Database
              </Button>
            </a>
            <a href="/admin/debug" className="block w-full">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" /> Debug Tools
              </Button>
            </a>
            <a href="/admin/debug/verify-bookings" className="block w-full">
              <Button variant="outline" className="w-full justify-start">
                <span className="mr-2">🔍</span>
                Verify Booking View
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Recent Properties */}
      <h2 className="text-2xl font-bold text-gouna-blue-dark mb-4">Recent Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {properties?.slice(0, 3).map((property) => (
          <Card key={property.id}>
            <div className="relative h-48 w-full">
              <img
                src={property.images?.[0] || "/placeholder.svg?height=400&width=600"}
                alt={property.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">{property.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{property.location}</p>
              <div className="flex justify-between">
                <span className="font-medium">${property.price}/night</span>
                <div className="flex gap-2">
                  <a href={`/admin/properties/edit/${property.id}`} className="inline-block">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </a>
                  <a href={`/admin/properties/calendar/${property.id}`} className="inline-block">
                    <Button variant="outline" size="sm">
                      Calendar
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Bookings */}
      <h2 className="text-2xl font-bold text-gouna-blue-dark mb-4">Recent Bookings</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Property</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Guest</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Dates</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings?.slice(0, 5).map((booking) => (
              <tr key={booking.id} className="border-b">
                <td className="px-4 py-3 text-sm">{booking.id.substring(0, 8)}</td>
                <td className="px-4 py-3 text-sm">
                  <div>{booking.properties?.title || "Unknown Property"}</div>
                  <div className="text-xs text-gray-500">{booking.properties?.location}</div>
                </td>
                <td className="px-4 py-3 text-sm">{booking.name}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-wrap gap-2">
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
