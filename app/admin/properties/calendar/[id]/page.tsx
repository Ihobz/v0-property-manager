"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { PropertyCalendar } from "@/components/property-calendar"

export default function PropertyCalendarPage({ params }: { params: { id: string } }) {
  const { isAdmin } = useAuth()
  const router = useRouter()
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

        const { data, error } = await supabase.from("properties").select("*").eq("id", params.id).single()

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

    if (params.id) {
      fetchProperty()
    }
  }, [params.id])

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

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Property</h2>
            <p className="text-red-600">{error || "Property not found"}</p>
            <Button className="mt-4 bg-red-600 hover:bg-red-700 text-white" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/properties")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
      </Button>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gouna-blue-dark">Calendar for {property.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 mb-6">
            <p>
              Use this calendar to view bookings and block dates for this property. You can block dates when the
              property is unavailable (e.g., for maintenance or owner stays).
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="font-medium">Green</span>: Confirmed bookings
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                <span className="font-medium">Blue</span>: Pending bookings (awaiting confirmation)
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                <span className="font-medium">Yellow</span>: Awaiting payment
              </li>
              <li>
                <span className="inline-block w-3 h-3 rounded-full bg-gray-500 mr-2"></span>
                <span className="font-medium">Gray</span>: Manually blocked dates
              </li>
            </ul>
          </div>

          <PropertyCalendar propertyId={property.id} />
        </CardContent>
      </Card>
    </div>
  )
}
