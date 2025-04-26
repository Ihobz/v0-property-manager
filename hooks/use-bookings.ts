"use client"

import { useState, useEffect } from "react"
import { getBookings } from "@/app/api/bookings/actions"

export function useBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true)
        const { bookings: fetchedBookings, error: fetchError } = await getBookings()

        if (fetchError) {
          throw new Error(fetchError)
        }

        setBookings(fetchedBookings || [])
        console.log("Fetched bookings:", fetchedBookings)
      } catch (err) {
        console.error("Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  return { bookings, isLoading, error }
}
