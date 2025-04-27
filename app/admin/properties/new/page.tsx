"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { uploadPropertyImage } from "@/lib/blob"
import { createProperty } from "@/app/api/properties/actions"
// Change the import from auth-context to auth-provider
import { useAuth } from "@/lib/auth-provider"
import { Loader2, Plus, Trash, ArrowLeft } from "lucide-react"
// Add import for the Blob configuration check
import { checkBlobConfiguration } from "@/lib/check-blob-config"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

export default function NewPropertyPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()

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

  const [images, setImages] = useState<File[]>([])
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Add state for Blob configuration status
  const [blobConfigured, setBlobConfigured] = useState<boolean | null>(null)
  const [configMessage, setConfigMessage] = useState<string | null>(null)

  // Add useEffect to check Blob configuration on component mount
  useEffect(() => {
    async function checkConfig() {
      const { isConfigured, message } = await checkBlobConfiguration()
      setBlobConfigured(isConfigured)
      setConfigMessage(message)

      if (!isConfigured) {
        setError(`Image uploads are not available: ${message}`)
        toast({
          variant: "destructive",
          title: "Storage Configuration Error",
          description: message,
        })
      }
    }

    checkConfig()
  }, [])

  if (!isAdmin) {
    router.push("/admin/login")
    return null
  }

  const handleAddImage = (file: File) => {
    setImages((prev) => [...prev, file])
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
    if (primaryImageIndex === index) {
      setPrimaryImageIndex(0)
    } else if (primaryImageIndex > index) {
      setPrimaryImageIndex(primaryImageIndex - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Validate inputs
      if (!title || !shortDescription || !description || !location || !price || !bedrooms || !bathrooms || !guests) {
        throw new Error("Please fill in all required fields")
      }

      if (images.length === 0) {
        throw new Error("Please upload at least one image")
      }

      // Upload images to Vercel Blob
      const imageUrls: string[] = []
      let uploadedCount = 0

      for (const image of images) {
        const result = await uploadPropertyImage(image)

        if (!result.success || !result.url) {
          throw new Error(`Failed to upload image: ${result.error || "Unknown error"}`)
        }

        imageUrls.push(result.url)
        uploadedCount++
        setUploadProgress(Math.round((uploadedCount / images.length) * 50))
      }

      setUploadProgress(75)

      // Create property in database
      const amenitiesArray = amenities
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)

      const result = await createProperty({
        property: {
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
        imageUrls,
        primaryImageIndex,
      })

      setUploadProgress(100)

      if (!result.success) {
        throw new Error(result.error || "Failed to create property")
      }

      toast({
        title: "Success",
        description: "Property created successfully",
      })

      // Redirect to admin dashboard
      router.push("/admin")
    } catch (err: any) {
      setError(err.message || "An error occurred")
      console.error("Error creating property:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to create property",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gouna-blue-dark">Add New Property</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

          {isUploading && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Uploading property data...</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Property Title*</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Luxury Lagoon Villa"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location*</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="South Marina, El Gouna"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short-description">Short Description*</Label>
              <Input
                id="short-description"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Stunning 3-bedroom villa with private pool and lagoon views"
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
                placeholder="Provide a detailed description of the property..."
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
                  placeholder="250"
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
                  placeholder="3"
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
                  placeholder="2"
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
                  placeholder="6"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amenities">Amenities (comma-separated)*</Label>
              <Textarea
                id="amenities"
                value={amenities}
                onChange={(e) => setAmenities(e.target.value)}
                placeholder="Private Pool, Air Conditioning, WiFi, Fully Equipped Kitchen, BBQ Area, Beach Access, Parking"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="featured" checked={featured} onCheckedChange={setFeatured} />
              <Label htmlFor="featured">Featured Property</Label>
            </div>

            <div className="space-y-4">
              <Label>Property Images*</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative border rounded-md overflow-hidden">
                    <div className="relative h-40 w-full">
                      <img
                        src={URL.createObjectURL(image) || "/placeholder.svg"}
                        alt={`Property image ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 flex justify-between items-center">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={`primary-${index}`}
                          name="primary-image"
                          checked={primaryImageIndex === index}
                          onChange={() => setPrimaryImageIndex(index)}
                          className="mr-2"
                        />
                        <label htmlFor={`primary-${index}`} className="text-sm">
                          Primary
                        </label>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveImage(index)}
                        className="h-8 w-8 p-0 text-red-500"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {images.length < 5 && (
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
                )}
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Property...
                  </>
                ) : (
                  "Create Property"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
