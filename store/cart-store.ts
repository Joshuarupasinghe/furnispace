import { create } from "zustand"
import { STORAGE_KEYS } from "@/lib/config"

export interface CartItem {
  productId: string
  quantity: number
  color: string
}

interface CartState {
  items: CartItem[]
  addItem: (productId: string, color: string, quantity?: number) => void
  removeItem: (productId: string, color: string) => void
  updateQuantity: (productId: string, color: string, quantity: number) => void
  clearCart: () => void
  getItemCount: () => number
}

const CART_KEY = STORAGE_KEYS.CART

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: typeof window !== "undefined" ? loadCart() : [],

  addItem: (productId, color, quantity = 1) => {
    set((state) => {
      const existing = state.items.find(
        (i) => i.productId === productId && i.color === color
      )
      const next = existing
        ? state.items.map((i) =>
            i.productId === productId && i.color === color
              ? { ...i, quantity: i.quantity + quantity }
              : i
          )
        : [...state.items, { productId, color, quantity }]
      saveCart(next)
      return { items: next }
    })
  },

  removeItem: (productId, color) => {
    set((state) => {
      const next = state.items.filter(
        (i) => !(i.productId === productId && i.color === color)
      )
      saveCart(next)
      return { items: next }
    })
  },

  updateQuantity: (productId, color, quantity) => {
    if (quantity < 1) {
      get().removeItem(productId, color)
      return
    }
    set((state) => {
      const next = state.items.map((i) =>
        i.productId === productId && i.color === color
          ? { ...i, quantity }
          : i
      )
      saveCart(next)
      return { items: next }
    })
  },

  clearCart: () => {
    set({ items: [] })
    saveCart([])
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0)
  },
}))
