import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient()

    // First check if the column exists by getting a sample row
    const { data: sampleRow, error: sampleError } = await supabase.from("bookings").select("*").limit(1).maybeSingle()

    if (sampleError) {
      return NextResponse.json({ error: sampleError.message }, { status: 500 })
    }

    // Check if tenant_id column exists
    const hasColumn = sampleRow && "tenant_id" in sampleRow

    // If column doesn't exist, add it
    if (!hasColumn) {
      try {
        // Execute raw SQL to add the column
        // Note: This might not work with all Supabase configurations
        // as it requires raw SQL execution permissions
        const { error: alterError } = await supabase.rpc("execute_sql", {
          sql: "ALTER TABLE bookings ADD COLUMN tenant_id TEXT[] DEFAULT NULL",
        })

        if (alterError) {
          return NextResponse.json(
            {
              error: alterError.message,
              message:
                "Failed to add tenant_id column. You may need to add this column manually in the Supabase dashboard.",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Added tenant_id column to bookings table",
        })
      } catch (sqlError) {
        return NextResponse.json(
          {
            error: sqlError instanceof Error ? sqlError.message : "Unknown error",
            message:
              "Failed to add tenant_id column. You may need to add this column manually in the Supabase dashboard.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: hasColumn ? "tenant_id column already exists" : "Could not determine if column exists",
    })
  } catch (error) {
    console.error("Error in add-id-column route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
