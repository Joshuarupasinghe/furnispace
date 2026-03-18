import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { uploadToR2, isValidImageFile, isValidModelFile, isR2Configured } from "@/lib/r2"

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    if (!isR2Configured()) {
      console.error("R2 Configuration Error: Missing R2 environment variables")
      return NextResponse.json(
        { error: "Cloudflare R2 is not configured. Please set R2 environment variables." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = (formData.get("type") as string) || "image" // "image" or "model"
    const folder =
      (formData.get("folder") as string) || (type === "model" ? "products/models" : "products/images")

    if (type !== "image" && type !== "model") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 })
    }

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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Upload failed"
    console.error("Upload error:", message, error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
