"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import { Product } from "@/lib/db-supabase"

interface ProductEditDialogProps {
  product: Product
  categories: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProductEditDialog({
  product,
  categories,
  open,
  onOpenChange,
}: ProductEditDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    dimensions: {
      width: product.dimensions.width,
      length: product.dimensions.length,
      height: product.dimensions.height,
    },
    colors: product.colors || [],
    image_url: product.image_url || "",
    status: product.status,
  })
  const [newColor, setNewColor] = useState("")

  // Reset form when dialog opens with new product
  useEffect(() => {
    if (open) {
      setFormData({
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        dimensions: {
          width: product.dimensions.width,
          length: product.dimensions.length,
          height: product.dimensions.height,
        },
        colors: product.colors || [],
        image_url: product.image_url || "",
        status: product.status,
      })
      setNewColor("")
    }
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to update product")
      }

      toast({
        title: "Success",
        description: "Product updated successfully",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const addColor = () => {
    if (newColor && !formData.colors.includes(newColor)) {
      setFormData({
        ...formData,
        colors: [...formData.colors, newColor],
      })
      setNewColor("")
    }
  }

  const removeColor = (color: string) => {
    setFormData({
      ...formData,
      colors: formData.colors.filter((c) => c !== color),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>Dimensions (meters)</Label>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm">Width *</Label>
                <Input
                  id="width"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dimensions.width}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, width: parseFloat(e.target.value) || 0 },
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="length" className="text-sm">Length *</Label>
                <Input
                  id="length"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dimensions.length}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, length: parseFloat(e.target.value) || 0 },
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-sm">Height *</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.dimensions.height}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dimensions: { ...formData.dimensions, height: parseFloat(e.target.value) || 0 },
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">Image URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="/path/to/image.jpg"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Colors</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                disabled={loading}
                className="w-20"
              />
              <Input
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="#000000"
                disabled={loading}
                className="flex-1"
              />
              <Button type="button" onClick={addColor} disabled={loading} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {formData.colors.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-2 bg-muted px-3 py-1 rounded-md"
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm">{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      disabled={loading}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
