"use client"

import { useState, useEffect } from "react"
import { getProperties } from "@/app/api/properties/actions"

export function useProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true)
        const { properties: fetchedProperties, error: fetchError } = await getProperties()

        if (fetchError) {
          throw new Error(fetchError)
        }

        setProperties(fetchedProperties || [])
      } catch (err) {
        console.error("Error fetching properties:", err)
        setError(err instanceof Error ? err.message : "Failed to load properties")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return { properties, isLoading, error }
}
