"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { seedInitialProperties } from "@/app/api/seed/actions"
import { useAuth } from "@/lib/auth-provider"
import { Loader2, Check, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()
  const router = useRouter()

  if (!isAdmin) {
    return null
  }

  const handleSeed = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await seedInitialProperties()

      if (result.success) {
        setSuccess(true)
      } else {
        setError("Failed to seed properties")
      }
    } catch (err) {
      console.error("Error seeding properties:", err)
      setError("An error occurred while seeding properties")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-12 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-gouna-blue-dark">Seed Database</CardTitle>
          <CardDescription>This will add sample properties to the database to help you get started.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start">
              <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gouna-blue-dark mb-2">Seeding Complete!</h3>
              <p className="text-gray-600 mb-6">Sample properties have been added to the database.</p>

              <div className="flex space-x-4 justify-center">
                <Button variant="outline" onClick={() => router.push("/admin")}>
                  Go to Dashboard
                </Button>
                <Button onClick={() => router.push("/properties")}>View Properties</Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="mb-6 text-gray-600">
                This will add 3 sample properties to your database. Use this to quickly populate your site with content
                for testing.
              </p>
              <Button onClick={handleSeed} disabled={isLoading} className="bg-gouna-blue hover:bg-gouna-blue-dark">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding...
                  </>
                ) : (
                  "Seed Database"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
