"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { X, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ModelUploadProps {
  onUploadComplete: (objUrl: string, mtlUrl: string) => void
  folder?: string
  existingObjUrl?: string
  existingMtlUrl?: string
}

// Smoothly animates progress toward a target value using requestAnimationFrame
function useSmoothedProgress() {
  const [display, setDisplay] = useState(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  const tick = useCallback(() => {
    setDisplay((prev) => {
      const target = targetRef.current
      if (Math.abs(prev - target) < 0.5) return target
      // Ease toward target: close the gap by 8% per frame
      const next = prev + (target - prev) * 0.08
      rafRef.current = requestAnimationFrame(tick)
      return next
    })
  }, [])

  const setTarget = useCallback(
    (pct: number) => {
      targetRef.current = pct
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(tick)
    },
    [tick]
  )

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

// Ticks fake progress from 0→90 while a real upload is in flight
function useFakeProgress(setTarget: (n: number) => void) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fakeRef = useRef(0)

  const start = useCallback(() => {
    fakeRef.current = 0
    setTarget(0)
    intervalRef.current = setInterval(() => {
      // Approach 90% asymptotically so it never quite reaches it
      fakeRef.current = fakeRef.current + (90 - fakeRef.current) * 0.04
      setTarget(fakeRef.current)
    }, 80)
  }, [setTarget])

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [])

  return { start, stop }
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
  const objUrlRef = useRef<string | null>(existingObjUrl || null)
  const mtlUrlRef = useRef<string | null>(existingMtlUrl || null)
  const { toast } = useToast()

  const objProgress = useSmoothedProgress()
  const mtlProgress = useSmoothedProgress()
  const objFake = useFakeProgress(objProgress.setTarget)
  const mtlFake = useFakeProgress(mtlProgress.setTarget)

  const uploadFile = (file: File, fileType: "obj" | "mtl"): Promise<void> => {
    return new Promise((resolve) => {
      setUploading(true)
      setUploadingFile(fileType)

      const prog = fileType === "obj" ? objProgress : mtlProgress
      const fake = fileType === "obj" ? objFake : mtlFake
      prog.reset()

      const ext = file.name.toLowerCase().split(".").pop()
      if (fileType === "obj" && ext !== "obj") {
        toast({ title: "Invalid file", description: "Please upload a .obj file", variant: "destructive" })
        setUploading(false); setUploadingFile(null)
        return resolve()
      }
      if (fileType === "mtl" && ext !== "mtl") {
        toast({ title: "Invalid file", description: "Please upload a .mtl file", variant: "destructive" })
        setUploading(false); setUploadingFile(null)
        return resolve()
      }

      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        toast({ title: "File too large", description: `Maximum size: ${maxSize / 1024 / 1024}MB`, variant: "destructive" })
        setUploading(false); setUploadingFile(null)
        return resolve()
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", folder)
      formData.append("type", "model")

      const xhr = new XMLHttpRequest()

      // Start fake progress ticker — replaces instantly-100% problem on localhost
      fake.start()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          // When we get real events, drive them but cap at 90 so completion looks intentional
          fake.stop()
          prog.setTarget(Math.min((e.loaded / e.total) * 90, 90))
        }
      }

      xhr.onload = () => {
        fake.stop()
        prog.complete() // snap to 100%

        setUploading(false)
        setUploadingFile(null)

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            if (fileType === "obj") {
              setObjUrl(data.url)
              objUrlRef.current = data.url
              onUploadComplete(data.url, mtlUrlRef.current || "")
            } else {
              setMtlUrl(data.url)
              mtlUrlRef.current = data.url
              onUploadComplete(objUrlRef.current || "", data.url)
            }
            toast({ title: "Upload successful", description: `${fileType.toUpperCase()} file uploaded successfully` })
          } catch {
            toast({ title: "Upload failed", description: "Invalid response", variant: "destructive" })
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
        fake.stop()
        prog.reset()
        setUploading(false)
        setUploadingFile(null)
        toast({ title: "Upload failed", description: "Network error during upload", variant: "destructive" })
        resolve()
      }

      xhr.open("POST", "/api/admin/upload")
      xhr.send(formData)
    })
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
    objUrlRef.current = null
    objProgress.reset()
    if (objInputRef.current) objInputRef.current.value = ""
    onUploadComplete("", mtlUrlRef.current || "")
  }

  const handleRemoveMtl = () => {
    setMtlUrl(null)
    mtlUrlRef.current = null
    mtlProgress.reset()
    if (mtlInputRef.current) mtlInputRef.current.value = ""
    onUploadComplete(objUrlRef.current || "", "")
  }

  return (
    <div className="space-y-4">
      <Label>3D Model Files</Label>

      {/* OBJ File */}
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
            <Button type="button" variant="outline" size="icon" onClick={handleRemoveObj} disabled={uploading}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploadingFile === "obj" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading OBJ…</span>
              <span>{Math.round(objProgress.display)}%</span>
            </div>
            <Progress value={objProgress.display} className="h-2" />
          </div>
        )}
        {objUrl && uploadingFile !== "obj" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {objUrl.split("/").pop()}
          </div>
        )}
      </div>

      {/* MTL File */}
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
            <Button type="button" variant="outline" size="icon" onClick={handleRemoveMtl} disabled={uploading}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploadingFile === "mtl" && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading MTL…</span>
              <span>{Math.round(mtlProgress.display)}%</span>
            </div>
            <Progress value={mtlProgress.display} className="h-2" />
          </div>
        )}
        {mtlUrl && uploadingFile !== "mtl" && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {mtlUrl.split("/").pop()}
          </div>
        )}
      </div>

      {objUrl && mtlUrl && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">✓ Both OBJ and MTL files uploaded successfully</p>
        </div>
      )}
    </div>
  )
}
