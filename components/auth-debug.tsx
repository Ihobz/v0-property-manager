"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-provider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function AuthDebug() {
  const { user, session, isAdmin, isLoading } = useAuth()
  const [authDetails, setAuthDetails] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkAuth = async () => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        throw error
      }

      setAuthDetails({
        session: data.session
          ? {
              ...data.session,
              access_token: data.session.access_token ? `${data.session.access_token.substring(0, 10)}...` : null,
              refresh_token: data.session.refresh_token ? `${data.session.refresh_token.substring(0, 10)}...` : null,
            }
          : null,
        user: data.session?.user
          ? {
              ...data.session.user,
              id: data.session.user.id ? `${data.session.user.id.substring(0, 10)}...` : null,
            }
          : null,
      })

      setError(null)
    } catch (err) {
      console.error("Auth check error:", err)
      setError(err instanceof Error ? err.message : "Failed to check auth")
      setAuthDetails(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Auth State:</p>
            <p className="text-sm">Loading: {isLoading ? "Yes" : "No"}</p>
            <p className="text-sm">User: {user ? "Authenticated" : "Not authenticated"}</p>
            <p className="text-sm">Admin: {isAdmin ? "Yes" : "No"}</p>
            {user && (
              <div className="mt-2">
                <p className="text-sm font-medium">User Email:</p>
                <p className="text-sm">{user.email}</p>
              </div>
            )}
          </div>

          <Button onClick={checkAuth} variant="outline" size="sm">
            Check Auth Details
          </Button>

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          {authDetails && (
            <div className="p-3 bg-gray-50 rounded-md">
              <pre className="text-xs overflow-auto whitespace-pre-wrap">{JSON.stringify(authDetails, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
