"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { createClientSupabaseClient } from "@/lib/supabase/client"
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  X,
  CalendarPlus2Icon as CalendarIcon2,
  Lock,
  Unlock,
  Plus,
  CheckCircle,
  XCircle,
  Eye,
  CalendarIcon as CalendarIcon3,
} from "lucide-react"
import {
  format,
  isSameDay,
  isWithinInterval,
  addDays,
  addMonths,
  subMonths,
  isBefore,
  startOfMonth,
  endOfMonth,
  isAfter,
  differenceInDays,
} from "date-fns"
import type { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { updateBookingStatus } from "@/app/api/bookings/actions"

interface Booking {
  id: string
  check_in: string
  check_out: string
  status: string
  name: string
  email: string
  payment_proof_url?: string
  property_id?: string
}

interface BlockedDate {
  id: string
  date: string
  reason: string
}

interface PropertyCalendarProps {
  propertyId: string
}

export function PropertyCalendar({ propertyId }: PropertyCalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false)
  const [isUnblockDialogOpen, setIsUnblockDialogOpen] = useState(false)
  const [blockReason, setBlockReason] = useState("")
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<BlockedDate | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [month, setMonth] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 1),
  })
  const [blockMode, setBlockMode] = useState<"single" | "range">("single")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [activeTab, setActiveTab] = useState<string>("calendar")
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  useEffect(() => {
    fetchCalendarData()
  }, [propertyId])

  async function fetchCalendarData() {
    try {
      setIsLoading(true)
      const supabase = createClientSupabaseClient()

      // Fetch bookings for this property
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, name, email, payment_proof_url, property_id")
        .eq("property_id", propertyId)
        .not("status", "eq", "cancelled")

      if (bookingsError) {
        throw new Error(bookingsError.message)
      }

      // Fetch blocked dates for this property
      const { data: blockedDatesData, error: blockedDatesError } = await supabase
        .from("blocked_dates")
        .select("id, date, reason")
        .eq("property_id", propertyId)

      if (blockedDatesError) {
        throw new Error(blockedDatesError.message)
      }

      setBookings(bookingsData || [])
      setBlockedDates(blockedDatesData || [])
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load calendar data. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateClick = (date: Date | undefined) => {
    if (!date) return

    // Check if the date is already blocked
    const blockedDate = blockedDates.find((bd) => isSameDay(new Date(bd.date), date))

    if (blockedDate) {
      setSelectedBlockedDate(blockedDate)
      setIsUnblockDialogOpen(true)
    } else {
      // Check if the date is already booked
      const isBooked = bookings.some((booking) => isDateInBookingRange(date, booking))

      if (!isBooked) {
        if (blockMode === "single") {
          setSelectedDate(date)
          setBlockReason("")
          setIsBlockDialogOpen(true)
        } else {
          // In multi-select mode, toggle the date selection
          const dateExists = selectedDates.some((d) => isSameDay(d, date))
          if (dateExists) {
            setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)))
          } else {
            setSelectedDates([...selectedDates, date])
          }
        }
      } else {
        toast({
          title: "Date is booked",
          description: "This date already has a booking and cannot be blocked.",
        })
      }
    }
  }

  // Helper function to check if a date is within a booking range (including check-in date)
  const isDateInBookingRange = (date: Date | undefined, booking: Booking) => {
    if (!date) return false

    const checkIn = new Date(booking.check_in)
    const checkOut = new Date(booking.check_out)

    // Include the check-in date in the range
    return (
      isSameDay(date, checkIn) ||
      isWithinInterval(date, {
        start: checkIn,
        end: addDays(checkOut, -1),
      })
    )
  }

  const handleBlockDate = async () => {
    if (!selectedDate && blockMode === "single") return
    if (selectedDates.length === 0 && blockMode === "range") return

    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient()

      if (blockMode === "single" && selectedDate) {
        const { error } = await supabase.from("blocked_dates").insert({
          property_id: propertyId,
          date: format(selectedDate, "yyyy-MM-dd"),
          reason: blockReason || "Manually blocked",
        })

        if (error) {
          throw new Error(error.message)
        }

        toast({
          title: "Date blocked",
          description: `${format(selectedDate, "MMMM d, yyyy")} has been blocked successfully.`,
        })
      } else if (blockMode === "range" && dateRange?.from && dateRange?.to) {
        // Generate all dates in the range
        const dates = []
        let currentDate = dateRange.from

        while (currentDate <= dateRange.to) {
          // Check if the date is already booked
          const isBooked = bookings.some((booking) => isDateInBookingRange(currentDate, booking))

          if (!isBooked) {
            dates.push({
              property_id: propertyId,
              date: format(currentDate, "yyyy-MM-dd"),
              reason: blockReason || "Manually blocked",
            })
          }

          currentDate = addDays(currentDate, 1)
        }

        if (dates.length > 0) {
          const { error } = await supabase.from("blocked_dates").insert(dates)

          if (error) {
            throw new Error(error.message)
          }

          toast({
            title: "Dates blocked",
            description: `${dates.length} dates have been blocked successfully.`,
          })
        } else {
          toast({
            variant: "warning",
            title: "No dates blocked",
            description: "All selected dates are already booked or blocked.",
          })
        }
      } else if (blockMode === "range" && selectedDates.length > 0) {
        // Handle multiple selected dates
        const dates = selectedDates.map((date) => ({
          property_id: propertyId,
          date: format(date, "yyyy-MM-dd"),
          reason: blockReason || "Manually blocked",
        }))

        const { error } = await supabase.from("blocked_dates").insert(dates)

        if (error) {
          throw new Error(error.message)
        }

        toast({
          title: "Dates blocked",
          description: `${dates.length} dates have been blocked successfully.`,
        })

        setSelectedDates([])
      }

      // Refresh calendar data
      fetchCalendarData()
    } catch (error) {
      console.error("Error blocking date:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to block date. Please try again.",
      })
    } finally {
      setIsProcessing(false)
      setIsBlockDialogOpen(false)
    }
  }

  const handleUnblockDate = async () => {
    if (!selectedBlockedDate) return

    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase.from("blocked_dates").delete().eq("id", selectedBlockedDate.id)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Date unblocked",
        description: `${format(new Date(selectedBlockedDate.date), "MMMM d, yyyy")} has been unblocked successfully.`,
      })

      // Refresh calendar data
      fetchCalendarData()
    } catch (error) {
      console.error("Error unblocking date:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock date. Please try again.",
      })
    } finally {
      setIsProcessing(false)
      setIsUnblockDialogOpen(false)
    }
  }

  const handlePreviousMonth = () => {
    setMonth(subMonths(month, 1))
  }

  const handleNextMonth = () => {
    setMonth(addMonths(month, 1))
  }

  const handleMonthChange = (value: string) => {
    const [year, monthNum] = value.split("-").map(Number)
    const newDate = new Date(year, monthNum - 1, 1)
    setMonth(newDate)
  }

  const getDayClassName = (date: Date | undefined) => {
    if (!date) return ""

    // Check if date is in selected dates (for multi-select mode)
    if (blockMode === "range" && selectedDates.some((d) => isSameDay(d, date))) {
      return "bg-blue-600 text-white hover:bg-blue-700"
    }

    // Check if date is in blocked dates
    const isBlocked = blockedDates.some((bd) => isSameDay(new Date(bd.date), date))
    if (isBlocked) return "bg-gray-300 text-gray-800 hover:bg-gray-400"

    // Check if date is in bookings (including check-in date)
    for (const booking of bookings) {
      if (isDateInBookingRange(date, booking)) {
        switch (booking.status) {
          case "confirmed":
            return "bg-green-100 text-green-800 hover:bg-green-200"
          case "awaiting_confirmation":
            return "bg-blue-100 text-blue-800 hover:bg-blue-200"
          case "awaiting_payment":
            return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          default:
            return "bg-gray-100 text-gray-800 hover:bg-gray-200"
        }
      }
    }

    return ""
  }

  const getDateTooltip = (date: Date | undefined) => {
    if (!date) return ""

    // Check if date is in bookings (including check-in date)
    for (const booking of bookings) {
      if (isDateInBookingRange(date, booking)) {
        return `${booking.name || "Guest"} - ${booking.status.replace("_", " ")}`
      }
    }

    // Check if date is blocked
    const blockedDate = blockedDates.find((bd) => isSameDay(new Date(bd.date), date))
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

  // Function to handle bulk unblock
  const handleBulkUnblock = async () => {
    try {
      setIsProcessing(true)
      const supabase = createClientSupabaseClient()

      if (!dateRange?.from || !dateRange?.to) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a date range to unblock.",
        })
        return
      }

      // Get all blocked dates in the range
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("id")
        .eq("property_id", propertyId)
        .gte("date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("date", format(dateRange.to, "yyyy-MM-dd"))

      if (error) {
        throw new Error(error.message)
      }

      if (!data || data.length === 0) {
        toast({
          variant: "warning",
          title: "No dates to unblock",
          description: "There are no blocked dates in the selected range.",
        })
        return
      }

      // Delete all blocked dates in the range
      const { error: deleteError } = await supabase
        .from("blocked_dates")
        .delete()
        .in(
          "id",
          data.map((item) => item.id),
        )

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      toast({
        title: "Dates unblocked",
        description: `${data.length} dates have been unblocked successfully.`,
      })

      // Refresh calendar data
      fetchCalendarData()
    } catch (error) {
      console.error("Error unblocking dates:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unblock dates. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate occupancy for current month
  const calculateMonthlyOccupancy = () => {
    const currentDate = new Date()
    const firstDayOfMonth = startOfMonth(currentDate)
    const lastDayOfMonth = endOfMonth(currentDate)

    // Total days in month
    const totalDays = differenceInDays(lastDayOfMonth, firstDayOfMonth) + 1

    // Create an array of all days in the month
    const daysInMonth = Array.from({ length: totalDays }, (_, i) => addDays(firstDayOfMonth, i))

    // Count booked days (excluding cancelled bookings)
    let bookedDays = 0
    daysInMonth.forEach((day) => {
      const isBooked = bookings.some((booking) => booking.status !== "cancelled" && isDateInBookingRange(day, booking))
      if (isBooked) bookedDays++
    })

    // Calculate occupancy percentage
    const occupancyRate = (bookedDays / totalDays) * 100

    return {
      occupancyRate: Math.round(occupancyRate),
      bookedDays,
      totalDays,
    }
  }

  // Get upcoming check-ins (next 3 days)
  const getUpcomingCheckIns = () => {
    const today = new Date()
    const threeDaysLater = addDays(today, 3)

    return bookings
      .filter((booking) => {
        const checkInDate = new Date(booking.check_in)
        return (
          (isAfter(checkInDate, today) && isBefore(checkInDate, threeDaysLater)) ||
          isSameDay(checkInDate, threeDaysLater)
        )
      })
      .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())
  }

  // Get upcoming check-outs (next 3 days)
  const getUpcomingCheckOuts = () => {
    const today = new Date()
    const threeDaysLater = addDays(today, 3)

    return bookings
      .filter((booking) => {
        const checkOutDate = new Date(booking.check_out)
        return (
          (isAfter(checkOutDate, today) && isBefore(checkOutDate, threeDaysLater)) ||
          isSameDay(checkOutDate, threeDaysLater)
        )
      })
      .sort((a, b) => new Date(a.check_out).getTime() - new Date(b.check_out).getTime())
  }

  // Handle confirm booking
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

        // Refresh the data
        fetchCalendarData()
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

  // Handle cancel booking
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

        // Refresh the data
        fetchCalendarData()
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

  // View booking details
  const handleViewBooking = (bookingId: string) => {
    window.location.href = `/admin/bookings/${bookingId}`
  }

  // Sort bookings by check-in date
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(a.check_in).getTime() - new Date(b.check_in).getTime()
  })

  // Sort blocked dates by date
  const sortedBlockedDates = [...blockedDates].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  // Calculate occupancy stats
  const occupancyStats = calculateMonthlyOccupancy()
  const upcomingCheckIns = getUpcomingCheckIns()
  const upcomingCheckOuts = getUpcomingCheckOuts()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="blocked">Blocked Dates</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-0 pt-4 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={handlePreviousMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Select value={format(month, "yyyy-MM")} onValueChange={handleMonthChange}>
                    <SelectTrigger className="w-[180px] h-8">
                      <SelectValue>{format(month, "MMMM yyyy")}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select
                    value={blockMode}
                    onValueChange={(value: "single" | "range") => {
                      setBlockMode(value)
                      setSelectedDates([])
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue placeholder="Block Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Date</SelectItem>
                      <SelectItem value="range">Multiple Dates</SelectItem>
                    </SelectContent>
                  </Select>

                  {blockMode === "range" && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-8 justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                              </>
                            ) : (
                              format(dateRange.from, "LLL dd, y")
                            )
                          ) : (
                            <span>Pick dates</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          initialFocus
                          mode="range"
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  )}

                  <Button
                    onClick={() => {
                      if (blockMode === "single") {
                        if (selectedDate) {
                          setBlockReason("")
                          setIsBlockDialogOpen(true)
                        } else {
                          toast({
                            variant: "warning",
                            title: "No date selected",
                            description: "Please select a date to block.",
                          })
                        }
                      } else if (blockMode === "range" && dateRange?.from && dateRange?.to) {
                        setBlockReason("")
                        setIsBlockDialogOpen(true)
                      } else if (blockMode === "range" && selectedDates.length > 0) {
                        setBlockReason("")
                        setIsBlockDialogOpen(true)
                      } else {
                        toast({
                          variant: "warning",
                          title: "No dates selected",
                          description: "Please select dates to block.",
                        })
                      }
                    }}
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Block
                  </Button>

                  {blockMode === "range" && dateRange?.from && dateRange?.to && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkUnblock}
                      disabled={isProcessing}
                      className="h-8"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Processing
                        </>
                      ) : (
                        <>
                          <Unlock className="mr-1 h-3 w-3" /> Unblock Range
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {blockMode === "range" && selectedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {selectedDates.map((date, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {format(date, "MMM d, yyyy")}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => setSelectedDates(selectedDates.filter((d) => !isSameDay(d, date)))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                  {selectedDates.length > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedDates([])} className="h-6">
                      Clear All
                    </Button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-green-100 mr-2 border border-green-300"></div>
                  <span className="text-xs">Confirmed</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-blue-100 mr-2 border border-blue-300"></div>
                  <span className="text-xs">Awaiting Confirmation</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-yellow-100 mr-2 border border-yellow-300"></div>
                  <span className="text-xs">Awaiting Payment</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 rounded bg-gray-300 mr-2 border border-gray-400"></div>
                  <span className="text-xs">Blocked</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-white rounded-lg overflow-hidden">
                <Calendar
                  mode={blockMode === "single" ? "single" : "multiple"}
                  selected={blockMode === "single" ? selectedDate : selectedDates}
                  onSelect={(date) => {
                    if (blockMode === "single") {
                      setSelectedDate(date as Date | null)
                    }
                  }}
                  month={month}
                  onMonthChange={setMonth}
                  className="rounded-md border-0"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: cn(
                      "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                      blockMode === "range" ? "h-9 w-9 cursor-pointer" : "h-9 w-9",
                    ),
                    day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                    day_range_end: "day-range-end",
                    day_selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                  components={{
                    Day: ({ date, ...props }) => {
                      if (!date) {
                        return <div {...props}></div>
                      }

                      const className = getDayClassName(date)
                      const tooltip = getDateTooltip(date)
                      const isBlocked = blockedDates.some((bd) => isSameDay(new Date(bd.date), date))
                      const isBooked = bookings.some((booking) => isDateInBookingRange(date, booking))
                      const isSelected = blockMode === "range" && selectedDates.some((d) => isSameDay(d, date))

                      let statusIndicator = null
                      if (isBlocked) {
                        statusIndicator = <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-500"></div>
                      } else if (isBooked) {
                        const booking = bookings.find((b) => isDateInBookingRange(date, b))

                        if (booking) {
                          const color =
                            booking.status === "confirmed"
                              ? "bg-green-500"
                              : booking.status === "awaiting_confirmation"
                                ? "bg-blue-500"
                                : "bg-yellow-500"

                          statusIndicator = <div className={`absolute bottom-0 left-0 right-0 h-1 ${color}`}></div>
                        }
                      }

                      // Check if date is in the past
                      const isPast = isBefore(date, new Date()) && !isSameDay(date, new Date())

                      return (
                        <div
                          {...props}
                          className={`${props.className} ${className} ${isPast ? "opacity-50" : ""} ${isSelected ? "bg-blue-600 text-white" : ""} relative`}
                          title={tooltip}
                          onClick={(e) => {
                            e.preventDefault() // Prevent default to handle our own click logic
                            handleDateClick(date)
                          }}
                        >
                          <div className="relative w-full h-full flex items-center justify-center">
                            {date.getDate()}
                            {statusIndicator}
                          </div>
                        </div>
                      )
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Guest</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Dates</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="px-4 py-3 text-sm">
                            <div>{booking.name}</div>
                            <div className="text-xs text-gray-500">{booking.email}</div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>{format(new Date(booking.check_in), "MMM d, yyyy")}</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(booking.check_out), "MMM d, yyyy")}
                            </div>
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
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => handleViewBooking(booking.id)}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>

                              {booking.status === "awaiting_confirmation" && booking.payment_proof_url && (
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
                                  onClick={() =>
                                    (window.location.href = `/admin/properties/calendar/${booking.property_id}`)
                                  }
                                >
                                  <CalendarIcon3 className="h-4 w-4 mr-1" /> Calendar
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CalendarIcon2 className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2">No bookings found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Blocked Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedBlockedDates.length > 0 ? (
                <div className="space-y-3">
                  {sortedBlockedDates.map((blockedDate) => (
                    <Card
                      key={blockedDate.id}
                      className="overflow-hidden border-l-4 border-l-gray-400 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="font-medium flex items-center">
                              <Lock className="h-4 w-4 mr-1 text-gray-500" />
                              {format(new Date(blockedDate.date), "MMMM d, yyyy")}
                            </h4>
                            <div className="text-sm text-gray-500 mt-1">
                              {blockedDate.reason || "No reason provided"}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 sm:mt-0"
                            onClick={() => {
                              setSelectedBlockedDate(blockedDate)
                              setIsUnblockDialogOpen(true)
                            }}
                          >
                            <Unlock className="h-3 w-3 mr-1" /> Unblock
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Unlock className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2">No blocked dates</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Block Date Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blockMode === "single"
                ? `Block Date: ${selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}`
                : `Block ${
                    selectedDates.length > 0
                      ? selectedDates.length + " Selected Dates"
                      : dateRange?.from && dateRange?.to
                        ? "Date Range"
                        : "Dates"
                  }`}
            </DialogTitle>
            <DialogDescription>
              {blockMode === "single"
                ? "Block this date to prevent bookings."
                : selectedDates.length > 0
                  ? `Block ${selectedDates.length} selected dates to prevent bookings.`
                  : dateRange?.from && dateRange?.to
                    ? `Block dates from ${format(dateRange.from, "MMMM d, yyyy")} to ${format(dateRange.to, "MMMM d, yyyy")} to prevent bookings.`
                    : "Block multiple dates to prevent bookings."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Owner stay, maintenance, etc."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBlockDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleBlockDate} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Block Date" +
                (blockMode === "range" && (selectedDates.length > 1 || (dateRange?.from && dateRange?.to)) ? "s" : "")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock Date Dialog */}
      <AlertDialog open={isUnblockDialogOpen} onOpenChange={setIsUnblockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Date</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock{" "}
              {selectedBlockedDate ? format(new Date(selectedBlockedDate.date), "MMMM d, yyyy") : "this date"}?
              {selectedBlockedDate?.reason && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md">
                  <span className="font-medium">Reason:</span> {selectedBlockedDate.reason}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnblockDate}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Unblock Date"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
