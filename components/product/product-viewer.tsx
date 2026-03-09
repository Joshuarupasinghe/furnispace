"use client"

import { useState, useMemo } from "react"
import { ImageGallery } from "./image-gallery"
import { ModelViewer } from "./model-viewer"
import { Card } from "@/components/ui/card"
import { Box, Image as ImageIcon, Boxes } from "lucide-react"

// Import Tabs components
import * as TabsComponents from "@/components/ui/tabs"

interface ProductViewerProps {
  imageUrl?: string
  /** When set, used as gallery images (overrides building from imageUrl) */
  imageUrls?: string[]
  modelUrl?: string
  objUrl?: string
  mtlUrl?: string
  productName: string
  productId?: string
  dimensions?: { width: number; length: number; height: number }
  colors?: string[]
  /** Selected color from Available Colors; updates the 3D model when set */
  selectedColor?: string
}

export function ProductViewer({ imageUrl, imageUrls: imageUrlsProp, modelUrl, objUrl, mtlUrl, productName, productId, dimensions, colors, selectedColor }: ProductViewerProps) {
  const [viewMode, setViewMode] = useState<"image" | "3d">("image")

  // Gallery: use imageUrlsProp when provided, else build from imageUrl
  // Use useMemo to ensure Math.random() only runs on client side
  const imageUrls = useMemo(() => {
    if (imageUrlsProp?.length) {
      return imageUrlsProp
    }
    if (imageUrl && typeof window !== "undefined") {
      return [
        imageUrl,
        imageUrl.replace("w=800", "w=800&sig=" + Math.random()),
        imageUrl.replace("w=800", "w=800&sig=" + Math.random() * 2),
      ]
    }
    return imageUrl ? [imageUrl] : []
  }, [imageUrl, imageUrlsProp])

  // Extract Tabs components
  const Tabs = TabsComponents.Tabs
  const TabsList = TabsComponents.TabsList
  const TabsTrigger = TabsComponents.TabsTrigger
  const TabsContent = TabsComponents.TabsContent

  // Fallback if Tabs components are not available
  if (!Tabs || !TabsList || !TabsTrigger || !TabsContent) {
    return (
      <Card className="overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("image")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "image"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ImageIcon className="h-4 w-4 inline mr-2" />
              Images
            </button>
            <button
              onClick={() => setViewMode("3d")}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "3d"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Boxes className="h-4 w-4 inline mr-2" />
              3D Model
            </button>
          </div>
        </div>
        <div className="p-4">
          {viewMode === "image" ? (
            imageUrl && imageUrls.length > 0 ? (
              <ImageGallery images={imageUrls} productName={productName} />
            ) : (
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                <Box className="h-48 w-48 text-gray-400" />
              </div>
            )
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {modelUrl ? (
                <ModelViewer
                  src={modelUrl}
                  alt={productName}
                  ar={true}
                  autoRotate={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                  <Boxes className="h-24 w-24 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">3D model not available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back soon for 3D viewing
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <Tabs value={viewMode} onValueChange={(v: string) => setViewMode(v as "image" | "3d")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="3d" className="flex items-center gap-2">
            <Boxes className="h-4 w-4" />
            3D Model
          </TabsTrigger>
        </TabsList>
        <TabsContent value="image" className="mt-0">
          {imageUrl && imageUrls.length > 0 ? (
            <ImageGallery images={imageUrls} productName={productName} />
          ) : (
            <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <Box className="h-48 w-48 text-gray-400" />
            </div>
          )}
        </TabsContent>
        <TabsContent value="3d" className="mt-0">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden" style={{ position: 'relative', pointerEvents: 'auto' }}>
            {modelUrl || (productId && dimensions) ? (
              <ModelViewer
                src={modelUrl || ""}
                alt={productName}
                ar={true}
                autoRotate={true}
                className="w-full h-full"
                furnitureType={productId}
                dimensions={dimensions}
                objUrl={objUrl}
                mtlUrl={mtlUrl}
                color={selectedColor ?? colors?.[0]}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
                <Boxes className="h-24 w-24 text-gray-400 mb-4" />
                <p className="text-muted-foreground">3D model not available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Check back soon for 3D viewing
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
