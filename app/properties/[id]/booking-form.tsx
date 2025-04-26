"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { createBooking } from "@/app/api/bookings/actions"
import { getPropertyBookedDates } from "@/app/api/availability/actions"

interface BookingFormProps {
  propertyId: string
  pricePerNight: number
  cleaningFee: number
}

export default function BookingForm({ propertyId, pricePerNight, cleaningFee }: BookingFormProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined)
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [confirmedDates, setConfirmedDates] = useState<string[]>([])
  const [pendingDates, setPendingDates] = useState<string[]>([])
  const [awaitingPaymentDates, setAwaitingPaymentDates] = useState<string[]>([])
  const [blockedDates, setBlockedDates] = useState<string[]>([])
  const [isLoadingDates, setIsLoadingDates] = useState(true)

  // Calculate total price
  const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : 0
  const subtotal = nights * pricePerNight
  const total = subtotal + cleaningFee

  useEffect(() => {
    async function fetchBookedDates() {
      setIsLoadingDates(true)
      try {
        const { bookedDates, confirmedDates, pendingDates, awaitingPaymentDates, blockedDates, error } =
          await getPropertyBookedDates(propertyId)

        if (error) {
          console.error("Error fetching booked dates:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load availability data. Please try again.",
          })
          return
        }

        setBookedDates(bookedDates || [])
        setConfirmedDates(confirmedDates || [])
        setPendingDates(pendingDates || [])
        setAwaitingPaymentDates(awaitingPaymentDates || [])
        setBlockedDates(blockedDates || [])
      } catch (error) {
        console.error("Error in fetchBookedDates:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load availability data. Please try again.",
        })
      } finally {
        setIsLoadingDates(false)
      }
    }

    fetchBookedDates()
  }, [propertyId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!checkIn || !checkOut) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select check-in and check-out dates.",
      })
      return
    }

    if (nights <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Check-out date must be after check-in date.",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formattedCheckIn = format(checkIn, "yyyy-MM-dd")
      const formattedCheckOut = format(checkOut, "yyyy-MM-dd")

      const result = await createBooking({
        propertyId,
        name,
        email,
        phone,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        notes,
        totalPrice: total,
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: "Booking Request Submitted",
        description: "Your booking request has been submitted successfully.",
      })

      // Redirect to the payment proof upload page
      router.push(`/upload/${result.bookingId}`)
    } catch (error) {
      console.error("Error creating booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to check if a date is disabled (already booked)
  const isDateDisabled = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")
    return bookedDates.includes(formattedDate)
  }

  // Function to get day style based on booking status
  const getDayStyle = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd")

    if (blockedDates.includes(formattedDate)) {
      return "bg-gray-200 text-gray-500 cursor-not-allowed"
    }

    if (confirmedDates.includes(formattedDate)) {
      return "bg-green-100 text-green-800 cursor-not-allowed"
    }

    if (pendingDates.includes(formattedDate)) {
      return "bg-blue-100 text-blue-800 cursor-not-allowed"
    }

    if (awaitingPaymentDates.includes(formattedDate)) {
      return "bg-yellow-100 text-yellow-800 cursor-not-allowed"
    }

    return ""
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Book This Property</CardTitle>
        <CardDescription>Fill out the form below to request a booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in">Check-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-in"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !checkIn && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkIn ? format(checkIn, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {isLoadingDates ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gouna-blue" />
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={setCheckIn}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isDateDisabled(date)}
                      initialFocus
                      styles={{
                        day: (date) => {
                          return {
                            className: getDayStyle(date),
                          }
                        },
                      }}
                    />
                  )}
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out">Check-out Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="check-out"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !checkOut && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {checkOut ? format(checkOut, "PPP") : <span>Select date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  {isLoadingDates ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gouna-blue" />
                    </div>
                  ) : (
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={setCheckOut}
                      disabled={(date) =>
                        (checkIn ? date <= checkIn : date < new Date(new Date().setHours(0, 0, 0, 0))) ||
                        isDateDisabled(date)
                      }
                      initialFocus
                      styles={{
                        day: (date) => {
                          return {
                            className: getDayStyle(date),
                          }
                        },
                      }}
                    />
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requests or notes for your stay"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Price per night</span>
              <span>${pricePerNight.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Number of nights</span>
              <span>{nights}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cleaning fee</span>
              <span>${cleaningFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-700">
            <p className="font-medium mb-1">Booking Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your booking will be confirmed after payment verification.</li>
              <li>After submitting, you'll be directed to upload payment proof.</li>
              <li>You can check your booking status anytime using your email.</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full bg-green-100"></div>
            <span className="text-xs">Confirmed bookings</span>
            <div className="w-3 h-3 rounded-full bg-blue-100 ml-2"></div>
            <span className="text-xs">Pending confirmation</span>
            <div className="w-3 h-3 rounded-full bg-yellow-100 ml-2"></div>
            <span className="text-xs">Awaiting payment</span>
            <div className="w-3 h-3 rounded-full bg-gray-200 ml-2"></div>
            <span className="text-xs">Blocked dates</span>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          className="w-full bg-gouna-blue hover:bg-gouna-blue-dark"
          disabled={isSubmitting || !checkIn || !checkOut || nights <= 0}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            "Request Booking"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
