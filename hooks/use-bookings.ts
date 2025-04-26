"use client"

import { useState, useEffect } from "react"
import { getBookings } from "@/app/api/bookings/actions"

export function useBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    async function fetchBookings() {
      try {
        setIsLoading(true)
        console.log("useBookings: Fetching bookings...")

        // Add a timeout to prevent infinite loading if the request fails
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 10000),
        )

        // Race the actual request against the timeout
        const result = (await Promise.race([getBookings(), timeoutPromise])) as any

        const { bookings: fetchedBookings, error: fetchError, details } = result

        if (fetchError) {
          console.error("useBookings: Error from getBookings:", fetchError, details)
          setDebugInfo({ error: fetchError, details })
          throw new Error(fetchError)
        }

        console.log("useBookings: Fetched bookings:", fetchedBookings)
        setDebugInfo({
          bookingsCount: fetchedBookings?.length || 0,
          firstBooking: fetchedBookings?.[0]
            ? {
                id: fetchedBookings[0].id,
                status: fetchedBookings[0].status,
                property: fetchedBookings[0].properties?.name || "Unknown",
              }
            : null,
        })

        setBookings(fetchedBookings || [])
      } catch (err) {
        console.error("useBookings: Error fetching bookings:", err)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
        setDebugInfo({
          catchError: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBookings()
  }, [])

  return { bookings, isLoading, error, debugInfo }
}
