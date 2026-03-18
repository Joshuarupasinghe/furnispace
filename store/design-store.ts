import { create } from 'zustand'
import { Design, RoomConfig, FurnitureItem } from '@/types/design'

interface DesignState {
  currentDesign: Design | null
  history: Design[]
  historyIndex: number
  hasUnsavedChanges: boolean
  loadingStates: Record<string, boolean>
  isLoading: boolean
  setLoadingState: (key: string, isLoading: boolean) => void
  
  // Room configuration
  roomConfig: RoomConfig | null
  setRoomConfig: (config: RoomConfig) => void
  
  // Design management
  createNewDesign: (name: string) => void
  updateDesign: (design: Design) => void
  loadDesign: (design: Design) => void
  resetDesign: () => void
  
  // Furniture management
  addFurniture: (item: FurnitureItem) => void
  updateFurniture: (id: string, updates: Partial<FurnitureItem>, options?: { commitHistory?: boolean }) => void
  removeFurniture: (id: string) => void
  selectFurniture: (id: string | null) => void
  selectedFurnitureId: string | null
  
  // View mode
  viewMode: '2d' | '3d'
  setViewMode: (mode: '2d' | '3d') => void
  
  // History management
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveToHistory: () => void
  markSaved: () => void
  
  // Global design operations
  scaleAllFurniture: (scaleFactor: number) => void
  applyShadingToAll: (shading: number) => void
  changeColorOfAll: (color: string) => void
}

const defaultRoomConfig: RoomConfig = {
  width: 5,
  length: 4,
  height: 2.5,
  shape: 'rectangle',
  colorScheme: '#f5f5f5',
}

