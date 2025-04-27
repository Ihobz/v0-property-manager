"use client"

import { useState, useEffect } from "react"
import { getBookings } from "@/app/api/bookings/actions"
import { logError } from "@/lib/logging"
import { mockBookings } from "@/lib/mock-data" // Import mock data for fallback

export function useBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isMockData, setIsMockData] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 2

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    async function fetchBookings() {
      try {
        if (!isMounted) return

        setIsLoading(true)
        console.log(`useBookings: Fetching bookings... (Attempt ${retryCount + 1})`)

        // Increase timeout to 20 seconds (from 10)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 20000),
        )

        // Race the actual request against the timeout
        const result = (await Promise.race([getBookings(), timeoutPromise])) as any

        if (!isMounted) return

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
        setIsMockData(false)
      } catch (err) {
        if (!isMounted) return

        console.error("useBookings: Error fetching bookings:", err)

        // Log the error to the server
        try {
          logError("Error fetching bookings in useBookings hook", {
            error: err instanceof Error ? err.message : String(err),
            retryCount,
          })
        } catch (logErr) {
          console.error("Failed to log error:", logErr)
        }

        // If we haven't exceeded max retries, try again
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`)
          setRetryCount((prev) => prev + 1)
          // Don't set error or finish loading yet
          return
        }

        // We've exhausted retries, fall back to mock data
        console.log("Using mock data as fallback")
        setBookings(mockBookings)
        setIsMockData(true)
        setError(err instanceof Error ? err.message : "Failed to load bookings")
        setDebugInfo({
          catchError: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          usedMockData: true,
        })
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchBookings()

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [retryCount]) // Add retryCount as dependency to trigger retries

  return { bookings, isLoading, error, debugInfo, isMockData }
}
