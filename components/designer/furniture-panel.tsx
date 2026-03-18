"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useDesignStore } from "@/store/design-store"
import { useEffect, useMemo, useState } from "react"
import { Sofa } from "lucide-react"
import { API_ROUTES } from "@/lib/config"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface DesignerProduct {
  id: string
  name: string
  category: string
  price: number
  dimensions: { width: number; length: number; height: number }
  colors: string[]
  image_url?: string
  image_urls?: string[]
  model_url?: string
  obj_url?: string
  mtl_url?: string
}

export function FurniturePanel() {
  const { roomConfig, addFurniture, currentDesign, setLoadingState } = useDesignStore()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [products, setProducts] = useState<DesignerProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoadingProducts(true)
        setLoadingState("catalog", true)
        setLoadError(null)
        const response = await fetch(API_ROUTES.PRODUCTS, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = (await response.json()) as DesignerProduct[]
        setProducts(data)
      } catch (error) {
        console.error("Failed to load furniture catalog:", error)
        setLoadError("Could not load furniture catalog. Try refreshing.")
      } finally {
        setIsLoadingProducts(false)
        setLoadingState("catalog", false)
      }
    }

    loadProducts()
    return () => {
      setLoadingState("catalog", false)
    }
  }, [setLoadingState])

  const furnitureCategories = useMemo(() => {
    return ["All", ...Array.from(new Set(products.map((p) => p.category)))]
  }, [products])

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory)

  const handleAddFurniture = (product: DesignerProduct) => {
    if (!roomConfig || !currentDesign) {
      console.log('[FurniturePanel] Cannot add: missing roomConfig or currentDesign', {
        hasRoomConfig: !!roomConfig,
        hasCurrentDesign: !!currentDesign,
      })
      toast({
        title: "Cannot add furniture",
        description: "Configure a room and open a design first.",
        variant: "destructive",
      })
      return
    }

    // Grid size in meters (matching GRID_SIZE_METERS in editor-2d.tsx)
    const GRID_SIZE_METERS = 0.5
    
    // Snap position to grid (in meters)
    const snapToGrid = (value: number): number => {
      return Math.round(value / GRID_SIZE_METERS) * GRID_SIZE_METERS
    }
    
    // Place furniture in center of room, snapped to grid
    const x = snapToGrid(roomConfig.width / 2)
    const y = snapToGrid(roomConfig.length / 2)

    // Default to first available color
    const selectedColor = product.colors?.[0] || "#888888"

    const item = {
      id: `${product.id}-${Date.now()}`,
      type: product.id,
      name: product.name,
      x,
      y,
      rotation: 0,
      scale: 1,
      color: selectedColor,
      shading: 0.5,
      dimensions: product.dimensions,
      modelUrl: product.model_url,
      objUrl: product.obj_url,
      mtlUrl: product.mtl_url,
      price: product.price,
      availableColors: product.colors,
    }

    console.log('[FurniturePanel] Adding furniture:', item)
    addFurniture(item)
    console.log('[FurniturePanel] Furniture added, new count:', (currentDesign?.furnitureItems?.length ?? 0) + 1)
    toast({
      title: "Furniture added",
      description: `${product.name} placed at room center.`,
    })
  }

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 pb-3">
        <CardTitle className="text-base font-semibold text-[#1f2340]">Furniture Catalog</CardTitle>
        <CardDescription className="text-xs text-[#8086a3]">Add and style products before placing them</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="flex flex-wrap gap-1.5">
          {furnitureCategories.map((category) => (
            <Button
              key={category}
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={`h-8 rounded-full px-3 text-xs ${selectedCategory === category ? "bg-[#5d59db] text-white hover:bg-[#4f4bc8]" : "bg-[#f3f4fb] text-[#5e6485] hover:bg-[#e7e9f6]"}`}
            >
              {category}
            </Button>
          ))}
        </div>

        <div className="space-y-2" role="status" aria-live="polite">
          {isLoadingProducts ? <p className="text-sm text-[#757c99]">Loading furniture catalog...</p> : null}
          {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
          {!isLoadingProducts && !loadError && filteredProducts.length === 0 ? <p className="text-sm text-[#757c99]">No furniture in this category.</p> : null}

          {filteredProducts.map((product) => {
            const previewImage = product.image_url || product.image_urls?.[0]
            const accentColor = product.colors?.[0] || "#888888"

            return (
              <div key={product.id} className="overflow-hidden rounded-xl border border-[#e8e9f3] bg-[#fbfbff] transition-colors hover:bg-white">
                {/* Preview thumbnail */}
                <div
                  className="relative flex h-28 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
                  style={!previewImage ? { backgroundColor: `${accentColor}18` } : undefined}
                >
                  {previewImage ? (
                    <Image
                      src={previewImage}
                      alt={product.name}
                      fill
                      sizes="300px"
                      className="object-contain p-2"
                      unoptimized
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <Sofa
                        className="h-10 w-10"
                        style={{ color: accentColor }}
                      />
                      <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: accentColor }}>
                        {product.category}
                      </span>
                    </div>
                  )}
                  {/* Color dots overlay */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {product.colors.slice(0, 5).map((c) => (
                        <span
                          key={c}
                          className="h-3 w-3 rounded-full border border-white/80 shadow-sm"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                      {product.colors.length > 5 && (
                        <span className="text-[9px] leading-3 font-semibold text-white drop-shadow">+{product.colors.length - 5}</span>
                      )}
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#4f8a2d] shadow-sm">
                    3D
                  </span>
                </div>

                {/* Card body */}
                <div className="p-3">
                  <div className="mb-2">
                    <h4 className="truncate text-sm font-semibold text-[#262a48]">{product.name}</h4>
                    <p className="truncate text-xs text-[#8b91ad]">{product.category}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#8188a7]">
                      {product.dimensions.width}m × {product.dimensions.length}m
                      {product.price > 0 && (
                        <span className="ml-1.5 font-semibold text-[#4a4e6a]">${product.price.toFixed(0)}</span>
                      )}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddFurniture(product)}
                      disabled={!roomConfig || !currentDesign}
                      className="h-8 rounded-full bg-[#151936] px-4 text-xs text-white hover:bg-[#262b4c]"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
