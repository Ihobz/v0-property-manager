"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Plus, Pencil, Trash2, Calendar } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"
import { useProperties } from "@/hooks/use-properties"
import { toast } from "@/components/ui/use-toast"

export default function AdminPropertiesPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const { properties, isLoading, error } = useProperties()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    if (isAdmin === false) {
      router.push("/admin/login")
    }
  }, [isAdmin, router])

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load properties. Please try again.",
      })
    }
  }, [error])

  if (!isClient || isAdmin === false) {
    return null
  }

  const handleEditProperty = (id: string) => {
    router.push(`/admin/properties/edit/${id}`)
  }

  const handleDeleteProperty = (id: string) => {
    router.push(`/admin/properties/delete/${id}`)
  }

  const handleViewCalendar = (id: string) => {
    router.push(`/admin/properties/calendar/${id}`)
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Properties</h1>
        <Button onClick={() => router.push("/admin/properties/new")} className="bg-gouna-blue hover:bg-gouna-blue-dark">
          <Plus className="mr-2 h-4 w-4" /> Add New Property
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
        </div>
      ) : properties && properties.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Price/Night</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.name}</TableCell>
                    <TableCell>{property.location}</TableCell>
                    <TableCell>{property.property_type}</TableCell>
                    <TableCell className="text-right">${property.price}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditProperty(property.id)}
                          title="Edit Property"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteProperty(property.id)}
                          title="Delete Property"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleViewCalendar(property.id)}
                          title="View Calendar"
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500 mb-4">No properties found</p>
            <Button
              onClick={() => router.push("/admin/properties/new")}
              className="bg-gouna-blue hover:bg-gouna-blue-dark"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Property
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
