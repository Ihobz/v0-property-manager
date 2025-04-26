"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-provider"
import { useBookings } from "@/hooks/use-bookings"
import { useProperties } from "@/hooks/use-properties"
import { Loader2, Plus, Pencil, Trash2, Calendar, Home, CalendarDays, Users } from "lucide-react"
import { format } from "date-fns"

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { bookings, isLoading: isLoadingBookings } = useBookings()
  const { properties, isLoading: isLoadingProperties } = useProperties()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (isAdmin === false) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  if (!isClient || isAdmin === false) {
    return null
  }

  // Calculate occupancy metrics
  const calculateOccupancy = () => {
    if (!bookings || !properties || bookings.length === 0 || properties.length === 0) {
      return { rate: 0, bookedNights: 0, totalNights: 0 }
    }

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)

    // Count confirmed bookings in the last 30 days
    const recentBookings = bookings.filter(
      (booking) => booking.status === "confirmed" && new Date(booking.created_at) >= thirtyDaysAgo,
    )

    const bookedNights = recentBookings.reduce((total, booking) => {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      return total + nights
    }, 0)

    // Total available nights in the last 30 days
    const totalNights = properties.length * 30

    // Calculate occupancy rate
    const rate = totalNights > 0 ? Math.round((bookedNights / totalNights) * 100) : 0

    return { rate, bookedNights, totalNights }
  }

  const occupancy = calculateOccupancy()

  const handleEditProperty = (id: string) => {
    router.push(`/admin/properties/edit/${id}`)
  }

  const handleDeleteProperty = (id: string) => {
    router.push(`/admin/properties/delete/${id}`)
  }

  const handleViewCalendar = (id: string) => {
    router.push(`/admin/properties/calendar/${id}`)
  }

  const handleViewBooking = (id: string) => {
    router.push(`/admin/bookings/${id}`)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Properties</CardTitle>
            <CardDescription>Total properties listed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Home className="h-8 w-8 text-gouna-blue mr-4" />
              <span className="text-3xl font-bold">{properties?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Bookings</CardTitle>
            <CardDescription>Total bookings received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CalendarDays className="h-8 w-8 text-gouna-blue mr-4" />
              <span className="text-3xl font-bold">{bookings?.length || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Occupancy Rate</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-gouna-blue mr-4" />
              <span className="text-3xl font-bold">{occupancy.rate}%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {occupancy.bookedNights} of {occupancy.totalNights} available nights booked
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Manage your property bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBookings ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
                </div>
              ) : bookings && bookings.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.slice(0, 5).map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.name}</TableCell>
                        <TableCell>{booking.property_title || booking.property_id}</TableCell>
                        <TableCell>
                          {format(new Date(booking.check_in), "MMM d")} -{" "}
                          {format(new Date(booking.check_out), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "awaiting_confirmation"
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.status === "awaiting_payment"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : booking.status === "cancelled"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewBooking(booking.id)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found</p>
                </div>
              )}

              {bookings && bookings.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => router.push("/admin/bookings")}>
                    View All Bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Properties</CardTitle>
                <CardDescription>Manage your rental properties</CardDescription>
              </div>
              <Button
                onClick={() => router.push("/admin/properties/new")}
                className="bg-gouna-blue hover:bg-gouna-blue-dark"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Property
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingProperties ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
                </div>
              ) : properties && properties.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Price/Night</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {properties.slice(0, 5).map((property) => (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.title || property.short_description}</TableCell>
                        <TableCell>{property.location}</TableCell>
                        <TableCell className="text-right">${property.price}</TableCell>
                        <TableCell>
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditProperty(property.id)}
                              title="Edit Property"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteProperty(property.id)}
                              title="Delete Property"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewCalendar(property.id)}
                              title="View Calendar"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No properties found</p>
                  <Button
                    onClick={() => router.push("/admin/properties/new")}
                    className="mt-4 bg-gouna-blue hover:bg-gouna-blue-dark"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add Property
                  </Button>
                </div>
              )}

              {properties && properties.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" onClick={() => router.push("/admin/properties")}>
                    View All Properties
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
