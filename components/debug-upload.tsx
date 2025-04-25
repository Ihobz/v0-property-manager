"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadPropertyImage } from "@/lib/blob"
import { Loader2 } from "lucide-react"

export function DebugUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)
    setError(null)

    try {
      const uploadResult = await uploadPropertyImage(file)
      setResult(uploadResult)

      if (!uploadResult.success) {
        setError(uploadResult.error || "Upload failed")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug Image Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="text-sm text-gray-600">
              <p>Name: {file.name}</p>
              <p>Size: {Math.round(file.size / 1024)} KB</p>
              <p>Type: {file.type}</p>
            </div>
          )}

          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Test Upload"
            )}
          </Button>

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          {result && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <pre className="whitespace-pre-wrap overflow-auto">{JSON.stringify(result, null, 2)}</pre>

              {result.url && (
                <div className="mt-2">
                  <p className="font-semibold">Image Preview:</p>
                  <img src={result.url || "/placeholder.svg"} alt="Uploaded" className="mt-2 max-h-40 rounded-md" />
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
