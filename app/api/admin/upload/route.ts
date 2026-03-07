import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { uploadToR2, isValidImageFile, isValidModelFile } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const file = formData.get("file") as File
    const folder = (formData.get("folder") as string) || "uploads"
    const type = (formData.get("type") as string) || "image" // "image" or "model"

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (type === "image" && !isValidImageFile(file.name)) {
      return NextResponse.json(
        { error: "Invalid image file. Allowed: jpg, jpeg, png, webp" },
        { status: 400 }
      )
    }

    if (type === "model" && !isValidModelFile(file.name)) {
      return NextResponse.json(
        { error: "Invalid model file. Allowed: obj, mtl, glb, gltf" },
        { status: 400 }
      )
    }

    // Check file size (10MB for images, 50MB for models)
    const maxSize = type === "image" ? 10 * 1024 * 1024 : 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await uploadToR2(buffer, file.name, folder)

    return NextResponse.json({
      url: result.url,
      key: result.key,
      fileName: file.name,
    })
  } catch (error: any) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 })
  }
}
