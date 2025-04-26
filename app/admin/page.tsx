"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBookings } from "@/hooks/use-bookings"
import { useProperties } from "@/hooks/use-properties"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Building, Calendar, DollarSign, Percent } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

export default function AdminDashboard() {
  const { bookings, isLoading: isLoadingBookings, error: bookingsError } = useBookings()
  const { properties, isLoading: isLoadingProperties, error: propertiesError } = useProperties()
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalProperties: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    avgBookingValue: 0,
    statusCounts: {
      confirmed: 0,
      awaiting_payment: 0,
      awaiting_confirmation: 0,
      cancelled: 0,
      completed: 0,
    },
    propertyStats: {
      avgBedrooms: 0,
      avgBathrooms: 0,
      avgPrice: 0,
    },
  })

  useEffect(() => {
    if (bookings && properties) {
      // Calculate booking stats
      const totalBookings = bookings.length
      const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)
      const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0

      // Calculate status counts
      const statusCounts = {
        confirmed: 0,
        awaiting_payment: 0,
        awaiting_confirmation: 0,
        cancelled: 0,
        completed: 0,
      }

      bookings.forEach((booking) => {
        if (booking.status && statusCounts.hasOwnProperty(booking.status)) {
          statusCounts[booking.status as keyof typeof statusCounts]++
        }
      })

      // Calculate property stats
      const totalProperties = properties.length
      const avgBedrooms =
        properties.reduce((sum, property) => sum + (property.bedrooms || 0), 0) / (totalProperties || 1)
      const avgBathrooms =
        properties.reduce((sum, property) => sum + (property.bathrooms || 0), 0) / (totalProperties || 1)
      const avgPrice = properties.reduce((sum, property) => sum + (property.price || 0), 0) / (totalProperties || 1)

      // Calculate occupancy rate (simplified)
      const confirmedBookings = bookings.filter(
        (booking) => booking.status === "confirmed" || booking.status === "completed",
      ).length
      const occupancyRate = totalProperties > 0 ? (confirmedBookings / totalProperties) * 100 : 0

      setStats({
        totalBookings,
        totalProperties,
        totalRevenue,
        occupancyRate,
        avgBookingValue,
        statusCounts,
        propertyStats: {
          avgBedrooms,
          avgBathrooms,
          avgPrice,
        },
      })
    }
  }, [bookings, properties])

  const isLoading = isLoadingBookings || isLoadingProperties
  const error = bookingsError || propertiesError

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.statusCounts.confirmed} confirmed, {stats.statusCounts.awaiting_payment} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Avg. ${stats.avgBookingValue.toFixed(2)} per booking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">Avg. ${stats.propertyStats.avgPrice.toFixed(2)} per night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate.toFixed(1)}%</div>
            <Progress value={stats.occupancyRate} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Status Distribution</CardTitle>
                <CardDescription>Current status of all bookings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <span>Confirmed</span>
                    </div>
                    <span className="text-sm">{stats.statusCounts.confirmed}</span>
                  </div>
                  <Progress
                    value={(stats.statusCounts.confirmed / stats.totalBookings) * 100}
                    className="h-2 bg-slate-200"
                    indicatorColor="bg-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                      <span>Awaiting Payment</span>
                    </div>
                    <span className="text-sm">{stats.statusCounts.awaiting_payment}</span>
                  </div>
                  <Progress
                    value={(stats.statusCounts.awaiting_payment / stats.totalBookings) * 100}
                    className="h-2 bg-slate-200"
                    indicatorColor="bg-yellow-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <span>Awaiting Confirmation</span>
                    </div>
                    <span className="text-sm">{stats.statusCounts.awaiting_confirmation}</span>
                  </div>
                  <Progress
                    value={(stats.statusCounts.awaiting_confirmation / stats.totalBookings) * 100}
                    className="h-2 bg-slate-200"
                    indicatorColor="bg-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <span>Cancelled</span>
                    </div>
                    <span className="text-sm">{stats.statusCounts.cancelled}</span>
                  </div>
                  <Progress
                    value={(stats.statusCounts.cancelled / stats.totalBookings) * 100}
                    className="h-2 bg-slate-200"
                    indicatorColor="bg-red-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <span>Completed</span>
                    </div>
                    <span className="text-sm">{stats.statusCounts.completed}</span>
                  </div>
                  <Progress
                    value={(stats.statusCounts.completed / stats.totalBookings) * 100}
                    className="h-2 bg-slate-200"
                    indicatorColor="bg-purple-500"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Property Statistics</CardTitle>
                <CardDescription>Average metrics across all properties</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Average Bedrooms</span>
                    <span className="font-medium">{stats.propertyStats.avgBedrooms.toFixed(1)}</span>
                  </div>
                  <Progress value={(stats.propertyStats.avgBedrooms / 5) * 100} className="h-2 bg-slate-200" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Average Bathrooms</span>
                    <span className="font-medium">{stats.propertyStats.avgBathrooms.toFixed(1)}</span>
                  </div>
                  <Progress value={(stats.propertyStats.avgBathrooms / 3) * 100} className="h-2 bg-slate-200" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Average Price</span>
                    <span className="font-medium">${stats.propertyStats.avgPrice.toFixed(2)}/night</span>
                  </div>
                  <Progress value={(stats.propertyStats.avgPrice / 300) * 100} className="h-2 bg-slate-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{booking.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.properties?.title || booking.properties?.name || "Unknown Property"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "awaiting_payment"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "awaiting_confirmation"
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {booking.status?.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${booking.total_price}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.check_in).toLocaleDateString()} -{" "}
                        {new Date(booking.check_out).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                ))}

                {bookings.length === 0 && <p>No bookings found.</p>}

                {bookings.length > 5 && (
                  <div className="text-center mt-4">
                    <Link href="/admin/bookings" className="text-sm text-blue-600 hover:underline">
                      View all {bookings.length} bookings
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Listing</CardTitle>
              <CardDescription>All available properties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.slice(0, 5).map((property) => (
                  <div key={property.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="font-medium">{property.title || property.name}</p>
                      <p className="text-sm text-muted-foreground">{property.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">
                          {property.bedrooms} bed{property.bedrooms !== 1 ? "s" : ""} • {property.bathrooms} bath
                          {property.bathrooms !== 1 ? "s" : ""} • {property.guests} guest
                          {property.guests !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${property.price}/night</p>
                      <Link
                        href={`/admin/properties/edit/${property.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block mr-2"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}

                {properties.length === 0 && <p>No properties found.</p>}

                {properties.length > 5 && (
                  <div className="text-center mt-4">
                    <Link href="/admin/properties" className="text-sm text-blue-600 hover:underline">
                      View all {properties.length} properties
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
