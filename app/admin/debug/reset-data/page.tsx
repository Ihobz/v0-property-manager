"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react"
import { resetAllData } from "@/app/api/admin/reset-data/actions"
import { useToast } from "@/components/ui/use-toast"
import { AdminAuthCheck } from "@/components/admin-auth-check"

export default function ResetDataPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [confirmation, setConfirmation] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (confirmation !== "DELETE ALL DATA") {
      toast({
        title: "Invalid confirmation",
        description: "Please type the confirmation phrase exactly as shown",
        variant: "destructive",
      })
      return
    }

    setIsResetting(true)
    setError(null)

    try {
      const result = await resetAllData()

      if (result.success) {
        toast({
          title: "Data reset successful",
          description: "All properties and bookings have been deleted",
        })
        // Wait a moment before redirecting to allow the toast to be seen
        setTimeout(() => {
          router.push("/admin")
          router.refresh()
        }, 1500)
      } else {
        setError(result.error || "An unknown error occurred")
        toast({
          title: "Reset failed",
          description: result.error || "An unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setError(errorMessage)
      toast({
        title: "Reset failed",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AdminAuthCheck>
      <div className="container py-12">
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => router.push("/admin/debug")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug Tools
          </Button>
          <h1 className="text-3xl font-bold text-gouna-blue-dark">Reset Database</h1>
        </div>

        <Card className="max-w-2xl mx-auto border-red-300">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              This action will permanently delete ALL properties and bookings from the database. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="font-medium text-red-800">To confirm deletion, type "DELETE ALL DATA" below:</p>
              </div>

              <Input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="border-red-300"
                placeholder="Type confirmation phrase here"
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-800">Error: {error}</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/admin/debug")}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={confirmation !== "DELETE ALL DATA" || isResetting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isResetting ? "Deleting..." : "Reset All Data"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AdminAuthCheck>
  )
}
