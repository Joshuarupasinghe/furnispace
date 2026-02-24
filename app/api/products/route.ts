import { NextResponse } from "next/server"
import { getAllProducts } from "@/lib/db-supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const products = await getAllProducts()
    const activeProducts = products.filter((product) => product.status === "active")
    return NextResponse.json(activeProducts)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch products" }, { status: 500 })
  }
}