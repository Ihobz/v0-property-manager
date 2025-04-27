import { NextResponse } from "next/server"
import { createAdminSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient()

    // Execute SQL directly to add the tenant_id column
    const { error } = await supabase.rpc("exec_sql", {
      query: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tenant_id TEXT[] DEFAULT '{}'::TEXT[]",
    })

    if (error) {
      console.error("Error adding tenant_id column:", error)

      // Try alternative approach with direct SQL
      try {
        const { error: directError } = await supabase.rpc("exec_sql", {
          query: "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS id_documents TEXT[] DEFAULT '{}'::TEXT[]",
        })

        if (directError) {
          return NextResponse.json(
            {
              error: directError.message,
              message: "Failed to add ID documents column. Please add it manually in Supabase.",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Added id_documents column to bookings table",
          columnAdded: "id_documents",
        })
      } catch (directErr) {
        return NextResponse.json(
          {
            error: directErr instanceof Error ? directErr.message : "Unknown error",
            message: "Failed to add any ID documents column. Please add it manually in Supabase.",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Added tenant_id column to bookings table",
      columnAdded: "tenant_id",
    })
  } catch (error) {
    console.error("Error in fix-schema route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        message:
          "Please add a column named 'tenant_id' or 'id_documents' of type TEXT[] to your bookings table manually.",
      },
      { status: 500 },
    )
  }
}
