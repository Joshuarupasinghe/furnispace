import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createDesign, getAllDesigns } from "@/lib/db-supabase"
import type { Design } from "@/types/design"

export async function GET() {
  try {
    await requireAuth()
    const designs = await getAllDesigns()
    return NextResponse.json(designs)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = (await request.json()) as { id?: string; name?: string; design?: Design }

    if (!body?.name?.trim() || !body?.design) {
      return NextResponse.json({ error: "name and design are required" }, { status: 400 })
    }

    const saved = await createDesign({
      id: body.id,
      name: body.name.trim(),
      design: body.design,
    })

    return NextResponse.json(saved, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create design" }, { status: 500 })
  }
}
