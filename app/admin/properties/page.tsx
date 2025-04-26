"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { Loader2, Search, ArrowLeft, PlusCircle, Edit, Trash, Calendar } from "lucide-react"

export default function PropertiesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  useEffect(() => {
    async function fetchProperties() {
      try {
        setIsLoading(true)
        const supabase = createClientSupabaseClient()

        const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false })

        if (error) {
          throw new Error(error.message)
        }

        setProperties(data || [])
      } catch (err) {
        console.error("Error fetching properties:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProperties()
  }, [])

  useEffect(() => {
    if (properties) {
      let filtered = [...properties]

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        filtered = filtered.filter(
          (property) =>
            property.title?.toLowerCase().includes(term) ||
            property.location?.toLowerCase().includes(term) ||
            property.description?.toLowerCase().includes(term),
        )
      }

      setFilteredProperties(filtered)
    }
  }, [properties, searchTerm])

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

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold text-gouna-blue-dark mb-4 md:mb-0">Properties</h1>

        <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64"
            />
          </div>

          <Button asChild className="bg-gouna-blue hover:bg-gouna-blue-dark">
            <Link href="/admin/properties/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Property
            </Link>
          </Button>
        </div>
      </div>

      {filteredProperties.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Property</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Capacity</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Featured</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="font-medium">{property.title}</div>
                        <div className="text-xs text-gray-500">ID: {property.id.substring(0, 8)}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{property.location}</td>
                      <td className="px-4 py-3 text-sm">${property.price}/night</td>
                      <td className="px-4 py-3 text-sm">{property.guests} guests</td>
                      <td className="px-4 py-3 text-sm">
                        {property.is_featured ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Yes</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/admin/properties/edit/${property.id}`}>
                              <span className="sr-only">Edit</span>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/admin/properties/delete/${property.id}`}>
                              <span className="sr-only">Delete</span>
                              <Trash className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Link href={`/admin/properties/calendar/${property.id}`}>
                              <span className="sr-only">Calendar</span>
                              <Calendar className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No properties found</p>
          <p className="text-sm text-gray-500">Try adjusting your search or add a new property</p>
        </div>
      )}
    </div>
  )
}
