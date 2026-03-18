"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { loadModelFromProductAssets } from "@/lib/model-loader"

interface Furniture3DProps {
  type: string
  dimensions: { width: number; length: number; height: number }
  modelUrl?: string
  objUrl?: string
  mtlUrl?: string
  color?: string
  className?: string
}

export function Furniture3D({ type, dimensions, modelUrl, objUrl, mtlUrl, color, className }: Furniture3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<any>(null)
  const modelRef = useRef<THREE.Group | null>(null)

  // Separate effect for color updates (doesn't recreate scene)
  useEffect(() => {
    console.log("Color effect triggered", {
      hasModel: !!modelRef.current,
      hasScene: !!sceneRef.current,
      color: color,
      hasRenderer: !!rendererRef.current,
      hasCamera: !!cameraRef.current
    })
    
    if (!modelRef.current || !sceneRef.current || !color || !rendererRef.current || !cameraRef.current) {
      console.log("Color update skipped - missing dependencies")
      return
    }

    console.log("Updating color to:", color)
    
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Handle both single materials and arrays
          const materials = Array.isArray(child.material) ? child.material : [child.material]
          
          materials.forEach((mat) => {
            if (mat instanceof THREE.MeshStandardMaterial || 
                mat instanceof THREE.MeshPhongMaterial || 
                mat instanceof THREE.MeshLambertMaterial) {
              // Clone material to avoid affecting other instances
              const newMaterial = mat.clone()
              if (newMaterial.color) {
                // Three.js color.set() accepts CSS color strings (hex, rgb, color names)
                newMaterial.color.set(color)
                newMaterial.needsUpdate = true
              }
              // Replace the material
              if (Array.isArray(child.material)) {
                const index = child.material.indexOf(mat)
                if (index >= 0) {
                  child.material[index] = newMaterial
                }
              } else {
                child.material = newMaterial
              }
            }
          })
        }
      }
    })
    
    // Force render after color update
    rendererRef.current.render(sceneRef.current, cameraRef.current)
  }, [color])

  useEffect(() => {
    if (!containerRef.current) return

    // Ensure container has dimensions
    const width = containerRef.current.clientWidth || 600
    const height = containerRef.current.clientHeight || 600

    // Dynamically import OrbitControls to avoid SSR issues
    const initControls = async () => {
      try {
        const module = await import("three/examples/jsm/controls/OrbitControls.js")
        const OrbitControls = module.OrbitControls
        
        // Wait longer to ensure renderer DOM element is fully attached and ready
        await new Promise(resolve => setTimeout(resolve, 300))
        
        if (!cameraRef.current || !rendererRef.current) {
          console.warn("Camera or renderer not ready for controls")
          return null
        }
        
        // Ensure DOM element exists and is in the DOM
        const domElement = rendererRef.current.domElement
        if (!domElement) {
          console.warn("Renderer DOM element not found")
          return null
        }
        
        if (!domElement.parentElement) {
          console.warn("Renderer DOM element not attached to parent")
          return null
        }
        
        // Verify DOM element is ready
        if (window.getComputedStyle(domElement).pointerEvents === 'none') {
          console.warn("DOM element has pointer-events: none, fixing...")
          domElement.style.pointerEvents = 'auto'
        }
        
        const controls = new OrbitControls(cameraRef.current, domElement)
        controls.enableDamping = true
        controls.dampingFactor = 0.05
        controls.enableZoom = true
        controls.enablePan = true
        controls.enableRotate = true
        controls.minDistance = 1
        controls.maxDistance = 20
        controls.target.set(0, 0, 0)
        controls.update()
        
        // Add event listeners for cursor feedback
        const handleMouseDown = () => {
          domElement.style.cursor = 'grabbing'
        }
        const handleMouseUp = () => {
          domElement.style.cursor = 'grab'
        }
        
        domElement.addEventListener('mousedown', handleMouseDown)
        domElement.addEventListener('mouseup', handleMouseUp)
        domElement.addEventListener('mouseleave', handleMouseUp)
        
        controlsRef.current = controls
        
        console.log("✅ OrbitControls initialized successfully")
        
        return controls
      } catch (error) {
        console.error("Failed to load OrbitControls:", error)
        throw error
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
    camera.position.set(3, 2, 3)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Create renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({ 
      antialias: false, // Disable antialiasing for better performance
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)) // Limit pixel ratio
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.BasicShadowMap // Faster than PCFSoftShadowMap
    renderer.shadowMap.autoUpdate = false
    
    // Ensure renderer DOM element has proper styling for pointer events
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.touchAction = 'none'
    renderer.domElement.style.userSelect = 'none'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    renderer.domElement.style.zIndex = '1'
    renderer.domElement.style.pointerEvents = 'auto'
    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.setAttribute('tabindex', '0') // Make it focusable for keyboard events
    
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer
    
    // Focus the canvas to ensure it can receive events
    renderer.domElement.focus()

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 5)
    directionalLight.castShadow = true
    // Optimize shadow map resolution
    directionalLight.shadow.mapSize.width = 512
    directionalLight.shadow.mapSize.height = 512
    directionalLight.shadow.camera.near = 0.1
    directionalLight.shadow.camera.far = 50
    scene.add(directionalLight)

    // Add floor
    const floorGeometry = new THREE.PlaneGeometry(10, 10)
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc })
    const floor = new THREE.Mesh(floorGeometry, floorMaterial)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.5
    floor.receiveShadow = true
    scene.add(floor)

    // Load model from dynamic product assets
    const loadModel = async (): Promise<void> => {
      try {
        let group: THREE.Group | null = null

        if (modelUrl || objUrl) {
          group = await loadModelFromProductAssets({
            modelUrl,
            objUrl,
            mtlUrl,
            targetDimensions: dimensions,
          })
        } else {
          // Fallback: create a simple box
          const geometry = new THREE.BoxGeometry(
            dimensions.width,
            dimensions.height,
            dimensions.length
          )
          const material = new THREE.MeshStandardMaterial({
            color: color || 0x888888,
          })
          group = new THREE.Group()
          const mesh = new THREE.Mesh(geometry, material)
          mesh.castShadow = true
          mesh.receiveShadow = true
          group.add(mesh)
        }

        if (group) {
          // Center the model first
          const box = new THREE.Box3().setFromObject(group)
          const center = new THREE.Vector3()
          box.getCenter(center)
          group.position.sub(center)

          // Apply color if provided (using same logic as color update effect)
          if (color) {
            group.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  // Handle both single materials and arrays
                  const materials = Array.isArray(child.material) ? child.material : [child.material]
                  
                  materials.forEach((mat) => {
                    if (mat instanceof THREE.MeshStandardMaterial || 
                        mat instanceof THREE.MeshPhongMaterial || 
                        mat instanceof THREE.MeshLambertMaterial) {
                      // Clone material to avoid affecting other instances
                      const newMaterial = mat.clone()
                      if (newMaterial.color) {
                        newMaterial.color.set(color)
                        newMaterial.needsUpdate = true
                      }
                      // Replace the material
                      if (Array.isArray(child.material)) {
                        const index = child.material.indexOf(mat)
                        if (index >= 0) {
                          child.material[index] = newMaterial
                        }
                      } else {
                        child.material = newMaterial
                      }
                    }
                  })
                }
              }
            })
          }

          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true
              child.receiveShadow = true
            }
          })

          scene.add(group)
          modelRef.current = group
          
          // Trigger render after adding model
          if (rendererRef.current && cameraRef.current) {
            rendererRef.current.render(scene, cameraRef.current)
          }
        }
      } catch (error) {
        console.error("Failed to load model:", error)
        // Fallback: create a simple box
        const geometry = new THREE.BoxGeometry(
          dimensions.width,
          dimensions.height,
          dimensions.length
        )
        const material = new THREE.MeshStandardMaterial({
          color: color || 0x888888,
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true
        mesh.receiveShadow = true
        scene.add(mesh)
      }
    }

    // Store animation ID for cleanup
    let animationId: number | null = null
    
    // Start animation loop immediately (will update controls when ready)
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      
      if (controlsRef.current) {
        controlsRef.current.update()
      }
      
      // Always render - this ensures smooth interaction and model visibility
      renderer.render(scene, camera)
    }
    
    // Start animation loop
    animate()
    
    // Load model first, then initialize controls
    loadModel().then(() => {
      // Wait a bit more to ensure DOM is fully ready
      setTimeout(() => {
        // Initialize controls
        initControls().then((controls) => {
          if (controls) {
            console.log("Controls initialized successfully, animation loop already running")
            // Initial render to show scene immediately
            renderer.render(scene, camera)
          } else {
            console.warn("Controls initialization returned null")
          }
        }).catch((error) => {
          console.error("Failed to initialize controls:", error)
          // Still render even if controls fail
          renderer.render(scene, camera)
        })
      }, 200) // Wait 200ms after model loads
    }).catch((error) => {
      console.error("Failed to load model:", error)
      // Still try to initialize controls even if model fails
      setTimeout(() => {
        initControls().then((controls) => {
          if (controls) {
            renderer.render(scene, camera)
          }
        }).catch((err) => {
          console.error("Failed to initialize controls after model error:", err)
        })
      }, 200)
    })

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return
      const width = containerRef.current.clientWidth || 600
      const height = containerRef.current.clientHeight || 600
      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }
    window.addEventListener("resize", handleResize)
    
    // Initial resize to ensure proper sizing
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationId !== null) {
        cancelAnimationFrame(animationId)
      }
      if (containerRef.current && renderer.domElement && containerRef.current.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement)
      }
      if (controlsRef.current) {
        controlsRef.current.dispose()
        controlsRef.current = null
      }
      renderer.dispose()
    }
  }, [type, dimensions.width, dimensions.length, dimensions.height, modelUrl, objUrl, mtlUrl])

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full min-h-[400px] ${className || ""}`}
      style={{ 
        minHeight: '400px',
        position: 'relative',
        touchAction: 'none', // Prevent default touch behaviors that might interfere
        pointerEvents: 'auto',
        overflow: 'hidden',
        isolation: 'isolate' // Create new stacking context
      }}
      onMouseDown={(e) => {
        // Ensure events can reach the canvas
        e.stopPropagation()
      }}
      onTouchStart={(e) => {
        e.stopPropagation()
      }}
    />
  )
}
