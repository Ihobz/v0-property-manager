import { NextResponse } from "next/server"
import { getTableSchema, getSampleRow } from "@/lib/schema-inspector"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const table = url.searchParams.get("table") || "bookings"

  try {
    // Get the table schema
    const { columns, error: schemaError } = await getTableSchema(table)

    if (schemaError) {
      return NextResponse.json({ error: schemaError }, { status: 500 })
    }

    // Get a sample row
    const { row, error: rowError } = await getSampleRow(table)

    // Return the combined information
    return NextResponse.json({
      table,
      columns,
      sampleRow: row,
      rowError: rowError,
      columnNames: columns.map((col) => col.column_name),
    })
  } catch (error) {
    console.error(`Error in schema debug endpoint:`, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
