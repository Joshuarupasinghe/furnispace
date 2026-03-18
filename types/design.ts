export type FloorTextureType = 'none' | (string & {})

export type WallMaterialType =
  | 'color'
  | (string & {})

export interface RoomConfig {
  width: number
  length: number
  height: number
  shape: 'rectangle' | 'square' | 'custom'
  colorScheme: string
  floorTexture?: FloorTextureType
  wallMaterial?: WallMaterialType
  wallColor?: string
}

export interface FurnitureItem {
  id: string
  type: string
  name: string
  x: number
  y: number
  rotation: number
  scale: number
  color: string
  shading: number
  dimensions?: { width: number; length: number; height: number }
  modelUrl?: string
  objUrl?: string
  mtlUrl?: string
  price?: number
  availableColors?: string[]
}

export interface Design {
  id?: string
  name: string
  roomConfig: RoomConfig
  furnitureItems: FurnitureItem[]
  createdAt?: string
  updatedAt?: string
}
