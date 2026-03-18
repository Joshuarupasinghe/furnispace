import { NextRequest, NextResponse } from "next/server"
import { getObjectFromR2, isR2Configured } from "@/lib/r2"

export const runtime = "nodejs"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    if (!isR2Configured()) {
      return NextResponse.json({ error: "R2 is not configured" }, { status: 500 })
    }

    const { key: keyParts } = await params
    const key = keyParts.map((part) => decodeURIComponent(part)).join("/").replace(/^\/+/, "")

    if (!key || key.includes("..")) {
      return NextResponse.json({ error: "Invalid asset key" }, { status: 400 })
    }

    const object = await getObjectFromR2(key)
    const responseBody = Buffer.from(object.body)

    return new NextResponse(responseBody, {
      status: 200,
      headers: {
        "Content-Type": object.contentType || "application/octet-stream",
        "Cache-Control": object.cacheControl || "public, max-age=3600",
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Asset fetch failed"
    const lowered = message.toLowerCase()

    if (lowered.includes("nosuchkey") || lowered.includes("not found") || lowered.includes("404")) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    console.error("Asset proxy error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
