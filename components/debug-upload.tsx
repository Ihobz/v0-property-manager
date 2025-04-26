// Update the debug-upload component to include more detailed error reporting
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
  const [detailedLogs, setDetailedLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setDetailedLogs((prev) => [...prev, `${new Date().toISOString().split("T")[1].split(".")[0]} - ${message}`])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
      setError(null)
      setDetailedLogs([])
      addLog(`File selected: ${e.target.files[0].name} (${e.target.files[0].size} bytes)`)
    }
  }

  const checkBlobConfig = async () => {
    try {
      addLog("Checking Blob configuration...")
      const response = await fetch("/api/check-blob-config")
      const data = await response.json()
      setBlobConfig(data)
      addLog(`Blob config check result: ${data.isConfigured ? "Configured" : "Not configured"}`)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to check Blob configuration"
      addLog(`Blob config check error: ${message}`)
      setBlobConfig({
        isConfigured: false,
        message,
      })
      return null
    }
  }

  const runDetailedTest = async () => {
    try {
      addLog("Running detailed Blob test...")
      const response = await fetch("/api/debug/blob-test")
      const data = await response.json()
      addLog(`Detailed test result: ${data.success ? "Success" : "Failed"}`)
      if (data.url) {
        addLog(`Test file uploaded to: ${data.url}`)
      }
      if (data.error) {
        addLog(`Test error: ${data.error}`)
      }
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run detailed test"
      addLog(`Detailed test error: ${message}`)
      return { success: false, error: message }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setResult(null)
    setError(null)
    setDetailedLogs([])
    addLog(`Starting upload process for file: ${file.name}`)

    // First check if Blob is configured
    const configResult = await checkBlobConfig()
    if (configResult && !configResult.isConfigured) {
      setError(`Blob is not properly configured: ${configResult.message}`)
      addLog(`Blob configuration error: ${configResult.message}`)
      setIsUploading(false)
      return
    }

    // Run detailed test
    const testResult = await runDetailedTest()
    if (!testResult.success) {
      setError(`Blob test failed: ${testResult.error}`)
      addLog(`Blob test failed: ${testResult.error}`)
      setIsUploading(false)
      return
    }

    try {
      addLog(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`)
      const uploadResult = await uploadPropertyImage(file)
      setResult(uploadResult)
      addLog(`Upload result: ${uploadResult.success ? "Success" : "Failed"}`)

      if (!uploadResult.success) {
        setError(uploadResult.error || "Upload failed")
        addLog(`Upload error: ${uploadResult.error || "Unknown error"}`)
      } else {
        addLog(`File uploaded successfully to: ${uploadResult.url}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      addLog(`Upload exception: ${message}`)
      if (err instanceof Error && err.stack) {
        addLog(`Stack trace: ${err.stack}`)
      }
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

            <Button onClick={runDetailedTest} variant="outline">
              Run Detailed Test
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

          {detailedLogs.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-md text-sm">
              <p className="font-medium mb-2">Detailed Logs:</p>
              <div className="bg-black text-green-400 p-2 rounded font-mono text-xs h-48 overflow-y-auto">
                {detailedLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
