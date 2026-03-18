"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RoomConfig, FloorTextureType, WallMaterialType } from "@/types/design"
import { useDesignStore } from "@/store/design-store"
import { useToast } from "@/hooks/use-toast"
import { TextureThumbnailPicker, TextureOption } from "@/components/designer/texture-thumbnail-picker"

interface ApiTexture {
  id: string
  name: string
  type: "floor" | "wall"
  category?: string
  file_url?: string
}

/** Build a preview URL for a texture option. Tries the API file_url first,
 *  then falls back to the legacy public path. */
function resolvePreviewUrl(value: string, type: "floor" | "wall", fileUrl?: string): string | undefined {
  if (fileUrl) return fileUrl
  if (value === "none" || value === "color") return undefined
  const dir = type === "floor" ? "floors" : "walls"
  return `/textures/${dir}/${value}.jpg`
}

/** Solid fill colours shown when the real texture image is unavailable. */
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

const LEGACY_FLOOR_TEXTURES: TextureOption[] = [
  { value: "none", label: "Solid Color", solidColor: SWATCH_COLORS["none"] },
  { value: "wood-oak", label: "Oak Wood", solidColor: SWATCH_COLORS["wood-oak"], previewUrl: "/textures/floors/wood-oak.jpg" },
  { value: "wood-walnut", label: "Walnut", solidColor: SWATCH_COLORS["wood-walnut"], previewUrl: "/textures/floors/wood-walnut.jpg" },
  { value: "wood-light", label: "Light Wood", solidColor: SWATCH_COLORS["wood-light"], previewUrl: "/textures/floors/wood-light.jpg" },
  { value: "tile-marble", label: "Marble", solidColor: SWATCH_COLORS["tile-marble"], previewUrl: "/textures/floors/tile-marble.jpg" },
  { value: "tile-ceramic", label: "Ceramic", solidColor: SWATCH_COLORS["tile-ceramic"], previewUrl: "/textures/floors/tile-ceramic.jpg" },
  { value: "tile-slate", label: "Slate", solidColor: SWATCH_COLORS["tile-slate"], previewUrl: "/textures/floors/tile-slate.jpg" },
]

const LEGACY_WALL_TEXTURES: TextureOption[] = [
  { value: "color", label: "Solid Color", solidColor: SWATCH_COLORS["color"] },
  { value: "panel-wood", label: "Wood Panels", solidColor: SWATCH_COLORS["panel-wood"], previewUrl: "/textures/walls/panel-wood.jpg" },
  { value: "panel-white", label: "White Panels", solidColor: SWATCH_COLORS["panel-white"], previewUrl: "/textures/walls/panel-white.jpg" },
  { value: "brick", label: "Brick", solidColor: SWATCH_COLORS["brick"], previewUrl: "/textures/walls/brick.jpg" },
  { value: "concrete", label: "Concrete", solidColor: SWATCH_COLORS["concrete"], previewUrl: "/textures/walls/concrete.jpg" },
]

interface RoomConfigProps {
  onComplete: () => void
}

