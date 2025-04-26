import type { ReactNode } from "react"
import { AdminAuthCheck } from "@/components/admin-auth-check"

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminAuthCheck>{children}</AdminAuthCheck>
    </div>
  )
}
