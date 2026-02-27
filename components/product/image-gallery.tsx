"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (images.length === 0) return null

  return (
    <>
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 group">
        <Image
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized
        />
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex ? "w-8 bg-white" : "w-2 bg-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsFullscreen(true)}
        >
          <X className="h-4 w-4 rotate-45" />
        </Button>
      </div>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <DialogTitle className="sr-only">{productName} - Image Gallery</DialogTitle>
          <div className="relative w-full h-full">
            <Image
              src={images[currentIndex]}
              alt={`${productName} - Fullscreen`}
              fill
              className="object-contain"
              sizes="100vw"
              unoptimized
            />
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
