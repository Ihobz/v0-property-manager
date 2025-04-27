"use client"

import { useEffect } from "react"
import { setupGlobalErrorHandler } from "@/lib/error-handler"

export function ErrorBoundaryInitializer() {
  useEffect(() => {
    setupGlobalErrorHandler()
  }, [])

  return null
}
