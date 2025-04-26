"use server"

import { getSupabaseServerClient } from "@/lib/supabase/server"
import { logSystemEvent } from "@/lib/logging"

export async function createAdminUser(email: string) {
  try {
    const supabase = getSupabaseServerClient()

    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned"
      console.error("Error checking for existing admin:", checkError)
      await logSystemEvent("Error checking for existing admin", "error", { error: checkError.message })
      return { success: false, error: checkError.message }
    }

    if (existingAdmin) {
      return { success: true, message: "Admin already exists", admin: existingAdmin }
    }

    // Create new admin
    const { data: newAdmin, error: insertError } = await supabase.from("admins").insert([{ email }]).select().single()

    if (insertError) {
      console.error("Error creating admin:", insertError)
      await logSystemEvent("Error creating admin", "error", { error: insertError.message })
      return { success: false, error: insertError.message }
    }

    await logSystemEvent(`Admin user created: ${email}`, "info")
    return { success: true, admin: newAdmin }
  } catch (error: any) {
    console.error("Unexpected error creating admin:", error)
    await logSystemEvent("Unexpected error creating admin", "error", { error: String(error) })
    return { success: false, error: String(error) }
  }
}

export async function listAdminUsers() {
  try {
    const supabase = getSupabaseServerClient()

    const { data: admins, error } = await supabase.from("admins").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error listing admins:", error)
      await logSystemEvent("Error listing admins", "error", { error: error.message })
      return { success: false, error: error.message }
    }

    return { success: true, admins }
  } catch (error: any) {
    console.error("Unexpected error listing admins:", error)
    await logSystemEvent("Unexpected error listing admins", "error", { error: String(error) })
    return { success: false, error: String(error) }
  }
}

export async function deleteAdminUser(id: string) {
  try {
    const supabase = getSupabaseServerClient()

    // Get the admin email before deleting (for logging)
    const { data: admin } = await supabase.from("admins").select("email").eq("id", id).single()

    const { error } = await supabase.from("admins").delete().eq("id", id)

    if (error) {
      console.error("Error deleting admin:", error)
      await logSystemEvent("Error deleting admin", "error", { error: error.message })
      return { success: false, error: error.message }
    }

    await logSystemEvent(`Admin user deleted: ${admin?.email || id}`, "info")
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error deleting admin:", error)
    await logSystemEvent("Unexpected error deleting admin", "error", { error: String(error) })
    return { success: false, error: String(error) }
  }
}
