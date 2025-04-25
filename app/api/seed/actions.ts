"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function seedInitialProperties() {
  const supabase = createServerSupabaseClient()

  const properties = [
    {
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
      featured: true,
      images: [
        "/placeholder.svg?height=600&width=800",
        "/placeholder.svg?height=600&width=800",
        "/placeholder.svg?height=600&width=800",
      ],
    },
    {
      title: "Cozy Marina Apartment",
      short_description: "Modern 1-bedroom apartment with marina views",
      description:
        "This stylish 1-bedroom apartment offers the perfect blend of comfort and convenience. Located in the heart of Abu Tig Marina, you'll be steps away from restaurants, shops, and nightlife. The apartment features a fully equipped kitchen, comfortable living area, and a balcony with stunning marina views. Ideal for couples or solo travelers looking to experience the best of El Gouna.",
      location: "Abu Tig Marina, El Gouna",
      price: 120,
      bedrooms: 1,
      bathrooms: 1,
      guests: 2,
      amenities: ["Air Conditioning", "WiFi", "Fully Equipped Kitchen", "Marina View", "Pool Access", "24/7 Security"],
      featured: true,
      images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    },
    {
      title: "Beachfront Studio",
      short_description: "Charming studio with direct beach access",
      description:
        "Wake up to the sound of waves in this charming beachfront studio. With direct access to one of El Gouna's pristine beaches, this cozy studio is perfect for beach lovers. The property features a comfortable sleeping area, kitchenette, and a private terrace where you can enjoy stunning sea views. Ideal for couples seeking a romantic getaway.",
      location: "Mangroovy Beach, El Gouna",
      price: 95,
      bedrooms: 0,
      bathrooms: 1,
      guests: 2,
      amenities: ["Beach Access", "Air Conditioning", "WiFi", "Kitchenette", "Sea View", "Beach Towels"],
      featured: false,
      images: ["/placeholder.svg?height=600&width=800", "/placeholder.svg?height=600&width=800"],
    },
  ]

  for (const property of properties) {
    // Insert property
    const { data: newProperty, error } = await supabase
      .from("properties")
      .insert({
        title: property.title,
        short_description: property.short_description,
        description: property.description,
        location: property.location,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        guests: property.guests,
        amenities: property.amenities,
        featured: property.featured,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating property:", error)
      continue
    }

    // Insert images
    for (let i = 0; i < property.images.length; i++) {
      await supabase.from("property_images").insert({
        property_id: newProperty.id,
        url: property.images[i],
        is_primary: i === 0,
      })
    }
  }

  revalidatePath("/properties")
  revalidatePath("/")

  return { success: true }
}
