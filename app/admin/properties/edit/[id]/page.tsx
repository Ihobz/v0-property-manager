"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { uploadPropertyImage } from "@/lib/blob"
import { getPropertyById, updateProperty } from "@/app/api/properties/actions"
// Change the import from auth-context to auth-provider
import { useAuth } from "@/lib/auth-provider"
import { Loader2, Plus, Trash, ArrowLeft } from "lucide-react"

export default function EditPropertyPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string

  const [property, setProperty] = useState<any>(null)
  const [title, setTitle] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [price, setPrice] = useState("")
  const [bedrooms, setBedrooms] = useState("")
  const [bathrooms, setBathrooms] = useState("")
  const [guests, setGuests] = useState("")
  const [amenities, setAmenities] = useState("")
  const [featured, setFeatured] = useState(false)

  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [primaryImageUrl, setPrimaryImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProperty() {
      try {
        const { property, error } = await getPropertyById(propertyId)

        if (error || !property) {
          throw new Error("Failed to load property")
        }

        setProperty(property)
        setTitle(property.title)
        setShortDescription(property.short_description)
        setDescription(property.description)
        setLocation(property.location)
        setPrice(property.price.toString())
        setBedrooms(property.bedrooms.toString())
        setBathrooms(property.bathrooms.toString())
        setGuests(property.guests.toString())
        setAmenities(property.amenities.join(", "))
        setFeatured(property.featured)
        setExistingImages(property.images || [])

        // Set the primary image (first image is primary by default)
        if (property.images && property.images.length > 0) {
          setPrimaryImageUrl(property.images[0])
        }
      } catch (err: any) {
        setError(err.message || "An error occurred")
        console.error("Error loading property:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (propertyId) {
      loadProperty()
    }
  }, [propertyId])

  if (!isAdmin) {
    router.push("/admin/login")
    return null
  }

  const handleAddImage = (file: File) => {
    setNewImages((prev) => [...prev, file])
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url))
    if (primaryImageUrl === url && existingImages.length > 1) {
      // Set a new primary image if the removed one was primary
      setPrimaryImageUrl(existingImages.find((img) => img !== url) || "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsUploading(true)

    try {
      // Validate inputs
      if (!title || !shortDescription || !description || !location || !price || !bedrooms || !bathrooms || !guests) {
        throw new Error("Please fill in all required fields")
      }

      if (existingImages.length === 0 && newImages.length === 0) {
        throw new Error("Please upload at least one image")
      }

      // Upload new images to Vercel Blob
      const newImageUrls: string[] = []
      for (const image of newImages) {
        const result = await uploadPropertyImage(image)
        if (!result.success || !result.url) {
          throw new Error("Failed to upload image")
        }
        newImageUrls.push(result.url)
      }

      // Determine images to delete (compare original property images with current existingImages)
      const imagesToDelete = property.images.filter((url: string) => !existingImages.includes(url))

      // Create property in database
      const amenitiesArray = amenities
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      const result = await updateProperty({
        id: propertyId,
        data: {
          title,
          short_description: shortDescription,
          description,
          location,
          price: Number.parseFloat(price),
          bedrooms: Number.parseInt(bedrooms),
          bathrooms: Number.parseInt(bathrooms),
          guests: Number.parseInt(guests),
          amenities: amenitiesArray,
          featured,
        },
        newImageUrls: newImageUrls.length > 0 ? newImageUrls : undefined,
        imagesToDelete: imagesToDelete.length > 0 ? imagesToDelete : undefined,
        primaryImageUrl: primaryImageUrl || undefined,
      })

      if (!result.success) {
        throw new Error("Failed to update property")
      }

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error updating property:", err)
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
      </div>
    )
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gouna-blue-dark">Edit Property</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title*</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location*</Label>
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">Short Description*</Label>
              <Input
                id="short-description"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description*</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price per Night ($)*</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms*</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms*</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guests">Max Guests*</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)*</Label>
              <Textarea id="amenities" value={amenities} onChange={(e) => setAmenities(e.target.value)} required />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              <Label htmlFor="featured">Featured Property</Label>
            </div>

            <div className="space-y-4">
              <Label>Existing Images</Label>
              {existingImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingImages.map((imageUrl, index) => (
                    <div key={index} className="relative border rounded-md overflow-hidden">
                      <div className="relative h-40 w-full">
                        <img
                          src={imageUrl || "/placeholder.svg"}
                          alt={`Property image ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 flex justify-between items-center">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={`primary-existing-${index}`}
                            name="primary-image"
                            checked={primaryImageUrl === imageUrl}
                            onChange={() => setPrimaryImageUrl(imageUrl)}
                            className="mr-2"
                          />
                          <label htmlFor={`primary-existing-${index}`} className="text-sm">
                            Primary
                          </label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExistingImage(imageUrl)}
                          className="h-8 w-8 p-0 text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No existing images</p>
              )}
            </div>

            <div className="space-y-4">
              <Label>Add New Images</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newImages.map((image, index) => (
                  <div key={index} className="relative border rounded-md overflow-hidden">
                    <div className="relative h-40 w-full">
                      <img
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={`New property image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveNewImage(index)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="border-2 border-dashed rounded-md flex flex-col items-center justify-center p-4 h-40">
                  <input
                    type="file"
                    id="add-image"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleAddImage(e.target.files[0])}
                  />
                  <Button type="button" variant="ghost" onClick={() => document.getElementById("add-image")?.click()}>
                    <Plus className="h-6 w-6 mr-2" /> Add Image
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-gouna-blue hover:bg-gouna-blue-dark text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Property...
                  </>
                ) : (
                  "Update Property"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
