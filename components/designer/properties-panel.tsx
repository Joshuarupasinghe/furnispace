"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDesignStore } from "@/store/design-store"
import { Trash2, Palette, RotateCcw, Info, Scaling, SunMedium } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PropertiesPanel() {
  const { toast } = useToast()
  const {
    currentDesign,
    selectedFurnitureId,
    updateFurniture,
    removeFurniture,
    selectFurniture,
    scaleAllFurniture,
    applyShadingToAll,
    changeColorOfAll,
  } = useDesignStore()

  const selectedItem = currentDesign?.furnitureItems.find((item) => item.id === selectedFurnitureId)
  const hasFurniture = Boolean(currentDesign && currentDesign.furnitureItems.length > 0)

  const [globalColor, setGlobalColor] = useState("#c7c9d9")
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)

  const commitSelectedItemChange = (updates: Record<string, any>) => {
    if (!selectedItem) return
    updateFurniture(selectedItem.id, updates, { commitHistory: true })
  }

  const normalizeHex = (value: string) => {
    const withHash = value.startsWith("#") ? value : `#${value}`
    return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash : null
  }

  const handleApplyColorToAll = () => {
    const normalized = normalizeHex(globalColor)
    if (!normalized) {
      toast({
        title: "Invalid color",
        description: "Use hexadecimal format like #AABBCC.",
        variant: "destructive",
      })
      return
    }
    changeColorOfAll(normalized)
  }

  const handleScaleAll = (factor: number) => {
    scaleAllFurniture(factor)
  }

  const handleShadeAll = (value: number) => {
    applyShadingToAll(value)
  }

  if (!hasFurniture) {
    return (
      <Card className="border-none bg-transparent shadow-none">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-base font-semibold text-foreground">Properties</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Select or add furniture to edit properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Add furniture from the catalog to start designing. Use 2D for layout and switch to 3D for realistic presentation.
          </p>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Global controls</p>
            <p className="mt-1 text-xs text-muted-foreground">Global scale, shading, and color tools become available after adding furniture.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base font-semibold text-foreground">{selectedItem ? selectedItem.name : "No item selected"}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {selectedItem ? "Edit selected item" : "Select an item in canvas to edit individual properties"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 rounded-xl border-none bg-card p-3">
        {selectedItem ? (
          <>
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Color</Label>
              </div>
              {selectedItem.availableColors && selectedItem.availableColors.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.availableColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => commitSelectedItemChange({ color: c })}
                      className={`h-6 w-6 rounded-full border-2 transition-all ${
                        selectedItem.color === c
                          ? "scale-110 border-primary ring-2 ring-ring ring-offset-1"
                          : "border-border hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                      aria-label={`Set color to ${c}`}
                    />
                  ))}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={selectedItem.color}
                  onChange={(e) => updateFurniture(selectedItem.id, { color: e.target.value })}
                  onBlur={(e) => commitSelectedItemChange({ color: e.target.value })}
                  className="h-10 w-20 border-border"
                />
                <Input
                  type="text"
                  value={selectedItem.color}
                  onChange={(e) => updateFurniture(selectedItem.id, { color: e.target.value })}
                  onBlur={(e) => {
                    const normalized = normalizeHex(e.target.value)
                    if (!normalized) {
                      toast({
                        title: "Invalid color",
                        description: "Use hexadecimal format, for example #AABBCC.",
                        variant: "destructive",
                      })
                      return
                    }
                    commitSelectedItemChange({ color: normalized })
                  }}
                  className="border-border"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Rotation: {Math.round((selectedItem.rotation * 180) / Math.PI)}deg</Label>
              </div>
              <Slider
                value={[Math.round((selectedItem.rotation * 180) / Math.PI)]}
                min={0}
                max={360}
                step={1}
                onValueChange={([value]) => updateFurniture(selectedItem.id, { rotation: (value * Math.PI) / 180 })}
                onValueCommit={([value]) =>
                  commitSelectedItemChange({ rotation: (value * Math.PI) / 180 })
                }
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <Scaling className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Scale: {selectedItem.scale.toFixed(2)}x</Label>
              </div>
              <Slider
                value={[selectedItem.scale]}
                min={0.1}
                max={3}
                step={0.05}
                onValueChange={([value]) => updateFurniture(selectedItem.id, { scale: value })}
                onValueCommit={([value]) => commitSelectedItemChange({ scale: value })}
              />
            </div>

            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <SunMedium className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm text-foreground">Shading: {Math.round((selectedItem.shading ?? 0.5) * 100)}%</Label>
              </div>
              <Slider
                value={[selectedItem.shading ?? 0.5]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={([value]) => updateFurniture(selectedItem.id, { shading: value })}
                onValueCommit={([value]) => commitSelectedItemChange({ shading: value })}
              />
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            Click any furniture item in 2D or 3D view to edit item-specific properties.
          </div>
        )}

        <div className="space-y-3 rounded-lg border border-border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Global furniture actions</p>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Apply color to all furniture</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={globalColor}
                onChange={(e) => setGlobalColor(e.target.value)}
                className="h-9 w-14 border-border"
              />
              <Input
                type="text"
                value={globalColor}
                onChange={(e) => setGlobalColor(e.target.value)}
                className="border-border"
              />
              <Button className="rounded-full" onClick={handleApplyColorToAll}>Apply</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Scale all furniture</Label>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => handleScaleAll(0.9)}>
                -10%
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => handleScaleAll(1.1)}>
                +10%
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Shade all furniture</Label>
            <Slider
              defaultValue={[0.5]}
              min={0}
              max={1}
              step={0.05}
              onValueCommit={([value]) => handleShadeAll(value)}
            />
          </div>
        </div>

        {(selectedItem?.dimensions || (selectedItem?.price !== undefined && selectedItem.price > 0)) && (
          <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Item Info</span>
            </div>
            {selectedItem?.dimensions ? (
              <p className="text-xs text-muted-foreground">
                {selectedItem.dimensions.width}m x {selectedItem.dimensions.length}m x {selectedItem.dimensions.height}m
              </p>
            ) : null}
            {selectedItem?.price !== undefined && selectedItem.price > 0 ? (
              <p className="text-xs font-semibold text-foreground">Unit price: ${selectedItem.price.toFixed(2)}</p>
            ) : null}
          </div>
        )}

        <Separator />

        <Button
          variant="destructive"
          className="h-10 w-full rounded-full"
          disabled={!selectedItem}
          onClick={() => {
            if (!selectedItem) return
            setShowRemoveDialog(true)
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Item
        </Button>

        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Remove selected item?</DialogTitle>
              <DialogDescription>
                This removes the furniture item from your layout.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!selectedItem) return
                  removeFurniture(selectedItem.id)
                  selectFurniture(null)
                  setShowRemoveDialog(false)
                }}
              >
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
