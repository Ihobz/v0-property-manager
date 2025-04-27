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
import { logError } from "@/lib/logging"

interface Property {
  id?: string
  price?: number
  cleaningFee?: number
  [key: string]: any
}

interface BookingFormProps {
  property?: Property
  propertyId?: string
  pricePerNight?: number
  cleaningFee?: number
}

export default function BookingForm({
  property,
  propertyId: propId,
  pricePerNight: propPrice,
  cleaningFee: propCleaningFee,
}: BookingFormProps) {
  const router = useRouter()

  // Handle both property object and direct props with fallbacks
  const propertyId = property?.id || propId || ""
  const pricePerNight = property?.price || propPrice || 0
  const cleaningFee = property?.cleaningFee || propCleaningFee || 0

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Calculate total price with safety checks
  const nights = checkIn && checkOut ? Math.max(0, differenceInDays(checkOut, checkIn)) : 0
  const subtotal = nights * (typeof pricePerNight === "number" ? pricePerNight : 0)
  const total = subtotal + (typeof cleaningFee === "number" ? cleaningFee : 0)

  useEffect(() => {
    async function fetchBookedDates() {
      setIsLoadingDates(true)
      try {
        // Check if propertyId is valid before making the request
        if (!propertyId) {
          console.error("Property ID is missing or invalid:", propertyId)
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load availability data. Invalid property ID.",
          })
          setIsLoadingDates(false)
          return
        }

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
    setErrorMessage(null)

    if (!propertyId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid property ID. Please try again.",
      })
      return
    }

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

      // Create booking data with the correct field names expected by the server
      const bookingData = {
        property_id: propertyId,
        name,
        email,
        phone,
        check_in: formattedCheckIn,
        check_out: formattedCheckOut,
        guests: 2, // Default value
        base_price: subtotal,
        total_price: total,
      }

      const result = await createBooking(bookingData)

      if (result.error) {
        setErrorMessage(result.error)
        throw new Error(result.error)
      }

      toast({
        title: "Booking Request Submitted",
        description: "Your booking request has been submitted successfully.",
      })

      // Redirect to the payment proof upload page
      if (result.booking && result.booking.id) {
        router.push(`/upload/${result.booking.id}`)
      } else {
        // Fallback if no booking ID is returned
        toast({
          variant: "destructive",
          title: "Warning",
          description: "Booking was created but no ID was returned. Please check your email for booking details.",
        })
        router.push(`/properties/${propertyId}?booking=success`)
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      logError("Error creating booking in form", { error, propertyId })
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

  // Handle check-in date selection
  const handleCheckInSelect = (date: Date | undefined) => {
    setCheckIn(date)
    // If check-out is before check-in, reset it
    if (date && checkOut && checkOut <= date) {
      setCheckOut(undefined)
    }
  }

  // Handle check-out date selection
  const handleCheckOutSelect = (date: Date | undefined) => {
    setCheckOut(date)
  }

  // Safe toFixed function that handles undefined/null values
  const safeToFixed = (value: number | undefined | null, decimals = 2): string => {
    if (value === undefined || value === null) return (0).toFixed(decimals)
    return value.toFixed(decimals)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Book This Property</CardTitle>
        <CardDescription>Fill out the form below to request a booking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
              <p className="font-medium">Error:</p>
              <p>{errorMessage}</p>
              <p className="mt-1 text-xs">Please try again or contact support if the issue persists.</p>
            </div>
          )}

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
                      onSelect={handleCheckInSelect}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0)) || isDateDisabled(date)}
                      initialFocus
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
                    disabled={!checkIn}
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
                      onSelect={handleCheckOutSelect}
                      disabled={(date) => !checkIn || date <= checkIn || isDateDisabled(date)}
                      initialFocus
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
            <p className="text-xs text-gray-500">
              Your special requests will be noted but may not be guaranteed. We'll contact you if we need more
              information.
            </p>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between text-sm">
              <span>Price per night</span>
              <span>${safeToFixed(pricePerNight)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Number of nights</span>
              <span>{nights}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${safeToFixed(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cleaning fee</span>
              <span>${safeToFixed(cleaningFee)}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>${safeToFixed(total)}</span>
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
