"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { PropertyCalendar } from "@/components/property-calendar"

export default function PropertyCalendarPage({ params }: { params: { id: string } }) {
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && !authLoading && !isAuthenticated) {
      router.push("/admin/login")
    }
  }, [isClient, isAuthenticated, authLoading, router])

  useEffect(() => {
    async function fetchProperty() {
      if (!params.id || !isClient || authLoading || !isAuthenticated) return

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

    fetchProperty()
  }, [params.id, isClient, authLoading, isAuthenticated])

  if (!isClient || authLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-12">
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-yellow-700 mb-2">Authentication Required</h2>
            <p className="text-yellow-600">You need to be logged in as an admin to view this page.</p>
            <Button
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => router.push("/admin/login")}
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/admin/properties")} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Button>
      </div>

      <Card className="mb-8 border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-2xl font-bold">{property.title || property.name}</CardTitle>
          </div>
          <CardDescription>Manage availability, bookings, and blocked dates for this property</CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyCalendar propertyId={property.id} />
        </CardContent>
      </Card>
    </div>
  )
}
