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
  DollarSign,
  BarChart3,
  Percent,
  Clock,
  TrendingUp,
  Users,
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

  // Calculate revenue metrics
  const revenueMetrics = {
    totalRevenue: bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0,
    averageBookingValue: bookings?.length
      ? (bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0) / bookings.length).toFixed(2)
      : 0,
    confirmedRevenue:
      bookings?.filter((b) => b.status === "confirmed").reduce((sum, booking) => sum + (booking.total_price || 0), 0) ||
      0,
    pendingRevenue:
      bookings
        ?.filter((b) => b.status === "awaiting_confirmation" || b.status === "awaiting_payment")
        .reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0,
  }

  // Calculate occupancy metrics
  const occupancyMetrics = {
    // Calculate total nights booked across all confirmed bookings
    totalNightsBooked:
      bookings
        ?.filter((b) => b.status === "confirmed")
        .reduce((sum, booking) => {
          const checkIn = new Date(booking.check_in)
          const checkOut = new Date(booking.check_out)
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
          return sum + nights
        }, 0) || 0,

    // Calculate average stay duration
    averageStayDuration: bookings?.length
      ? (
          bookings.reduce((sum, booking) => {
            const checkIn = new Date(booking.check_in)
            const checkOut = new Date(booking.check_out)
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
            return sum + nights
          }, 0) / bookings.length
        ).toFixed(1)
      : 0,

    // Count upcoming check-ins (next 7 days)
    upcomingCheckIns:
      bookings?.filter((booking) => {
        const checkIn = new Date(booking.check_in)
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)
        return checkIn >= today && checkIn <= nextWeek && booking.status === "confirmed"
      }).length || 0,

    // Count upcoming check-outs (next 7 days)
    upcomingCheckOuts:
      bookings?.filter((booking) => {
        const checkOut = new Date(booking.check_out)
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)
        return checkOut >= today && checkOut <= nextWeek && booking.status === "confirmed"
      }).length || 0,
  }

  // Calculate performance metrics
  const performanceMetrics = {
    // Calculate occupancy rate (simplified)
    occupancyRate:
      properties?.length && occupancyMetrics.totalNightsBooked
        ? Math.min(100, Math.round((occupancyMetrics.totalNightsBooked / (properties.length * 30)) * 100))
        : 0,

    // Count bookings by property to find most popular
    mostPopularProperty: (() => {
      if (!bookings?.length || !properties?.length) return { name: "N/A", count: 0 }

      const bookingsByProperty = bookings.reduce(
        (acc, booking) => {
          acc[booking.property_id] = (acc[booking.property_id] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      let maxCount = 0
      let popularPropertyId = ""

      Object.entries(bookingsByProperty).forEach(([propertyId, count]) => {
        if (count > maxCount) {
          maxCount = count
          popularPropertyId = propertyId
        }
      })

      const popularProperty = properties.find((p) => p.id === popularPropertyId)
      return {
        name: popularProperty?.title || "N/A",
        count: maxCount,
      }
    })(),

    // Calculate conversion rate (confirmed bookings / total bookings)
    conversionRate: bookings?.length
      ? Math.round((bookings.filter((b) => b.status === "confirmed").length / bookings.length) * 100)
      : 0,
  }

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

      {/* Stats Cards - First Row */}
      <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Booking Overview</h2>
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

      {/* Revenue Metrics */}
      <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Revenue Metrics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-3xl font-bold text-green-600 mt-1">
                  ${revenueMetrics.totalRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmed Revenue</p>
                <h3 className="text-3xl font-bold text-green-600 mt-1">
                  ${revenueMetrics.confirmedRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Revenue</p>
                <h3 className="text-3xl font-bold text-amber-500 mt-1">
                  ${revenueMetrics.pendingRevenue.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Booking Value</p>
                <h3 className="text-3xl font-bold text-gouna-blue-dark mt-1">${revenueMetrics.averageBookingValue}</h3>
              </div>
              <div className="p-3 bg-gouna-blue/10 rounded-full">
                <BarChart3 className="h-6 w-6 text-gouna-blue" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Metrics */}
      <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Occupancy & Performance</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
                <h3 className="text-3xl font-bold text-purple-600 mt-1">{performanceMetrics.occupancyRate}%</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Percent className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg. Stay Duration</p>
                <h3 className="text-3xl font-bold text-indigo-600 mt-1">
                  {occupancyMetrics.averageStayDuration} nights
                </h3>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Calendar className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <h3 className="text-3xl font-bold text-teal-600 mt-1">{performanceMetrics.conversionRate}%</h3>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Upcoming Check-ins</p>
                <h3 className="text-3xl font-bold text-orange-500 mt-1">{occupancyMetrics.upcomingCheckIns}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Popular Property */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Most Popular Property</CardTitle>
            <CardDescription>Property with the most bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gouna-blue-dark">
                  {performanceMetrics.mostPopularProperty.name}
                </h3>
                <p className="text-gray-600">{performanceMetrics.mostPopularProperty.count} bookings</p>
              </div>
              <div className="p-3 bg-gouna-blue/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-gouna-blue" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Booking Activity</CardTitle>
            <CardDescription>Upcoming check-ins and check-outs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Upcoming Check-ins</p>
                <p className="text-2xl font-bold text-blue-700">{occupancyMetrics.upcomingCheckIns}</p>
                <p className="text-xs text-blue-500">Next 7 days</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-amber-600">Upcoming Check-outs</p>
                <p className="text-2xl font-bold text-amber-700">{occupancyMetrics.upcomingCheckOuts}</p>
                <p className="text-xs text-amber-500">Next 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Properties</CardTitle>
            <CardDescription>Manage your rental properties</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => router.push("/admin/properties/new")}>
              <Plus className="h-4 w-4 mr-2" /> Add New Property
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/admin/properties")}>
              <ListFilter className="h-4 w-4 mr-2" /> Manage Properties
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/properties")}>
              View Public Listings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Bookings</CardTitle>
            <CardDescription>Manage your property bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => router.push("/admin/bookings")}>
              View All Bookings
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/admin/bookings?status=awaiting_confirmation")}
            >
              View Pending Bookings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Tools</CardTitle>
            <CardDescription>Admin tools and utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full" onClick={() => router.push("/admin/seed")}>
              <Database className="h-4 w-4 mr-2" /> Seed Database
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push("/admin/debug")}>
              <Settings className="h-4 w-4 mr-2" /> Debug Tools
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => router.push("/admin/debug/verify-bookings")}
            >
              <span className="mr-2">🔍</span>
              Verify Booking View
            </Button>
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/properties/edit/${property.id}`)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/properties/calendar/${property.id}`)}
                  >
                    Calendar
                  </Button>
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3"
                      onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>

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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => router.push(`/admin/properties/calendar/${booking.property_id}`)}
                      >
                        <Calendar className="h-4 w-4 mr-1" /> Calendar
                      </Button>
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
