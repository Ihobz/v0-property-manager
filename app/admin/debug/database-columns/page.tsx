"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export default function DatabaseColumnsPage() {
  const [tableName, setTableName] = useState("bookings")
  const [columns, setColumns] = useState<any[]>([])
  const [sampleRow, setSampleRow] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTableInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/debug/schema?table=${tableName}`)
      const data = await response.json()

      if (data.error) {
        setError(data.error)
      } else {
        setColumns(data.columns || [])
        setSampleRow(data.sampleRow || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableInfo()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Database Schema Inspector</h1>

      <div className="flex items-end gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="table-name" className="mb-2 block">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="Enter table name"
          />
        </div>
        <Button onClick={fetchTableInfo} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </>
          ) : (
            "Inspect Table"
          )}
        </Button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Table Columns</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
              </div>
            ) : columns.length > 0 ? (
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
                    {columns.map((column, index) => (
                      <tr key={index} className="border-b">
                        <td className="border p-2">{column.column_name}</td>
                        <td className="border p-2">{column.data_type}</td>
                        <td className="border p-2">{column.is_nullable === "YES" ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No columns found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Row</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gouna-blue" />
              </div>
            ) : sampleRow ? (
              <div className="overflow-x-auto">
                <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-96">
                  {JSON.stringify(sampleRow, null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sample data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
