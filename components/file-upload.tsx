"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { uploadFile } from "@/app/api/bookings/actions"
import { Loader2, Upload, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { logError } from "@/lib/logging"

interface FileUploadProps {
  bookingId: string
  uploadType: "payment" | "id"
  maxSizeMB?: number
  allowedTypes?: string[]
  redirectAfterUpload?: boolean
  redirectUrl?: string
  onUploadSuccess?: () => void
  multiple?: boolean
}

export function FileUpload({
  bookingId,
  uploadType,
  maxSizeMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
  redirectAfterUpload = false,
  redirectUrl,
  onUploadSuccess,
  multiple = uploadType === "id", // Default to true for ID documents
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    setUploadError(null)
    setUploadSuccess(false)

    if (!selectedFiles || selectedFiles.length === 0) {
      return
    }

    const newFiles: File[] = []
    let hasErrors = false

    // Check each file
    Array.from(selectedFiles).forEach((file) => {
      // Check file size
      if (file.size > maxSizeBytes) {
        setUploadError(`File ${file.name} exceeds the maximum allowed size of ${maxSizeMB}MB.`)
        hasErrors = true
        return
      }

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`File type not allowed for ${file.name}. Please upload ${allowedTypes.join(", ")}.`)
        hasErrors = true
        return
      }

      newFiles.push(file)
    })

    if (!hasErrors) {
      if (multiple) {
        setFiles((prev) => [...prev, ...newFiles])
      } else {
        setFiles(newFiles.slice(0, 1)) // Only keep the first file if multiple is false
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const simulateProgress = () => {
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval)
          return prev
        }
        return prev + 5
      })
    }, 100)
    return interval
  }

  const uploadCurrentFile = useCallback(
    async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("bookingId", bookingId)
      formData.append("uploadType", uploadType)

      const progressInterval = simulateProgress()

      try {
        const result = await uploadFile(formData)
        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!result.success) {
          setUploadError(result.error || `Failed to upload ${file.name}`)
          return false
        }

        return true
      } catch (error) {
        clearInterval(progressInterval)
        setUploadProgress(0)
        setUploadError(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        logError("File upload error", { error, fileName: file.name, bookingId, uploadType })
        return false
      }
    },
    [bookingId, uploadType],
  )

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadError("Please select at least one file to upload.")
      return
    }

    try {
      setIsUploading(true)
      setUploadError(null)

      let allSuccessful = true
      let successCount = 0

      // Upload files one by one
      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i)
        const success = await uploadCurrentFile(files[i])

        if (!success) {
          allSuccessful = false
          break
        }

        successCount++
      }

      // Check if all files were uploaded successfully
      if (allSuccessful && successCount === files.length) {
        setUploadSuccess(true)
        setFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        // Wait a moment to ensure database updates are complete
        setTimeout(() => {
          // Call the onUploadSuccess callback if provided
          if (onUploadSuccess) {
            onUploadSuccess()
          }

          // Redirect if specified
          if (redirectAfterUpload) {
            const url = redirectUrl || `/booking-status/${bookingId}`
            router.push(url)
          }
        }, 1000)
      }
    } catch (error) {
      setUploadError("An unexpected error occurred during upload.")
      console.error("Upload error:", error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          id={`file-upload-${uploadType}`}
          className="hidden"
          onChange={handleFileChange}
          accept={allowedTypes.join(",")}
          ref={fileInputRef}
          disabled={isUploading}
          multiple={multiple}
        />
        <label
          htmlFor={`file-upload-${uploadType}`}
          className={`flex-1 cursor-pointer border-2 border-dashed rounded-md p-4 text-center ${
            files.length > 0 ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            {files.length > 0 ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                <span className="text-sm font-medium">
                  {files.length} {files.length === 1 ? "file" : "files"} selected
                </span>
                <span className="text-xs text-gray-500">Click to add more files</span>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400" />
                <span className="text-sm font-medium">
                  {uploadType === "payment" ? "Select payment proof" : "Select ID document(s)"}
                </span>
                <span className="text-xs text-gray-500">
                  Click to browse or drag and drop (max {maxSizeMB}MB)
                  {multiple && " • You can select multiple files"}
                </span>
              </>
            )}
          </div>
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && !uploadSuccess && (
        <Button onClick={handleUpload} className="w-full" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading {currentFileIndex + 1} of {files.length}...
            </>
          ) : (
            `Upload ${files.length > 1 ? "Files" : "File"}`
          )}
        </Button>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-gray-500">
            {uploadProgress}% complete • File {currentFileIndex + 1} of {files.length}
          </p>
        </div>
      )}

      {uploadError && (
        <div className="flex items-center text-red-600 text-sm">
          <XCircle className="h-4 w-4 mr-1" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div className="flex items-center text-green-600 text-sm">
          <CheckCircle className="h-4 w-4 mr-1" />
          <span>Files uploaded successfully!</span>
        </div>
      )}
    </div>
  )
}
