"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Smartphone, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { ModelViewerFallback } from "./model-viewer-fallback"
import { Furniture3D } from "./furniture-3d"
import { EXTERNAL_URLS } from "@/lib/config"

interface ModelViewerElement extends HTMLElement {
  loaded?: boolean
  src?: string
}

type ModelViewerTagProps = React.DetailedHTMLProps<React.HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
  src: string
  alt?: string
  "ar-mode"?: string
  "ar-modes"?: string
  "ar-scale"?: string
  "camera-controls"?: boolean
  "auto-rotate"?: boolean
  "interaction-policy"?: string
  "poster"?: string
  "reveal"?: string
  "loading"?: string
  "shadow-intensity"?: string
  "exposure"?: string
  children?: React.ReactNode
}

interface ModelViewerProps {
  src: string
  alt?: string
  ar?: boolean
  autoRotate?: boolean
  className?: string
  furnitureType?: string
  dimensions?: { width: number; length: number; height: number }
  objUrl?: string
  mtlUrl?: string
  color?: string
}

// Reliable demo model URL
const DEMO_MODEL = EXTERNAL_URLS.MODEL_VIEWER_DEMO

const isModelViewerDefined = () => {
  if (typeof window === "undefined") return false
  return window.customElements.get("model-viewer") !== undefined
}

export function ModelViewer({ 
  src, 
  alt = "3D Model", 
  ar = true, 
  autoRotate = true, 
  className,
  furnitureType,
  dimensions,
  objUrl,
  mtlUrl,
  color
}: ModelViewerProps) {
  const viewerRef = useRef<ModelViewerElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [modelSrc] = useState(src || DEMO_MODEL)
  const [isModelViewerReady, setIsModelViewerReady] = useState(() => isModelViewerDefined())
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // If we have furniture type and dimensions, prefer Three.js model (matches furniture type)
  const shouldUseFurnitureModel = Boolean(furnitureType && dimensions)

  // Check if model-viewer is ready
  useEffect(() => {
    if (!scriptLoaded || shouldUseFurnitureModel || isModelViewerReady) return

    // Poll for custom element
    const interval = setInterval(() => {
      if (isModelViewerDefined()) {
        setIsModelViewerReady(true)
        clearInterval(interval)
      }
    }, 100)

    // Timeout after 3 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!isModelViewerDefined()) {
        console.warn("model-viewer not available, using fallback")
        setHasError(true)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [scriptLoaded, shouldUseFurnitureModel, isModelViewerReady])

  // Handle model loading
  useEffect(() => {
    if (shouldUseFurnitureModel) return
    if (isModelViewerReady && viewerRef.current) {
      const viewer = viewerRef.current

      const handleLoad = () => {
        setIsLoaded(true)
        setHasError(false)
      }

      const handleError = (e: Event) => {
        console.error("Model error:", e)
        // If we have furniture type and dimensions, use Three.js fallback instead
        if (furnitureType && dimensions) {
          setIsLoaded(true) // Show the fallback immediately
        } else {
          setHasError(true)
        }
      }

      viewer.addEventListener("load", handleLoad)
      viewer.addEventListener("error", handleError)

      return () => {
        viewer.removeEventListener("load", handleLoad)
        viewer.removeEventListener("error", handleError)
      }
    }
  }, [isModelViewerReady, modelSrc, shouldUseFurnitureModel, furnitureType, dimensions])

  // Timeout fallback
  useEffect(() => {
    if (shouldUseFurnitureModel) return
    if (isModelViewerReady && !isLoaded && !hasError) {
      const timeout = setTimeout(() => {
        if (viewerRef.current?.loaded) {
          setIsLoaded(true)
        } else {
          // Use furniture-specific fallback if available
          if (furnitureType && dimensions) {
            setIsLoaded(true)
          } else {
            setHasError(true)
          }
        }
      }, 10000)

      return () => clearTimeout(timeout)
    }
  }, [isModelViewerReady, isLoaded, hasError, furnitureType, dimensions, shouldUseFurnitureModel])

  const handleRetry = () => {
    setHasError(false)
    setIsLoaded(false)
    if (viewerRef.current) {
      viewerRef.current.src = modelSrc
    }
  }

  // If using furniture-specific model, render it directly
  if (shouldUseFurnitureModel) {
    return (
      <div className={`relative w-full h-full ${className}`} style={{ pointerEvents: 'auto', position: 'relative' }}>
        <Furniture3D 
          type={furnitureType!} 
          className={className}
          dimensions={dimensions!}
          modelUrl={src}
          objUrl={objUrl}
          mtlUrl={mtlUrl}
          color={color}
        />
      </div>
    )
  }

  return (
    <>
      <Script
        src={EXTERNAL_URLS.MODEL_VIEWER_SCRIPT}
        strategy="lazyOnload"
        onLoad={() => {
          setScriptLoaded(true)
        }}
        onError={() => {
          setHasError(true)
        }}
      />
      <div className={`relative w-full h-full ${className}`}>
        {!scriptLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading 3D viewer...</p>
            </div>
          </div>
        )}
        {scriptLoaded && !isModelViewerReady && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Initializing...</p>
            </div>
          </div>
        )}
        {!isLoaded && !hasError && isModelViewerReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 pointer-events-none">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading 3D model...</p>
            </div>
          </div>
        )}
        {hasError && (
          <>
            {furnitureType && dimensions ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="text-center p-4 bg-white/90 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      Showing 3D furniture preview
                    </p>
                  </div>
                </div>
                <Furniture3D 
                  type={furnitureType} 
                  className={className}
                  dimensions={dimensions}
                  modelUrl={src}
                  objUrl={objUrl}
                  mtlUrl={mtlUrl}
                  color={color}
                />
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
                  <div className="text-center p-4 bg-white/90 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">3D model viewer unavailable</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Showing fallback 3D preview below
                    </p>
                    <Button onClick={handleRetry} size="sm" variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
                <ModelViewerFallback className={className} />
              </>
            )}
          </>
        )}
        {isModelViewerReady && !hasError && React.createElement(
          "model-viewer",
          {
            ref: viewerRef,
            src: modelSrc,
            alt,
            "ar-modes": ar ? "webxr scene-viewer quick-look" : undefined,
            "ar-scale": "auto",
            "camera-controls": true,
            "auto-rotate": autoRotate,
            "interaction-policy": "allow-when-focused",
            loading: "auto",
            reveal: "auto",
            "shadow-intensity": "1",
            exposure: "1",
            style: {
              width: "100%",
              height: "100%",
              backgroundColor: "#f5f5f5",
            },
          } satisfies ModelViewerTagProps,
          ar && isLoaded ? (
            <button
              slot="ar-button"
              style={{
                position: "absolute",
                bottom: "16px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
                padding: "12px 24px",
                borderRadius: "8px",
                fontWeight: 600,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.9"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1"
              }}
            >
              <Smartphone style={{ width: "16px", height: "16px" }} />
              View in AR
            </button>
          ) : null,
        )}
      </div>
    </>
  )
}
