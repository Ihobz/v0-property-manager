"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { uploadPaymentProof, uploadTenantDocument } from "@/lib/blob"
import { AlertCircle, CheckCircle, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { logError } from "@/lib/logging"

interface FileUploadProps {
  bookingId: string
  uploadType: "payment" | "id"
  maxSizeMB?: number
  allowedTypes?: string[]
}

export function FileUpload({
  bookingId,
  uploadType,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)

    if (!selectedFile) {
      return
    }

    // Check file type
    if (allowedTypes && !allowedTypes.includes(selectedFile.type)) {
      setError(`Invalid file type. Please upload one of the following: ${allowedTypes.join(", ")}`)
      return
    }

    // Check file size
    if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxSizeMB}MB limit`)
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload")
      return
    }

    try {
      setUploading(true)
      setProgress(10)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Upload the file based on the upload type
      let result
      if (uploadType === "payment") {
        result = await uploadPaymentProof(file, bookingId)
      } else if (uploadType === "id") {
        result = await uploadTenantDocument(file, bookingId)
      } else {
        throw new Error("Invalid upload type")
      }

      clearInterval(progressInterval)

      if (!result.success) {
        throw new Error(result.error || "Upload failed")
      }

      setProgress(100)
      setSuccess(true)
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully.",
      })

      // Redirect to booking status page after a short delay
      setTimeout(() => {
        router.push(`/booking-status/${bookingId}`)
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload file"
      setError(errorMessage)
      logError("Upload failed", { bookingId, uploadType, error: errorMessage })
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: errorMessage,
      })
    } finally {
      setUploading(false)
    }
  }

  const resetFileInput = () => {
    setFile(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept={allowedTypes?.join(",")}
          disabled={uploading || success}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`flex flex-col items-center justify-center cursor-pointer ${
            uploading || success ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <Upload className="h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm font-medium">{file ? file.name : `Click to select a file or drag and drop`}</p>
          <p className="text-xs text-gray-500 mt-1">
            {`Supported formats: ${allowedTypes?.map((type) => type.split("/")[1]).join(", ")}`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{`Max size: ${maxSizeMB}MB`}</p>
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span>Upload successful! Redirecting to booking status...</span>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        {file && !uploading && !success && (
          <Button variant="outline" onClick={resetFileInput}>
            Reset
          </Button>
        )}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading || success}
          className={success ? "bg-green-600 hover:bg-green-700" : ""}
        >
          {uploading ? "Uploading..." : success ? "Uploaded" : "Upload"}
        </Button>
      </div>
    </div>
  )
}

// Add default export for backward compatibility
export default FileUpload
