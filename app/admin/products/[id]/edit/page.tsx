import { redirect, notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getProductById, getAllCategories } from "@/lib/db-supabase"
import { ProductForm } from "@/components/admin/product-form"

export default async function EditProductPage({
  params,
}: {
  params: { id: string }
}) {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  const product = await getProductById(params.id)
  if (!product) {
    notFound()
  }

  const categories = await getAllCategories()
  const categoryNames = categories.map((c) => c.name)

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif tracking-wide text-foreground">Edit Product</h1>
        <p className="mt-1 text-sm text-muted-foreground">Update product details</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-semibold text-foreground">Product Details</h2>
        </div>
        <div className="p-6">
          <ProductForm product={product} categories={categoryNames} />
        </div>
      </div>
    </div>
  )
}
