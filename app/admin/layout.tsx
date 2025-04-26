"use client"

import type React from "react"

import { EnvironmentWarning } from "@/components/env-warning"

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <EnvironmentWarning />
      {children}
    </>
  )
}
