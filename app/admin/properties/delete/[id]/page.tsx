"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getPropertyById, deleteProperty } from "@/app/api/properties/actions"
import { useAuth } from "@/lib/auth-provider"
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react"
import Image from "next/image"

export default function DeletePropertyPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProperty() {
      try {
        const { property, error } = await getPropertyById(propertyId)

        if (error || !property) {
          throw new Error("Failed to load property")
        }

        setProperty(property)
      } catch (err: any) {
        setError(err.message || "An error occurred")
        console.error("Error loading property:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [propertyId])

  if (!isAdmin) {
    router.push("/admin/login")
    return null
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      const { success, error } = await deleteProperty(propertyId)

      if (!success) {
        throw new Error(error || "Failed to delete property")
      }

      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error deleting property:", err)
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gouna-blue-dark">Delete Property</CardTitle>
          <CardDescription>
            Are you sure you want to delete this property? This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {property && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={property.images?.[0] || "/placeholder.svg?height=200&width=200"}
                    alt={property.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{property.title}</h3>
                  <p className="text-gray-600">{property.location}</p>
                </div>
              </div>

              <div className="bg-red-50 p-4 rounded-md border border-red-200">
                <p className="text-red-700 font-medium mb-2">Warning:</p>
                <p className="text-red-600">
                  Deleting this property will permanently remove it from the system. All associated images and booking
                  data will also be deleted.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                    </>
                  ) : (
                    "Delete Property"
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
