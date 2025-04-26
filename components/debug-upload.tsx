"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadPropertyImage } from "@/lib/blob"
import { Loader2, AlertCircle } from "lucide-react"

export function DebugUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [blobConfig, setBlobConfig] = useState<any>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
    }
  }

  const checkBlobConfig = async () => {
    try {
      const response = await fetch("/api/check-blob-config")
      const data = await response.json()
      setBlobConfig(data)
      return data
    } catch (err) {
      setBlobConfig({
        isConfigured: false,
        message: err instanceof Error ? err.message : "Failed to check Blob configuration",
      })
      return null
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)
    setError(null)

    // First check if Blob is configured
    const configResult = await checkBlobConfig()
    if (configResult && !configResult.isConfigured) {
      setError(`Blob is not properly configured: ${configResult.message}`)
      setIsUploading(false)
      return
    }

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

          <div className="flex space-x-2">
            <Button onClick={handleUpload} disabled={!file || isUploading} className="flex-1">
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Test Upload"
              )}
            </Button>

            <Button onClick={checkBlobConfig} variant="outline">
              Check Blob Config
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm flex items-start">
              <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {blobConfig && (
            <div
              className={`p-3 rounded-md text-sm ${blobConfig.isConfigured ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}
            >
              <p className="font-medium">Blob Configuration:</p>
              <p>{blobConfig.message}</p>
              {blobConfig.testUrl && (
                <p className="mt-2">
                  Test URL:{" "}
                  <a href={blobConfig.testUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    {blobConfig.testUrl}
                  </a>
                </p>
              )}
            </div>
          )}

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
