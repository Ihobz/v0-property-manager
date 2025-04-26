"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Check } from "lucide-react"
import { createBooking } from "@/app/api/bookings/actions"
import { checkPropertyAvailability } from "@/app/api/availability/actions"
import { usePropertyAvailability } from "@/hooks/use-availability"
import { format, addDays, differenceInDays, isAfter, isBefore, parseISO } from "date-fns"

type BookingFormProps = {
  property: any
}

export default function BookingForm({ property }: BookingFormProps) {
  const router = useRouter()
  const { bookedDates } = usePropertyAvailability(property.id)
  const [today] = useState(format(new Date(), "yyyy-MM-dd"))

  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("2")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    // Automatically redirect to upload page after 3 seconds when booking is submitted
    if (bookingSubmitted && booking) {
      const timer = setTimeout(() => {
        router.push(`/upload/${booking.id}`)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [bookingSubmitted, booking, router])

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut) return 0

    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)
    const nights = differenceInDays(endDate, startDate)

    return nights * property.price
  }

  const totalPrice = calculateTotalPrice()

  // Check if selected dates are valid
  const isDateRangeValid = () => {
    if (!checkIn || !checkOut) return false

    const startDate = new Date(checkIn)
    const endDate = new Date(checkOut)

    // Check if checkout is after checkin
    if (!isAfter(endDate, startDate)) return false

    // Check if dates are not in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (isBefore(startDate, today)) return false

    // Check if dates are not booked
    for (const bookedDate of bookedDates) {
      const booked = parseISO(bookedDate)
      if (
        (isAfter(booked, startDate) || booked.getTime() === startDate.getTime()) &&
        (isBefore(booked, endDate) || booked.getTime() === endDate.getTime())
      ) {
        return false
      }
    }

    return true
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate inputs
      if (!checkIn || !checkOut || !guests || !name || !email || !phone) {
        throw new Error("Please fill in all required fields")
      }

      if (!isDateRangeValid()) {
        throw new Error("The selected dates are not available")
      }

      // Check availability
      const { available } = await checkPropertyAvailability(property.id, checkIn, checkOut)

      if (!available) {
        throw new Error("Sorry, these dates are no longer available")
      }

      // Create booking
      const result = await createBooking({
        property_id: property.id,
        name,
        email,
        phone,
        check_in: checkIn,
        check_out: checkOut,
        guests: Number.parseInt(guests),
        base_price: totalPrice,
        total_price: totalPrice, // Cleaning fee will be added by admin
      })

      if (!result.success) {
        throw new Error("Failed to create booking")
      }

      setBooking(result.booking)
      setBookingSubmitted(true)
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error creating booking:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle date input change with validation
  const handleCheckInChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value

    // Validate that the selected date is not in the past
    if (selectedDate < today) {
      setError("You cannot select a date in the past")
      return
    }

    setCheckIn(selectedDate)
    setError(null)

    // Clear checkout if it's before new checkin
    if (checkOut && checkOut <= selectedDate) {
      setCheckOut("")
    }
  }

  const handleCheckOutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value

    // Validate that the selected date is after check-in
    if (checkIn && selectedDate <= checkIn) {
      setError("Check-out date must be after check-in date")
      return
    }

    setCheckOut(selectedDate)
    setError(null)
  }

  return (
    <div>
      {bookingSubmitted ? (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gouna-blue-dark">Booking Request Sent!</h3>
          <p className="text-gray-600">
            Thank you for your booking request. You'll be redirected to upload your documents.
          </p>
          <div className="mt-6">
            <Button
              className="bg-gouna-blue hover:bg-gouna-blue-dark text-white"
              onClick={() => router.push(`/upload/${booking.id}`)}
            >
              Upload Documents
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="check-in">Check In</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="check-in"
                  className="pr-10"
                  value={checkIn}
                  onChange={handleCheckInChange}
                  min={today}
                  required
                />
                <Calendar className="h-4 w-4 absolute top-3 right-3 text-gray-500" />
              </div>
            </div>
            <div>
              <Label htmlFor="check-out">Check Out</Label>
              <div className="relative">
                <Input
                  type="date"
                  id="check-out"
                  className="pr-10"
                  value={checkOut}
                  onChange={handleCheckOutChange}
                  min={checkIn ? format(addDays(new Date(checkIn), 1), "yyyy-MM-dd") : today}
                  disabled={!checkIn}
                  required
                />
                <Calendar className="h-4 w-4 absolute top-3 right-3 text-gray-500" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="guests">Guests</Label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger id="guests">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(property.guests)].map((_, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>
                    {i + 1} {i === 0 ? "Guest" : "Guests"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {checkIn && checkOut && isDateRangeValid() && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <div className="flex justify-between">
                <span>Price per night</span>
                <span>${property.price}</span>
              </div>
              <div className="flex justify-between">
                <span>Nights</span>
                <span>{differenceInDays(new Date(checkOut), new Date(checkIn))}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">* Cleaning fee may be added by the property owner</p>
            </div>
          )}

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>

          <Button
            type="submit"
            className="w-full bg-gouna-sand hover:bg-gouna-sand-dark text-white"
            disabled={isSubmitting || !isDateRangeValid()}
          >
            {isSubmitting ? "Processing..." : "Request Booking"}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            By clicking "Request Booking", you agree to our terms and conditions.
          </p>
        </form>
      )}
    </div>
  )
}