export const useDesignStore = create<DesignState>((set, get) => ({
  currentDesign: null,
  history: [],
  historyIndex: -1,
  hasUnsavedChanges: false,
  loadingStates: {},
  isLoading: false,
  roomConfig: null,
  selectedFurnitureId: null,
  viewMode: '2d',

  setLoadingState: (key, isLoading) => {
    set((state) => {
      const next = { ...state.loadingStates }
      if (isLoading) {
        next[key] = true
      } else {
        delete next[key]
      }

      return {
        loadingStates: next,
        isLoading: Object.keys(next).length > 0,
      }
    })
  },
  
  setRoomConfig: (config) => {
    set((state) => {
      if (state.currentDesign) {
        const updatedDesign = {
          ...state.currentDesign,
          roomConfig: config,
        }
        return {
          roomConfig: config,
          currentDesign: updatedDesign,
          hasUnsavedChanges: true,
        }
      }
      return { roomConfig: config }
    })
  },
  
  createNewDesign: (name) => {
    const config = get().roomConfig || defaultRoomConfig
    const newDesign: Design = {
      name,
      roomConfig: config,
      furnitureItems: [],
    }
    set({
      currentDesign: newDesign,
      history: [newDesign],
      historyIndex: 0,
      hasUnsavedChanges: false,
    })
  },
  
  updateDesign: (design) => {
    set({ currentDesign: design })
  },
  
  loadDesign: (design) => {
    set({
      currentDesign: design,
      roomConfig: design.roomConfig,
      history: [design],
      historyIndex: 0,
      hasUnsavedChanges: false,
    })
  },
  
  resetDesign: () => {
    const design = get().currentDesign
    if (design) {
      const resetDesign: Design = {
        ...design,
        furnitureItems: [],
      }
      set({ currentDesign: resetDesign, hasUnsavedChanges: true })
      get().saveToHistory()
    }
  },
  
  addFurniture: (item) => {
    const design = get().currentDesign
    if (design) {
      const updatedDesign: Design = {
        ...design,
        furnitureItems: [...design.furnitureItems, item],
      }
      set({ currentDesign: updatedDesign, hasUnsavedChanges: true })
      get().saveToHistory()
    }
  },
  
  updateFurniture: (id, updates, options) => {
    const design = get().currentDesign
    const roomConfig = get().roomConfig
    if (design && roomConfig) {
      const updatedDesign: Design = {
        ...design,
        furnitureItems: design.furnitureItems.map((item) => {
          if (item.id === id) {
            // Ensure furniture stays within room boundaries
            const constrainedUpdates = { ...updates }
            if (updates.x !== undefined) {
              constrainedUpdates.x = Math.max(0, Math.min(roomConfig.width, updates.x))
            }
            if (updates.y !== undefined) {
              constrainedUpdates.y = Math.max(0, Math.min(roomConfig.length, updates.y))
            }
            // Ensure scale respects room dimensions
            if (updates.scale !== undefined) {
              constrainedUpdates.scale = Math.max(0.1, Math.min(3, updates.scale))
            }
            return { ...item, ...constrainedUpdates }
          }
          return item
        }),
      }
      set({ currentDesign: updatedDesign, hasUnsavedChanges: true })
      if (options?.commitHistory) {
        get().saveToHistory()
      }
    }
  },
  
  removeFurniture: (id) => {
    const design = get().currentDesign
    if (design) {
      const updatedDesign: Design = {
        ...design,
        furnitureItems: design.furnitureItems.filter((item) => item.id !== id),
      }
      set({ currentDesign: updatedDesign, selectedFurnitureId: null, hasUnsavedChanges: true })
      get().saveToHistory()
    }
  },
  
  selectFurniture: (id) => {
    set({ selectedFurnitureId: id })
  },
  
  setViewMode: (mode) => {
    set({ viewMode: mode })
  },
  
  saveToHistory: () => {
    const design = get().currentDesign
    if (!design) return
    
    const { history, historyIndex } = get()
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(design)))
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
      hasUnsavedChanges: true,
    })
  },
  
  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex > 0) {
      const previousDesign = history[historyIndex - 1]
      const parsedDesign = JSON.parse(JSON.stringify(previousDesign))
      set({
        currentDesign: parsedDesign,
        roomConfig: parsedDesign.roomConfig,
        historyIndex: historyIndex - 1,
        hasUnsavedChanges: true,
      })
    }
  },
  
  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex < history.length - 1) {
      const nextDesign = history[historyIndex + 1]
      const parsedDesign = JSON.parse(JSON.stringify(nextDesign))
      set({
        currentDesign: parsedDesign,
        roomConfig: parsedDesign.roomConfig,
        historyIndex: historyIndex + 1,
        hasUnsavedChanges: true,
      })
    }
  },
  
  canUndo: () => {
    return get().historyIndex > 0
  },
  
  canRedo: () => {
    const { history, historyIndex } = get()
    return historyIndex < history.length - 1
  },
  
  scaleAllFurniture: (scaleFactor) => {
    const design = get().currentDesign
    if (design) {
      const updatedDesign: Design = {
        ...design,
        furnitureItems: design.furnitureItems.map((item) => {
          const newScale = item.scale * scaleFactor
          // Ensure scale respects room dimensions (0.1 to 3x)
          return {
            ...item,
            scale: Math.max(0.1, Math.min(3, newScale)),
          }
        }),
      }
      set({ currentDesign: updatedDesign, hasUnsavedChanges: true })
      get().saveToHistory()
    }
  },
  
  applyShadingToAll: (shading) => {
    const design = get().currentDesign
    if (design) {
      const updatedDesign: Design = {
        ...design,
        furnitureItems: design.furnitureItems.map((item) => ({
          ...item,
          shading,
        })),
      }
      set({ currentDesign: updatedDesign, hasUnsavedChanges: true })
      get().saveToHistory()
    }
  },
  
  changeColorOfAll: (color) => {
    const design = get().currentDesign
    if (!design?.furnitureItems?.length) return
    const normalized = color.startsWith("#") ? color : `#${color}`
    if (!/^#[0-9A-Fa-f]{6}$/.test(normalized)) return
    const updatedDesign: Design = {
      ...design,
      furnitureItems: design.furnitureItems.map((item) => ({
        ...item,
        color: normalized,
      })),
    }
    set({ currentDesign: updatedDesign, hasUnsavedChanges: true })
    get().saveToHistory()
  },

  markSaved: () => {
    set({ hasUnsavedChanges: false })
  },
}))
