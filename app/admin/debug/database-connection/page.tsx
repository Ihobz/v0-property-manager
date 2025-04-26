"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function DatabaseConnectionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    setIsLoading(true)
    setError(null)
    setResults(null)

    try {
      const supabase = createClientSupabaseClient()

      // Test connection by querying system tables
      const { data: tablesData, error: tablesError } = await supabase
        .from("pg_tables")
        .select("schemaname, tablename")
        .eq("schemaname", "public")
        .limit(10)

      if (tablesError) {
        throw new Error(`Failed to query tables: ${tablesError.message}`)
      }

      // Test bookings table
      const { count: bookingsCount, error: bookingsError } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })

      if (bookingsError) {
        throw new Error(`Failed to query bookings: ${bookingsError.message}`)
      }

      // Test properties table
      const { count: propertiesCount, error: propertiesError } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })

      if (propertiesError) {
        throw new Error(`Failed to query properties: ${propertiesError.message}`)
      }

      // Test admins table
      const { count: adminsCount, error: adminsError } = await supabase
        .from("admins")
        .select("*", { count: "exact", head: true })

      if (adminsError) {
        throw new Error(`Failed to query admins: ${adminsError.message}`)
      }

      setResults({
        tables: tablesData,
        counts: {
          bookings: bookingsCount,
          properties: propertiesCount,
          admins: adminsCount,
        },
        connection: "Success",
      })
    } catch (err) {
      console.error("Error testing database connection:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <Button variant="ghost" className="mb-6" onClick={() => router.push("/admin/debug")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Debug
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testConnection} disabled={isLoading} className="mb-6">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing Connection...
              </>
            ) : (
              "Test Database Connection"
            )}
          </Button>

          {error && (
            <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="text-red-700 font-medium mb-2">Connection Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="text-green-700 font-medium">Connection Status: {results.connection}</h3>
              </div>

              <div>
                <h3 className="font-medium mb-2">Table Counts:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bookings: {results.counts.bookings}</li>
                  <li>Properties: {results.counts.properties}</li>
                  <li>Admins: {results.counts.admins}</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Available Tables:</h3>
                <div className="bg-gray-50 p-4 rounded-md overflow-auto max-h-60">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left px-2 py-1">Schema</th>
                        <th className="text-left px-2 py-1">Table</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.tables.map((table: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-gray-100" : ""}>
                          <td className="px-2 py-1">{table.schemaname}</td>
                          <td className="px-2 py-1">{table.tablename}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
