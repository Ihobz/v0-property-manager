"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { useBookings } from "@/hooks/use-bookings"
import { Loader2, Search, ArrowLeft } from "lucide-react"

export default function BookingsPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = searchParams.get("status") || "all"

  const { bookings, isLoading } = useBookings()
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusValue, setStatusValue] = useState(statusFilter)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

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
            booking.name.toLowerCase().includes(term) ||
            booking.email.toLowerCase().includes(term) ||
            booking.properties?.title.toLowerCase().includes(term),
        )
      }

      setFilteredBookings(filtered)
    }
  }, [bookings, statusValue, searchTerm])

  const handleStatusChange = (value: string) => {
    setStatusValue(value)
    router.push(`/admin/bookings${value !== "all" ? `?status=${value}` : ""}`)
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
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
              <SelectItem value="completed">Completed</SelectItem>
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
                      <td className="px-4 py-3 text-sm">{booking.id.substring(0, 8)}</td>
                      <td className="px-4 py-3 text-sm">{booking.properties?.title || "Unknown Property"}</td>
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
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/bookings/${booking.id}`}>View</Link>
                        </Button>
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
    </div>
  )
}
