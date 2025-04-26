"use client"

import type React from "react"

import { AuthProvider } from "@/lib/auth-provider"
import { EnvironmentWarning } from "@/components/env-warning"
import { useAuth } from "@/lib/auth-provider"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { isAdmin } = useAuth()

  return (
    <AuthProvider>
      {isAdmin && <EnvironmentWarning />}
      {children}
    </AuthProvider>
  )
}
