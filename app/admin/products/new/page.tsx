import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getAllCategories } from "@/lib/db-supabase"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  const categories = await getAllCategories()
  const categoryNames = categories.map((c) => c.name)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif tracking-wide text-foreground">Add New Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create a new furniture product</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-foreground">Product Details</h2>
        </div>
        <div className="p-6">
          <ProductForm categories={categoryNames} />
        </div>
      </div>
    </div>
  )
}
