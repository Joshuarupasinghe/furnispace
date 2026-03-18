/**
 * Room Coordinate System Utilities
 * 
 * Single source of truth for converting between meters and pixels in the 2D designer.
 * 
 * Coordinate System:
 * - Origin (0,0) is top-left corner of the room
 * - X-axis: positive to the right (room width in meters)
 * - Y-axis: positive downward (room length in meters)
 * - Canvas pixels directly map to room coordinates (canvas = room)
 */

export interface RoomDimensions {
  widthMeters: number
  lengthMeters: number
}

export interface ContainerDimensions {
  width: number   // pixels
  height: number  // pixels
}

export interface CanvasDimensions {
  width: number   // pixels
  height: number  // pixels
  scale: number   // pixels per meter
}

// Constants
export const MIN_SCALE = 40       // Minimum pixels per meter
export const MAX_SCALE = 150      // Maximum pixels per meter
export const GRID_SIZE_METERS = 0.5

/**
 * Calculate canvas dimensions that fit within a container while maintaining room aspect ratio.
 * This is the RESPONSIVE version that adapts to available space.
 */
export function calculateResponsiveCanvasDimensions(
  room: RoomDimensions,
  container: ContainerDimensions
): CanvasDimensions {
  const roomAspectRatio = room.widthMeters / room.lengthMeters
  const containerAspectRatio = container.width / container.height
  
  let canvasWidth: number
  let canvasHeight: number
  
  // Fit room within container while maintaining aspect ratio
  if (roomAspectRatio > containerAspectRatio) {
    // Room is wider relative to container - constrain by width
    canvasWidth = container.width
    canvasHeight = canvasWidth / roomAspectRatio
  } else {
    // Room is taller relative to container - constrain by height
    canvasHeight = container.height
    canvasWidth = canvasHeight * roomAspectRatio
  }
  
  // Round to integers
  canvasWidth = Math.round(canvasWidth)
  canvasHeight = Math.round(canvasHeight)
  
  // Calculate scale (pixels per meter)
  let scale = canvasWidth / room.widthMeters
  
  // Clamp scale to reasonable range
  if (scale < MIN_SCALE) {
    scale = MIN_SCALE
    canvasWidth = Math.round(room.widthMeters * scale)
    canvasHeight = Math.round(room.lengthMeters * scale)
  } else if (scale > MAX_SCALE) {
    scale = MAX_SCALE
    canvasWidth = Math.round(room.widthMeters * scale)
    canvasHeight = Math.round(room.lengthMeters * scale)
  }
  
  // Final constraint: don't exceed container
  if (canvasWidth > container.width) {
    const reduction = container.width / canvasWidth
    canvasWidth = Math.round(container.width)
    canvasHeight = Math.round(canvasHeight * reduction)
    scale = canvasWidth / room.widthMeters
  }
  if (canvasHeight > container.height) {
    const reduction = container.height / canvasHeight
    canvasHeight = Math.round(container.height)
    canvasWidth = Math.round(canvasWidth * reduction)
    scale = canvasWidth / room.widthMeters
  }
  
  return { width: canvasWidth, height: canvasHeight, scale }
}

/**
 * Legacy function - Calculate canvas dimensions from room dimensions only.
 * @deprecated Use calculateResponsiveCanvasDimensions for responsive layouts
 */
export function calculateCanvasDimensions(room: RoomDimensions): CanvasDimensions {
  // Use a default container size for backward compatibility
  return calculateResponsiveCanvasDimensions(room, { width: 800, height: 600 })
}

/**
 * Convert position from meters to pixels.
 */
export function metersToPixels(
  xMeters: number,
  yMeters: number,
  scale: number
): { x: number; y: number } {
  return {
    x: xMeters * scale,
    y: yMeters * scale,
  }
}

/**
 * Convert position from pixels to meters.
 */
export function pixelsToMeters(
  xPixels: number,
  yPixels: number,
  scale: number
): { x: number; y: number } {
  return {
    x: xPixels / scale,
    y: yPixels / scale,
  }
}

/**
 * Snap a pixel value to the nearest grid point.
 */
export function snapToGrid(valuePixels: number, gridSizePixels: number): number {
  return Math.round(valuePixels / gridSizePixels) * gridSizePixels
}

/**
 * Constrain an item position within room bounds.
 */
export function constrainToRoom(
  x: number,
  y: number,
  itemWidth: number,
  itemHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(canvasWidth - itemWidth, x)),
    y: Math.max(0, Math.min(canvasHeight - itemHeight, y)),
  }
}

/**
 * Validate that a position in meters is within room bounds.
 */
export function isWithinRoom(
  xMeters: number,
  yMeters: number,
  roomWidthMeters: number,
  roomLengthMeters: number
): boolean {
  return (
    xMeters >= 0 &&
    xMeters <= roomWidthMeters &&
    yMeters >= 0 &&
    yMeters <= roomLengthMeters
  )
}

// =============================================================================
// MANUAL TEST RUNNER
// Run with: npx tsx lib/room-coordinates.ts
// =============================================================================