export function RoomConfigPanel({ onComplete }: RoomConfigProps) {
  const { setRoomConfig } = useDesignStore()
  const { toast } = useToast()
  const [floorTextureOptions, setFloorTextureOptions] = useState<TextureOption[]>(LEGACY_FLOOR_TEXTURES)
  const [wallTextureOptions, setWallTextureOptions] = useState<TextureOption[]>(LEGACY_WALL_TEXTURES)
  const [config, setConfig] = useState<RoomConfig>({
    width: 5,
    length: 4,
    height: 2.5,
    shape: "rectangle",
    colorScheme: "#f5f5f5",
    floorTexture: "wood-oak",
    wallMaterial: "color",
    wallColor: "#eeeeee",
  })

  useEffect(() => {
    let mounted = true

    const loadTextures = async () => {
      try {
        const response = await fetch("/api/textures")
        if (!response.ok) return

        const textures = (await response.json()) as ApiTexture[]
        if (!mounted) return

        const floorOptions: TextureOption[] = [{ value: "none", label: "Solid Color", solidColor: SWATCH_COLORS["none"] }]
        const wallOptions: TextureOption[] = [{ value: "color", label: "Solid Color", solidColor: SWATCH_COLORS["color"] }]

        for (const texture of textures) {
          const option: TextureOption = {
            value: texture.id,
            label: texture.name,
            category: texture.category,
            previewUrl: resolvePreviewUrl(texture.id, texture.type, texture.file_url),
            solidColor: SWATCH_COLORS[texture.id] ?? (texture.type === "floor" ? "#c5a880" : "#d4d4d4"),
          }
          if (texture.type === "floor") {
            floorOptions.push(option)
          } else {
            wallOptions.push(option)
          }
        }

        if (floorOptions.length > 1) setFloorTextureOptions(floorOptions)
        if (wallOptions.length > 1) setWallTextureOptions(wallOptions)
      } catch {
        // Keep legacy defaults if texture fetch fails.
      }
    }

    void loadTextures()
    return () => { mounted = false }
  }, [])

  const resolvedFloorOptions = useMemo(() => {
    const exists = floorTextureOptions.some((t) => t.value === config.floorTexture)
    if (!config.floorTexture || exists) return floorTextureOptions
    return [
      ...floorTextureOptions,
      { value: config.floorTexture, label: "Current texture", solidColor: "#c5a880" },
    ]
  }, [config.floorTexture, floorTextureOptions])

  const resolvedWallOptions = useMemo(() => {
    const exists = wallTextureOptions.some((t) => t.value === config.wallMaterial)
    if (!config.wallMaterial || exists) return wallTextureOptions
    return [
      ...wallTextureOptions,
      { value: config.wallMaterial, label: "Current texture", solidColor: "#d4d4d4" },
    ]
  }, [config.wallMaterial, wallTextureOptions])

  const handleSubmit = () => {
    if (config.width <= 0 || config.length <= 0 || config.height <= 0) {
      toast({
        title: "Invalid room dimensions",
        description: "Width, length, and height must be greater than 0.",
        variant: "destructive",
      })
      return
    }
    if (
      (!config.floorTexture || config.floorTexture === "none") &&
      (!config.colorScheme || !config.colorScheme.match(/^#[0-9A-Fa-f]{6}$/))
    ) {
      toast({
        title: "Invalid floor color",
        description: "Use hex format like #RRGGBB.",
        variant: "destructive",
      })
      return
    }

    setRoomConfig(config)
    toast({ title: "Room configured", description: "Your room settings were applied." })
    onComplete()
  }

  const hasValidDimensions = config.width > 0 && config.length > 0 && config.height > 0
  const hasValidFloorColor =
    config.floorTexture !== "none" || /^#[0-9A-Fa-f]{6}$/.test(config.colorScheme || "")

  return (
    <Card>
      <CardContent className="space-y-4 mt-4">
        {/* Room shape */}
        <div className="space-y-2">
          <Label>Room Shape</Label>
          <Select
            value={config.shape}
            onValueChange={(value: "rectangle" | "square" | "custom") =>
              setConfig({ ...config, shape: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rectangle">Rectangle</SelectItem>
              <SelectItem value="square">Square</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Width (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.width}
              onChange={(e) => setConfig({ ...config, width: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Length (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.length}
              onChange={(e) => setConfig({ ...config, length: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Height (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.height}
              onChange={(e) => setConfig({ ...config, height: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Floor Texture thumbnails */}
        <div className="space-y-2">
          <Label>Floor Texture</Label>
          <TextureThumbnailPicker
            options={resolvedFloorOptions}
            value={config.floorTexture || "none"}
            onChange={(value) => setConfig({ ...config, floorTexture: value as FloorTextureType })}
            thumbSize={52}
          />
        </div>

        {/* Floor color (only when "Solid Color" is selected) */}
        {config.floorTexture === "none" && (
          <div className="space-y-2">
            <Label>Floor Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.colorScheme || "#f5f5f5"}
                onChange={(e) => setConfig({ ...config, colorScheme: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={config.colorScheme}
                onChange={(e) => setConfig({ ...config, colorScheme: e.target.value })}
                placeholder="#f5f5f5"
              />
            </div>
            {!hasValidFloorColor ? (
              <p className="text-xs text-red-600">Use a valid hex color (example: #AABBCC).</p>
            ) : null}
          </div>
        )}

        {/* Wall Texture thumbnails */}
        <div className="space-y-2">
          <Label>Wall Texture</Label>
          <TextureThumbnailPicker
            options={resolvedWallOptions}
            value={config.wallMaterial || "color"}
            onChange={(value) => setConfig({ ...config, wallMaterial: value as WallMaterialType })}
            thumbSize={52}
          />
        </div>

        {/* Wall color (only when "Solid Color" is selected) */}
        {config.wallMaterial === "color" && (
          <div className="space-y-2">
            <Label>Wall Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.wallColor || "#eeeeee"}
                onChange={(e) => setConfig({ ...config, wallColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={config.wallColor || "#eeeeee"}
                onChange={(e) => setConfig({ ...config, wallColor: e.target.value })}
                placeholder="#eeeeee"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full"
          disabled={!hasValidDimensions || !hasValidFloorColor}
        >
          Start Designing
        </Button>
      </CardContent>
    </Card>
  )
}
