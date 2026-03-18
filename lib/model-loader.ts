import * as THREE from "three"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

export interface ModelDimensions {
  width: number
  length: number
  height: number
}

export interface ObjMtlModelConfig {
  basePath: string
  objFile: string
  mtlFile: string
  targetDimensions?: ModelDimensions
  normalize?: (group: THREE.Group) => void
  postLoad?: (group: THREE.Group) => Promise<void>
}

function applyDefaultMeshSettings(group: THREE.Group): void {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })
}

function scaleModel(group: THREE.Group, targetDimensions: ModelDimensions): void {
  const box = new THREE.Box3().setFromObject(group)
  const size = new THREE.Vector3()
  box.getSize(size)

  const safeX = size.x || 1
  const safeY = size.y || 1
  const safeZ = size.z || 1

  const scaleX = targetDimensions.width / safeX
  const scaleY = targetDimensions.height / safeY
  const scaleZ = targetDimensions.length / safeZ

  group.scale.setScalar(Math.min(scaleX, scaleY, scaleZ))
}

function getBasePathFromUrl(url: string): string {
  const idx = url.lastIndexOf("/")
  return idx >= 0 ? url.slice(0, idx + 1) : ""
}

function getExtension(url: string): string {
  const clean = url.split("?")[0]
  const idx = clean.lastIndexOf(".")
  return idx >= 0 ? clean.slice(idx + 1).toLowerCase() : ""
}

export interface DynamicModelAssetConfig {
  modelUrl?: string
  objUrl?: string
  mtlUrl?: string
  targetDimensions?: ModelDimensions
  normalize?: (group: THREE.Group) => void
  postLoad?: (group: THREE.Group) => Promise<void>
}

const modelPromiseCache = new Map<string, Promise<THREE.Group>>()

function cloneGroupWithMaterials(source: THREE.Group): THREE.Group {
  const clone = source.clone(true)
  clone.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      if (Array.isArray(child.material)) {
        child.material = child.material.map((mat) => mat.clone())
      } else {
        child.material = child.material.clone()
      }
    }
  })
  return clone
}

function buildAssetCacheKey(config: DynamicModelAssetConfig): string {
  return JSON.stringify({
    modelUrl: config.modelUrl || "",
    objUrl: config.objUrl || "",
    mtlUrl: config.mtlUrl || "",
  })
}

export async function loadObjMtlModel(config: ObjMtlModelConfig): Promise<THREE.Group> {
  const materials = await new Promise<MTLLoader.MaterialCreator>((resolve, reject) => {
    const mtlLoader = new MTLLoader()
    mtlLoader.setPath(config.basePath)
    mtlLoader.setResourcePath(config.basePath)
    mtlLoader.load(config.mtlFile, resolve, undefined, reject)
  })

  materials.preload()

  const group = await new Promise<THREE.Group>((resolve, reject) => {
    const objLoader = new OBJLoader()
    objLoader.setMaterials(materials)
    objLoader.setPath(config.basePath)
    objLoader.load(config.objFile, resolve, undefined, reject)
  })

  applyDefaultMeshSettings(group)

  if (config.normalize) {
    config.normalize(group)
  }

  if (config.targetDimensions) {
    scaleModel(group, config.targetDimensions)
  }

  if (config.postLoad) {
    await config.postLoad(group)
  }

  return group
}

export async function loadModelFromProductAssets(config: DynamicModelAssetConfig): Promise<THREE.Group> {
  const cacheKey = buildAssetCacheKey(config)
  const cachedPromise = modelPromiseCache.get(cacheKey)
  if (cachedPromise) {
    const cached = await cachedPromise
    const clone = cloneGroupWithMaterials(cached)

    if (config.normalize) {
      config.normalize(clone)
    }
    if (config.targetDimensions) {
      scaleModel(clone, config.targetDimensions)
    }
    if (config.postLoad) {
      await config.postLoad(clone)
    }

    return clone
  }

  const baseLoadPromise = (async (): Promise<THREE.Group> => {
  const primaryModelUrl = config.modelUrl || config.objUrl
  if (!primaryModelUrl) {
    throw new Error("No model URL configured for this product")
  }

  const extension = getExtension(primaryModelUrl)

  if (extension === "glb" || extension === "gltf") {
    const gltf = await new Promise<any>((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(primaryModelUrl, resolve, undefined, reject)
    })

    const group = gltf.scene as THREE.Group
    applyDefaultMeshSettings(group)

    return group
  }

  const objUrl = config.objUrl || (extension === "obj" ? primaryModelUrl : undefined)
  if (!objUrl) {
    throw new Error("Unsupported model format. Provide glb/gltf or obj_url")
  }

  const mtlUrl = config.mtlUrl
  let group: THREE.Group

  if (mtlUrl) {
    const materials = await new Promise<MTLLoader.MaterialCreator>((resolve, reject) => {
      const mtlLoader = new MTLLoader()
      const resourcePath = getBasePathFromUrl(mtlUrl)
      if (resourcePath) {
        mtlLoader.setResourcePath(resourcePath)
      }
      mtlLoader.load(mtlUrl, resolve, undefined, reject)
    })
    materials.preload()

    group = await new Promise<THREE.Group>((resolve, reject) => {
      const objLoader = new OBJLoader()
      objLoader.setMaterials(materials)
      objLoader.load(objUrl, resolve, undefined, reject)
    })
  } else {
    group = await new Promise<THREE.Group>((resolve, reject) => {
      const objLoader = new OBJLoader()
      objLoader.load(objUrl, resolve, undefined, reject)
    })
  }

  applyDefaultMeshSettings(group)

  return group
  })()

  modelPromiseCache.set(cacheKey, baseLoadPromise)

  let baseGroup: THREE.Group
  try {
    baseGroup = await baseLoadPromise
  } catch (error) {
    modelPromiseCache.delete(cacheKey)
    throw error
  }

  const result = cloneGroupWithMaterials(baseGroup)

  if (config.normalize) {
    config.normalize(result)
  }

  if (config.targetDimensions) {
    scaleModel(result, config.targetDimensions)
  }

  if (config.postLoad) {
    await config.postLoad(result)
  }

  return result
}
