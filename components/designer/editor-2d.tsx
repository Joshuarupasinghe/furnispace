"use client"

import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react"
import { Canvas, Rect, Text } from "fabric"
import { useDesignStore } from "@/store/design-store"
import { FurnitureItem } from "@/types/design"

// Constants
const GRID_SIZE_METERS = 0.5
const CONTAINER_PADDING = 32
const MIN_SCALE = 40
const MAX_SCALE = 150

function get2DShadedColor(color: string, shading = 0.5): string {
  const hex = color?.startsWith("#") ? color.slice(1) : color
  if (!hex || !/^[0-9A-Fa-f]{6}$/.test(hex)) return color || "#888888"

  const shade = Math.max(0, Math.min(1, shading))
  const brightness = 1 - shade * 0.5

  const r = Math.round(parseInt(hex.slice(0, 2), 16) * brightness)
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * brightness)
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * brightness)

  return `rgb(${r}, ${g}, ${b})`
}

interface RoomBounds {
  canvasWidth: number
  canvasHeight: number
  scale: number
  roomWidthMeters: number
  roomLengthMeters: number
}

export function Editor2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const isInitializedRef = useRef(false)
  
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 })
  const [renderTrigger, setRenderTrigger] = useState(0) // Force re-render
  
  const {
    roomConfig,
    currentDesign,
    updateFurniture,
    saveToHistory,
    selectFurniture,
    selectedFurnitureId,
  } = useDesignStore()
  
  // Store callbacks in refs to avoid dependency issues
  const selectFurnitureRef = useRef(selectFurniture)
  const updateFurnitureRef = useRef(updateFurniture)
  const saveToHistoryRef = useRef(saveToHistory)
  const containerSizeRef = useRef(containerSize)
  const roomConfigRef = useRef(roomConfig)
  selectFurnitureRef.current = selectFurniture
  updateFurnitureRef.current = updateFurniture
  saveToHistoryRef.current = saveToHistory
  containerSizeRef.current = containerSize
  roomConfigRef.current = roomConfig

  // Calculate room bounds - use ref version for event handlers
  const calculateBoundsFromRef = useCallback((): RoomBounds => {
    const config = roomConfigRef.current
    const container = containerSizeRef.current
    if (!config) {
      return { canvasWidth: 400, canvasHeight: 300, scale: 80, roomWidthMeters: 5, roomLengthMeters: 4 }
    }
    
    const roomAspect = config.width / config.length
    const containerAspect = container.width / container.height
    
    let canvasWidth: number, canvasHeight: number
    
    if (roomAspect > containerAspect) {
      canvasWidth = container.width
      canvasHeight = canvasWidth / roomAspect
    } else {
      canvasHeight = container.height
      canvasWidth = canvasHeight * roomAspect
    }
    
    canvasWidth = Math.round(Math.max(200, canvasWidth))
    canvasHeight = Math.round(Math.max(150, canvasHeight))
    
    let scale = canvasWidth / config.width
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    
    return {
      canvasWidth,
      canvasHeight,
      scale,
      roomWidthMeters: config.width,
      roomLengthMeters: config.length,
    }
  }, [])

  // Calculate room bounds
  const calculateBounds = useCallback((container: { width: number; height: number }): RoomBounds => {
    if (!roomConfig) {
      return { canvasWidth: 400, canvasHeight: 300, scale: 80, roomWidthMeters: 5, roomLengthMeters: 4 }
    }
    
    const roomAspect = roomConfig.width / roomConfig.length
    const containerAspect = container.width / container.height
    
    let canvasWidth: number, canvasHeight: number
    
    if (roomAspect > containerAspect) {
      canvasWidth = container.width
      canvasHeight = canvasWidth / roomAspect
    } else {
      canvasHeight = container.height
      canvasWidth = canvasHeight * roomAspect
    }
    
    canvasWidth = Math.round(Math.max(200, canvasWidth))
    canvasHeight = Math.round(Math.max(150, canvasHeight))
    
    let scale = canvasWidth / roomConfig.width
    scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
    
    return {
      canvasWidth,
      canvasHeight,
      scale,
      roomWidthMeters: roomConfig.width,
      roomLengthMeters: roomConfig.length,
    }
  }, [roomConfig])

  // Track container size
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const update = () => {
      const rect = container.getBoundingClientRect()
      setContainerSize({
        width: Math.max(200, rect.width - CONTAINER_PADDING),
        height: Math.max(150, rect.height - CONTAINER_PADDING - 40),
      })
    }
    
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    window.addEventListener("resize", update)
    
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", update)
    }
  }, [])

  // Initialize canvas ONCE
  useEffect(() => {
    if (!canvasRef.current || !roomConfig || isInitializedRef.current) return
    
    const bounds = calculateBounds(containerSize)
    console.log('[Editor2D] Creating Fabric canvas:', bounds)
    
    const canvas = new Canvas(canvasRef.current, {
      width: bounds.canvasWidth,
      height: bounds.canvasHeight,
      backgroundColor: "#f8f8f8",
      selection: true,
    })
    
    fabricRef.current = canvas
    isInitializedRef.current = true
    
    // Selection handlers - use refs to avoid stale closures
    canvas.on("selection:created", (e) => {
      const obj = e.selected?.[0] as any
      if (obj?.furnitureId) selectFurnitureRef.current(obj.furnitureId)
    })
    canvas.on("selection:updated", (e) => {
      const obj = e.selected?.[0] as any
      if (obj?.furnitureId) selectFurnitureRef.current(obj.furnitureId)
    })
    canvas.on("selection:cleared", () => selectFurnitureRef.current(null))
    
    // Live movement handler - snap to grid, constrain, and update label
    canvas.on("object:moving", (e) => {
      const obj = e.target as any
      if (!obj?.furnitureId) return
      
      obj.isMoving = true
      
      const bounds = calculateBoundsFromRef()
      const gridPx = GRID_SIZE_METERS * bounds.scale
      const size = (obj.width || 60) * (obj.scaleX || 1)
      
      // Snap to grid
      let x = Math.round((obj.left || 0) / gridPx) * gridPx
      let y = Math.round((obj.top || 0) / gridPx) * gridPx
      
      // Constrain to bounds
      x = Math.max(0, Math.min(bounds.canvasWidth - size, x))
      y = Math.max(0, Math.min(bounds.canvasHeight - size, y))
      
      obj.set({ left: x, top: y })
      
      // Update label position
      const label = canvas.getObjects().find((o: any) => o.isLabel && o.furnitureId === obj.furnitureId)
      if (label) {
        label.set({ left: x, top: y - 18 })
      }
    })
    
    // Rotation handler - update label during rotation too
    canvas.on("object:rotating", (e) => {
      const obj = e.target as any
      if (!obj?.furnitureId) return
      obj.isMoving = true
    })
    
    // Final movement handler - save to state
    canvas.on("object:modified", (e) => {
      const obj = e.target as any
      if (!obj?.furnitureId) return
      
      obj.isMoving = false
      
      const bounds = calculateBoundsFromRef()
      const xMeters = (obj.left || 0) / bounds.scale
      const yMeters = (obj.top || 0) / bounds.scale
      
      updateFurnitureRef.current(obj.furnitureId, {
        x: Math.max(0, Math.min(bounds.roomWidthMeters, xMeters)),
        y: Math.max(0, Math.min(bounds.roomLengthMeters, yMeters)),
        rotation: ((obj.angle || 0) * Math.PI) / 180,
        scale: obj.scaleX || 1,
      })
      saveToHistoryRef.current()
    })
    
    // Scaling handler
    canvas.on("object:scaling", (e) => {
      const obj = e.target as any
      if (!obj?.furnitureId) return
      obj.isMoving = true
    })
    
    console.log('[Editor2D] Canvas created successfully')
    
    // Trigger initial render
    setRenderTrigger(t => t + 1)
    
    return () => {
      console.log('[Editor2D] Disposing canvas')
      canvas.dispose()
      fabricRef.current = null
      isInitializedRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomConfig]) // Only re-run when roomConfig changes (triggers full reset)

  // Render room background, grid, and furniture
  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || !roomConfig) {
      console.log('[Editor2D] Render skipped - no canvas/roomConfig')
      return
    }
    
    const bounds = calculateBounds(containerSize)
    const furnitureItems = currentDesign?.furnitureItems || []
    const gridPx = GRID_SIZE_METERS * bounds.scale
    
    console.log('[Editor2D] Rendering:', {
      bounds,
      furnitureCount: furnitureItems.length,
      gridPx,
    })
    
    // Resize canvas
    canvas.setDimensions({ width: bounds.canvasWidth, height: bounds.canvasHeight })
    
    // Get existing objects
    const allObjects = canvas.getObjects()
    const existingFurnitureRects = allObjects.filter((o: any) => o.furnitureId) as any[]
    const existingLabels = allObjects.filter((o: any) => o.isLabel) as any[]
    const existingBackground = allObjects.filter((o: any) => o.isBackground) as any[]
    const existingGrid = allObjects.filter((o: any) => o.isGridLine) as any[]
    
    // Only rebuild room and grid if they don't exist or need resize
    const needsBackgroundRebuild = existingBackground.length === 0
    
    if (needsBackgroundRebuild) {
      // Remove old background and grid
      existingBackground.forEach(o => canvas.remove(o))
      existingGrid.forEach(o => canvas.remove(o))
      
      // Draw room background
      const roomRect = new Rect({
        left: 0,
        top: 0,
        width: bounds.canvasWidth,
        height: bounds.canvasHeight,
        fill: "#ffffff",
        stroke: "transparent",
        strokeWidth: 0,
        selectable: false,
        evented: false,
      })
      ;(roomRect as any).isBackground = true
      canvas.add(roomRect)
      canvas.sendObjectToBack(roomRect)
      
      // Grid drawing disabled - clean 2D view
    }
    
    // Track which furniture IDs exist in current state
    const currentFurnitureIds = new Set(furnitureItems.map(i => i.id))
    
    // Remove furniture that no longer exists
    existingFurnitureRects.forEach(rect => {
      if (!currentFurnitureIds.has(rect.furnitureId)) {
        canvas.remove(rect)
      }
    })
    existingLabels.forEach(label => {
      if (!currentFurnitureIds.has(label.furnitureId)) {
        canvas.remove(label)
      }
    })
    
    // Get updated list after removal
    const currentRects = canvas.getObjects().filter((o: any) => o.furnitureId) as any[]
    const rectMap = new Map(currentRects.map(r => [r.furnitureId, r]))
    
    // Update or add furniture items
    furnitureItems.forEach((item: FurnitureItem) => {
      const xPx = item.x * bounds.scale
      const yPx = item.y * bounds.scale
      const size = 60 * item.scale
      
      // Constrain to bounds (don't snap here - let dragging handle snap)
      const finalX = Math.max(0, Math.min(bounds.canvasWidth - size, xPx))
      const finalY = Math.max(0, Math.min(bounds.canvasHeight - size, yPx))
      
      const isSelected = selectedFurnitureId === item.id
      
      const existingRect = rectMap.get(item.id)
      
      if (existingRect) {
        // Update existing - only update if not currently being dragged
        if (!existingRect.isMoving) {
          existingRect.set({
            left: finalX,
            top: finalY,
            width: size,
            height: size,
            fill: get2DShadedColor(item.color || "#888", item.shading ?? 0.5),
            stroke: isSelected ? "#0066ff" : "#444",
            strokeWidth: isSelected ? 3 : 1,
            angle: (item.rotation * 180) / Math.PI,
          })
          existingRect.setCoords()
        }
        
        // Update label position
        const existingLabel = canvas.getObjects().find((o: any) => o.isLabel && o.furnitureId === item.id) as any
        if (existingLabel && !existingRect.isMoving) {
          existingLabel.set({ left: finalX, top: finalY - 18 })
          existingLabel.setCoords()
        }
      } else {
        // Create new furniture rect
        console.log('[Editor2D] Adding NEW furniture:', item.name, { finalX, finalY, size })
        
        const rect = new Rect({
          left: finalX,
          top: finalY,
          width: size,
          height: size,
          fill: get2DShadedColor(item.color || "#888", item.shading ?? 0.5),
          stroke: isSelected ? "#0066ff" : "#444",
          strokeWidth: isSelected ? 3 : 1,
          angle: (item.rotation * 180) / Math.PI,
          hasControls: true,
          hasBorders: true,
          selectable: true,
          evented: true,
          lockRotation: false,
          centeredRotation: true,
          lockScalingFlip: true,
        })
        ;(rect as any).furnitureId = item.id
        
        canvas.add(rect)
        
        // Label
        const label = new Text(item.name, {
          left: finalX,
          top: finalY - 18,
          fontSize: 11,
          fill: "#333",
          selectable: false,
          evented: false,
        })
        ;(label as any).isLabel = true
        ;(label as any).furnitureId = item.id
        canvas.add(label)
      }
    })
    
    // Bring furniture to front (above grid)
    canvas.getObjects().filter((o: any) => o.furnitureId || o.isLabel).forEach(o => {
      canvas.bringObjectToFront(o)
    })
    
    canvas.requestRenderAll()
    
    console.log('[Editor2D] Render complete, objects:', canvas.getObjects().length)
    
  }, [roomConfig, currentDesign, selectedFurnitureId, containerSize, calculateBounds, renderTrigger])

  if (!roomConfig) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-muted-foreground">Please configure your room first</p>
      </div>
    )
  }

  const bounds = calculateBounds(containerSize)

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg overflow-hidden relative"
      style={{ minHeight: "300px" }}
    >
      {/* Room label */}
      <div className="text-xs text-gray-600 mb-2 shrink-0" role="status" aria-live="polite">
        Room: {roomConfig.width}m × {roomConfig.length}m
      </div>
      <p className="sr-only">
        2D editor canvas. Drag to move furniture, rotate with handles, and resize with corner controls.
      </p>
      <div className="text-xs text-gray-500 mb-2 shrink-0">Tip: drag items to move, then use Undo if needed.</div>
      
      {/* Canvas */}
      <div className="flex items-center justify-center flex-1 w-full overflow-hidden" style={{ minHeight: 0 }}>
        <canvas 
          ref={canvasRef}
          className="rounded-lg shadow-md border border-gray-300"
          style={{ display: "block" }}
          aria-label="Room planning canvas"
        />
      </div>
    </div>
  )
}
