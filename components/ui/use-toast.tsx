"use client"

import { useState, useEffect } from "react"

type ToastProps = {
  title: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function toast({ title, description, variant = "default", duration = 5000 }: ToastProps) {
  // Create a custom event to trigger the toast
  const event = new CustomEvent("toast", {
    detail: {
      title,
      description,
      variant,
      duration,
    },
  })

  // Dispatch the event
  window.dispatchEvent(event)
}

export function useToast() {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const { title, description, variant, duration } = (event as CustomEvent).detail

      const id = Math.random().toString(36).substring(2, 9)

      setToasts((prev) => [...prev, { id, title, description, variant, duration }])

      // Auto-dismiss after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, duration)
    }

    window.addEventListener("toast", handleToast)

    return () => {
      window.removeEventListener("toast", handleToast)
    }
  }, [])

  return {
    toasts,
    dismiss: (id: string) => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    },
  }
}
