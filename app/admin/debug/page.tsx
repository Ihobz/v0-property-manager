"use client"

import { useAuth } from "@/lib/auth-provider"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DebugUpload } from "@/components/debug-upload"
import { EnvironmentStatus } from "@/components/env-status"
import { AuthDebug } from "@/components/auth-debug"
import { ArrowLeft } from "lucide-react"
import config from "@/lib/config"

export default function DebugPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()

  if (!isAdmin) {
    router.push("/admin/login")
    return null
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <h1 className="text-2xl font-bold text-gouna-blue-dark mb-6">Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <EnvironmentStatus />

        <Card>
          <CardHeader>
            <CardTitle>Client Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="font-semibold">NEXT_PUBLIC_SUPABASE_URL:</p>
                <p className="text-sm text-gray-600">{config.public.SUPABASE_URL ? "Set" : "Not set"}</p>
              </div>
              <div>
                <p className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY:</p>
                <p className="text-sm text-gray-600">{config.public.SUPABASE_ANON_KEY ? "Set" : "Not set"}</p>
              </div>
              <div>
                <p className="font-semibold">NEXT_PUBLIC_SITE_URL:</p>
                <p className="text-sm text-gray-600">{config.public.SITE_URL}</p>
              </div>
              <div>
                <p className="font-semibold">NEXT_PUBLIC_VERCEL_ENV:</p>
                <p className="text-sm text-gray-600">{config.public.VERCEL_ENV || "Not set"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <AuthDebug />
        <DebugUpload />
      </div>
    </div>
  )
}
