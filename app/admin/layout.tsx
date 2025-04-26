import type React from "react"
import { AuthProvider } from "@/lib/auth-provider"
import { AdminAuthCheck } from "@/components/admin-auth-check"
import { Sidebar } from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthCheck>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-8">{children}</div>
        </div>
      </AdminAuthCheck>
    </AuthProvider>
  )
}
