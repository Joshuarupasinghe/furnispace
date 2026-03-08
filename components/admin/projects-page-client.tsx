"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { deleteDesign, loadAllDesigns, loadDesign, saveDesign } from "@/lib/storage"
import type { Design } from "@/types/design"
import { Edit, FolderOpen, Loader2, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function ProjectsPageClient() {
  const [projects, setProjects] = useState<Design[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [targetProject, setTargetProject] = useState<Design | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const router = useRouter()
  const { toast } = useToast()

  const sortedProjects = useMemo(
    () =>
      projects
        .slice()
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()),
    [projects]
  )

  const loadProjects = () => {
    const data = loadAllDesigns()
    setProjects(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleOpen = (id: string) => {
    router.push(`/studio?design=${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/studio?design=${id}&configure=true`)
  }

  const openRenameDialog = (project: Design) => {
    setTargetProject(project)
    setRenameValue(project.name)
    setShowRenameDialog(true)
  }

  const openDeleteDialog = (project: Design) => {
    setTargetProject(project)
    setShowDeleteDialog(true)
  }

  const handleRename = () => {
    if (!targetProject) return
    if (!targetProject.id) return
    if (!renameValue.trim()) {
      toast({ title: "Invalid name", description: "Project name is required.", variant: "destructive" })
      return
    }

    setBusyId(targetProject.id)
    try {
      const existing = loadDesign(targetProject.id)
      if (!existing) {
        throw new Error("Project no longer exists")
      }

      saveDesign({ ...existing, name: renameValue.trim() })

      toast({ title: "Project renamed", description: "Saved project name updated." })
      setShowRenameDialog(false)
      setTargetProject(null)
      loadProjects()
    } catch (error: any) {
      toast({ title: "Rename failed", description: error?.message || "Failed to rename project", variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = () => {
    if (!targetProject) return
    if (!targetProject.id) return

    setBusyId(targetProject.id)
    try {
      deleteDesign(targetProject.id)

      toast({ title: "Project deleted", description: "Saved project removed." })
      setShowDeleteDialog(false)
      setTargetProject(null)
      loadProjects()
    } catch (error: any) {
      toast({ title: "Delete failed", description: error?.message || "Failed to delete project", variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-8">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif tracking-wide text-foreground">Saved Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open, rename, edit, or delete your saved room designs</p>
        </div>
        <Link href="/studio?configure=true">
          <Button className="rounded-full bg-primary px-5 text-primary-foreground hover:bg-primary/90">
            New Design
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center text-muted-foreground">Loading projects...</div>
      ) : sortedProjects.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/90 py-16 text-center">
          <p className="mb-4 text-muted-foreground">No saved projects yet</p>
          <Link href="/studio?configure=true">
            <Button className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90">Create your first design</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sortedProjects.map((project) => {
            const furnitureCount = Array.isArray(project.furnitureItems) ? project.furnitureItems.length : 0
            const isBusy = !!project.id && busyId === project.id

            return (
              <div key={project.id || project.name} className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
                <div className="mb-3">
                  <p className="truncate text-lg font-semibold text-foreground">{project.name}</p>
                  <p className="text-xs text-muted-foreground">Updated {new Date(project.updatedAt || project.createdAt || Date.now()).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{furnitureCount} furniture item{furnitureCount === 1 ? "" : "s"}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => project.id && handleOpen(project.id)}
                    disabled={!project.id || isBusy}
                  >
                    <FolderOpen className="mr-1 h-3.5 w-3.5" /> Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => project.id && handleEdit(project.id)}
                    disabled={!project.id || isBusy}
                  >
                    <Edit className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => openRenameDialog(project)}
                    disabled={isBusy}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Rename
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-full"
                    onClick={() => openDeleteDialog(project)}
                    disabled={isBusy}
                  >
                    {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
            <DialogDescription>Update the name for this saved design.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rename-project">Project name</Label>
            <Input
              id="rename-project"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Project name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRename} disabled={!targetProject || !renameValue.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This will permanently delete {targetProject?.name || "this project"}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!targetProject}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
