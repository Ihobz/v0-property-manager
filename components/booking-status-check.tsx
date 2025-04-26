"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"

export function BookingStatusCheck() {
  const [bookingId, setBookingId] = useState("")
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!bookingId.trim()) {
      setError("Please enter a booking ID")
      return
    }

    if (!email.trim()) {
      setError("Please enter your email")
      return
    }

    // In a real implementation, you would verify the booking ID and email match
    // For now, we'll just redirect to a hypothetical status page
    router.push(`/booking-status/${bookingId}`)
  }

  return (
    <Card className="bg-white shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gouna-blue-dark">Check Booking Status</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="space-y-1">
            <Input
              placeholder="Booking ID"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              className="border-gray-300"
            />
          </div>
          <div className="space-y-1">
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-gray-300"
            />
          </div>
          <Button type="submit" className="w-full bg-gouna-sand hover:bg-gouna-sand-dark text-white">
            <Search className="h-4 w-4 mr-2" /> Check Status
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
