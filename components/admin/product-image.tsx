"use client"

import { useState } from "react"

const FALLBACK_BY_ID: Record<string, string> = {
  "sofa-001": "/sofa/sofa.jpg",
  "chair-001": "/ergonomic-chair/front.jpg",
  "table-001": "/dining-table/dining-table-amir3design-3d-model-c74df80176.jpg",
  "bed-001": "/platform-bed/bed.jpg",
  "desk-001": "/standing-desk/desk.jpg",
  "cabinet-001": "/storage-cabinet/cabinet.jpg",
}
const FALLBACK_BY_NAME: Record<string, string> = {
  "Modern Sofa": "/sofa/sofa.jpg",
  "Ergonomic Chair": "/ergonomic-chair/front.jpg",
  "Dining Table": "/dining-table/dining-table-amir3design-3d-model-c74df80176.jpg",
  "Platform Bed": "/platform-bed/bed.jpg",
  "Standing Desk": "/standing-desk/desk.jpg",
  "Storage Cabinet": "/storage-cabinet/cabinet.jpg",
}

function getFallbackUrl(product: { id: string; name: string }): string | null {
  return FALLBACK_BY_ID[product.id] ?? FALLBACK_BY_NAME[product.name] ?? null
}

function getPrimaryUrl(product: { image_url?: string; image_urls?: string[] }): string | null {
  if (product.image_url) return product.image_url
  if (product.image_urls?.length) return product.image_urls[0]
  return null
}

interface ProductImageProps {
  product: {
    id: string
    name: string
    image_url?: string
    image_urls?: string[]
  }
  className?: string
}

export function ProductImage({ product, className = "h-16 w-16 rounded object-cover" }: ProductImageProps) {
  const primaryUrl = getPrimaryUrl(product)
  const fallbackUrl = getFallbackUrl(product)
  const [src, setSrc] = useState(primaryUrl || fallbackUrl || "")
  const [failed, setFailed] = useState(false)

  const handleError = () => {
    if (failed) return
    // If primary failed, try fallback
    if (src === primaryUrl && fallbackUrl) {
      setSrc(fallbackUrl)
    } else {
      setFailed(true)
    }
  }

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <span className="text-xs text-muted-foreground">No image</span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={product.name}
      className={className}
      onError={handleError}
    />
  )
}
