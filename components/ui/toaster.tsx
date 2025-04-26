"use client"

import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, X } from "lucide-react"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg flex items-start justify-between transform transition-all duration-300 ease-in-out ${
            toast.variant === "destructive"
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-white text-gray-800 border border-gray-200"
          }`}
          role="alert"
        >
          <div className="flex items-start">
            {toast.variant === "destructive" ? (
              <AlertCircle className="h-5 w-5 mr-2 text-red-500 mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 mr-2 text-green-500 mt-0.5" />
            )}
            <div>
              <h3 className="font-medium">{toast.title}</h3>
              {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
            </div>
          </div>
          <button onClick={() => dismiss(toast.id)} className="ml-4 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
