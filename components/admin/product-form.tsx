"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileUpload } from "./file-upload"
import { ModelUpload } from "./model-upload"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, X } from "lucide-react"
import { Product } from "@/lib/db-supabase"

interface ProductFormProps {
  product?: Product
  categories: string[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || categories[0] || "",
    price: product?.price || 0,
    dimensions: {
      width: product?.dimensions.width || 0,
      length: product?.dimensions.length || 0,
      height: product?.dimensions.height || 0,
    },
    colors: product?.colors || [],
    imageUrl: product?.image_url || "",
    imageUrls: product?.image_urls || [],
    modelUrl: product?.model_url || "",
    objUrl: product?.obj_url || "",
    mtlUrl: product?.mtl_url || "",
    status: product?.status || "active",
  })
  const [newColor, setNewColor] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = product
        ? `/api/admin/products/${product.id}`
        : "/api/admin/products"
      const method = product ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save product")
      }

      toast({
        title: "Success",
        description: `Product ${product ? "updated" : "created"} successfully`,
      })

      router.push("/admin/products")
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

  const addGalleryImage = (url: string) => {
    if (url && !formData.imageUrls.includes(url)) {
      setFormData({
        ...formData,
        imageUrls: [...formData.imageUrls, url],
      })
    }
  }

  const removeGalleryImage = (url: string) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((u) => u !== url),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
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
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
        <Label>Dimensions (meters) *</Label>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
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
            <Label htmlFor="length">Length</Label>
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
            <Label htmlFor="height">Height</Label>
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
            type="text"
            placeholder="#000000"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            disabled={loading}
            className="flex-1"
          />
          <Button type="button" onClick={addColor} disabled={loading || !newColor}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {formData.colors.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.colors.map((color) => (
              <div
                key={color}
                className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted"
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm">{color}</span>
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  disabled={loading}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <FileUpload
          label="Primary Image *"
          type="image"
          folder="products/images"
          onUploadComplete={(url) => setFormData({ ...formData, imageUrl: url })}
          existingUrl={formData.imageUrl}
          maxSize={10 * 1024 * 1024}
        />
      </div>

      <div className="space-y-2">
        <Label>Gallery Images</Label>
        <FileUpload
          type="image"
          folder="products/images"
          onUploadComplete={addGalleryImage}
          maxSize={10 * 1024 * 1024}
        />
        {formData.imageUrls.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {formData.imageUrls.map((url) => (
              <div key={url} className="relative group">
                <img src={url} alt="Gallery" className="h-20 w-full rounded object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryImage(url)}
                  disabled={loading}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <ModelUpload
          folder="products/models"
          onUploadComplete={(objUrl, mtlUrl) =>
            setFormData({
              ...formData,
              objUrl,
              mtlUrl,
              // Keep modelUrl for backward compatibility (use objUrl)
              modelUrl: objUrl || formData.modelUrl,
            })
          }
          existingObjUrl={formData.objUrl}
          existingMtlUrl={formData.mtlUrl}
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Update Product" : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
