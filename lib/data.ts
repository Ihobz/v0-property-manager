export type Property = {
  id: string
  title: string
  description: string
  shortDescription: string
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
  propertyId: string
  name: string
  email: string
  phone: string
  checkIn: string
  checkOut: string
  guests: number
  basePrice: number
  cleaningFee: number | null
  totalPrice: number
  status: "pending" | "awaiting_payment" | "awaiting_confirmation" | "confirmed" | "completed" | "cancelled"
  paymentProof: string | null
  tenantIds: string[] | null
  createdAt: string
}

export const properties: Property[] = [
  {
    id: "prop1",
    title: "Luxury Lagoon Villa",
    shortDescription: "Stunning 3-bedroom villa with private pool and lagoon views",
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
  {
    id: "prop2",
    title: "Cozy Marina Apartment",
    shortDescription: "Modern 1-bedroom apartment with marina views",
    description:
      "This stylish 1-bedroom apartment offers the perfect blend of comfort and convenience. Located in the heart of Abu Tig Marina, you'll be steps away from restaurants, shops, and nightlife. The apartment features a fully equipped kitchen, comfortable living area, and a balcony with stunning marina views. Ideal for couples or solo travelers looking to experience the best of El Gouna.",
    location: "Abu Tig Marina, El Gouna",
    price: 120,
    bedrooms: 1,
    bathrooms: 1,
    guests: 2,
    amenities: ["Air Conditioning", "WiFi", "Fully Equipped Kitchen", "Marina View", "Pool Access", "24/7 Security"],
    images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    featured: true,
  },
  {
    id: "prop3",
    title: "Beachfront Studio",
    shortDescription: "Charming studio with direct beach access",
    description:
      "Wake up to the sound of waves in this charming beachfront studio. With direct access to one of El Gouna's pristine beaches, this cozy studio is perfect for beach lovers. The property features a comfortable sleeping area, kitchenette, and a private terrace where you can enjoy stunning sea views. Ideal for couples seeking a romantic getaway.",
    location: "Mangroovy Beach, El Gouna",
    price: 95,
    bedrooms: 0,
    bathrooms: 1,
    guests: 2,
    amenities: ["Beach Access", "Air Conditioning", "WiFi", "Kitchenette", "Sea View", "Beach Towels"],
    images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    featured: false,
  },
  {
    id: "prop4",
    title: "Family Golf Villa",
    shortDescription: "Spacious 4-bedroom villa overlooking the golf course",
    description:
      "This spacious 4-bedroom villa is perfect for families or groups looking for a luxurious stay in El Gouna. Located on the golf course, the property offers stunning views and a peaceful environment. The villa features a private pool, large garden, and spacious living areas. With 4 bedrooms and 3 bathrooms, there's plenty of space for everyone to relax and enjoy their vacation.",
    location: "Golf Area, El Gouna",
    price: 320,
    bedrooms: 4,
    bathrooms: 3,
    guests: 8,
    amenities: [
      "Private Pool",
      "Golf Course View",
      "Air Conditioning",
      "WiFi",
      "Fully Equipped Kitchen",
      "BBQ Area",
      "Parking",
      "Garden",
    ],
    images: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    featured: true,
  },
  {
    id: "prop5",
    title: "Downtown Apartment",
    shortDescription: "Centrally located 2-bedroom apartment",
    description:
      "Stay in the heart of El Gouna in this modern 2-bedroom apartment. Located in the downtown area, you'll be within walking distance of shops, restaurants, and entertainment. The apartment features a fully equipped kitchen, comfortable living area, and a balcony where you can enjoy your morning coffee. Perfect for small families or friends traveling together.",
    location: "Downtown, El Gouna",
    price: 150,
    bedrooms: 2,
    bathrooms: 1,
    guests: 4,
    amenities: ["Air Conditioning", "WiFi", "Fully Equipped Kitchen", "Balcony", "Pool Access", "Central Location"],
    images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    featured: false,
  },
  {
    id: "prop6",
    title: "Nubian-Style Villa",
    shortDescription: "Unique 3-bedroom villa with traditional architecture",
    description:
      "Experience the charm of traditional Nubian architecture in this unique 3-bedroom villa. The property features beautiful domed ceilings, colorful decor, and a private courtyard with a plunge pool. Located in a quiet neighborhood, you'll enjoy peace and privacy while still being just a short tuk-tuk ride from El Gouna's attractions. Perfect for those seeking an authentic Egyptian experience with modern comforts.",
    location: "West Golf, El Gouna",
    price: 280,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    amenities: [
      "Plunge Pool",
      "Air Conditioning",
      "WiFi",
      "Fully Equipped Kitchen",
      "Traditional Architecture",
      "Private Courtyard",
      "Parking",
    ],
    images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    featured: false,
  },
]

export const bookings: Booking[] = [
  {
    id: "book1",
    propertyId: "prop1",
    name: "John Smith",
    email: "john@example.com",
    phone: "+44 123 456 7890",
    checkIn: "2025-05-10",
    checkOut: "2025-05-17",
    guests: 4,
    basePrice: 1750,
    cleaningFee: 100,
    totalPrice: 1850,
    status: "confirmed",
    paymentProof: "/placeholder.svg?height=600&width=800",
    tenantIds: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    createdAt: "2025-04-01T10:30:00Z",
  },
  {
    id: "book2",
    propertyId: "prop2",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    phone: "+1 987 654 3210",
    checkIn: "2025-06-15",
    checkOut: "2025-06-22",
    guests: 2,
    basePrice: 840,
    cleaningFee: 50,
    totalPrice: 890,
    status: "awaiting_payment",
    paymentProof: null,
    tenantIds: null,
    createdAt: "2025-04-10T14:45:00Z",
  },
  {
    id: "book3",
    propertyId: "prop4",
    name: "Ahmed Hassan",
    email: "ahmed@example.com",
    phone: "+20 123 456 789",
    checkIn: "2025-05-20",
    checkOut: "2025-05-27",
    guests: 6,
    basePrice: 2240,
    cleaningFee: 150,
    totalPrice: 2390,
    status: "awaiting_confirmation",
    paymentProof: "/placeholder.svg?height=600&width=800",
    tenantIds: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    createdAt: "2025-04-05T09:15:00Z",
  },
]
