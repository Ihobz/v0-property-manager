/**
 * Mock data for use when database connection fails
 */

// Mock properties
export const mockProperties = [
  {
    id: "mock-property-1",
    title: "Luxury Villa with Pool",
    name: "Luxury Villa",
    location: "El Gouna, Egypt",
    description: "A beautiful villa with private pool in El Gouna.",
    price: 150,
    bedrooms: 3,
    bathrooms: 2,
    guests: 6,
    images: ["/images/el-gouna-villa.png"],
    amenities: ["Pool", "WiFi", "Air Conditioning", "Kitchen"],
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-property-2",
    title: "Beachfront Apartment",
    name: "Beachfront Apartment",
    location: "El Gouna, Egypt",
    description: "Modern apartment with stunning sea views.",
    price: 100,
    bedrooms: 2,
    bathrooms: 1,
    guests: 4,
    images: ["/images/el-gouna-apartment.png"],
    amenities: ["Beach Access", "WiFi", "Air Conditioning"],
    created_at: new Date().toISOString(),
  },
]

// Add or update the mockBookings array
export const mockBookings = [
  {
    id: "mock-booking-1",
    property_id: "mock-property-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 2,
    base_price: 700,
    total_price: 800,
    status: "awaiting_payment",
    created_at: new Date().toISOString(),
    properties: {
      id: "mock-property-1",
      name: "Luxury Villa",
      location: "El Gouna Marina",
      price: 100,
      bedrooms: 3,
      bathrooms: 2,
      guests: 6,
      description: "A beautiful villa with sea view",
    },
  },
  {
    id: "mock-booking-2",
    property_id: "mock-property-2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+1987654321",
    check_in: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 4,
    base_price: 1200,
    total_price: 1350,
    status: "confirmed",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    properties: {
      id: "mock-property-2",
      name: "Beachfront Apartment",
      location: "El Gouna Beach",
      price: 150,
      bedrooms: 2,
      bathrooms: 1,
      guests: 4,
      description: "Modern apartment with direct beach access",
    },
  },
  {
    id: "mock-booking-3",
    property_id: "mock-property-3",
    name: "Robert Johnson",
    email: "robert@example.com",
    phone: "+1122334455",
    check_in: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 2,
    base_price: 500,
    total_price: 550,
    status: "completed",
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    properties: {
      id: "mock-property-3",
      name: "Downtown Studio",
      location: "El Gouna Downtown",
      price: 75,
      bedrooms: 1,
      bathrooms: 1,
      guests: 2,
      description: "Cozy studio in the heart of downtown",
    },
  },
]

// Function to get mock bookings
export function getMockBookings() {
  console.log("Using mock bookings data as fallback")
  return {
    bookings: mockBookings,
    error: null,
    isMockData: true,
  }
}

// Function to get a mock booking by ID
export function getMockBookingById(id: string) {
  const booking = mockBookings.find((booking) => booking.id === id)

  if (!booking) {
    return {
      booking: null,
      error: "Booking not found",
      isMockData: true,
    }
  }

  return {
    booking,
    error: null,
    isMockData: true,
  }
}

// Function to get mock properties
export function getMockProperties() {
  return {
    properties: mockProperties,
    error: null,
    isMockData: true,
  }
}

// Function to get a mock property by ID
export function getMockPropertyById(id: string) {
  const property = mockProperties.find((property) => property.id === id)

  if (!property) {
    return {
      property: null,
      error: "Property not found",
      isMockData: true,
    }
  }

  return {
    property,
    error: null,
    isMockData: true,
  }
}
