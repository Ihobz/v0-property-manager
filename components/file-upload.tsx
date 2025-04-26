"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, ImageIcon, AlertCircle, Loader2 } from "lucide-react"
import Image from "next/image"

type FileUploadProps = {
  onFileSelect: (file: File) => void
  onFileRemove?: () => void
  selectedFile: File | null
  previewUrl?: string
  accept?: string
  label?: string
  className?: string
  variant?: "default" | "image"
  error?: string
  disabled?: boolean
  maxSizeMB?: number
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  selectedFile,
  previewUrl,
  accept = "image/*",
  label = "Upload a file",
  className = "",
  variant = "default",
  error,
  disabled = false,
  maxSizeMB = 5, // Default 5MB max size
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Clear local error when external error changes
  useEffect(() => {
    if (error) {
      setLocalError(error)
    }
  }, [error])

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setLocalError(`File size exceeds ${maxSizeMB}MB limit`)
      return false
    }

    // Check file type if accept is specified
    if (accept && accept !== "*") {
      const acceptTypes = accept.split(",").map((type) => type.trim())
      const fileType = file.type

      // Special handling for common file types
      if (acceptTypes.includes("image/*") && fileType.startsWith("image/")) {
        return true
      }

      if (acceptTypes.includes("application/pdf") && fileType === "application/pdf") {
        return true
      }

      // Check if file type matches any accepted type
      const isAccepted = acceptTypes.some((type) => {
        if (type.includes("*")) {
          const typePrefix = type.split("*")[0]
          return fileType.startsWith(typePrefix)
        }
        return type === fileType
      })

      if (!isAccepted) {
        setLocalError(`File type not accepted. Please upload ${accept}`)
        return false
      }
    }

    setLocalError(null)
    return true
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled) return

    if (e.dataTransfer.files?.length) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        setIsLoading(true)
        onFileSelect(file)
        setIsLoading(false)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        setIsLoading(true)
        onFileSelect(file)
        setIsLoading(false)
      }
    }
  }

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setLocalError(null)
    onFileRemove?.()
  }

  // Show preview for an image if we have a file or previewUrl
  const hasFile = !!selectedFile || !!previewUrl
  const isImage = variant === "image" || accept.includes("image")

  const previewSrc = previewUrl || (selectedFile && isImage ? URL.createObjectURL(selectedFile) : null)

  return (
    <div className={className}>
      {hasFile ? (
        <div className="border rounded-md p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="font-medium truncate">{selectedFile?.name || "Uploaded file"}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
              disabled={disabled}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {isImage && previewSrc ? (
            <div className="relative h-40 w-full overflow-hidden rounded-md border">
              <Image
                src={previewSrc || "/placeholder.svg"}
                alt={selectedFile?.name || "Preview"}
                fill
                className="object-cover"
                onError={() => setLocalError("Failed to load image preview")}
              />
            </div>
          ) : (
            <div className="flex items-center px-3 py-2 bg-gray-50 rounded-md">
              <FileText className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600 truncate">{selectedFile?.name || "File uploaded"}</span>
              <span className="ml-auto text-xs text-gray-400">
                {selectedFile?.size ? `${Math.round(selectedFile.size / 1024)} KB` : ""}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center transition-colors ${
            isDragging ? "border-gouna-blue bg-gouna-blue/5" : localError ? "border-red-300" : "border-gray-300"
          } ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
        >
          {isLoading ? (
            <Loader2 className="h-10 w-10 text-gray-400 mb-3 animate-spin" />
          ) : isImage ? (
            <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
          )}

          <p className="text-sm text-gray-600 text-center mb-2">{label}</p>
          <p className="text-xs text-gray-500 text-center mb-4">
            {isLoading ? "Uploading..." : "Drag and drop, or click to browse"}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isLoading}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Browse"
            )}
          </Button>

          {localError && (
            <div className="flex items-center mt-3 text-red-500 text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              <span>{localError}</span>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-3">Max size: {maxSizeMB}MB</p>
        </div>
      )}
    </div>
  )
}