function runTests() {
  console.log("🧪 Running coordinate utility tests...\n")
  
  let passed = 0
  let failed = 0
  
  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ ${testName}`)
      passed++
    } else {
      console.log(`❌ ${testName}`)
      failed++
    }
  }
  
  // Test 1: Responsive canvas - fits within container
  const container1 = { width: 600, height: 400 }
  const dims1 = calculateResponsiveCanvasDimensions({ widthMeters: 5, lengthMeters: 4 }, container1)
  assert(dims1.width <= container1.width, "Responsive: canvas width fits container")
  assert(dims1.height <= container1.height, "Responsive: canvas height fits container")
  assert(Math.abs(dims1.width / dims1.height - 5/4) < 0.02, "Responsive: aspect ratio preserved")
  
  // Test 2: Responsive canvas - wide room in tall container
  const container2 = { width: 400, height: 600 }
  const dims2 = calculateResponsiveCanvasDimensions({ widthMeters: 8, lengthMeters: 4 }, container2)
  assert(dims2.width <= container2.width, "Wide room in tall container: width constrained")
  assert(dims2.width > dims2.height, "Wide room: maintains wide aspect")
  
  // Test 3: Responsive canvas - tall room in wide container
  const container3 = { width: 600, height: 400 }
  const dims3 = calculateResponsiveCanvasDimensions({ widthMeters: 3, lengthMeters: 8 }, container3)
  assert(dims3.height <= container3.height, "Tall room in wide container: height constrained")
  assert(dims3.height > dims3.width, "Tall room: maintains tall aspect")
  
  // Test 4: Meters to pixels conversion
  const scale = 100 // 100 pixels per meter
  const px = metersToPixels(2.5, 3.0, scale)
  assert(px.x === 250, "metersToPixels x: 2.5m * 100 = 250px")
  assert(px.y === 300, "metersToPixels y: 3.0m * 100 = 300px")
  
  // Test 5: Pixels to meters conversion (inverse)
  const m = pixelsToMeters(250, 300, scale)
  assert(m.x === 2.5, "pixelsToMeters x: 250px / 100 = 2.5m")
  assert(m.y === 3.0, "pixelsToMeters y: 300px / 100 = 3.0m")
  
  // Test 6: Snap to grid
  const gridPx = 50 // 50 pixels per grid cell
  assert(snapToGrid(123, gridPx) === 100, "snapToGrid: 123 -> 100 (grid=50)")
  assert(snapToGrid(140, gridPx) === 150, "snapToGrid: 140 -> 150 (grid=50)")
  assert(snapToGrid(125, gridPx) === 150, "snapToGrid: 125 -> 150 (grid=50, rounds up at midpoint)")
  
  // Test 7: Constrain to room
  const constrained1 = constrainToRoom(-10, 50, 60, 60, 500, 400)
  assert(constrained1.x === 0, "constrainToRoom: negative x clamped to 0")
  assert(constrained1.y === 50, "constrainToRoom: valid y unchanged")
  
  const constrained2 = constrainToRoom(500, 400, 60, 60, 500, 400)
  assert(constrained2.x === 440, "constrainToRoom: x exceeding width clamped (500-60=440)")
  assert(constrained2.y === 340, "constrainToRoom: y exceeding height clamped (400-60=340)")
  
  // Test 8: Scale - small container uses appropriate scale
  const smallContainer = { width: 300, height: 300 }
  const dimsSmall = calculateResponsiveCanvasDimensions({ widthMeters: 5, lengthMeters: 4 }, smallContainer)
  assert(dimsSmall.width <= smallContainer.width, "Small container: width fits")
  assert(dimsSmall.height <= smallContainer.height, "Small container: height fits")
  assert(dimsSmall.scale > 0, "Small container: positive scale")
  
  // Test 9: Scale clamping - very large container  
  const hugeContainer = { width: 2000, height: 2000 }
  const dimsHuge = calculateResponsiveCanvasDimensions({ widthMeters: 3, lengthMeters: 3 }, hugeContainer)
  assert(dimsHuge.scale <= MAX_SCALE, "Huge container: scale <= MAX_SCALE")
  
  // Test 10: isWithinRoom
  assert(isWithinRoom(2.5, 2.0, 5, 4) === true, "isWithinRoom: center point is within")
  assert(isWithinRoom(0, 0, 5, 4) === true, "isWithinRoom: origin is within")
  assert(isWithinRoom(5, 4, 5, 4) === true, "isWithinRoom: far corner is within (boundary)")
  assert(isWithinRoom(-0.1, 2, 5, 4) === false, "isWithinRoom: negative x is outside")
  assert(isWithinRoom(2, 4.1, 5, 4) === false, "isWithinRoom: exceeding y is outside")
  
  // Test 11: Legacy function still works
  const legacy = calculateCanvasDimensions({ widthMeters: 5, lengthMeters: 4 })
  assert(legacy.width > 0, "Legacy function: returns valid width")
  assert(legacy.height > 0, "Legacy function: returns valid height")
  assert(legacy.scale > 0, "Legacy function: returns valid scale")
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`)
  
  if (failed > 0) {
    process.exit(1)
  }
}

// Only run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests()
}
