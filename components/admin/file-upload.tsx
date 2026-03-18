"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploadProps {
  onUploadComplete: (url: string) => void
  folder?: string
  type?: "image" | "model"
  accept?: string
  maxSize?: number
  label?: string
  existingUrl?: string
}

export function FileUpload({
  onUploadComplete,
  folder = "uploads",
  type = "image",
  accept,
  maxSize,
  label,
  existingUrl,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingUrl || null)
  const [preview, setPreview] = useState<string | null>(existingUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (maxSize && file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum size: ${maxSize / 1024 / 1024}MB`,
        variant: "destructive",
      })
      return
    }

    // Create preview for images
    if (type === "image") {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      formData.append("type", type)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()
      setUploadedUrl(data.url)
      onUploadComplete(data.url)
      toast({
        title: "Upload successful",
        description: "File uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setUploadedUrl(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onUploadComplete("")
  }

  const defaultAccept =
    type === "image" ? "image/jpeg,image/png,image/webp" : ".obj,.mtl,.glb,.gltf"

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept || defaultAccept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="cursor-pointer"
          />
        </div>
        {uploadedUrl && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Uploading...
        </div>
      )}
      {preview && type === "image" && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 rounded-md object-cover border"
          />
        </div>
      )}
      {uploadedUrl && type === "model" && (
        <div className="mt-2 text-sm text-muted-foreground">
          Model uploaded: {uploadedUrl.split("/").pop()}
        </div>
      )}
    </div>
  )
}
