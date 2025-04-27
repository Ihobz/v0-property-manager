"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AuthStatusPage() {
  const { isAuthenticated, isAdmin, error, checkSession } = useAuth()
  const [sessionData, setSessionData] = useState<any>(null)
  const [adminData, setAdminData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checkError, setCheckError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          setCheckError(`Session error: ${sessionError.message}`)
          return
        }

        setSessionData(session)

        // If we have a session, check admin status
        if (session) {
          const { data: adminResult, error: adminError } = await supabase
            .from("admins")
            .select("*")
            .eq("email", session.user.email)
            .single()

          if (adminError && adminError.code !== "PGRST116") {
            setCheckError(`Admin check error: ${adminError.message}`)
          }

          setAdminData(adminResult)
        }
      } catch (err) {
        setCheckError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const handleRefreshSession = async () => {
    try {
      setLoading(true)
      await checkSession()

      // Refresh the page data
      const supabase = getSupabaseBrowserClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSessionData(session)

      if (session) {
        const { data } = await supabase.from("admins").select("*").eq("email", session.user.email).single()
        setAdminData(data)
      }
    } catch (err) {
      setCheckError(`Refresh error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Authentication Debug</CardTitle>
          <CardDescription>Current authentication state information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="font-semibold">Auth Context State:</div>
              <div>
                <div>isAuthenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}</div>
                <div>isAdmin: {isAdmin ? "✅ Yes" : "❌ No"}</div>
                <div>Error: {error || "None"}</div>
              </div>

              <div className="font-semibold">Session Check:</div>
              <div>
                {loading ? (
                  "Loading..."
                ) : checkError ? (
                  <div className="text-red-500">{checkError}</div>
                ) : (
                  <div>
                    <div>Has Session: {sessionData ? "✅ Yes" : "❌ No"}</div>
                    {sessionData && (
                      <>
                        <div>User Email: {sessionData.user.email}</div>
                        <div>Session Expires: {new Date(sessionData.expires_at * 1000).toLocaleString()}</div>
                      </>
                    )}
                    <div>Is Admin in DB: {adminData ? "✅ Yes" : "❌ No"}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleRefreshSession} disabled={loading}>
                Refresh Session Check
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/login")}>
                Go to Login Page
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Go to Admin Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Session Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(sessionData, null, 2) || "No session data"}
          </pre>

          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Raw Admin Data</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(adminData, null, 2) || "No admin data"}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
