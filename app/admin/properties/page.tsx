"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-provider"
import { useProperties } from "@/hooks/use-properties"
import { Loader2, Search, ArrowLeft, Edit, Trash, Calendar, Eye } from "lucide-react"

export default function AdminPropertiesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { properties, isLoading } = useProperties()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProperties, setFilteredProperties] = useState<any[]>([])

  useEffect(() => {
    if (!isAdmin) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  useEffect(() => {
    if (properties) {
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        setFilteredProperties(
          properties.filter(
            (property) =>
              property.title.toLowerCase().includes(term) ||
              property.location.toLowerCase().includes(term) ||
              property.description.toLowerCase().includes(term),
          ),
        )
      } else {
        setFilteredProperties(properties)
      }
    }
  }, [properties, searchTerm])

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
        <h1 className="text-3xl font-bold text-gouna-blue-dark mb-4 md:mb-0">Manage Properties</h1>

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

          <Button asChild className="bg-gouna-blue hover:bg-gouna-blue-dark text-white">
            <Link href="/admin/properties/new">Add New Property</Link>
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Image</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Location</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Bedrooms</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((property) => (
                    <tr key={property.id} className="border-b">
                      <td className="px-4 py-3">
                        <div className="h-16 w-16 relative rounded overflow-hidden">
                          <img
                            src={property.images?.[0] || "/placeholder.svg?height=200&width=200"}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{property.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{property.location}</td>
                      <td className="px-4 py-3 text-sm font-medium">${property.price}/night</td>
                      <td className="px-4 py-3 text-sm">{property.bedrooms}</td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/properties/${property.id}`}>
                              <span className="sr-only">View</span>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/admin/properties/edit/${property.id}`}>
                              <span className="sr-only">Edit</span>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 p-0">
                            <Link href={`/admin/properties/calendar/${property.id}`}>
                              <span className="sr-only">Calendar</span>
                              <Calendar className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Link href={`/admin/properties/delete/${property.id}`}>
                              <span className="sr-only">Delete</span>
                              <Trash className="h-4 w-4" />
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
