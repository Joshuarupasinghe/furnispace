"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useDesignStore } from "@/store/design-store"
import { loadModelFromProductAssets } from "@/lib/model-loader"

function getShadedColor(color: string, shading = 0.5): THREE.Color {
  const clamped = Math.max(0, Math.min(1, shading))
  const brightness = 1 - clamped * 0.55
  return new THREE.Color(color).multiplyScalar(brightness)
}

function applyItemAppearance(material: THREE.Material, itemColor: string, shading = 0.5): THREE.Material {
  if (
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhongMaterial ||
    material instanceof THREE.MeshLambertMaterial
  ) {
    const next = material.clone()
    if (next.color) {
      next.color.copy(getShadedColor(itemColor, shading))
    }
    if (next instanceof THREE.MeshStandardMaterial) {
      // More shading means less reflectance and slightly rougher finish.
      next.metalness = Math.max(0, Math.min(1, 0.15 - shading * 0.1))
      next.roughness = Math.max(0.3, Math.min(1, 0.65 + shading * 0.25))
    }
    next.needsUpdate = true
    return next
  }
  return material
}

export function Viewer3D() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null)
  const furnitureMeshesRef = useRef<Map<string, THREE.Group>>(new Map())
  const pendingLoadsRef = useRef<Set<string>>(new Set())
  const animationFrameRef = useRef<number>()
  const selectionHelperRef = useRef<THREE.BoxHelper | null>(null)
  
  // Interaction state
  const raycasterRef = useRef(new THREE.Raycaster())
  const mouseRef = useRef(new THREE.Vector2())
  const draggedItemRef = useRef<{ id: string; startX: number; startZ: number; mouseX: number; mouseY: number } | null>(null)
  const rotatingItemRef = useRef<{ id: string; startRotation: number; mouseX: number } | null>(null)
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)) // Plane at y=0 for raycasting
  const intersectionPointRef = useRef(new THREE.Vector3())

  const { roomConfig, currentDesign, selectedFurnitureId, selectFurniture, updateFurniture, setLoadingState } = useDesignStore()

  useEffect(() => {
    if (!containerRef.current || !roomConfig) return

    const container = containerRef.current
    let cleanupFn: (() => void) | null = null
    
    // Use a small delay to ensure container is rendered
    const timeoutId = setTimeout(() => {
      // Ensure container has dimensions
      const width = container.clientWidth || 800
      const height = container.clientHeight || 600
      
      if (width === 0 || height === 0) {
        console.warn("Container has zero dimensions, using defaults")
        return
      }

      // Dynamically import OrbitControls to avoid SSR issues
      const initControls = async () => {
        try {
          const module = await import("three/examples/jsm/controls/OrbitControls.js")
          const OrbitControls = module.OrbitControls
          
          if (!cameraRef.current || !rendererRef.current) return
          
          const controls = new OrbitControls(cameraRef.current, rendererRef.current.domElement)
          controls.enableDamping = true
          controls.dampingFactor = 0.05
          controlsRef.current = controls
        } catch (error) {
          console.error("Failed to load OrbitControls:", error)
        }
      }

      // Create scene
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf5f5f5)
      sceneRef.current = scene

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        width / height,
        0.1,
        1000
      )
      camera.position.set(
        roomConfig.width * 1.5,
        roomConfig.height * 1.5,
        roomConfig.length * 1.5
      )
      camera.lookAt(roomConfig.width / 2, 0, roomConfig.length / 2)
      cameraRef.current = camera

      // Create renderer with performance optimizations
      const renderer = new THREE.WebGLRenderer({ 
        antialias: false, // Disable antialiasing for better performance
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      })
      renderer.setSize(width, height)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Limit pixel ratio for performance
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.BasicShadowMap // Faster than PCFSoftShadowMap
      renderer.shadowMap.autoUpdate = false // Don't auto-update shadows
      
      // Ensure renderer DOM element has proper styling for pointer events
      renderer.domElement.style.display = 'block'
      renderer.domElement.style.touchAction = 'none'
      renderer.domElement.style.userSelect = 'none'
      
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Initialize controls
      initControls()

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(roomConfig.width, roomConfig.height * 2, roomConfig.length)
      directionalLight.castShadow = true
      // Optimize shadow map resolution for performance
      directionalLight.shadow.mapSize.width = 512 // Reduced from default 2048
      directionalLight.shadow.mapSize.height = 512
      directionalLight.shadow.camera.near = 0.1
      directionalLight.shadow.camera.far = 50
      directionalLight.shadow.camera.left = -roomConfig.width * 2
      directionalLight.shadow.camera.right = roomConfig.width * 2
      directionalLight.shadow.camera.top = roomConfig.height * 2
      directionalLight.shadow.camera.bottom = -roomConfig.height * 2
      scene.add(directionalLight)

      // Create room (floor and walls)
      const floorGeometry = new THREE.PlaneGeometry(roomConfig.width, roomConfig.length)
      
      // Floor material - use texture if specified, otherwise solid color
      let floorMaterial: THREE.MeshStandardMaterial
      
      if (roomConfig.floorTexture && roomConfig.floorTexture !== 'none') {
        const textureLoader = new THREE.TextureLoader()
        const texturePath = `/textures/floors/${roomConfig.floorTexture}.jpg`
        const floorTexture = textureLoader.load(texturePath)
        
        // Configure texture tiling based on room size
        floorTexture.wrapS = THREE.RepeatWrapping
        floorTexture.wrapT = THREE.RepeatWrapping
        const repeatX = roomConfig.width / 2 // Repeat every 2 meters
        const repeatY = roomConfig.length / 2
        floorTexture.repeat.set(repeatX, repeatY)
        
        floorMaterial = new THREE.MeshStandardMaterial({ 
          map: floorTexture,
          roughness: 0.8,
        })
      } else {
        const floorColor = roomConfig.colorScheme || "#cccccc"
        floorMaterial = new THREE.MeshStandardMaterial({ color: floorColor })
      }
      
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.position.set(roomConfig.width / 2, 0, roomConfig.length / 2)
      floor.receiveShadow = false
      scene.add(floor)

      // Create walls
      let wallMaterial: THREE.MeshStandardMaterial
      
      if (roomConfig.wallMaterial && roomConfig.wallMaterial !== 'color') {
        const textureLoader = new THREE.TextureLoader()
        const texturePath = `/textures/walls/${roomConfig.wallMaterial}.jpg`
        const wallTexture = textureLoader.load(texturePath)
        
        wallTexture.wrapS = THREE.RepeatWrapping
        wallTexture.wrapT = THREE.RepeatWrapping
        
        wallMaterial = new THREE.MeshStandardMaterial({ 
          map: wallTexture,
          roughness: 0.9,
        })
      } else {
        const wallColor = roomConfig.wallColor || '#eeeeee'
        wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor })
      }
      
      const wallHeight = roomConfig.height

      // Back wall
      const backWallMaterial = wallMaterial.clone()
      if (backWallMaterial.map) {
        backWallMaterial.map = backWallMaterial.map.clone()
        backWallMaterial.map.repeat.set(roomConfig.width / 2, wallHeight / 2)
        backWallMaterial.map.needsUpdate = true
      }
      const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomConfig.width, wallHeight),
        backWallMaterial
      )
      backWall.position.set(roomConfig.width / 2, wallHeight / 2, 0)
      scene.add(backWall)

      // Left wall
      const leftWallMaterial = wallMaterial.clone()
      if (leftWallMaterial.map) {
        leftWallMaterial.map = leftWallMaterial.map.clone()
        leftWallMaterial.map.repeat.set(roomConfig.length / 2, wallHeight / 2)
        leftWallMaterial.map.needsUpdate = true
      }
      const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomConfig.length, wallHeight),
        leftWallMaterial
      )
      leftWall.rotation.y = Math.PI / 2
      leftWall.position.set(0, wallHeight / 2, roomConfig.length / 2)
      scene.add(leftWall)

      // Right wall
      const rightWallMaterial = wallMaterial.clone()
      if (rightWallMaterial.map) {
        rightWallMaterial.map = rightWallMaterial.map.clone()
        rightWallMaterial.map.repeat.set(roomConfig.length / 2, wallHeight / 2)
        rightWallMaterial.map.needsUpdate = true
      }
      const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(roomConfig.length, wallHeight),
        rightWallMaterial
      )
      rightWall.rotation.y = -Math.PI / 2
      rightWall.position.set(roomConfig.width, wallHeight / 2, roomConfig.length / 2)
      scene.add(rightWall)

      // Initial render to show scene immediately
      renderer.render(scene, camera)
      
      // Animation loop - always render (controls with damping need continuous updates)
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate)
        
        if (controlsRef.current) {
          controlsRef.current.update()
        }
        
        // Always render - this ensures smooth interaction and model visibility
        renderer.render(scene, camera)
      }
      animate()

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
        const width = containerRef.current.clientWidth || 800
        const height = containerRef.current.clientHeight || 600
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
      
      // Mouse interaction handlers
      const handleMouseDown = (e: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current) return
        if (e.button !== 0 && e.button !== 2) return
        
        // Calculate mouse position in normalized device coordinates
        const rect = containerRef.current.getBoundingClientRect()
        mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
        
        // Perform raycasting to detect clicked furniture
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)
        
        const furnitureObjects = Array.from(furnitureMeshesRef.current.values())
        const intersects = raycasterRef.current.intersectObjects(furnitureObjects, true)
        
        if (intersects.length > 0) {
          // Resolve clicked furniture by walking up parent chain from hit mesh.
          let furnitureId: string | null = null
          let object: THREE.Object3D | null = intersects[0].object
          while (object && !furnitureId) {
            for (const [id, mesh] of furnitureMeshesRef.current.entries()) {
              if (mesh === object) {
                furnitureId = id
                break
              }
            }
            object = object.parent
          }

          if (furnitureId) {
              selectFurniture(furnitureId)
              if (controlsRef.current) {
                controlsRef.current.enabled = false
              }
              const latestDesign = useDesignStore.getState().currentDesign
              
              if (e.button === 2 || (e.button === 0 && e.shiftKey)) { // Right click or Shift+Left - rotate
                rotatingItemRef.current = {
                  id: furnitureId,
                  startRotation: latestDesign?.furnitureItems.find(item => item.id === furnitureId)?.rotation || 0,
                  mouseX: e.clientX,
                }
                e.preventDefault()
              } else { // Left click - move
                const furnitureItem = latestDesign?.furnitureItems.find(item => item.id === furnitureId)
                if (furnitureItem) {
                  draggedItemRef.current = {
                    id: furnitureId,
                    startX: furnitureItem.x,
                    startZ: furnitureItem.y,
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                  }
                }
              }
          }
        } else if (e.button === 0) {
          // Clicking empty canvas should clear selection and remove highlight.
          selectFurniture(null)
        }
      }
      
      const handleMouseMove = (e: MouseEvent) => {
        if (!containerRef.current || !cameraRef.current) return
        const state = useDesignStore.getState()
        const latestDesign = state.currentDesign
        const latestRoomConfig = state.roomConfig
        
        if (draggedItemRef.current) {
          // Update position while dragging
          const rect = containerRef.current.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
          const y = -((e.clientY - rect.top) / rect.height) * 2 + 1
          
          // Cast ray to floor plane (y=0)
          raycasterRef.current.setFromCamera(new THREE.Vector2(x, y), cameraRef.current)
          const hasPlaneIntersection = raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPointRef.current)
          if (!hasPlaneIntersection) return
          
          const furnitureItem = latestDesign?.furnitureItems.find(item => item.id === draggedItemRef.current!.id)
          if (furnitureItem && latestRoomConfig) {
            const newX = intersectionPointRef.current.x
            const newZ = intersectionPointRef.current.z
            
            // Constrain to room boundaries
            const baseDim = furnitureItem.dimensions ?? { width: 1, length: 1, height: 1 }
            const itemWidth = baseDim.width * furnitureItem.scale
            const itemLength = baseDim.length * furnitureItem.scale
            
            const constrainedX = Math.max(itemWidth / 2, Math.min(latestRoomConfig.width - itemWidth / 2, newX))
            const constrainedZ = Math.max(itemLength / 2, Math.min(latestRoomConfig.length - itemLength / 2, newZ))
            
            updateFurniture(furnitureItem.id, {
              x: constrainedX,
              y: constrainedZ,
            })
          }
        } else if (rotatingItemRef.current) {
          // Update rotation while dragging
          const deltaX = e.clientX - rotatingItemRef.current.mouseX
          const rotationDelta = (deltaX / 100) * Math.PI // Convert pixels to radians
          
          const furnitureItem = latestDesign?.furnitureItems.find(item => item.id === rotatingItemRef.current!.id)
          if (furnitureItem) {
            updateFurniture(furnitureItem.id, {
              rotation: rotatingItemRef.current.startRotation + rotationDelta,
            })
          }
        }
      }
      
      const handleMouseUp = () => {
        const latestDesign = useDesignStore.getState().currentDesign
        if (draggedItemRef.current) {
          const furnitureItem = latestDesign?.furnitureItems.find(item => item.id === draggedItemRef.current!.id)
          if (furnitureItem) {
            updateFurniture(draggedItemRef.current.id, {
              x: furnitureItem.x,
              y: furnitureItem.y,
            }, { commitHistory: true })
          }
          draggedItemRef.current = null
        } else if (rotatingItemRef.current) {
          const furnitureItem = latestDesign?.furnitureItems.find(item => item.id === rotatingItemRef.current!.id)
          if (furnitureItem) {
            updateFurniture(rotatingItemRef.current.id, {
              rotation: furnitureItem.rotation,
            }, { commitHistory: true })
          }
          rotatingItemRef.current = null
        }
        if (controlsRef.current) {
          controlsRef.current.enabled = true
        }
      }
      
      const handleContextMenu = (e: MouseEvent) => {
        // Right click is used for rotation interaction in the 3D viewport.
        if (e.button === 2) {
          e.preventDefault()
        }
      }
      
      window.addEventListener("resize", handleResize)
      renderer.domElement.addEventListener("mousedown", handleMouseDown)
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      renderer.domElement.addEventListener("contextmenu", handleContextMenu)
      
      // Use ResizeObserver to detect container size changes (e.g., when sidebar collapses)
      const resizeObserver = new ResizeObserver(() => {
        handleResize()
      })
      resizeObserver.observe(container)
      
      // Initial resize to ensure proper sizing
      handleResize()

      // Store cleanup function
      cleanupFn = () => {
        window.removeEventListener("resize", handleResize)
        renderer.domElement.removeEventListener("mousedown", handleMouseDown)
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        renderer.domElement.removeEventListener("contextmenu", handleContextMenu)
        resizeObserver.disconnect()
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement)
        }
        if (controlsRef.current) {
          controlsRef.current.dispose()
        }
        if (selectionHelperRef.current && sceneRef.current) {
          sceneRef.current.remove(selectionHelperRef.current)
          selectionHelperRef.current = null
        }
        renderer.dispose()
        furnitureMeshesRef.current.clear()
        pendingLoadsRef.current.clear()
        setLoadingState("models", false)
      }
    }, 100) // Small delay to ensure container is rendered
    
    return () => {
      clearTimeout(timeoutId)
      setLoadingState("models", false)
      if (cleanupFn) {
        cleanupFn()
      }
    }
  }, [roomConfig, setLoadingState])

  // Load and update furniture items
  useEffect(() => {
    if (!sceneRef.current || !currentDesign || !roomConfig) return

    const scene = sceneRef.current
    const furnitureItems = currentDesign.furnitureItems

    // Remove furniture that no longer exists
    const currentIds = new Set(furnitureItems.map((item) => item.id))
    furnitureMeshesRef.current.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh)
        furnitureMeshesRef.current.delete(id)
      }
    })
    pendingLoadsRef.current.forEach((id) => {
      if (!currentIds.has(id)) {
        pendingLoadsRef.current.delete(id)
      }
    })

    // Load new furniture items
    furnitureItems.forEach((item) => {
      const itemScale = Number.isFinite(item.scale) ? item.scale : 1
      const itemRotation = Number.isFinite(item.rotation) ? item.rotation : 0
      const itemShading = Number.isFinite(item.shading as number) ? (item.shading as number) : 0.5

      // Constrain furniture position to room boundaries
      const baseDim = item.dimensions ?? { width: 1, length: 1, height: 1 }
      const itemWidth = baseDim.width * itemScale
      const itemLength = baseDim.length * itemScale
      
      // Ensure furniture stays within room bounds
      // Room floor extends from (0,0,0) to (width,0,length)
      // Furniture coordinates (item.x, item.y) are in meters from room origin
      const constrainedX = Math.max(itemWidth / 2, Math.min(roomConfig.width - itemWidth / 2, item.x))
      const constrainedZ = Math.max(itemLength / 2, Math.min(roomConfig.length - itemLength / 2, item.y))

      if (furnitureMeshesRef.current.has(item.id)) {
        // Update existing furniture
        const mesh = furnitureMeshesRef.current.get(item.id)!
        const isPlaceholder = !!(mesh as any).userData?.isPlaceholder
        if (isPlaceholder) {
          const placeholderSize = item.dimensions ?? { width: 1, length: 1, height: 1 }
          const placeholderScale = Math.max(0.1, itemScale)
          ;(mesh as any).scale.set(placeholderScale, placeholderScale, placeholderScale)
          ;(mesh as any).position.set(constrainedX, (placeholderSize.height * placeholderScale) / 2, constrainedZ)
          ;(mesh as any).rotation.y = itemRotation
          mesh.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = child.material as THREE.MeshStandardMaterial
              material.color.copy(getShadedColor(item.color, itemShading))
              material.needsUpdate = true
            }
          })
          return
        }
        
        // Preserve loader/base orientation around X/Z and apply state-driven Y rotation.
        const currentRotationX = mesh.rotation.x
        const currentRotationZ = mesh.rotation.z
        
        // Reset position to calculate bounding box accurately
        mesh.position.set(0, 0, 0)
        // For cabinet, keep rotation.x to get correct bounding box
        // For other items, reset rotation
        mesh.rotation.set(0, 0, 0)
        
        // For updates, we need to recalculate the base scale
        // Reset to scale 1 to get original model size
        mesh.scale.set(1, 1, 1)
        const boxAtScale1 = new THREE.Box3().setFromObject(mesh)
        const sizeAtScale1 = new THREE.Vector3()
        boxAtScale1.getSize(sizeAtScale1)
        
        // Calculate base scale to fit base dimensions (what loader would do)
        const scaleX = baseDim.width / sizeAtScale1.x
        const scaleY = baseDim.height / sizeAtScale1.y
        const scaleZ = baseDim.length / sizeAtScale1.z
        const baseScale = Math.min(scaleX, scaleY, scaleZ)
        
        // Apply base scale and user scale
        mesh.scale.setScalar(baseScale * itemScale)
        
        // Get bounding box in local space (with rotation applied for cabinet)
        const box = new THREE.Box3().setFromObject(mesh)
        const min = box.min
        const centerX = (box.min.x + box.max.x) / 2
        const centerZ = (box.min.z + box.max.z) / 2
        
        // Calculate offset to center horizontally and position bottom at y=0
        const offsetX = -centerX
        const offsetY = -min.y  // This ensures bottom sits at y=0
        const offsetZ = -centerZ
        
        // Position furniture within room space
        // Combine offset with desired position so bottom sits on floor (y=0)
        mesh.position.set(constrainedX + offsetX, offsetY, constrainedZ + offsetZ)
        // Restore rotations: preserve X/Z base orientation and apply Y from store.
        mesh.rotation.x = currentRotationX
        mesh.rotation.y = itemRotation
        mesh.rotation.z = currentRotationZ

        // Update color - clone material to ensure changes are applied
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.material) {
              // Handle both single materials and arrays
              const materials = Array.isArray(child.material) ? child.material : [child.material]
              
              const newMaterials = materials.map((mat) => applyItemAppearance(mat, item.color, itemShading))
              
              // Replace the material(s)
              child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0]
            }
          }
        })
        
        // Force render after color update
        if (rendererRef.current && cameraRef.current) {
          rendererRef.current.render(sceneRef.current!, cameraRef.current)
        }

        return
      }

      // Load new furniture model
      // Pass base dimensions to loader - it will scale to fit
      // We'll apply user scale separately after loading
      const dimensions = {
        width: baseDim.width,
        length: baseDim.length,
        height: baseDim.height,
      }

      if (pendingLoadsRef.current.has(item.id)) {
        return
      }

      // Add a lightweight placeholder immediately so switching 2D -> 3D is responsive.
      const placeholderGeometry = new THREE.BoxGeometry(baseDim.width, baseDim.height, baseDim.length)
      const placeholderMaterial = new THREE.MeshStandardMaterial({
        color: getShadedColor(item.color, itemShading),
        roughness: 0.8,
      })
      const placeholderMesh = new THREE.Mesh(placeholderGeometry, placeholderMaterial)
      placeholderMesh.castShadow = true
      placeholderMesh.receiveShadow = true
      const placeholderGroup = new THREE.Group()
      ;(placeholderGroup as any).userData = { isPlaceholder: true }
      placeholderGroup.add(placeholderMesh)
      placeholderGroup.scale.setScalar(itemScale)
      placeholderGroup.position.set(constrainedX, (baseDim.height * itemScale) / 2, constrainedZ)
      placeholderGroup.rotation.y = itemRotation
      scene.add(placeholderGroup)
      furnitureMeshesRef.current.set(item.id, placeholderGroup)

      pendingLoadsRef.current.add(item.id)
      setLoadingState("models", true)

      const loadModel = async () => {
        try {
          let group: THREE.Group | null = null

          if (item.modelUrl || item.objUrl) {
            group = await loadModelFromProductAssets({
              modelUrl: item.modelUrl,
              objUrl: item.objUrl,
              mtlUrl: item.mtlUrl,
              targetDimensions: dimensions,
            })
          } else {
            // Fallback: create a simple box when no model asset is provided.
            const geometry = new THREE.BoxGeometry(
              dimensions.width,
              dimensions.height,
              dimensions.length
            )
            const material = new THREE.MeshStandardMaterial({ color: getShadedColor(item.color, itemShading) })
            group = new THREE.Group()
            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true
            group.add(mesh)
          }

          if (group) {
            // Store loader orientation (needed for specific assets like cabinets).
            const loaderRotationX = group.rotation.x
            const loaderRotationZ = group.rotation.z
            
            // Normalize transform before computing final fitted scale.
            group.position.set(0, 0, 0)
            group.rotation.set(0, 0, 0)
            group.scale.set(1, 1, 1)

            // Fit to target dimensions using the unscaled model bounds.
            const boxAtScale1 = new THREE.Box3().setFromObject(group)
            const sizeAtScale1 = new THREE.Vector3()
            boxAtScale1.getSize(sizeAtScale1)

            const safeX = Math.max(sizeAtScale1.x, 0.0001)
            const safeY = Math.max(sizeAtScale1.y, 0.0001)
            const safeZ = Math.max(sizeAtScale1.z, 0.0001)

            const scaleX = baseDim.width / safeX
            const scaleY = baseDim.height / safeY
            const scaleZ = baseDim.length / safeZ
            const baseScale = Math.min(scaleX, scaleY, scaleZ)

            group.scale.setScalar(baseScale * itemScale)

            // Get bounding box in local space after final scale.
            const box = new THREE.Box3().setFromObject(group)
            const min = box.min
            const max = box.max

            // Calculate offsets to center horizontally and position bottom at y=0
            const centerX = (min.x + max.x) / 2
            const centerZ = (min.z + max.z) / 2
            const offsetX = -centerX
            const offsetY = -min.y  // Move bottom to y=0
            const offsetZ = -centerZ

            // Apply color - handle all material types
            group.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Handle both single materials and arrays
                  const materials = Array.isArray(child.material) ? child.material : [child.material]
                  
                  const newMaterials = materials.map((mat) => applyItemAppearance(mat, item.color, itemShading))
                  
                  // Replace the material(s)
                  child.material = Array.isArray(child.material) ? newMaterials : newMaterials[0]
                  child.castShadow = true
                  child.receiveShadow = true
                }
              }
            })

            // Position furniture: combine offset with room position
            // The offset centers the model and puts its bottom at y=0
            group.position.set(constrainedX + offsetX, offsetY, constrainedZ + offsetZ)
            // Apply user rotation around Y axis, preserving loader's X rotation (needed for cabinet)
            group.rotation.y = itemRotation
            // Keep the loader's X rotation (cabinet needs -PI/2 to stand upright)
            group.rotation.x = loaderRotationX
            group.rotation.z = loaderRotationZ

            if (furnitureMeshesRef.current.has(item.id)) {
              const existing = furnitureMeshesRef.current.get(item.id)
              if ((existing as any)?.userData?.isPlaceholder) {
                scene.remove(existing!)
              } else {
                return
              }
            }

            scene.add(group)
            furnitureMeshesRef.current.set(item.id, group)
          }
        } catch (error) {
          console.error("Failed to load furniture model:", error)
          // Keep placeholder visible when model loading fails.
          const existing = furnitureMeshesRef.current.get(item.id)
          if (!existing || !(existing as any).userData?.isPlaceholder) {
            const geometry = new THREE.BoxGeometry(
              dimensions.width,
              dimensions.height,
              dimensions.length
            )
            const material = new THREE.MeshStandardMaterial({ color: getShadedColor(item.color, itemShading) })
            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true
            mesh.scale.setScalar(itemScale)
            const scaledHeight = dimensions.height * itemScale
            mesh.position.set(constrainedX, scaledHeight / 2, constrainedZ)
            mesh.rotation.y = itemRotation
            if (furnitureMeshesRef.current.has(item.id)) {
              return
            }
            scene.add(mesh)
            furnitureMeshesRef.current.set(item.id, mesh as any)
          }
        } finally {
          pendingLoadsRef.current.delete(item.id)
          if (pendingLoadsRef.current.size === 0) {
            setLoadingState("models", false)
          }
        }
      }

      loadModel()
    })

    // Keep a non-destructive selection outline in sync with selected furniture.
    if (selectionHelperRef.current) {
      scene.remove(selectionHelperRef.current)
      selectionHelperRef.current = null
    }

    if (selectedFurnitureId) {
      const selectedMesh = furnitureMeshesRef.current.get(selectedFurnitureId)
      if (selectedMesh) {
        const helper = new THREE.BoxHelper(selectedMesh, 0x2563eb)
        scene.add(helper)
        selectionHelperRef.current = helper
      }
    }
  }, [currentDesign?.furnitureItems, selectedFurnitureId, roomConfig, setLoadingState])

  if (!roomConfig) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-muted-foreground">Please configure your room first</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[600px]"
      style={{ minHeight: '600px' }}
    />
  )
}
