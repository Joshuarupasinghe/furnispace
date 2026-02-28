import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { adminService } from "@/lib/services"

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const categories = await adminService.categories.getAllCategories()
    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()

    const category = await adminService.categories.createCategory(body)
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Failed to create category" }, { status: 500 })
  }
}
