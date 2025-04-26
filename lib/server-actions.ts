"use server"

import { cookies, headers } from "next/headers"

// Function to get headers that can be called from client components
export async function getRequestHeaders() {
  const headersList = headers()
  return {
    userAgent: headersList.get("user-agent") || "Unknown",
    referer: headersList.get("referer") || "",
    // Add any other headers you need
  }
}

// Function to get cookies that can be called from client components
export async function getRequestCookies() {
  const cookiesList = cookies()
  return {
    // Return any cookies you need
    // Example: theme: cookiesList.get('theme')?.value || 'light',
  }
}
