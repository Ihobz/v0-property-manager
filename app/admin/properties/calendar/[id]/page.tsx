"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { PropertyCalendar } from "@/components/property-calendar"
import { useAuth } from "@/lib/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function PropertyCalendarPage() {
  const params = useParams()
  const router = useRouter()
  const propertyId = params.id as string
  const { isAdmin } = useAuth()

  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  useEffect(() => {
    async function fetchProperty() {
      try {
        setIsLoading(true)
        const supabase = createClientSupabaseClient()

        const { data, error } = await supabase
          .from("properties")
          .select("id, title, location")
          .eq("id", propertyId)
          .single()

        if (error) {
          throw new Error(error.message)
        }

        setProperty(data)
      } catch (err) {
        console.error("Error fetching property:", err)
        setError(err instanceof Error ? err.message : "Failed to load property")
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      fetchProperty()
    }
  }, [propertyId])

  if (!isAdmin) {
    return null // We'll redirect in the useEffect
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="container py-12">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/properties")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
        </Button>

        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-red-600">{error || "Property not found"}</p>
          <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/properties")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gouna-blue-dark">{property.title} - Calendar</h1>
        <p className="text-gray-600">{property.location}</p>
      </div>

      <PropertyCalendar propertyId={propertyId} />
    </div>
  )
}
