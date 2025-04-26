"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function AuthTestPage() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSession = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClientSupabaseClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw new Error(`Session error: ${error.message}`)
      }

      // Check admin status
      let adminData = null
      if (data.session?.user) {
        const { data: admin, error: adminError } = await supabase
          .from("admins")
          .select("*")
          .eq("email", data.session.user.email)
          .single()

        if (!adminError) {
          adminData = admin
        }
      }

      setSessionInfo({
        session: data.session,
        admin: adminData,
      })
    } catch (err) {
      console.error("Error checking session:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/debug")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Auth Context Status:</h3>
              <div className="p-4 bg-gray-50 rounded-md">
                <p>
                  <strong>Is Admin:</strong> {isAdmin === null ? "Loading..." : isAdmin ? "Yes" : "No"}
                </p>
                <p>
                  <strong>User:</strong> {user ? user.email : "Not logged in"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Session Information:</h3>
              <Button onClick={checkSession} disabled={isLoading} className="mb-4">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
                  </>
                ) : (
                  "Refresh Session Info"
                )}
              </Button>

              {error && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-red-700 font-medium mb-2">Error</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {sessionInfo && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">Session Details:</h4>
                  <pre className="text-xs overflow-auto max-h-60 bg-gray-100 p-2 rounded">
                    {JSON.stringify(sessionInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => router.push("/admin/login")}>Go to Login Page</Button>
              <Button
                variant="outline"
                onClick={async () => {
                  const supabase = createClientSupabaseClient()
                  await supabase.auth.signOut()
                  router.push("/admin/login")
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
