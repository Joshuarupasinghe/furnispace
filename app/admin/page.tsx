import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { getAllProducts, getAllCategories } from "@/lib/db-supabase"
import { Box, FolderTree, DollarSign, TrendingUp, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboardPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  const products = await getAllProducts()
  const categories = await getAllCategories()
  const activeProducts = products.filter((p) => p.status === "active").length
  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0)

  const stats = [
    {
      name: "Total Products",
      value: products.length,
      icon: Box,
      description: `${activeProducts} active`,
    },
    {
      name: "Categories",
      value: categories.length,
      icon: FolderTree,
      description: "Product categories",
    },
    {
      name: "Total Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "All time",
    },
    {
      name: "Active Products",
      value: activeProducts,
      icon: TrendingUp,
      description: "Currently available",
    },
  ]

  return (
    <div className="mx-auto max-w-7xl p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-serif tracking-wide text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back to the Furnispace admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.name} className="rounded-2xl border border-border bg-card/90 p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stat.name}</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <stat.icon className="h-[18px] w-[18px] text-foreground" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Products */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">Recent Products</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Latest added products</p>
          </div>
          <div className="px-6 py-4">
            {products.slice(0, 5).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No products yet</p>
            ) : (
              <div className="space-y-0">
                {products
                  .slice(0, 5)
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((product) => (
                    <div key={product.id} className="flex items-center justify-between border-b border-border/60 py-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="text-sm font-semibold text-foreground">${product.price}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Common admin tasks</p>
          </div>
          <div className="p-4 space-y-3">
            <Link
              href="/studio"
              className="group flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">Open Design Studio</p>
                <p className="text-xs text-muted-foreground">Launch full-screen 2D/3D workspace</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
            <Link
              href="/admin/products/new"
              className="group flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">Add New Product</p>
                <p className="text-xs text-muted-foreground">Create a new furniture product</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
            <Link
              href="/admin/categories"
              className="group flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4 transition-colors hover:bg-muted"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">Manage Categories</p>
                <p className="text-xs text-muted-foreground">Add or edit product categories</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
