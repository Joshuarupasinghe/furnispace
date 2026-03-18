import { Design } from "@/types/design"
import { STORAGE_KEYS } from "@/lib/config"

const STORAGE_KEY = STORAGE_KEYS.DESIGNS

/**
 * Normalizes a design to ensure all color fields have valid hex values
 */
function normalizeDesign(design: Design): Design {
  return {
    ...design,
    roomConfig: {
      ...design.roomConfig,
      colorScheme: design.roomConfig.colorScheme || '#f5f5f5',
      wallColor: design.roomConfig.wallColor || '#eeeeee',
    },
    furnitureItems: design.furnitureItems.map(item => ({
      ...item,
      color: item.color || '#888888',
    })),
  }
}

export function saveDesign(design: Design): void {
  if (typeof window === "undefined") return

  const designs = loadAllDesigns()
  const existingIndex = designs.findIndex((d) => d.id === design.id)

  const designToSave: Design = {
    ...design,
    id: design.id || generateId(),
    updatedAt: new Date().toISOString(),
    createdAt: design.createdAt || new Date().toISOString(),
  }

  if (existingIndex >= 0) {
    designs[existingIndex] = designToSave
  } else {
    designs.push(designToSave)
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs))
}

export function loadAllDesigns(): Design[] {
  if (typeof window === "undefined") return []

  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const designs = JSON.parse(data) as Design[]
    return designs.map(normalizeDesign)
  } catch (error) {
    console.error("Error loading designs from localStorage:", error)
    return []
  }
}

export function loadDesign(id: string): Design | null {
  const designs = loadAllDesigns()
  const design = designs.find((d) => d.id === id) || null
  return design ? normalizeDesign(design) : null
}

export function deleteDesign(id: string): void {
  if (typeof window === "undefined") return

  const designs = loadAllDesigns()
  const filtered = designs.filter((d) => d.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

function generateId(): string {
  return `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
