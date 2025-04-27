export type Property = {
  id: string
  title: string
  description: string
  short_description: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  guests: number
  amenities: string[]
  images: string[]
  featured: boolean
}

export type Booking = {
  id: string
  property_id: string
  name: string
  email: string
  phone: string
  check_in: string
  check_out: string
  guests: number
  base_price: number
  cleaning_fee: number | null
  total_price: number
  status: "pending" | "awaiting_payment" | "awaiting_confirmation" | "confirmed" | "completed" | "cancelled"
  payment_proof: string | null
  tenant_id: string[] | null
  created_at: string
  updated_at: string | null
  // Include the property relation
  property?: Property
}

export const properties: Property[] = [
  {
    id: "prop1",
    title: "Luxury Lagoon Villa",
    short_description: "Stunning 3-bedroom villa with private pool and lagoon views",
    description:
      "Experience the ultimate in El Gouna luxury with this stunning 3-bedroom villa. Featuring a private pool, spacious terrace, and breathtaking lagoon views, this property is perfect for families or groups seeking a premium vacation experience. The villa is beautifully furnished with modern amenities and is located just minutes from downtown El Gouna and the beach.",
    location: "South Marina, El Gouna",
    price: 250,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    amenities: [
      "Private Pool",
      "Air Conditioning",
      "WiFi",
      "Fully Equipped Kitchen",
      "BBQ Area",
      "Beach Access",
      "Parking",
    ],
    images: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    featured: true,
  },
  // Other properties...
]

export const bookings: Booking[] = [
  {
    id: "book1",
    property_id: "prop1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+44 123 456 7890",
    check_in: "2025-05-10",
    check_out: "2025-05-17",
    guests: 4,
    base_price: 1750,
    cleaning_fee: 100,
    total_price: 1850,
    status: "confirmed",
    payment_proof: "/placeholder.svg?height=600&width=800",
    tenant_id: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    created_at: "2025-04-01T10:30:00Z",
    updated_at: null,
  },
  // Other bookings...
]
