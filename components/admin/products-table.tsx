"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { ProductActions } from "@/components/admin/product-actions"
import { ProductImage } from "@/components/admin/product-image"
import { ProductEditDialog } from "@/components/admin/product-edit-dialog"
import { Product } from "@/lib/db-supabase"

interface ProductsTableProps {
  products: Product[]
  categories: string[]
}

export function ProductsTable({ products, categories }: ProductsTableProps) {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-semibold text-foreground">Image</th>
                <th className="text-left p-4 font-semibold text-foreground">Name</th>
                <th className="text-left p-4 font-semibold text-foreground">Category</th>
                <th className="text-left p-4 font-semibold text-foreground">Price</th>
                <th className="text-left p-4 font-semibold text-foreground">Status</th>
                <th className="text-right p-4 font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border"
                >
                  <td className="p-4">
                    <ProductImage product={product} />
                  </td>
                  <td className="p-4">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4 font-semibold">${product.price}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        product.status === "active"
                          ? "bg-[var(--clr-success-a20)] text-[var(--clr-success-a0)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingProduct(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ProductActions productId={product.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingProduct && (
        <ProductEditDialog
          product={editingProduct}
          categories={categories}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
        />
      )}
    </>
  )
}
