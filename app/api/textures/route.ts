import { NextRequest, NextResponse } from "next/server"
import { getAllTextures } from "@/lib/db-supabase"

export const dynamic = "force-dynamic"

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const typeParam = searchParams.get("type")
    const type = typeParam === "floor" || typeParam === "wall" ? typeParam : undefined

    const textures = await getAllTextures(type)
    return NextResponse.json(textures)
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error, "Failed to fetch textures") }, { status: 500 })
  }
}
