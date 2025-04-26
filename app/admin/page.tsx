"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { useProperties } from "@/hooks/use-properties"
import { useBookings } from "@/hooks/use-bookings"
import { Loader2, Plus, Home, CalendarDays, Settings, Database, ListFilter } from "lucide-react"

export default function AdminDashboard() {
  const { user, isAdmin } = useAuth()
  const router = useRouter()
  const { properties, isLoading: propertiesLoading } = useProperties()
  const { bookings, isLoading: bookingsLoading } = useBookings()
  const [isLoading, setIsLoading] = useState(true)

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
    pending: bookings?.filter((b) => b.status === "awaiting_confirmation").length || 0,
    confirmed: bookings?.filter((b) => b.status === "confirmed").length || 0,
    awaiting_payment: bookings?.filter((b) => b.status === "awaiting_payment").length || 0,
  }

  // Handle view booking click
  const handleViewBooking = (bookingId: string) => {
    router.push(`/admin/bookings/${bookingId}`)
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
            <Link href="/admin/properties/new">
              <Plus className="h-4 w-4 mr-2" /> Add Property
            </Link>
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
                <p className="text-sm font-medium text-gray-500">Pending Bookings</p>
                <h3 className="text-3xl font-bold text-yellow-500 mt-1">{bookingCounts.pending}</h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Awaiting Payment</p>
                <h3 className="text-3xl font-bold text-orange-500 mt-1">{bookingCounts.awaiting_payment}</h3>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <CalendarDays className="h-6 w-6 text-orange-500" />
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
            <Button asChild className="w-full">
              <Link href="/admin/properties/new">
                <Plus className="h-4 w-4 mr-2" /> Add New Property
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/properties">
                <ListFilter className="h-4 w-4 mr-2" /> Manage Properties
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/properties">View Public Listings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Bookings</CardTitle>
            <CardDescription>Manage your property bookings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/admin/bookings">View All Bookings</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/bookings?status=awaiting_confirmation">View Pending Bookings</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-gouna-blue-dark">Tools</CardTitle>
            <CardDescription>Admin tools and utilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/admin/seed">
                <Database className="h-4 w-4 mr-2" /> Seed Database
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/debug">
                <Settings className="h-4 w-4 mr-2" /> Debug Tools
              </Link>
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
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/properties/edit/${property.id}`}>Edit</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/properties/calendar/${property.id}`}>Calendar</Link>
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
                <td className="px-4 py-3 text-sm">{booking.properties?.title || "Unknown Property"}</td>
                <td className="px-4 py-3 text-sm">{booking.name}</td>
                <td className="px-4 py-3 text-sm">
                  {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      booking.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : booking.status === "awaiting_confirmation"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "awaiting_payment"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {booking.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button variant="outline" size="sm" onClick={() => handleViewBooking(booking.id)}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
