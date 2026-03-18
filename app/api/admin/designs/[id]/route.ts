import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { deleteDesignById, getDesignById, updateDesign } from "@/lib/db-supabase"
import type { Design } from "@/types/design"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const design = await getDesignById(id)

    if (!design) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 })
    }

    return NextResponse.json(design)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    const body = (await request.json()) as { name?: string; design?: Design }

    if (!body?.name && !body?.design) {
      return NextResponse.json({ error: "At least one of name or design is required" }, { status: 400 })
    }

    const updated = await updateDesign(id, {
      name: body.name?.trim(),
      design: body.design,
    })

    if (!updated) {
      return NextResponse.json({ error: "Design not found" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update design" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth()
    const { id } = await params
    await deleteDesignById(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete design" }, { status: 500 })
  }
}
