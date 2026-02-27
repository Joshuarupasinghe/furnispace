import { Design } from "@/types/design"
import { STORAGE_KEYS } from "@/lib/config"

const STORAGE_KEY = STORAGE_KEYS.DESIGNS

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
    return JSON.parse(data) as Design[]
  } catch (error) {
    console.error("Error loading designs from localStorage:", error)
    return []
  }
}

export function loadDesign(id: string): Design | null {
  const designs = loadAllDesigns()
  return designs.find((d) => d.id === id) || null
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
