import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getFeaturedProperties, getProperties } from "@/app/api/properties/actions"
import { Bed, Bath, Users, ArrowRight } from "lucide-react"
import { BookingStatusCheck } from "@/components/booking-status-check"

export default async function Home() {
  const { properties: allProperties } = await getProperties()
  const { properties: featuredPropertiesResult } = await getFeaturedProperties()

  // If no featured properties or less than 3, use the first 3 regular properties
  const featuredProperties = featuredPropertiesResult.length > 0 ? featuredPropertiesResult : allProperties.slice(0, 3)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center justify-center">
        <div className="absolute inset-0 bg-gouna-blue-dark/60 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/placeholder.svg?height=1080&width=1920')" }}
        />
        <div className="container relative z-20 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">Discover Your Perfect El Gouna Getaway</h1>
              <p className="text-xl md:text-2xl mb-8 max-w-3xl">
                Luxury villas, beachfront apartments, and more in Egypt's premier resort town
              </p>
              <Button asChild size="lg" className="bg-gouna-sand hover:bg-gouna-sand-dark text-white">
                <Link href="/properties">Browse Properties</Link>
              </Button>
            </div>
            <div className="hidden lg:block">
              <BookingStatusCheck />
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Booking Status Check */}
      <section className="py-8 bg-gray-50 lg:hidden">
        <div className="container">
          <BookingStatusCheck />
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold text-gouna-blue-dark">Featured Properties</h2>
            <Button
              asChild
              variant="outline"
              className="text-gouna-blue border-gouna-blue hover:bg-gouna-blue hover:text-white"
            >
              <Link href="/properties" className="flex items-center gap-2">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.map((property) => (
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
        </div>
      </section>

      {/* About El Gouna */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gouna-blue-dark mb-6">About El Gouna</h2>
              <p className="text-gray-600 mb-4">
                El Gouna is a modern resort town on Egypt's Red Sea, known for its lagoons, coral reefs, and sandy
                beaches. This self-sufficient, fully integrated town is built on 10 km of beach with 17 spectacular
                hotels.
              </p>
              <p className="text-gray-600 mb-6">
                The town offers a unique mix of simple pleasures and high-end leisure. You'll find beautiful beaches,
                thriving coral reefs, and endless water activities alongside gourmet restaurants, vibrant nightlife, and
                world-class golf courses.
              </p>
              <Button
                asChild
                variant="outline"
                className="text-gouna-blue border-gouna-blue hover:bg-gouna-blue hover:text-white"
              >
                <Link href="/about">Learn More About El Gouna</Link>
              </Button>
            </div>
            <div className="relative h-96 rounded-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=800&width=1200"
                alt="El Gouna Scenery"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gouna-blue text-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-12 text-center">What Our Guests Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/10 backdrop-blur-sm border-none">
              <CardContent className="p-6">
                <p className="italic mb-4">
                  "We had an amazing stay at the Luxury Lagoon Villa. The property was beautiful, clean, and exactly as
                  described. Monzer was an excellent host, very responsive and helpful. We'll definitely be back!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gouna-sand flex items-center justify-center text-white font-bold">
                    JS
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">John Smith</p>
                    <p className="text-sm text-gray-300">London, UK</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-none">
              <CardContent className="p-6">
                <p className="italic mb-4">
                  "The Downtown Apartment was perfect for our family vacation. Great location, comfortable beds, and all
                  the amenities we needed. The booking process was smooth and Monzer made sure we had everything we
                  needed during our stay."
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gouna-sand flex items-center justify-center text-white font-bold">
                    AH
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Ahmed Hassan</p>
                    <p className="text-sm text-gray-300">Cairo, Egypt</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-none">
              <CardContent className="p-6">
                <p className="italic mb-4">
                  "We loved our stay at the Beachfront Studio! The location was perfect - just steps from the beach. The
                  property was clean and had everything we needed for a relaxing vacation. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gouna-sand flex items-center justify-center text-white font-bold">
                    SJ
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-sm text-gray-300">New York, USA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gouna-sand-light">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-gouna-blue-dark mb-4">Ready to Book Your El Gouna Getaway?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
            Browse our selection of premium properties and find your perfect vacation rental today.
          </p>
          <Button asChild size="lg" className="bg-gouna-blue hover:bg-gouna-blue-dark text-white">
            <Link href="/properties">View All Properties</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
