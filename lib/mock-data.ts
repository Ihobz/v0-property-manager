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

// Mock bookings
export const mockBookings = [
  {
    id: "mock-booking-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    check_in: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 2,
    base_price: 1050,
    cleaning_fee: 50,
    total_price: 1100,
    status: "awaiting_payment",
    created_at: new Date().toISOString(),
    property_id: "mock-property-1",
    properties: mockProperties[0],
  },
  {
    id: "mock-booking-2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "+9876543210",
    check_in: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 4,
    base_price: 700,
    cleaning_fee: 50,
    total_price: 750,
    status: "confirmed",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    property_id: "mock-property-2",
    properties: mockProperties[1],
  },
  {
    id: "mock-booking-3",
    name: "Robert Johnson",
    email: "robert@example.com",
    phone: "+1122334455",
    check_in: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    check_out: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    guests: 3,
    base_price: 1050,
    cleaning_fee: 50,
    total_price: 1100,
    status: "completed",
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    property_id: "mock-property-1",
    properties: mockProperties[0],
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
