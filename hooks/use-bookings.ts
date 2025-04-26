"use client"

import { useState, useEffect } from "react"
import { getBookings, getBookingById } from "@/app/api/bookings/actions"

export function useBookings(shouldFetch = true) {
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

    if (shouldFetch) {
      loadBookings()
    }
  }, [shouldFetch])

  return { bookings, isLoading, error }
}

export function useBooking(id: string, shouldFetch = true) {
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

    if (id && shouldFetch) {
      loadBooking()
    }
  }, [id, shouldFetch])

  return { booking, isLoading, error }
}
