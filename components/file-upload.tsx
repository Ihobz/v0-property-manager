"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
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
  error?: string // Add error prop
  disabled?: boolean // Add disabled prop
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
  error, // Add error prop
  disabled = false, // Add disabled prop
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files?.length) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelect(e.target.files[0])
    }
  }

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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
            isDragging ? "border-gouna-blue bg-gouna-blue/5" : error ? "border-red-300" : "border-gray-300"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
        >
          {isImage ? (
            <ImageIcon className="h-10 w-10 text-gray-400 mb-3" />
          ) : (
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
          )}

          <p className="text-sm text-gray-600 text-center mb-2">{label}</p>
          <p className="text-xs text-gray-500 text-center mb-4">Drag and drop, or click to browse</p>

          <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />

          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            Browse
          </Button>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
