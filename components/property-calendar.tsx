"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { getPropertyBookings, blockPropertyDates, unblockPropertyDates } from "@/app/api/availability/actions"
import { Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PropertyCalendarProps = {
  propertyId: string
}

type BookingInfo = {
  id: string
  status: string
  checkIn: Date
  checkOut: Date
  guestName?: string
}

type BlockedDate = {
  date: Date
  reason?: string
}

export function PropertyCalendar({ propertyId }: PropertyCalendarProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<BookingInfo[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedDateRange, setSelectedDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  })
  const [blockReason, setBlockReason] = useState("")
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch bookings and blocked dates for the property
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true)
        setError(null)

        const {
          bookings: propertyBookings,
          blockedDates: propertyBlockedDates,
          error: fetchError,
        } = await getPropertyBookings(propertyId)

        if (fetchError) {
          throw new Error(fetchError)
        }

        // Transform bookings data
        const transformedBookings = propertyBookings.map((booking: any) => ({
          id: booking.id,
          status: booking.status,
          checkIn: new Date(booking.check_in),
          checkOut: new Date(booking.check_out),
          guestName: booking.name,
        }))

        // Transform blocked dates
        const transformedBlockedDates = propertyBlockedDates.map((blockedDate: any) => ({
          date: new Date(blockedDate.date),
          reason: blockedDate.reason,
        }))

        setBookings(transformedBookings)
        setBlockedDates(transformedBlockedDates)
      } catch (err) {
        console.error("Error fetching property calendar data:", err)
        setError(err instanceof Error ? err.message : "Failed to load calendar data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [propertyId])

  // Handle blocking dates
  const handleBlockDates = async () => {
    if (!selectedDateRange.from || !selectedDateRange.to) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a date range to block",
      })
      return
    }

    setIsProcessing(true)
    try {
      const result = await blockPropertyDates(
        propertyId,
        format(selectedDateRange.from, "yyyy-MM-dd"),
        format(selectedDateRange.to, "yyyy-MM-dd"),
        blockReason,
      )

      if (!result.success) {
        throw new Error(result.error || "Failed to block dates")
      }

      // Add the newly blocked dates to the state
      const newBlockedDates = eachDayOfInterval({
        start: selectedDateRange.from,
        end: selectedDateRange.to,
      }).map((date) => ({
        date,
        reason: blockReason,
      }))

      setBlockedDates([...blockedDates, ...newBlockedDates])

      toast({
        title: "Dates blocked",
        description: "The selected dates have been blocked successfully",
      })

      // Reset selection
      setSelectedDateRange({ from: undefined, to: undefined })
      setBlockReason("")
      setIsBlockDialogOpen(false)
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to block dates",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle unblocking a date
  const handleUnblockDate = async (date: Date) => {
    setIsProcessing(true)
    try {
      const result = await unblockPropertyDates(propertyId, format(date, "yyyy-MM-dd"))

      if (!result.success) {
        throw new Error(result.error || "Failed to unblock date")
      }

      // Remove the unblocked date from state
      setBlockedDates(blockedDates.filter((blockedDate) => !isSameDay(blockedDate.date, date)))

      toast({
        title: "Date unblocked",
        description: "The selected date has been unblocked successfully",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to unblock date",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Function to determine the class name for a date
  const getDayClassName = (date: Date) => {
    // Check if date is in a booking
    for (const booking of bookings) {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)

      if (date >= checkIn && date <= checkOut) {
        switch (booking.status) {
          case "confirmed":
            return "bg-green-100 text-green-800 hover:bg-green-200"
          case "awaiting_confirmation":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200"
          case "awaiting_payment":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          case "cancelled":
            return "bg-red-100 text-red-800 hover:bg-red-200"
          default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }
      }
    }

    // Check if date is blocked
    const isBlocked = blockedDates.some((blockedDate) => isSameDay(blockedDate.date, date))

    if (isBlocked) {
      return "bg-gray-300 text-gray-800 hover:bg-gray-400"
    }

    return ""
  }

  // Function to get tooltip content for a date
  const getDateTooltip = (date: Date) => {
    // Check if date is in a booking
    for (const booking of bookings) {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)

      if (date >= checkIn && date <= checkOut) {
        return `${booking.guestName || "Guest"} - ${booking.status.replace("_", " ")}`
      }
    }

    // Check if date is blocked
    const blockedDate = blockedDates.find((blockedDate) => isSameDay(blockedDate.date, date))

    if (blockedDate) {
      return `Blocked: ${blockedDate.reason || "No reason provided"}`
    }

    return ""
  }

  // Generate months for dropdown
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    return {
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    }
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Calendar</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-700">Calendar Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Property Calendar</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={format(selectedMonth, "yyyy-MM")} onValueChange={(value) => setSelectedMonth(new Date(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsBlockDialogOpen(true)} className="bg-gouna-blue hover:bg-gouna-blue-dark">
            Block Dates
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-green-100 mr-2"></div>
              <span className="text-sm">Confirmed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-blue-100 mr-2"></div>
              <span className="text-sm">Awaiting Confirmation</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-yellow-100 mr-2"></div>
              <span className="text-sm">Awaiting Payment</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded bg-gray-300 mr-2"></div>
              <span className="text-sm">Blocked</span>
            </div>
          </div>
        </div>

        <Calendar
          mode="range"
          selected={selectedDateRange}
          onSelect={setSelectedDateRange}
          month={selectedMonth}
          onMonthChange={setSelectedMonth}
          className="rounded-md border"
          modifiers={{
            booked: (date) => bookings.some((booking) => date >= booking.checkIn && date <= booking.checkOut),
            blocked: (date) => blockedDates.some((blockedDate) => isSameDay(blockedDate.date, date)),
          }}
          modifiersClassNames={{
            booked: "font-bold",
            blocked: "line-through",
          }}
          components={{
            Day: ({ date, ...props }) => {
              const className = getDayClassName(date)
              const tooltip = getDateTooltip(date)

              // Check if this is a blocked date
              const isBlocked = blockedDates.some((blockedDate) => isSameDay(blockedDate.date, date))

              return (
                <div {...props} className={`${props.className} ${className}`} title={tooltip}>
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {isBlocked && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUnblockDate(date)
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                        title="Unblock date"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            },
          }}
        />

        {/* Bookings list for the selected month */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Bookings & Blocked Dates</h3>

          {(() => {
            const monthStart = startOfMonth(selectedMonth)
            const monthEnd = endOfMonth(selectedMonth)

            const monthBookings = bookings.filter(
              (booking) => booking.checkIn <= monthEnd && booking.checkOut >= monthStart,
            )

            const monthBlockedDates = blockedDates.filter(
              (blockedDate) => blockedDate.date >= monthStart && blockedDate.date <= monthEnd,
            )

            if (monthBookings.length === 0 && monthBlockedDates.length === 0) {
              return <p className="text-gray-500 italic">No bookings or blocked dates for this month</p>
            }

            return (
              <div className="space-y-4">
                {monthBookings.map((booking) => (
                  <div key={booking.id} className="p-3 rounded-md border">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{booking.guestName || "Guest"}</p>
                        <p className="text-sm text-gray-600">
                          {format(booking.checkIn, "MMM d, yyyy")} - {format(booking.checkOut, "MMM d, yyyy")}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
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
                    </div>
                  </div>
                ))}

                {monthBlockedDates.length > 0 && (
                  <div className="p-3 rounded-md border bg-gray-50">
                    <p className="font-medium mb-2">Blocked Dates</p>
                    <div className="space-y-2">
                      {monthBlockedDates.map((blockedDate, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm">{format(blockedDate.date, "MMM d, yyyy")}</p>
                            {blockedDate.reason && <p className="text-xs text-gray-600">{blockedDate.reason}</p>}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => handleUnblockDate(blockedDate.date)}
                          >
                            Unblock
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </CardContent>

      {/* Block Dates Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Dates</DialogTitle>
            <DialogDescription>
              Select a date range to block for this property. Blocked dates will not be available for booking.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <Calendar
                mode="range"
                selected={selectedDateRange}
                onSelect={setSelectedDateRange}
                className="rounded-md border"
                disabled={(date) => {
                  // Disable dates that already have bookings
                  return bookings.some((booking) => date >= booking.checkIn && date <= booking.checkOut)
                }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Reason (Optional)</label>
              <textarea
                className="w-full p-2 border rounded-md"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="e.g., Owner stay, Maintenance, etc."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBlockDates}
              disabled={!selectedDateRange.from || !selectedDateRange.to || isProcessing}
              className="bg-gouna-blue hover:bg-gouna-blue-dark"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Block Dates"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
