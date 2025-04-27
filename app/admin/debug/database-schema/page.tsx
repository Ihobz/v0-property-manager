"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseSchemaDebugPage() {
  const [tableInfo, setTableInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleRow, setSampleRow] = useState<any>(null)

  const fetchTableInfo = async (tableName: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/debug/table-info?table=${tableName}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setTableInfo(data.columns)
      }

      // Try to get a sample row
      const sampleResponse = await fetch(`/api/debug/sample-row?table=${tableName}`)
      const sampleData = await sampleResponse.json()

      if (!sampleData.error && sampleData.row) {
        setSampleRow(sampleData.row)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Database Schema Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Check Table Schema</CardTitle>
            <CardDescription>View column information for database tables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fetchTableInfo("bookings")} disabled={loading}>
                Bookings Table
              </Button>
              <Button onClick={() => fetchTableInfo("properties")} disabled={loading}>
                Properties Table
              </Button>
              <Button onClick={() => fetchTableInfo("property_images")} disabled={loading}>
                Property Images Table
              </Button>
              <Button onClick={() => fetchTableInfo("admins")} disabled={loading}>
                Admins Table
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading && <p className="text-center">Loading...</p>}

      {error && (
        <Card className="mb-8 border-red-300">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {tableInfo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Table Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 text-left">Column Name</th>
                    <th className="border p-2 text-left">Data Type</th>
                    <th className="border p-2 text-left">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {tableInfo.map((column: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="border p-2">{column.column_name}</td>
                      <td className="border p-2">{column.data_type}</td>
                      <td className="border p-2">{column.is_nullable ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {sampleRow && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Row</CardTitle>
            <CardDescription>A sample row from the selected table</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
                {JSON.stringify(sampleRow, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
