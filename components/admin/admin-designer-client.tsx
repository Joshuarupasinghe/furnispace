"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RoomConfigPanel } from "@/components/designer/room-config"
import { FurniturePanel } from "@/components/designer/furniture-panel"
import { Editor2D } from "@/components/designer/editor-2d"
import { Viewer3D } from "@/components/designer/viewer-3d"
import { PropertiesPanel } from "@/components/designer/properties-panel"
import { QuotationPanel } from "@/components/designer/quotation-panel"
import { useDesignStore } from "@/store/design-store"
import { deleteDesign, loadAllDesigns, loadDesign, saveDesign } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"
import { Design } from "@/types/design"
import { TextureThumbnailPicker, TextureOption } from "@/components/designer/texture-thumbnail-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  PencilRuler,
  Home,
  Save,
  Undo2,
  Redo2,
  RotateCcw,
  Plus,
  Trash2,
  FolderOpen,
  Eye,
  Loader2,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


/** Solid fallback swatches mirroring room-config defaults. */
const SWATCH_COLORS: Record<string, string> = {
  none: "#f5f5f5",
  color: "#eeeeee",
  "wood-oak": "#b08a5e",
  "wood-walnut": "#6b4226",
  "wood-light": "#e0c49a",
  "tile-marble": "#e8e8e8",
  "tile-ceramic": "#d0d8e0",
  "tile-slate": "#6b7280",
  "panel-wood": "#8b5c2a",
  "panel-white": "#f8f8f8",
  brick: "#b34e2b",
  concrete: "#9ca3af",
}

const DEFAULT_FLOOR_OPTIONS: TextureOption[] = [
  { value: "none", label: "Solid Color", solidColor: SWATCH_COLORS["none"] },
  { value: "wood-oak", label: "Oak Wood", solidColor: SWATCH_COLORS["wood-oak"], previewUrl: "/textures/floors/wood-oak.jpg" },
  { value: "wood-walnut", label: "Walnut", solidColor: SWATCH_COLORS["wood-walnut"], previewUrl: "/textures/floors/wood-walnut.jpg" },
  { value: "wood-light", label: "Light Wood", solidColor: SWATCH_COLORS["wood-light"], previewUrl: "/textures/floors/wood-light.jpg" },
  { value: "tile-marble", label: "Marble", solidColor: SWATCH_COLORS["tile-marble"], previewUrl: "/textures/floors/tile-marble.jpg" },
  { value: "tile-ceramic", label: "Ceramic", solidColor: SWATCH_COLORS["tile-ceramic"], previewUrl: "/textures/floors/tile-ceramic.jpg" },
  { value: "tile-slate", label: "Slate", solidColor: SWATCH_COLORS["tile-slate"], previewUrl: "/textures/floors/tile-slate.jpg" },
]

const DEFAULT_WALL_OPTIONS: TextureOption[] = [
  { value: "color", label: "Solid Color", solidColor: SWATCH_COLORS["color"] },
  { value: "panel-wood", label: "Wood Panels", solidColor: SWATCH_COLORS["panel-wood"], previewUrl: "/textures/walls/panel-wood.jpg" },
  { value: "panel-white", label: "White Panels", solidColor: SWATCH_COLORS["panel-white"], previewUrl: "/textures/walls/panel-white.jpg" },
  { value: "brick", label: "Brick", solidColor: SWATCH_COLORS["brick"], previewUrl: "/textures/walls/brick.jpg" },
  { value: "concrete", label: "Concrete", solidColor: SWATCH_COLORS["concrete"], previewUrl: "/textures/walls/concrete.jpg" },
]

