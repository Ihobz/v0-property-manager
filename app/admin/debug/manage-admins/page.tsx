"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { createAdminUser, deleteAdminUser, listAdminUsers } from "@/app/api/admin/actions"

export default function ManageAdminsPage() {
  const [email, setEmail] = useState("")
  const [admins, setAdmins] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadAdmins = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await listAdminUsers()

      if (result.success) {
        setAdmins(result.admins || [])
      } else {
        setError(result.error || "Failed to load admin users")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await createAdminUser(email)

      if (result.success) {
        setSuccess(`Admin user ${email} created successfully`)
        setEmail("")
        loadAdmins()
      } else {
        setError(result.error || "Failed to create admin user")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteAdmin = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete admin ${email}?`)) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const result = await deleteAdminUser(id)

      if (result.success) {
        setSuccess(`Admin user ${email} deleted successfully`)
        loadAdmins()
      } else {
        setError(result.error || "Failed to delete admin user")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Manage Admin Users</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create Admin User</CardTitle>
            <CardDescription>
              Add a new admin user by email address. The user must have an account in Supabase Auth.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}

            {success && <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4">{success}</div>}

            <form onSubmit={handleCreateAdmin} className="flex gap-2">
              <Input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Admin
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>Manage existing admin users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : admins.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No admin users found</div>
            ) : (
              <div className="border rounded-md divide-y">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{admin.email}</div>
                      <div className="text-sm text-gray-500">
                        Created: {new Date(admin.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteAdmin(admin.id, admin.email)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
