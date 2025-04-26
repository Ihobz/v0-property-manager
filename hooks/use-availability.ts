"use client"

import { useState, useEffect } from "react"
import { getPropertyBookedDates } from "@/app/api/availability/actions"

// Export with both names for backward compatibility
export function usePropertyAvailability(propertyId: string) {
  const [bookedDates, setBookedDates] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookedDates() {
      try {
        setIsLoading(true)
        const { bookedDates, error } = await getPropertyBookedDates(propertyId)

        if (error) {
          setError(error)
        } else {
          setBookedDates(bookedDates)
          setError(null)
        }
      } catch (err) {
        setError("Failed to fetch availability data")
        console.error("Error fetching availability:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      fetchBookedDates()
    }
  }, [propertyId])

  return { bookedDates, isLoading, error }
}

// Add this alias export to fix the import error
export const useAvailability = usePropertyAvailability
