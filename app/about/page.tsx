import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gouna-blue-dark mb-6">About El Gouna Rentals</h1>

        <div className="relative h-80 rounded-lg overflow-hidden mb-8">
          <Image src="/placeholder.svg?height=600&width=1200" alt="El Gouna Scenery" fill className="object-cover" />
        </div>

        <div className="prose max-w-none">
          <p>
            Welcome to El Gouna Rentals, your premier destination for finding the perfect vacation rental in the
            beautiful resort town of El Gouna, Egypt. We are dedicated to providing exceptional rental properties and
            personalized service to ensure your stay in El Gouna is nothing short of amazing.
          </p>

          <h2>Our Story</h2>
          <p>
            El Gouna Rentals was founded by Monzer, a passionate local with extensive knowledge of El Gouna and its
            unique offerings. With years of experience in the hospitality industry, Monzer recognized the need for a
            personalized rental service that connects visitors with the perfect properties while providing local
            insights and support throughout their stay.
          </p>

          <h2>Why Choose El Gouna Rentals</h2>
          <p>
            We pride ourselves on offering a curated selection of high-quality rental properties in El Gouna's most
            desirable locations. From luxurious villas with private pools to cozy beachfront apartments, we have
            accommodations to suit every preference and budget.
          </p>

          <p>What sets us apart:</p>

          <ul>
            <li>
              <strong>Local Expertise:</strong> As locals, we have intimate knowledge of El Gouna and can provide
              recommendations for the best restaurants, activities, and hidden gems.
            </li>
            <li>
              <strong>Personalized Service:</strong> We work closely with each guest to understand their needs and
              preferences, ensuring a tailored experience from booking to check-out.
            </li>
            <li>
              <strong>Quality Assurance:</strong> All our properties are carefully selected and regularly inspected to
              maintain the highest standards of comfort, cleanliness, and amenities.
            </li>
            <li>
              <strong>Seamless Booking Process:</strong> Our user-friendly platform makes it easy to find and book your
              ideal property, with transparent pricing and policies.
            </li>
          </ul>

          <h2>About El Gouna</h2>
          <p>
            El Gouna is a modern resort town located on Egypt's beautiful Red Sea coast, about 25 kilometers north of
            Hurghada. Known as "The Venice of Egypt," El Gouna is built around a series of lagoons and small islands
            connected by bridges and canals.
          </p>

          <p>This self-contained paradise offers:</p>

          <ul>
            <li>Pristine beaches with crystal-clear waters</li>
            <li>World-class diving and snorkeling sites</li>
            <li>Championship golf courses</li>
            <li>Vibrant marina areas with restaurants and shops</li>
            <li>Water sports and desert adventures</li>
            <li>A relaxed, cosmopolitan atmosphere</li>
          </ul>

          <p>
            El Gouna is known for its commitment to sustainable tourism and environmental protection, making it not only
            a beautiful destination but also an eco-conscious one.
          </p>

          <h2>Contact Us</h2>
          <p>
            We're here to help you plan your perfect El Gouna getaway. Whether you have questions about our properties,
            need recommendations for activities, or want to make a booking, don't hesitate to reach out.
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <Button asChild className="bg-gouna-blue hover:bg-gouna-blue-dark text-white">
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
