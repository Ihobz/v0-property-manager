"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function UploadTestPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setUploadResult(null)
    }
  }

  const handleDirectUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setUploading(true)
    setError(null)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      const result = await response.json()
      setUploadResult(result.url)
      toast({
        title: "Upload successful",
        description: "File was uploaded successfully",
      })
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Upload Test</h1>
      <p className="text-gray-500 mb-8">
        This page allows you to test file uploads to verify that the upload functionality is working correctly.
      </p>

      <Tabs defaultValue="direct" className="space-y-6">
        <TabsList>
          <TabsTrigger value="direct">Direct API Upload</TabsTrigger>
          <TabsTrigger value="component">Component Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="direct">
          <Card>
            <CardHeader>
              <CardTitle>Direct API Upload</CardTitle>
              <CardDescription>Test uploading a file directly to the API endpoint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="file">Select File</Label>
                <Input id="file" type="file" onChange={handleFileChange} />
              </div>

              <Button onClick={handleDirectUpload} disabled={uploading || !file} className="flex items-center gap-2">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}

              {uploadResult && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  <p className="font-medium">Upload successful!</p>
                  <p className="mt-1 break-all">URL: {uploadResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="component">
          <Card>
            <CardHeader>
              <CardTitle>Component Upload</CardTitle>
              <CardDescription>Test the FileUpload component</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleFileUpload
                onUploadComplete={(url) => {
                  setUploadResult(url)
                  toast({
                    title: "Upload successful",
                    description: "File was uploaded successfully",
                  })
                }}
                onError={(err) => {
                  setError(err)
                  toast({
                    title: "Upload failed",
                    description: err,
                    variant: "destructive",
                  })
                }}
              />

              {error && (
                <div className="p-3 mt-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{error}</div>
              )}

              {uploadResult && (
                <div className="p-3 mt-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  <p className="font-medium">Upload successful!</p>
                  <p className="mt-1 break-all">URL: {uploadResult}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Simple file upload component for testing
function SimpleFileUpload({
  onUploadComplete,
  onError,
}: {
  onUploadComplete: (url: string) => void
  onError: (error: string) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      onError("Please select a file first")
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      const result = await response.json()
      onUploadComplete(result.url)
    } catch (err) {
      console.error("Upload error:", err)
      onError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="component-file">Select File</Label>
        <Input id="component-file" type="file" onChange={handleFileChange} />
      </div>

      <Button onClick={handleUpload} disabled={uploading || !file} className="flex items-center gap-2">
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            Upload File
          </>
        )}
      </Button>
    </div>
  )
}
