"use client"

import { useState, useEffect } from "react"
import { getBookings, getBookingById } from "@/app/api/bookings/actions"

export function useBookings() {
  const [bookings, setBookings] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadBookings() {
      try {
        setIsLoading(true)
        const { bookings, error } = await getBookings()

        if (error) {
          throw error
        }

        setBookings(bookings)
      } catch (err) {
        setError(err)
        console.error("Error loading bookings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadBookings()
  }, [])

  return { bookings, isLoading, error }
}

export function useBooking(id: string) {
  const [booking, setBooking] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadBooking() {
      try {
        setIsLoading(true)
        const { booking, error } = await getBookingById(id)

        if (error) {
          throw error
        }

        setBooking(booking)
      } catch (err) {
        setError(err)
        console.error("Error loading booking:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadBooking()
    }
  }, [id])

  return { booking, isLoading, error }
}
