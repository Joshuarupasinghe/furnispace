"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Boxes, ShoppingCart } from "lucide-react"
import { ProductViewer } from "@/components/product/product-viewer"
import { useCartStore } from "@/store/cart-store"
import { useToast } from "@/hooks/use-toast"
import { Product } from "@/lib/db-supabase"

interface ProductDetailClientProps {
  product: Product
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const activeColor = selectedColor ?? product.colors?.[0] ?? "#888888"
  const addItem = useCartStore((s) => s.addItem)
  const { toast } = useToast()

  const handleAddToCart = () => {
    addItem(product.id, activeColor, 1)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  // Format image URLs
  const formatImageUrl = (url: string | undefined) => {
    if (!url) return undefined
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (!url.startsWith('/')) return '/' + url
    return url
  }

  const imageUrl = formatImageUrl(product.image_url)
  const imageUrls = product.image_urls?.map(formatImageUrl).filter(Boolean) as string[] | undefined

  return (
    <div className="grid md:grid-cols-2 gap-12">
      {/* Product Image/3D Viewer */}
      <div className="space-y-4">
        <ProductViewer
          imageUrl={imageUrl}
          imageUrls={imageUrls}
          modelUrl={product.model_url || product.obj_url}
          objUrl={product.obj_url}
          mtlUrl={product.mtl_url}
          productName={product.name}
          productId={product.id}
          dimensions={product.dimensions}
          colors={product.colors}
          selectedColor={activeColor}
        />

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {(product.model_url || product.obj_url) && (
            <Badge variant="secondary" className="text-sm">
              <Boxes className="h-3 w-3 mr-1" />
              3D View Available
            </Badge>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
          <p className="text-xl text-muted-foreground">{product.category}</p>
        </div>

        <div className="text-3xl font-bold">${product.price}</div>

        <div>
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Dimensions</h3>
          <p className="text-muted-foreground">
            {product.dimensions.width}m × {product.dimensions.length}m × {product.dimensions.height}m
          </p>
        </div>

        {product.colors && product.colors.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Available Colors</h3>
            <p className="text-sm text-muted-foreground mb-2">Click a color to see it on the 3D model</p>
            <div className="flex gap-3">
              {product.colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-12 h-12 rounded-full border-2 shadow-sm hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    activeColor === color ? "border-primary ring-2 ring-primary ring-offset-2" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button size="lg" onClick={handleAddToCart} className="w-full" variant="default">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>

        {/* Features */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>High-quality materials</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>3D visualization available</span>
            </div>
            {(product.model_url || product.obj_url) && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>AR viewing supported</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Customizable colors</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
