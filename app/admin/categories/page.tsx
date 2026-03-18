"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Category {
  id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to load categories")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, description: category.description || "" })
    } else {
      setEditingCategory(null)
      setFormData({ name: "", description: "" })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories"
      const method = editingCategory ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save category")
      }

      toast({
        title: "Success",
        description: `Category ${editingCategory ? "updated" : "created"} successfully`,
      })

      setShowDialog(false)
      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete category")
      }

      toast({
        title: "Success",
        description: "Category deleted successfully",
      })

      loadCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-foreground">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage product categories</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center">
          <p className="mb-4 text-muted-foreground">No categories yet</p>
          <Button
            onClick={() => handleOpenDialog()}
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create your first category
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="overflow-hidden rounded-2xl border border-border bg-card/90 transition-shadow hover:shadow-md">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-foreground">{category.name}</h3>
                {category.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                )}
              </div>
              <div className="px-6 pb-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(category)}
                  className="flex-1 rounded-full border-border hover:bg-muted hover:text-foreground"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  disabled={deletingId === category.id}
                  className="rounded-full border-border hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                >
                  {deletingId === category.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details"
                : "Create a new product category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Seating, Tables"
                required
                disabled={saving}
                className="rounded-xl border-border bg-muted/50 transition-colors focus:bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
                className="flex w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={saving}
              className="rounded-full border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
