"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
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
import { FileUpload } from "@/components/admin/file-upload"
import { useToast } from "@/hooks/use-toast"
import { Edit, Loader2, Plus, Trash2 } from "lucide-react"

type TextureType = "floor" | "wall"

interface Texture {
  id: string
  name: string
  type: TextureType
  category?: string
  file_url: string
  preview_url?: string
  created_at?: string
  updated_at?: string
}

interface TextureForm {
  name: string
  type: TextureType
  category: string
  file_url: string
  preview_url: string
}

const initialForm: TextureForm = {
  name: "",
  type: "floor",
  category: "",
  file_url: "",
  preview_url: "",
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export default function TexturesPage() {
  const { toast } = useToast()

  const [textures, setTextures] = useState<Texture[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingTexture, setEditingTexture] = useState<Texture | null>(null)
  const [formData, setFormData] = useState<TextureForm>(initialForm)

  const floorCount = useMemo(() => textures.filter((texture) => texture.type === "floor").length, [textures])
  const wallCount = useMemo(() => textures.filter((texture) => texture.type === "wall").length, [textures])

  const loadTextures = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/textures")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to load textures")
      }
      const data = (await response.json()) as Texture[]
      setTextures(data)
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to load textures"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadTextures()
  }, [loadTextures])

  function openCreateDialog() {
    setEditingTexture(null)
    setFormData(initialForm)
    setShowDialog(true)
  }

  function openEditDialog(texture: Texture) {
    setEditingTexture(texture)
    setFormData({
      name: texture.name,
      type: texture.type,
      category: texture.category || "",
      file_url: texture.file_url,
      preview_url: texture.preview_url || texture.file_url,
    })
    setShowDialog(true)
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" })
      return
    }

    if (!formData.file_url) {
      toast({ title: "Texture image is required", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        category: formData.category.trim() || undefined,
        file_url: formData.file_url,
        preview_url: formData.preview_url || formData.file_url,
      }

      const url = editingTexture ? `/api/admin/textures/${editingTexture.id}` : "/api/admin/textures"
      const method = editingTexture ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save texture")
      }

      toast({
        title: "Success",
        description: `Texture ${editingTexture ? "updated" : "created"} successfully`,
      })

      setShowDialog(false)
      await loadTextures()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to save texture"),
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this texture? The image will also be removed from R2.")) {
      return
    }

    setDeletingId(id)
    try {
      const response = await fetch(`/api/admin/textures/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete texture")
      }

      toast({ title: "Texture deleted" })
      await loadTextures()
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error, "Failed to delete texture"),
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-foreground">Textures</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage wall and floor textures for the 3D room designer</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Texture
        </Button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card/90 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Floor Textures</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{floorCount}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card/90 p-5">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Wall Textures</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{wallCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center text-muted-foreground">Loading textures...</div>
      ) : textures.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center">
          <p className="mb-4 text-muted-foreground">No textures yet</p>
          <Button onClick={openCreateDialog} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
            Create your first texture
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {textures.map((texture) => (
            <div key={texture.id} className="overflow-hidden rounded-2xl border border-border bg-card/90 transition-shadow hover:shadow-md">
              <div className="aspect-square w-full bg-muted/40">
                <Image
                  src={texture.preview_url || texture.file_url}
                  alt={texture.name}
                  width={480}
                  height={480}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-foreground">{texture.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize text-muted-foreground">{texture.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{texture.category || "Uncategorized"}</p>
              </div>
              <div className="flex gap-2 px-4 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full border-border hover:bg-muted"
                  onClick={() => openEditDialog(texture)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-border hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(texture.id)}
                  disabled={deletingId === texture.id}
                >
                  {deletingId === texture.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingTexture ? "Edit Texture" : "Add Texture"}</DialogTitle>
            <DialogDescription>
              Upload a texture image to Cloudflare R2 and make it available in the room configurator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="texture-name">Texture Name *</Label>
              <Input
                id="texture-name"
                value={formData.name}
                onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                placeholder="e.g. White Marble"
                disabled={saving}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: TextureType) => setFormData((current) => ({ ...current, type: value }))}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="floor">Floor</SelectItem>
                    <SelectItem value="wall">Wall</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="texture-category">Category</Label>
                <Input
                  id="texture-category"
                  value={formData.category}
                  onChange={(event) => setFormData((current) => ({ ...current, category: event.target.value }))}
                  placeholder="e.g. Wood, Concrete, Tile"
                  disabled={saving}
                />
              </div>
            </div>

            <FileUpload
              label="Texture Image *"
              type="image"
              folder={formData.type === "floor" ? "textures/floors" : "textures/walls"}
              maxSize={10 * 1024 * 1024}
              existingUrl={formData.file_url || undefined}
              onUploadComplete={(url) => {
                setFormData((current) => ({
                  ...current,
                  file_url: url,
                  preview_url: current.preview_url || url,
                }))
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim() || !formData.file_url}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingTexture ? "Update Texture" : "Create Texture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
