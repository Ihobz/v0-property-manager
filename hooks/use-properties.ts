"use client"

import { useState, useEffect } from "react"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export function useProperties() {
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true)
        const supabase = createClientSupabaseClient()

        const { data, error } = await supabase
          .from("properties")
          .select("*, property_images(url, is_primary)")
          .order("created_at", { ascending: false })

        if (error) {
          throw new Error(error.message)
        }

        // Process properties to include images array and ensure title is available
        const processedProperties = data.map((property) => {
          const images = property.property_images
            ? property.property_images
                .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                .map((img) => img.url)
            : []

          // Remove property_images from the property object
          const { property_images, ...propertyWithoutImages } = property

          // Ensure title is available (use name if title is not available)
          const title = property.title || property.name || property.short_description || "Unnamed Property"

          return {
            ...propertyWithoutImages,
            title,
            images,
          }
        })

        setProperties(processedProperties)
      } catch (err) {
        console.error("Error fetching properties:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch properties")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  return { properties, isLoading, error }
}
