import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { nanoid } from "nanoid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    console.log(`Processing upload: ${file.name}, size: ${file.size}, type: ${file.type}`)

    // Upload to Vercel Blob
    const blob = await put(`${folder}/${nanoid()}-${file.name}`, file, {
      access: "public",
    })

    console.log("Upload successful:", blob.url)

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error("Upload error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
