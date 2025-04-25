"use server"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

// Type for property data
type PropertyData = {
  title: string
  short_description: string
  description: string
  location: string
  price: number
  bedrooms: number
  bathrooms: number
  guests: number
  amenities: string[]
  featured: boolean
}

// Get all properties
export async function getProperties() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching properties:", error)
      return { properties: [], error: error.message }
    }

    // Process properties to include images array
    const processedProperties = properties.map((property) => {
      const images = property.property_images
        ? property.property_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((img) => img.url)
        : []

      // Remove property_images from the property object
      const { property_images, ...propertyWithoutImages } = property

      return {
        ...propertyWithoutImages,
        images,
      }
    })

    return { properties: processedProperties, error: null }
  } catch (error) {
    console.error("Error in getProperties:", error)
    return { properties: [], error: "Failed to fetch properties" }
  }
}

// Get featured properties
export async function getFeaturedProperties() {
  try {
    const supabase = createServerSupabaseClient()

    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .eq("featured", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching featured properties:", error)
      return { properties: [], error: error.message }
    }

    // Process properties to include images array
    const processedProperties = properties.map((property) => {
      const images = property.property_images
        ? property.property_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((img) => img.url)
        : []

      // Remove property_images from the property object
      const { property_images, ...propertyWithoutImages } = property

      return {
        ...propertyWithoutImages,
        images,
      }
    })

    return { properties: processedProperties, error: null }
  } catch (error) {
    console.error("Error in getFeaturedProperties:", error)
    return { properties: [], error: "Failed to fetch featured properties" }
  }
}

// Get property by ID
export async function getPropertyById(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: property, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching property:", error)
      return { property: null, error: error.message }
    }

    // Process property to include images array
    const images = property.property_images
      ? property.property_images.sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((img) => img.url)
      : []

    // Remove property_images from the property object
    const { property_images, ...propertyWithoutImages } = property

    const processedProperty = {
      ...propertyWithoutImages,
      images,
    }

    return { property: processedProperty, error: null }
  } catch (error) {
    console.error("Error in getPropertyById:", error)
    return { property: null, error: "Failed to fetch property" }
  }
}

// Create a new property
export async function createProperty({
  property,
  imageUrls,
  primaryImageIndex = 0,
}: {
  property: PropertyData
  imageUrls: string[]
  primaryImageIndex: number
}) {
  try {
    console.log("Creating property with data:", property)
    console.log("Image URLs:", imageUrls)
    console.log("Primary image index:", primaryImageIndex)

    const supabase = createServerSupabaseClient()

    // Insert property
    const { data: newProperty, error: propertyError } = await supabase
      .from("properties")
      .insert([property])
      .select()
      .single()

    if (propertyError) {
      console.error("Error creating property in database:", propertyError)
      return { success: false, error: propertyError.message }
    }

    console.log("Property created in database:", newProperty.id)

    // Insert property images
    if (imageUrls.length > 0) {
      const propertyImages = imageUrls.map((url, index) => ({
        property_id: newProperty.id,
        url,
        is_primary: index === primaryImageIndex,
      }))

      console.log("Inserting property images:", propertyImages)

      const { error: imagesError } = await supabase.from("property_images").insert(propertyImages)

      if (imagesError) {
        console.error("Error adding property images to database:", imagesError)
        return { success: false, error: imagesError.message }
      }

      console.log("Property images added to database successfully")
    }

    // Revalidate paths
    revalidatePath("/properties")
    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true, property: newProperty }
  } catch (error) {
    console.error("Error in createProperty:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to create property" }
  }
}

// Update a property
export async function updateProperty({
  id,
  data,
  newImageUrls,
  imagesToDelete,
  primaryImageUrl,
}: {
  id: string
  data: Partial<PropertyData>
  newImageUrls?: string[]
  imagesToDelete?: string[]
  primaryImageUrl?: string
}) {
  try {
    const supabase = createServerSupabaseClient()

    // Update property
    const { error: updateError } = await supabase.from("properties").update(data).eq("id", id)

    if (updateError) {
      console.error("Error updating property:", updateError)
      return { success: false, error: updateError.message }
    }

    // Handle image updates

    // 1. Delete images if needed
    if (imagesToDelete && imagesToDelete.length > 0) {
      const { error: deleteError } = await supabase.from("property_images").delete().in("url", imagesToDelete)

      if (deleteError) {
        console.error("Error deleting property images:", deleteError)
        return { success: false, error: deleteError.message }
      }
    }

    // 2. Add new images if provided
    if (newImageUrls && newImageUrls.length > 0) {
      const newImages = newImageUrls.map((url) => ({
        property_id: id,
        url,
        is_primary: url === primaryImageUrl,
      }))

      const { error: addError } = await supabase.from("property_images").insert(newImages)

      if (addError) {
        console.error("Error adding new property images:", addError)
        return { success: false, error: addError.message }
      }
    }

    // 3. Update primary image if needed
    if (primaryImageUrl) {
      // First, set all images as non-primary
      await supabase.from("property_images").update({ is_primary: false }).eq("property_id", id)

      // Then set the selected image as primary
      const { error: primaryError } = await supabase
        .from("property_images")
        .update({ is_primary: true })
        .eq("url", primaryImageUrl)
        .eq("property_id", id)

      if (primaryError) {
        console.error("Error updating primary image:", primaryError)
        return { success: false, error: primaryError.message }
      }
    }

    // Revalidate paths
    revalidatePath("/properties")
    revalidatePath(`/properties/${id}`)
    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true }
  } catch (error) {
    console.error("Error in updateProperty:", error)
    return { success: false, error: "Failed to update property" }
  }
}

// Delete a property
export async function deleteProperty(id: string) {
  try {
    const supabase = createServerSupabaseClient()

    // Delete property (cascade will handle images)
    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) {
      console.error("Error deleting property:", error)
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/properties")
    revalidatePath("/")
    revalidatePath("/admin")

    // Redirect to admin page
    redirect("/admin")
  } catch (error) {
    console.error("Error in deleteProperty:", error)
    return { success: false, error: "Failed to delete property" }
  }
}
