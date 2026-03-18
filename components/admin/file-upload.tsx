"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { X, CheckCircle2 } from "lucide-react"
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

// Smoothly eases the displayed progress toward a target value using rAF
function useSmoothedProgress() {
  const [display, setDisplay] = useState(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    setDisplay((prev) => {
      const target = targetRef.current
      if (Math.abs(prev - target) < 0.5) return target
      const next = prev + (target - prev) * 0.08
      rafRef.current = requestAnimationFrame(tick)
      return next
    })
  }, [])

  const setTarget = useCallback((pct: number) => {
    targetRef.current = pct
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    targetRef.current = 0
    setDisplay(0)
  }, [])

  const complete = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    targetRef.current = 100
    setDisplay(100)
  }, [])

  return { display, setTarget, reset, complete }
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
  const fakeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fakeValueRef = useRef(0)
  const { toast } = useToast()
  const progress = useSmoothedProgress()

  const startFakeProgress = (setTarget: (n: number) => void) => {
    fakeValueRef.current = 0
    fakeIntervalRef.current = setInterval(() => {
      fakeValueRef.current = fakeValueRef.current + (90 - fakeValueRef.current) * 0.04
      setTarget(fakeValueRef.current)
    }, 80)
  }

  const stopFakeProgress = () => {
    if (fakeIntervalRef.current) clearInterval(fakeIntervalRef.current)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (maxSize && file.size > maxSize) {
      toast({ title: "File too large", description: `Maximum size: ${maxSize / 1024 / 1024}MB`, variant: "destructive" })
      return
    }

    if (type === "image") {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }

    await uploadFile(file)
  }

  const uploadFile = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      setUploading(true)
      progress.reset()

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      formData.append("type", type)

      const xhr = new XMLHttpRequest()

      // Start fake asymptotic progress toward 90%
      startFakeProgress(progress.setTarget)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          stopFakeProgress()
          progress.setTarget(Math.min((e.loaded / e.total) * 90, 90))
        }
      }

      xhr.onload = () => {
        stopFakeProgress()
        progress.complete()
        setUploading(false)

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            setUploadedUrl(data.url)
            onUploadComplete(data.url)
            toast({ title: "Upload successful", description: "File uploaded successfully" })
          } catch {
            toast({ title: "Upload failed", description: "Invalid response from server", variant: "destructive" })
          }
        } else {
          try {
            const err = JSON.parse(xhr.responseText)
            toast({ title: "Upload failed", description: err.error || "Upload failed", variant: "destructive" })
          } catch {
            toast({ title: "Upload failed", description: "Upload failed", variant: "destructive" })
          }
        }
        resolve()
      }

      xhr.onerror = () => {
        stopFakeProgress()
        progress.reset()
        setUploading(false)
        toast({ title: "Upload failed", description: "Network error during upload", variant: "destructive" })
        resolve()
      }

      xhr.open("POST", "/api/admin/upload")
      xhr.send(formData)
    })
  }

  const handleRemove = () => {
    setUploadedUrl(null)
    setPreview(null)
    progress.reset()
    if (fileInputRef.current) fileInputRef.current.value = ""
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
          <Button type="button" variant="outline" size="icon" onClick={handleRemove} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Uploading…</span>
            <span>{Math.round(progress.display)}%</span>
          </div>
          <Progress value={progress.display} className="h-2" />
        </div>
      )}

      {!uploading && uploadedUrl && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Upload complete
        </div>
      )}

      {preview && type === "image" && (
        <div className="mt-2">
          <img src={preview} alt="Preview" className="h-32 w-32 rounded-md object-cover border" />
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
