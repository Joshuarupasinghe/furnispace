import { redirect } from "next/navigation"
import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { getAllProducts, getAllCategories } from "@/lib/db-supabase"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ProductsTable } from "@/components/admin/products-table"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories()
  ])

  const categoryNames = categories.map((c) => c.name)

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-foreground">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your furniture products</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center">
          <p className="mb-4 text-muted-foreground">No products yet</p>
          <Link href="/admin/products/new">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Create your first product</Button>
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <ProductsTable products={products} categories={categoryNames} />
        </div>
      )}
    </div>
  )
}
