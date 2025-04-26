"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Loader2, CalendarIcon } from "lucide-react"
import { format, isSameDay, isWithinInterval, addDays } from "date-fns"

interface Booking {
  id: string
  check_in: string
  check_out: string
  status: string
  name: string
  email: string
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

  useEffect(() => {
    fetchCalendarData()
  }, [propertyId, month])

  async function fetchCalendarData() {
    try {
      setIsLoading(true)
      const supabase = createClientSupabaseClient()

      // Fetch bookings for this property
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, check_in, check_out, status, name, email")
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

  const handleDateClick = (date: Date) => {
    // Check if the date is already blocked
    const blockedDate = blockedDates.find((bd) => isSameDay(new Date(bd.date), date))

    if (blockedDate) {
      setSelectedBlockedDate(blockedDate)
      setIsUnblockDialogOpen(true)
    } else {
      // Check if the date is already booked
      const isBooked = bookings.some((booking) =>
        isWithinInterval(date, {
          start: new Date(booking.check_in),
          end: addDays(new Date(booking.check_out), -1),
        }),
      )

      if (!isBooked) {
        setSelectedDate(date)
        setBlockReason("")
        setIsBlockDialogOpen(true)
      } else {
        toast({
          title: "Date is booked",
          description: "This date already has a booking and cannot be blocked.",
        })
      }
    }
  }

  const handleBlockDate = async () => {
    if (!selectedDate) return

    setIsProcessing(true)
    try {
      const supabase = createClientSupabaseClient()

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

  const getDayClassName = (date: Date) => {
    // Check if date is in blocked dates
    const isBlocked = blockedDates.some((bd) => isSameDay(new Date(bd.date), date))
    if (isBlocked) return "bg-gray-200 text-gray-800 hover:bg-gray-300"

    // Check if date is in bookings
    for (const booking of bookings) {
      const checkIn = new Date(booking.check_in)
      const checkOut = new Date(booking.check_out)

      if (isWithinInterval(date, { start: checkIn, end: addDays(checkOut, -1) })) {
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

  return (
    <div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
        </div>
      ) : (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium">
              <CalendarIcon className="inline-block mr-2 h-5 w-5" />
              {format(month, "MMMM yyyy")}
            </h3>
            <div className="text-sm text-gray-500">Click on a date to block or unblock it</div>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateClick}
            onMonthChange={setMonth}
            className="rounded-md border"
            modifiers={{
              booked: (date) =>
                bookings.some((booking) =>
                  isWithinInterval(date, {
                    start: new Date(booking.check_in),
                    end: addDays(new Date(booking.check_out), -1),
                  }),
                ),
              blocked: (date) => blockedDates.some((bd) => isSameDay(new Date(bd.date), date)),
            }}
            modifiersClassNames={{
              booked: "",
              blocked: "",
            }}
            styles={{
              day: (date) => {
                return {
                  className: getDayClassName(date),
                }
              },
            }}
          />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Upcoming Bookings</h4>
                {bookings.length > 0 ? (
                  <ul className="space-y-2">
                    {bookings.slice(0, 5).map((booking) => (
                      <li key={booking.id} className="text-sm border-b pb-2">
                        <div className="font-medium">{booking.name}</div>
                        <div className="text-gray-500">
                          {format(new Date(booking.check_in), "MMM d")} -{" "}
                          {format(new Date(booking.check_out), "MMM d, yyyy")}
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs ${
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
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No upcoming bookings</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Blocked Dates</h4>
                {blockedDates.length > 0 ? (
                  <ul className="space-y-2">
                    {blockedDates.slice(0, 5).map((blockedDate) => (
                      <li key={blockedDate.id} className="text-sm border-b pb-2">
                        <div className="font-medium">{format(new Date(blockedDate.date), "MMMM d, yyyy")}</div>
                        <div className="text-gray-500">{blockedDate.reason || "No reason provided"}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No blocked dates</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Block Date Dialog */}
      <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Date</DialogTitle>
            <DialogDescription>
              Block {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "date"} to prevent bookings.
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
            <Button onClick={handleBlockDate} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Block Date"
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
            <AlertDialogAction onClick={handleUnblockDate} disabled={isProcessing}>
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
    </div>
  )
}
