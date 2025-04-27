"use server"

import { createAdminDatabaseClient } from "@/lib/database/client"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logError, logInfo } from "@/lib/logging"

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

/**
 * Get all properties with proper error handling
 */
export async function getProperties() {
  try {
    const supabase = createAdminDatabaseClient()

    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .order("created_at", { ascending: false })

    if (error) {
      logError("Error fetching properties", { error })
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
    logError("Error in getProperties", { error })
    return { properties: [], error: "Failed to fetch properties" }
  }
}

/**
 * Get featured properties with proper error handling
 */
export async function getFeaturedProperties() {
  try {
    const supabase = createAdminDatabaseClient()

    const { data: properties, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .eq("featured", true)
      .order("created_at", { ascending: false })

    if (error) {
      logError("Error fetching featured properties", { error })
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
    logError("Error in getFeaturedProperties", { error })
    return { properties: [], error: "Failed to fetch featured properties" }
  }
}

/**
 * Get property by ID with proper error handling
 */
export async function getPropertyById(id: string) {
  try {
    if (!id) {
      return { property: null, error: "Invalid property ID" }
    }

    const supabase = createAdminDatabaseClient()

    const { data: property, error } = await supabase
      .from("properties")
      .select("*, property_images(url, is_primary)")
      .eq("id", id)
      .single()

    if (error) {
      logError("Error fetching property", { id, error })
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
    logError("Error in getPropertyById", { error })
    return { property: null, error: "Failed to fetch property" }
  }
}

/**
 * Create a new property with proper error handling and RLS bypass
 */
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
    logInfo("Creating property", { property, imageCount: imageUrls.length, primaryImageIndex })

    const supabase = createAdminDatabaseClient()

    // Start a transaction
    const { data: newProperty, error: propertyError } = await supabase
      .from("properties")
      .insert([property])
      .select()
      .single()

    if (propertyError) {
      logError("Error creating property in database", { propertyError, property })
      return { success: false, error: propertyError.message }
    }

    logInfo("Property created in database", { propertyId: newProperty.id })

    // Insert property images
    if (imageUrls.length > 0) {
      const propertyImages = imageUrls.map((url, index) => ({
        property_id: newProperty.id,
        url,
        is_primary: index === primaryImageIndex,
      }))

      logInfo("Inserting property images", { propertyId: newProperty.id, imageCount: propertyImages.length })

      const { error: imagesError } = await supabase.from("property_images").insert(propertyImages)

      if (imagesError) {
        logError("Error adding property images to database", { imagesError, propertyId: newProperty.id })
        return { success: false, error: imagesError.message }
      }

      logInfo("Property images added to database successfully", { propertyId: newProperty.id })
    }

    // Revalidate paths
    revalidatePath("/properties")
    revalidatePath("/")
    revalidatePath("/admin")

    return { success: true, property: newProperty }
  } catch (error) {
    logError("Error in createProperty", { error })
    return { success: false, error: error instanceof Error ? error.message : "Failed to create property" }
  }
}

/**
 * Update a property with proper error handling and RLS bypass
 */
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
    const supabase = createAdminDatabaseClient()

    // Update property
    const { error: updateError } = await supabase.from("properties").update(data).eq("id", id)

    if (updateError) {
      logError("Error updating property", { updateError, propertyId: id })
      return { success: false, error: updateError.message }
    }

    // Handle image updates

    // 1. Delete images if needed
    if (imagesToDelete && imagesToDelete.length > 0) {
      const { error: deleteError } = await supabase.from("property_images").delete().in("url", imagesToDelete)

      if (deleteError) {
        logError("Error deleting property images", { deleteError, propertyId: id })
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
        logError("Error adding new property images", { addError, propertyId: id })
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
        logError("Error updating primary image", { primaryError, propertyId: id })
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
    logError("Error in updateProperty", { error, propertyId: id })
    return { success: false, error: "Failed to update property" }
  }
}

/**
 * Delete a property with proper error handling and RLS bypass
 */
export async function deleteProperty(id: string) {
  try {
    const supabase = createAdminDatabaseClient()

    // Delete property (cascade will handle images)
    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) {
      logError("Error deleting property", { error, propertyId: id })
      return { success: false, error: error.message }
    }

    // Revalidate paths
    revalidatePath("/properties")
    revalidatePath("/")
    revalidatePath("/admin")

    // Redirect to admin page
    redirect("/admin")
  } catch (error) {
    logError("Error in deleteProperty", { error, propertyId: id })
    return { success: false, error: "Failed to delete property" }
  }
}
