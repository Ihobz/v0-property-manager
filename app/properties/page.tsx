import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProperties } from "@/app/api/properties/actions"
import { Bed, Bath, Users, Search } from "lucide-react"

export default async function PropertiesPage() {
  const { properties } = await getProperties()

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-gouna-blue-dark mb-8">Our Properties</h1>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Find Your Perfect Property</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="check-in">Check In</Label>
            <Input type="date" id="check-in" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="check-out">Check Out</Label>
            <Input type="date" id="check-out" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="guests">Guests</Label>
            <Select>
              <SelectTrigger id="guests" className="mt-1">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Guest</SelectItem>
                <SelectItem value="2">2 Guests</SelectItem>
                <SelectItem value="3">3 Guests</SelectItem>
                <SelectItem value="4">4 Guests</SelectItem>
                <SelectItem value="5">5 Guests</SelectItem>
                <SelectItem value="6+">6+ Guests</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button className="w-full bg-gouna-blue hover:bg-gouna-blue-dark text-white">
              <Search className="h-4 w-4 mr-2" /> Search
            </Button>
          </div>
        </div>
      </div>

      {/* Property Listings */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden group">
              <div className="relative h-64 overflow-hidden">
                <Image
                  src={property.images?.[0] || "/placeholder.svg?height=400&width=600"}
                  alt={property.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-0 left-0 bg-gouna-blue text-white px-4 py-2">
                  ${property.price} / night
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-2 text-gouna-blue-dark">{property.title}</h3>
                <p className="text-gray-600 mb-4">{property.short_description}</p>
                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    <span>
                      {property.bedrooms} {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    <span>
                      {property.bathrooms} {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>Up to {property.guests}</span>
                  </div>
                </div>
                <Button asChild className="w-full bg-gouna-sand hover:bg-gouna-sand-dark text-white">
                  <Link href={`/properties/${property.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No properties found.</p>
          <p className="text-gray-500">Please check back later or adjust your search criteria.</p>
        </div>
      )}
    </div>
  )
}
