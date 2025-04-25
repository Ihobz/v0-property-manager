"use client"

import { useState, useEffect } from "react"
import { getProperties, getPropertyById } from "@/app/api/properties/actions"

export function useProperties() {
  const [properties, setProperties] = useState<any[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadProperties() {
      try {
        setIsLoading(true)
        const { properties, error } = await getProperties()

        if (error) {
          throw error
        }

        setProperties(properties)
      } catch (err) {
        setError(err)
        console.error("Error loading properties:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadProperties()
  }, [])

  return { properties, isLoading, error }
}

export function useProperty(id: string) {
  const [property, setProperty] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    async function loadProperty() {
      try {
        setIsLoading(true)
        const { property, error } = await getPropertyById(id)

        if (error) {
          throw error
        }

        setProperty(property)
      } catch (err) {
        setError(err)
        console.error("Error loading property:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      loadProperty()
    }
  }, [id])

  return { property, isLoading, error }
}
