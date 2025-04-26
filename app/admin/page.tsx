"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-provider"
import { useBookings } from "@/hooks/use-bookings"
import { useProperties } from "@/hooks/use-properties"
import { Loader2, Home, CalendarDays, LogOut } from "lucide-react"

export default function AdminDashboard() {
  const { isAdmin, signOut } = useAuth()
  const router = useRouter()
  const { bookings, isLoading: bookingsLoading } = useBookings()
  const { properties, isLoading: propertiesLoading } = useProperties()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (isAdmin === false) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  if (!isClient || isAdmin === false) {
    return null
  }

  // Count bookings by status
  const bookingCounts = {
    total: bookings?.length || 0,
    confirmed: bookings?.filter((b) => b.status === "confirmed").length || 0,
    pending: bookings?.filter((b) => b.status === "awaiting_confirmation").length || 0,
    awaitingPayment: bookings?.filter((b) => b.status === "awaiting_payment").length || 0,
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-64">
          <Card>
            <CardContent className="p-4">
              <nav className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("/admin")}>
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation("/admin/properties")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Properties
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => handleNavigation("/admin/bookings")}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Bookings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    signOut()
                    router.push("/")
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {propertiesLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{properties?.length || 0}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-gouna-blue"
                  onClick={() => handleNavigation("/admin/properties")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Total Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{bookingCounts.total}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-gouna-blue"
                  onClick={() => handleNavigation("/admin/bookings")}
                >
                  View All
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{bookingCounts.pending}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-gouna-blue"
                  onClick={() => handleNavigation("/admin/bookings?status=awaiting_confirmation")}
                >
                  View Pending
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">Awaiting Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <p className="text-2xl font-bold">{bookingCounts.awaitingPayment}</p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="ghost"
                  className="w-full justify-center text-gouna-blue"
                  onClick={() => handleNavigation("/admin/bookings?status=awaiting_payment")}
                >
                  View Unpaid
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks you might want to perform</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => handleNavigation("/admin/properties/new")}
                className="bg-gouna-blue text-white hover:bg-gouna-blue-dark"
              >
                Add New Property
              </Button>
              <Button variant="outline" onClick={() => handleNavigation("/admin/bookings")}>
                Manage Bookings
              </Button>
              <Button variant="outline" onClick={() => handleNavigation("/admin/seed")}>
                Seed Database
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Latest booking activity</CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gouna-blue" />
                </div>
              ) : bookings && bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="text-sm text-gray-500">{booking.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(booking.check_in).toLocaleDateString()} -{" "}
                          {new Date(booking.check_out).toLocaleDateString()}
                        </p>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "awaiting_confirmation"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {booking.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-4 text-center">No recent bookings</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                className="w-full justify-center"
                onClick={() => handleNavigation("/admin/bookings")}
              >
                View All Bookings
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
