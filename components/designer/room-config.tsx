"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RoomConfig, FloorTextureType, WallMaterialType } from "@/types/design"
import { useDesignStore } from "@/store/design-store"
import { useToast } from "@/hooks/use-toast"

const FLOOR_TEXTURES: { value: FloorTextureType; label: string; category: string }[] = [
  { value: 'none', label: 'Solid Color', category: 'Basic' },
  { value: 'wood-oak', label: 'Oak Wood', category: 'Wood' },
  { value: 'wood-walnut', label: 'Walnut Wood', category: 'Wood' },
  { value: 'wood-light', label: 'Light Wood', category: 'Wood' },
  { value: 'tile-marble', label: 'Marble', category: 'Tile' },
  { value: 'tile-ceramic', label: 'Ceramic', category: 'Tile' },
  { value: 'tile-slate', label: 'Slate', category: 'Tile' },
]

const WALL_MATERIALS: { value: WallMaterialType; label: string }[] = [
  { value: 'color', label: 'Solid Color' },
  { value: 'panel-wood', label: 'Wood Panels' },
  { value: 'panel-white', label: 'White Panels' },
  { value: 'brick', label: 'Brick' },
  { value: 'concrete', label: 'Concrete' },
]

interface RoomConfigProps {
  onComplete: () => void
}

export function RoomConfigPanel({ onComplete }: RoomConfigProps) {
  const { setRoomConfig } = useDesignStore()
  const { toast } = useToast()
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

  const handleSubmit = () => {
    // Validate room configuration
    if (config.width <= 0 || config.length <= 0 || config.height <= 0) {
      toast({
        title: "Invalid room dimensions",
        description: "Width, length, and height must be greater than 0.",
        variant: "destructive",
      })
      return
    }
    // Only validate color if no texture is selected
    if ((!config.floorTexture || config.floorTexture === 'none') && 
        (!config.colorScheme || !config.colorScheme.match(/^#[0-9A-Fa-f]{6}$/))) {
      toast({
        title: "Invalid floor color",
        description: "Use hex format like #RRGGBB.",
        variant: "destructive",
      })
      return
    }
    
    setRoomConfig(config)
    toast({
      title: "Room configured",
      description: "Your room settings were applied.",
    })
    onComplete()
  }

  const hasValidDimensions = config.width > 0 && config.length > 0 && config.height > 0
  const hasValidFloorColor =
    config.floorTexture !== "none" || /^#[0-9A-Fa-f]{6}$/.test(config.colorScheme || "")

  return (
    <Card>
      <CardContent className="space-y-4 mt-4">
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

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Width (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.width}
              onChange={(e) =>
                setConfig({ ...config, width: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Length (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.length}
              onChange={(e) =>
                setConfig({ ...config, length: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Height (m)</Label>
            <Input
              type="number"
              min="0.1"
              step="0.1"
              value={config.height}
              onChange={(e) =>
                setConfig({ ...config, height: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Floor Texture</Label>
          <Select
            value={config.floorTexture || 'none'}
            onValueChange={(value: FloorTextureType) =>
              setConfig({ ...config, floorTexture: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FLOOR_TEXTURES.map((texture) => (
                <SelectItem key={texture.value} value={texture.value}>
                  {texture.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.floorTexture === 'none' && (
          <div className="space-y-2">
            <Label>Floor Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.colorScheme || '#f5f5f5'}
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

        <div className="space-y-2">
          <Label>Wall Material</Label>
          <Select
            value={config.wallMaterial || 'color'}
            onValueChange={(value: WallMaterialType) =>
              setConfig({ ...config, wallMaterial: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WALL_MATERIALS.map((material) => (
                <SelectItem key={material.value} value={material.value}>
                  {material.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {config.wallMaterial === 'color' && (
          <div className="space-y-2">
            <Label>Wall Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={config.wallColor || '#eeeeee'}
                onChange={(e) => setConfig({ ...config, wallColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={config.wallColor || '#eeeeee'}
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
