"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/lib/auth-provider"
import { useBookings } from "@/hooks/use-bookings"
import { useProperties } from "@/hooks/use-properties"
import {
  Loader2,
  Plus,
  Pencil,
  Calendar,
  Home,
  Users,
  Clock,
  Eye,
  AlertTriangle,
  RefreshCw,
  Bug,
  DollarSign,
  ArrowRight,
} from "lucide-react"
import { format } from "date-fns"

export default function AdminDashboard() {
  const { isAdmin, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { bookings, isLoading: bookingsLoading, error: bookingsError, isMockData } = useBookings()
  const { properties, isLoading: propertiesLoading, error: propertiesError } = useProperties()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (!authLoading && !isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, authLoading, router])

  const handleRefresh = () => {
    setIsRefreshing(true)
    window.location.reload()
  }

  if (!isClient || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
        <span className="ml-2 text-xl font-medium">Loading...</span>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect in useEffect
  }

  // Calculate dashboard metrics
  const totalProperties = properties?.length || 0
  const activeBookings = bookings?.filter((b) => b.status === "confirmed")?.length || 0
  const pendingBookings =
    bookings?.filter((b) => ["awaiting_payment", "awaiting_confirmation"].includes(b.status))?.length || 0

  // Calculate revenue (from confirmed bookings)
  const confirmedBookings = bookings?.filter((b) => b.status === "confirmed") || []
  const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0)

  // Find property title by ID
  const getPropertyTitle = (propertyId) => {
    if (!properties) return propertyId
    const property = properties.find((p) => p.id === propertyId)
    return property ? property.title || property.name || propertyId : propertyId
  }

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gouna-blue-dark">Admin Dashboard</h1>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2">
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Mock Data Notice */}
      {isMockData && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="font-medium text-blue-700">Using Mock Data</h3>
            </div>
            <p className="mt-1 text-sm text-blue-600">
              The system is currently using mock data because the database connection timed out. This is normal in
              preview environments or when database credentials are not configured.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {(bookingsError || propertiesError) && (
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <h3 className="font-medium text-red-700">Data Loading Errors</h3>
            </div>
            {bookingsError && (
              <p className="mt-1 text-sm text-red-600">
                <strong>Bookings:</strong> {bookingsError}
              </p>
            )}
            {propertiesError && (
              <p className="mt-1 text-sm text-red-600">
                <strong>Properties:</strong> {propertiesError}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Access Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Link href="/admin/bookings" className="block">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Bookings
              </CardTitle>
              <CardDescription>Manage all property bookings</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/admin/properties" className="block">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Home className="mr-2 h-5 w-5" />
                Properties
              </CardTitle>
              <CardDescription>Manage all rental properties</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link href="/admin/debug" className="block">
          <Card className="h-full transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bug className="mr-2 h-5 w-5" />
                Debug Tools
              </CardTitle>
              <CardDescription>Access system diagnostics and tools</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="ghost" size="sm" className="ml-auto">
                Open Tools <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </Link>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {propertiesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{totalProperties}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{activeBookings}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">{pendingBookings}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Recent Bookings</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
        </TabsList>
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Overview of the most recent property bookings</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
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
                        <TableCell>{getPropertyTitle(booking.property_id)}</TableCell>
                        <TableCell>
                          {format(new Date(booking.check_in), "MMM d")} -{" "}
                          {format(new Date(booking.check_out), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}
                          >
                            {booking.status.replace("_", " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
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
                  <Button asChild>
                    <Link href="/admin/bookings">View All Bookings</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Properties Overview</CardTitle>
              <CardDescription>Summary of all available rental properties</CardDescription>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
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
                              size="sm"
                              onClick={() => router.push(`/admin/properties/calendar/${property.id}`)}
                              title="View Calendar"
                            >
                              <Calendar className="h-4 w-4 mr-1" /> Calendar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/properties/edit/${property.id}`)}
                              title="Edit Property"
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
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
                  <Button asChild>
                    <Link href="/admin/properties">View All Properties</Link>
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

// Helper function to get status color
function getStatusColor(status: string) {
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
