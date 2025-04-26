"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createTestBooking } from "@/app/api/bookings/actions"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-provider"

export default function CreateTestBookingPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Redirect if not admin
  if (!isAdmin) {
    router.push("/admin/login")
    return null
  }

  const handleCreateTestBooking = async () => {
    setIsCreating(true)
    try {
      const result = await createTestBooking()
      setResult(result)

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Test booking created successfully",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create test booking",
        })
      }
    } catch (error) {
      console.error("Error creating test booking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create Test Booking</CardTitle>
          <CardDescription>Create a test booking with sample data for debugging purposes.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">This will create a test booking with the following details:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Name: Test User</li>
            <li>Email: test@example.com</li>
            <li>Check-in: 7 days from today</li>
            <li>Check-out: 14 days from today</li>
            <li>Status: Awaiting Payment</li>
          </ul>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/admin/bookings")}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateTestBooking}
            disabled={isCreating}
            className="bg-gouna-blue hover:bg-gouna-blue-dark text-white"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Test Booking"
            )}
          </Button>
        </CardFooter>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">{JSON.stringify(result, null, 2)}</pre>
          </CardContent>
          <CardFooter>
            {result.success && (
              <Button
                onClick={() => router.push("/admin/bookings")}
                className="bg-gouna-blue hover:bg-gouna-blue-dark text-white"
              >
                View Bookings
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
