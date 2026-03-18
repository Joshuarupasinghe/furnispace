import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyAdmin, createSession } from "@/lib/auth"
import { validateLoginCredentials } from "@/lib/validation"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const credentials = validateLoginCredentials(body)

    const admin = await verifyAdmin(credentials.email, credentials.password)
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await createSession(admin.id, admin.email)

    return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email } })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 })
  }
}

