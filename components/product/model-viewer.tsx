"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Smartphone, Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { ModelViewerFallback } from "./model-viewer-fallback"
import { Furniture3D } from "./furniture-3d"
import { EXTERNAL_URLS } from "@/lib/config"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": {
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
        style?: React.CSSProperties
        className?: string
        children?: React.ReactNode
        ref?: React.Ref<any>
      }
    }
  }
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
  const viewerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [modelSrc] = useState(src || DEMO_MODEL)
  const [isModelViewerReady, setIsModelViewerReady] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  
  // If we have furniture type and dimensions, prefer Three.js model (matches furniture type)
  const shouldUseFurnitureModel = furnitureType && dimensions

  // If we should use furniture-specific model, skip model-viewer loading
  useEffect(() => {
    if (shouldUseFurnitureModel) {
      setUseFallback(true)
      setIsLoaded(true)
      return
    }
  }, [shouldUseFurnitureModel])

  // Check if model-viewer is ready
  useEffect(() => {
    if (!scriptLoaded || shouldUseFurnitureModel) return

    const checkModelViewer = () => {
      if (typeof window !== "undefined" && (window as any).customElements) {
        return (window as any).customElements.get("model-viewer") !== undefined
      }
      return false
    }

    // Check immediately
    if (checkModelViewer()) {
      setIsModelViewerReady(true)
      return
    }

    // Poll for custom element
    const interval = setInterval(() => {
      if (checkModelViewer()) {
        setIsModelViewerReady(true)
        clearInterval(interval)
      }
    }, 100)

    // Timeout after 3 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!checkModelViewer()) {
        console.warn("model-viewer not available, using fallback")
        setHasError(true)
      }
    }, 3000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [scriptLoaded])

  // Handle model loading
  useEffect(() => {
    if (shouldUseFurnitureModel) return
    if (isModelViewerReady && viewerRef.current) {
      const viewer = viewerRef.current

      const handleLoad = () => {
        setIsLoaded(true)
        setHasError(false)
      }

      const handleError = (e: any) => {
        console.error("Model error:", e)
        // If we have furniture type and dimensions, use Three.js fallback instead
        if (furnitureType && dimensions) {
          setUseFallback(true)
          setIsLoaded(true) // Show the fallback immediately
        } else {
          setHasError(true)
        }
      }

      viewer.addEventListener("load", handleLoad)
      viewer.addEventListener("error", handleError)

      if (viewer.loaded) {
        setIsLoaded(true)
      }

      return () => {
        viewer.removeEventListener("load", handleLoad)
        viewer.removeEventListener("error", handleError)
      }
    }
  }, [isModelViewerReady, modelSrc])

  // Timeout fallback
  useEffect(() => {
    if (shouldUseFurnitureModel) return
    if (isModelViewerReady && !isLoaded && !hasError && !useFallback) {
      const timeout = setTimeout(() => {
        if (viewerRef.current?.loaded) {
          setIsLoaded(true)
        } else {
          // Use furniture-specific fallback if available
          if (furnitureType && dimensions) {
            setUseFallback(true)
            setIsLoaded(true)
          } else {
            setHasError(true)
          }
        }
      }, 10000)

      return () => clearTimeout(timeout)
    }
  }, [isModelViewerReady, isLoaded, hasError, useFallback, furnitureType, dimensions])

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
        {isModelViewerReady && !hasError && !useFallback && (
          <model-viewer
            ref={viewerRef}
            src={modelSrc}
            alt={alt}
            ar-modes={ar ? "webxr scene-viewer quick-look" : undefined}
            ar-scale="auto"
            camera-controls
            auto-rotate={autoRotate}
            interaction-policy="allow-when-focused"
            loading="auto"
            reveal="auto"
            shadow-intensity="1"
            exposure="1"
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#f5f5f5",
            }}
          >
            {ar && isLoaded && (
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
            )}
          </model-viewer>
        )}
      </div>
    </>
  )
}
