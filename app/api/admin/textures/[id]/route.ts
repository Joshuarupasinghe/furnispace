import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { adminService } from "@/lib/services"

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const texture = await adminService.textures.getTextureById(id)

    if (!texture) {
      return NextResponse.json({ error: "Texture not found" }, { status: 404 })
    }

    return NextResponse.json(texture)
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Unauthorized") }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = await request.json()

    const texture = await adminService.textures.updateTexture(id, body)

    if (!texture) {
      return NextResponse.json({ error: "Texture not found" }, { status: 404 })
    }

    return NextResponse.json(texture)
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: getErrorMessage(error, "Failed to update texture") }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const success = await adminService.textures.deleteTexture(id)

    if (!success) {
      return NextResponse.json({ error: "Texture not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to delete texture") }, { status: 500 })
  }
}
