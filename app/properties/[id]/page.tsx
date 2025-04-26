import { getPropertyById } from "@/app/api/properties/actions"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bed, Bath, Users, Check, MapPin } from "lucide-react"
import BookingForm from "./booking-form"

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const { property, error } = await getPropertyById(params.id)

  if (error || !property) {
    notFound()
  }

  // Ensure property has an id field
  const propertyWithId = {
    ...property,
    id: params.id, // Ensure the ID is explicitly set
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold text-gouna-blue-dark mb-2">{property.title}</h1>
      <div className="flex items-center text-gray-600 mb-8">
        <MapPin className="h-4 w-4 mr-1" />
        <span>{property.location}</span>
      </div>

      {/* Image Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <div className="relative h-[400px] rounded-lg overflow-hidden">
            <Image
              src={property.images?.[0] || "/placeholder.svg?height=600&width=800"}
              alt={property.title}
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
          {property.images?.slice(1, 3).map((image: string, index: number) => (
            <div key={index} className="relative h-[120px] rounded-lg overflow-hidden">
              <Image
                src={image || "/placeholder.svg?height=600&width=800"}
                alt={`${property.title} - Image ${index + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Property Details and Booking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs defaultValue="details">
            <TabsList className="mb-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">About This Property</h2>
                <p className="text-gray-600">{property.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gouna-blue-dark mb-2">Property Features</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Bed className="h-6 w-6 text-gouna-blue mb-2" />
                    <span className="text-sm text-gray-600">
                      {property.bedrooms} {property.bedrooms === 1 ? "Bedroom" : "Bedrooms"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Bath className="h-6 w-6 text-gouna-blue mb-2" />
                    <span className="text-sm text-gray-600">
                      {property.bathrooms} {property.bathrooms === 1 ? "Bathroom" : "Bathrooms"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                    <Users className="h-6 w-6 text-gouna-blue mb-2" />
                    <span className="text-sm text-gray-600">Up to {property.guests} Guests</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="amenities">
              <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {property.amenities.map((amenity: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-5 w-5 text-gouna-blue mr-2" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="location">
              <h2 className="text-xl font-semibold text-gouna-blue-dark mb-4">Location</h2>
              <div className="relative h-[300px] rounded-lg overflow-hidden bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-600">Map of {property.location}</p>
                  {/* In a real app, this would be a Google Map or similar */}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gouna-blue-dark mb-2">About the Area</h3>
                <p className="text-gray-600">
                  {property.location} is a beautiful area in El Gouna, offering easy access to beaches, restaurants, and
                  activities. The neighborhood is known for its charm and convenience.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-gouna-blue-dark">
                ${property.price} <span className="text-sm font-normal">/ night</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingForm property={propertyWithId} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