export function AdminDesignerClient() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const {
    roomConfig,
    setRoomConfig,
    currentDesign,
    selectedFurnitureId,
    viewMode,
    setViewMode,
    createNewDesign,
    loadDesign: loadDesignToStore,
    removeFurniture,
    selectFurniture,
    undo,
    redo,
    canUndo,
    canRedo,
    resetDesign,
    hasUnsavedChanges,
    markSaved,
    isLoading,
    setLoadingState,
  } = useDesignStore()

  const [showRoomConfig, setShowRoomConfig] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showCatalog, setShowCatalog] = useState(true)
  const [designName, setDesignName] = useState("")
  const [inspectorTab, setInspectorTab] = useState<"properties" | "rooms" | "projects" | "quotation">("properties")
  const [loading, setLoading] = useState(false)
  const [savedDesigns, setSavedDesigns] = useState<Design[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [sidebarFloorOptions, setSidebarFloorOptions] = useState<TextureOption[]>(DEFAULT_FLOOR_OPTIONS)
  const [sidebarWallOptions, setSidebarWallOptions] = useState<TextureOption[]>(DEFAULT_WALL_OPTIONS)

  useEffect(() => {
    if (currentDesign?.name) {
      setDesignName(currentDesign.name)
    }
  }, [currentDesign])

  // Load textures for the sidebar thumbnail pickers
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch("/api/textures")
        if (!res.ok || !mounted) return
        const textures = await res.json() as { id: string; name: string; type: "floor" | "wall"; file_url?: string; category?: string }[]
        const floor: TextureOption[] = [{ value: "none", label: "Solid Color", solidColor: SWATCH_COLORS["none"] }]
        const wall: TextureOption[] = [{ value: "color", label: "Solid Color", solidColor: SWATCH_COLORS["color"] }]
        for (const t of textures) {
          const opt: TextureOption = {
            value: t.id,
            label: t.name,
            previewUrl: t.file_url ?? (t.type === "floor" ? `/textures/floors/${t.id}.jpg` : `/textures/walls/${t.id}.jpg`),
            solidColor: SWATCH_COLORS[t.id] ?? (t.type === "floor" ? "#c5a880" : "#d4d4d4"),
          }
          if (t.type === "floor") floor.push(opt)
          else wall.push(opt)
        }
        if (floor.length > 1) setSidebarFloorOptions(floor)
        if (wall.length > 1) setSidebarWallOptions(wall)
      } catch { /* keep defaults */ }
    }
    void load()
    return () => { mounted = false }
  }, [])

  const refreshSavedDesigns = () => {
    const designs = loadAllDesigns()
      .slice()
      .sort((a, b) => {
        const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime()
        const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime()
        return bTime - aTime
      })
    setSavedDesigns(designs)
  }

  useEffect(() => {
    refreshSavedDesigns()

    const configure = searchParams.get("configure")
    const designId = searchParams.get("design")
    const tab = searchParams.get("tab")

    if (tab === "properties" || tab === "rooms" || tab === "projects" || tab === "quotation") {
      setInspectorTab(tab)
    }

    if (designId) {
      const saved = loadDesign(designId)
      if (saved) {
        loadDesignToStore(saved)
        setDesignName(saved.name)
        setShowRoomConfig(false)
      } else {
        toast({ title: "Design not found", description: "This design is no longer available.", variant: "destructive" })
      }
      return
    }

    const shouldOpenRoomConfig =
      configure === "true" || ((!roomConfig || !currentDesign) && tab !== "projects")
    setShowRoomConfig(shouldOpenRoomConfig)
  }, [searchParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTypingElement =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest("[contenteditable='true']") !== null)

      if (!isTypingElement && (event.key === "Delete" || event.key === "Backspace")) {
        if (!selectedFurnitureId) return
        event.preventDefault()
        removeFurniture(selectedFurnitureId)
        selectFurniture(null)
        return
      }

      const isModifier = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()

      if (isModifier && !event.shiftKey && key === "z") {
        event.preventDefault()
        if (canUndo()) {
          undo()
        }
        return
      }

      if (isModifier && ((event.shiftKey && key === "z") || key === "y")) {
        event.preventDefault()
        if (canRedo()) {
          redo()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canRedo, canUndo, redo, removeFurniture, selectFurniture, selectedFurnitureId, toast, undo])

  const areaSqFt = useMemo(() => {
    if (!roomConfig) return 0
    return Math.round(roomConfig.width * roomConfig.length * 10.7639)
  }, [roomConfig])

  const hasAppliedRoomDimensions = useMemo(() => {
    if (!roomConfig) return false
    return roomConfig.width > 0 && roomConfig.length > 0 && roomConfig.height > 0
  }, [roomConfig])

  const handleSwitchTo3D = () => {
    if (!hasAppliedRoomDimensions) {
      toast({
        title: "Room dimensions required",
        description: "Apply room dimensions before continuing in 3D designer.",
        variant: "destructive",
      })
      setInspectorTab("rooms")
      setShowRoomConfig(true)
      setViewMode("2d")
      return
    }
    setViewMode("3d")
  }

  const handleRoomConfigOpenChange = (open: boolean) => {
    if (open) {
      setShowRoomConfig(true)
      return
    }

    if (!hasAppliedRoomDimensions) {
      toast({
        title: "Room dimensions required",
        description: "Enter and apply room dimensions before closing this dialog.",
        variant: "destructive",
      })
      setShowRoomConfig(true)
      return
    }

    setShowRoomConfig(false)
  }

  useEffect(() => {
    if (viewMode === "3d" && !hasAppliedRoomDimensions) {
      setViewMode("2d")
    }
  }, [hasAppliedRoomDimensions, setViewMode, viewMode])

  const handleSave = () => {
    if (!currentDesign || !designName.trim()) {
      toast({
        title: "Design name required",
        description: "Enter a design name before saving.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setLoadingState("save", true)
    try {
      const designToSave: Design = {
        ...currentDesign,
        name: designName.trim(),
        id: currentDesign.id || `design_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      }

      saveDesign(designToSave)
      loadDesignToStore(designToSave)
      setDesignName(designToSave.name)
      markSaved()
      refreshSavedDesigns()
      setShowSaveDialog(false)
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || "Unable to save the design.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setLoadingState("save", false)
    }
  }

  useEffect(() => {
    return () => {
      setLoadingState("save", false)
    }
  }, [setLoadingState])

  const handleOpenDesign = (id?: string) => {
    if (!id) return
    const saved = loadDesign(id)
    if (!saved) {
      toast({ title: "Design not found", description: "This design is no longer available.", variant: "destructive" })
      return
    }
    loadDesignToStore(saved)
    setDesignName(saved.name)
    setShowRoomConfig(false)
    setInspectorTab("properties")
  }

  const handleDeleteDesign = (id?: string) => {
    if (!id) return
    setDeleteTargetId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return

    try {
      deleteDesign(deleteTargetId)
      refreshSavedDesigns()

      if (currentDesign?.id === deleteTargetId) {
        createNewDesign("Untitled Design")
        setShowRoomConfig(true)
      }

      setShowDeleteDialog(false)
      setDeleteTargetId(null)
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || "Failed to delete design",
        variant: "destructive",
      })
    }
  }

  const deleteTargetName = savedDesigns.find((d) => d.id === deleteTargetId)?.name || "this design"

  const handleRoomConfigComplete = () => {
    setShowRoomConfig(false)
    if (!currentDesign) {
      createNewDesign("Untitled Design")
      setDesignName("Untitled Design")
    }
  }

  const handleResetConfirm = () => {
    resetDesign()
    setShowResetDialog(false)
  }

  return (
    <div className="h-screen w-screen bg-muted/40 p-3 md:p-5">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] border border-border bg-background shadow-xl">
        <header className="z-20 flex shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/admin" className="text-2xl font-black tracking-tight text-foreground">furnispace.</Link>
            <div className="h-5 w-px bg-border" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{designName || "Villa_house_interior"}</p>
              <p className="text-xs text-muted-foreground">{areaSqFt} sq.ft</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border bg-card p-1">
              <Button
                size="sm"
                className={`h-8 rounded-full px-4 text-xs ${viewMode === "2d" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
                onClick={() => setViewMode("2d")}
                aria-pressed={viewMode === "2d"}
              >
                2D
              </Button>
              <Button
                size="sm"
                className={`h-8 rounded-full px-4 text-xs ${viewMode === "3d" ? "bg-accent text-accent-foreground hover:bg-accent/90" : "bg-transparent text-muted-foreground hover:bg-muted"}`}
                onClick={handleSwitchTo3D}
                disabled={!hasAppliedRoomDimensions}
                aria-pressed={viewMode === "3d"}
              >
                3D
              </Button>
            </div>
            <Button
              onClick={() => setShowSaveDialog(true)}
              disabled={!currentDesign || !hasUnsavedChanges}
              className="h-9 rounded-full bg-primary px-4 text-xs text-primary-foreground hover:bg-primary/90"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> Save
            </Button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/40">
            <aside className="absolute left-8 top-1/2 z-20 flex w-12 -translate-y-1/2 flex-col items-center gap-2 rounded-3xl border border-border bg-card/95 p-2 shadow-lg">
              <Button
                size="icon"
                variant="ghost"
                className={`h-9 w-9 rounded-full ${showCatalog ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                onClick={() => setShowCatalog((v) => !v)}
                aria-label="Toggle catalog"
              >
                <PencilRuler className="h-4 w-4" />
              </Button>
              <Link href="/admin">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Go to dashboard"
                >
                  <Home className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                disabled={!canUndo()}
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  undo()
                }}
                aria-label="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={!canRedo()}
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => {
                  redo()
                }}
                aria-label="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={!currentDesign?.furnitureItems.length}
                className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowResetDialog(true)}
                aria-label="Reset design"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </aside>

            {showCatalog ? (
              <div className="absolute left-20 top-10 bottom-10 z-20 hidden w-[320px] overflow-hidden rounded-2xl border border-border bg-card/95 p-3 shadow-xl lg:block">
                <div className="mb-2 flex items-center justify-between border-b border-border pb-2">
                  <p className="text-sm font-semibold text-foreground">Catalog</p>
                  <Button variant="ghost" className="h-7 rounded-full px-2 text-xs" onClick={() => setShowCatalog(false)}>
                    Hide
                  </Button>
                </div>
                <div className="h-[calc(100%-32px)] overflow-y-auto pr-1">
                  <FurniturePanel />
                </div>
              </div>
            ) : null}

            <div className="h-full p-4">
              <div className="relative h-full overflow-hidden rounded-2xl border border-border bg-card">
                <div className="absolute left-4 top-3 z-10 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
                  {viewMode === "2d" ? "Plan Editing Mode" : "3D Presentation Mode"}
                </div>
                <div className="h-full w-full p-2 sm:p-3">{viewMode === "2d" ? <Editor2D /> : <Viewer3D />}</div>
                <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full border border-border bg-primary px-4 py-2 text-xs text-primary-foreground shadow-lg" role="status" aria-live="polite">
                  <span className="inline-flex items-center gap-2">
                    {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    {isLoading ? "Loading..." : hasUnsavedChanges ? "Unsaved changes" : "All changes saved"}
                  </span>
                </div>
              </div>
            </div>
          </main>

          <aside className="hidden w-[340px] shrink-0 border-l border-border bg-card/95 xl:flex xl:flex-col">
            <div className="border-b border-border px-3 py-3">
              <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1 text-xs">
                {[
                  { key: "properties", label: "Properties" },
                  { key: "rooms", label: "Rooms" },
                  { key: "projects", label: "Projects" },
                  { key: "quotation", label: "Quote" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setInspectorTab(tab.key as typeof inspectorTab)}
                    className={`rounded-lg px-2 py-2 font-semibold ${inspectorTab === tab.key ? "bg-card text-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {inspectorTab === "properties" ? <PropertiesPanel /> : null}

              {inspectorTab === "rooms" ? (
                <div className="space-y-4 text-sm text-foreground">
                  {/* Room info card */}
                  <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2">
                    <p className="text-sm font-semibold text-foreground">Room specification</p>
                    {roomConfig ? (
                      <>
                        <p>Shape: <span className="font-medium capitalize">{roomConfig.shape}</span></p>
                        <p>Size: <span className="font-medium">{roomConfig.width}m × {roomConfig.length}m × {roomConfig.height}m</span></p>
                        <p>Area: <span className="font-medium">{areaSqFt} sq.ft</span></p>
                        <div className="flex gap-2 pt-2">
                          <Button className="rounded-full" onClick={() => setShowRoomConfig(true)}>
                            <PencilRuler className="mr-1.5 h-4 w-4" /> Edit Room
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={handleSwitchTo3D}
                            disabled={!hasAppliedRoomDimensions}
                          >
                            <Eye className="mr-1.5 h-4 w-4" /> 3D View
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No room configuration found.</p>
                    )}
                  </div>

                  {/* Texture configuration – only shown once a room is configured */}
                  {roomConfig && (
                    <div className="rounded-2xl border border-border bg-card p-4 space-y-5">
                      <p className="text-sm font-semibold text-foreground">Textures</p>

                      {/* Floor texture */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floor</Label>
                        <TextureThumbnailPicker
                          options={sidebarFloorOptions}
                          value={roomConfig.floorTexture || "none"}
                          onChange={(val) => setRoomConfig({ ...roomConfig, floorTexture: val })}
                          size={46}
                        />
                        {(roomConfig.floorTexture === "none" || !roomConfig.floorTexture) && (
                          <div className="flex gap-2 pt-1">
                            <Input
                              type="color"
                              value={roomConfig.colorScheme || "#f5f5f5"}
                              onChange={(e) => setRoomConfig({ ...roomConfig, colorScheme: e.target.value })}
                              className="h-9 w-14 border-border"
                            />
                            <Input
                              type="text"
                              value={roomConfig.colorScheme || ""}
                              onChange={(e) => setRoomConfig({ ...roomConfig, colorScheme: e.target.value })}
                              placeholder="#f5f5f5"
                              className="h-9 border-border text-xs"
                            />
                          </div>
                        )}
                      </div>

                      {/* Wall texture */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Walls</Label>
                        <TextureThumbnailPicker
                          options={sidebarWallOptions}
                          value={roomConfig.wallMaterial || "color"}
                          onChange={(val) => setRoomConfig({ ...roomConfig, wallMaterial: val })}
                          size={46}
                        />
                        {(roomConfig.wallMaterial === "color" || !roomConfig.wallMaterial) && (
                          <div className="flex gap-2 pt-1">
                            <Input
                              type="color"
                              value={roomConfig.wallColor || "#eeeeee"}
                              onChange={(e) => setRoomConfig({ ...roomConfig, wallColor: e.target.value })}
                              className="h-9 w-14 border-border"
                            />
                            <Input
                              type="text"
                              value={roomConfig.wallColor || ""}
                              onChange={(e) => setRoomConfig({ ...roomConfig, wallColor: e.target.value })}
                              placeholder="#eeeeee"
                              className="h-9 border-border text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {inspectorTab === "projects" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">Saved designs</p>
                    <Button
                      size="sm"
                      className="h-8 rounded-full"
                      onClick={() => {
                        createNewDesign("Untitled Design")
                        setDesignName("Untitled Design")
                        setShowRoomConfig(true)
                        setInspectorTab("rooms")
                      }}
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> New
                    </Button>
                  </div>
                  <div className="space-y-2" role="status" aria-live="polite">
                    {savedDesigns.length === 0 ? (
                      <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                        No saved projects yet.
                      </div>
                    ) : (
                      savedDesigns.map((design) => (
                        <div key={design.id} className="rounded-xl border border-border bg-card p-3">
                          <p className="truncate text-sm font-semibold text-foreground">{design.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            Updated {new Date(design.updatedAt || design.createdAt || Date.now()).toLocaleString()}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 rounded-full px-3 text-xs"
                              onClick={() => handleOpenDesign(design.id)}
                            >
                              <FolderOpen className="mr-1 h-3 w-3" /> Open
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-7 rounded-full px-3 text-xs"
                              onClick={() => handleDeleteDesign(design.id)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" /> Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : null}

              {inspectorTab === "quotation" ? <QuotationPanel /> : null}
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Save Design</DialogTitle>
            <DialogDescription>Store this design so you can edit or present it later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Design name</Label>
            <Input
              value={designName}
              onChange={(e) => setDesignName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave()
              }}
              placeholder="Villa interior"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading || !designName.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoomConfig} onOpenChange={handleRoomConfigOpenChange}>
        <DialogContent
          className="max-w-2xl rounded-2xl p-2"
          onInteractOutside={(event) => {
            if (!hasAppliedRoomDimensions) {
              event.preventDefault()
            }
          }}
          onEscapeKeyDown={(event) => {
            if (!hasAppliedRoomDimensions) {
              event.preventDefault()
            }
          }}
        >
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>Room Dimensions</DialogTitle>
            <DialogDescription>
              Enter room size, shape, and finishes before designing.
            </DialogDescription>
          </DialogHeader>
          <div className="px-2 pb-2">
            <RoomConfigPanel onComplete={handleRoomConfigComplete} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset current layout?</DialogTitle>
            <DialogDescription>
              This removes all furniture from the active design. You can still recover with Undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleResetConfirm}>Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open)
          if (!open) setDeleteTargetId(null)
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete {deleteTargetName}?</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
