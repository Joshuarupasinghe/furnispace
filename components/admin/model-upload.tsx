"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, File } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ModelUploadProps {
  onUploadComplete: (objUrl: string, mtlUrl: string) => void
  folder?: string
  existingObjUrl?: string
  existingMtlUrl?: string
}

export function ModelUpload({
  onUploadComplete,
  folder = "products/models",
  existingObjUrl,
  existingMtlUrl,
}: ModelUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<"obj" | "mtl" | null>(null)
  const [objUrl, setObjUrl] = useState<string | null>(existingObjUrl || null)
  const [mtlUrl, setMtlUrl] = useState<string | null>(existingMtlUrl || null)
  const objInputRef = useRef<HTMLInputElement>(null)
  const mtlInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const uploadFile = async (file: File, fileType: "obj" | "mtl") => {
    setUploading(true)
    setUploadingFile(fileType)

    try {
      // Validate file extension
      const ext = file.name.toLowerCase().split(".").pop()
      if (fileType === "obj" && ext !== "obj") {
        throw new Error("Please upload a .obj file")
      }
      if (fileType === "mtl" && ext !== "mtl") {
        throw new Error("Please upload a .mtl file")
      }

      // Check file size (50MB max)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`)
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      formData.append("type", "model")

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const data = await response.json()

      if (fileType === "obj") {
        setObjUrl(data.url)
      } else {
        setMtlUrl(data.url)
      }

      // Call callback with both URLs (use existing URL if one is not uploaded yet)
      onUploadComplete(
        fileType === "obj" ? data.url : (objUrl || ""),
        fileType === "mtl" ? data.url : (mtlUrl || "")
      )

      toast({
        title: "Upload successful",
        description: `${fileType.toUpperCase()} file uploaded successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadingFile(null)
    }
  }

  const handleObjSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file, "obj")
  }

  const handleMtlSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile(file, "mtl")
  }

  const handleRemoveObj = () => {
    setObjUrl(null)
    if (objInputRef.current) {
      objInputRef.current.value = ""
    }
    onUploadComplete("", mtlUrl || "")
  }

  const handleRemoveMtl = () => {
    setMtlUrl(null)
    if (mtlInputRef.current) {
      mtlInputRef.current.value = ""
    }
    onUploadComplete(objUrl || "", "")
  }

  return (
    <div className="space-y-4">
      <Label>3D Model Files</Label>
      
      {/* OBJ File Upload */}
      <div className="space-y-2">
        <Label htmlFor="obj-file" className="text-sm font-medium">
          OBJ File (.obj) {objUrl && <span className="text-green-600">✓</span>}
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              ref={objInputRef}
              id="obj-file"
              type="file"
              accept=".obj"
              onChange={handleObjSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          {objUrl && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveObj}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploadingFile === "obj" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading OBJ file...
          </div>
        )}
        {objUrl && uploadingFile !== "obj" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            {objUrl.split("/").pop()}
          </div>
        )}
      </div>

      {/* MTL File Upload */}
      <div className="space-y-2">
        <Label htmlFor="mtl-file" className="text-sm font-medium">
          MTL File (.mtl) {mtlUrl && <span className="text-green-600">✓</span>}
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              ref={mtlInputRef}
              id="mtl-file"
              type="file"
              accept=".mtl"
              onChange={handleMtlSelect}
              disabled={uploading}
              className="cursor-pointer"
            />
          </div>
          {mtlUrl && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleRemoveMtl}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploadingFile === "mtl" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading MTL file...
          </div>
        )}
        {mtlUrl && uploadingFile !== "mtl" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <File className="h-4 w-4" />
            {mtlUrl.split("/").pop()}
          </div>
        )}
      </div>

      {objUrl && mtlUrl && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            ✓ Both OBJ and MTL files uploaded successfully
          </p>
        </div>
      )}
    </div>
  )
}
