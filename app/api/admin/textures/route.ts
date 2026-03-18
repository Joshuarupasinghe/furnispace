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

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const typeParam = searchParams.get("type")
    const type = typeParam === "floor" || typeParam === "wall" ? typeParam : undefined

    const textures = await adminService.textures.getAllTextures(type)
    return NextResponse.json(textures)
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Unauthorized") }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()

    const texture = await adminService.textures.createTexture(body)
    return NextResponse.json(texture, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: getErrorMessage(error, "Failed to create texture") }, { status: 500 })
  }
}
