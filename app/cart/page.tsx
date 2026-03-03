"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"
import { useCartStore, type CartItem } from "@/store/cart-store"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { SiteFooter } from "@/components/site-footer"
import { API_ROUTES, ROUTES } from "@/lib/config"
import { ScrollReveal } from "@/components/scroll-reveal"

interface CartProduct {
  id: string
  name: string
  category: string
  price: number
  image_url?: string
  image_urls?: string[]
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CartRow({
  item,
  product,
}: {
  item: CartItem
  product: CartProduct
}) {
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const { toast } = useToast()

  const lineTotal = product.price * item.quantity
  const imageUrl = product.image_url ?? product.image_urls?.[0] ?? "/placeholder.svg"

  const handleQuantityChange = (delta: number) => {
    const next = item.quantity + delta
    if (next < 1) {
      removeItem(item.productId, item.color)
      toast({ title: "Removed from cart", description: `${product.name} was removed.` })
    } else {
      updateQuantity(item.productId, item.color, next)
    }
  }

  const handleRemove = () => {
    removeItem(item.productId, item.color)
    toast({ title: "Removed from cart", description: `${product.name} was removed.` })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card">
      <div className="relative w-full sm:w-32 h-40 sm:h-28 rounded-md overflow-hidden bg-muted shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link href={`${ROUTES.SHOP}/${product.id}`} className="font-semibold text-lg hover:underline">
            {product.name}
          </Link>
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Color:</span>
            <span
              className="w-5 h-5 rounded-full border border-border inline-block"
              style={{ backgroundColor: item.color }}
              title={item.color}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 border rounded-md">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleQuantityChange(-1)}
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-sm font-medium tabular-nums">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleQuantityChange(1)}
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-lg font-semibold w-24 text-right">${lineTotal.toLocaleString()}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive shrink-0"
            onClick={handleRemove}
            aria-label="Remove from cart"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { items, clearCart, getItemCount } = useCartStore()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [products, setProducts] = useState<CartProduct[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    
    // Check for success/cancel params
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    
    if (success) {
      toast({
        title: "Payment successful!",
        description: "Thank you for your purchase.",
      })
      clearCart()
      // Clean up URL
      router.replace(ROUTES.CART)
    } else if (canceled) {
      toast({
        title: "Payment canceled",
        description: "Your order was not completed.",
        variant: "destructive",
      })
      // Clean up URL
      router.replace(ROUTES.CART)
    }
  }, [searchParams, toast, clearCart, router])

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(API_ROUTES.PRODUCTS, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const data = (await response.json()) as CartProduct[]
        setProducts(data)
      } catch (error) {
        console.error("Failed to load products for cart:", error)
      }
    }

    loadProducts()
  }, [])

  const cartWithProducts = items
    .map((item) => {
      const product = products.find((p) => p.id === item.productId)
      return product ? { item, product } : null
    })
    .filter((x): x is { item: CartItem; product: CartProduct } => x !== null)

  const subtotal = cartWithProducts.reduce(
    (sum, { item, product }) => sum + product.price * item.quantity,
    0
  )
  const itemCount = getItemCount()

  const handleClearCart = () => {
    clearCart()
    toast({ title: "Cart cleared", description: "All items have been removed." })
  }

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      // Prepare items for checkout
      const checkoutItems = cartWithProducts.map(({ item, product }) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: item.quantity,
        color: item.color,
        imageUrl: product.image_url ?? product.image_urls?.[0],
      }))

      console.log("Sending checkout items:", checkoutItems)

      // Create checkout session
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: checkoutItems }),
      })

      const data = await response.json()
      console.log("Checkout response:", data)

      if (!response.ok) {
        console.error("Response not OK:", response.status, data)
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.url) {
        console.error("No URL in response:", data)
        throw new Error("No checkout URL received from server")
      }

      console.log("Redirecting to:", data.url)
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to proceed to checkout. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title="Your Cart"
        subtitle={
          !mounted || itemCount === 0
            ? "Your cart is empty"
            : `${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`
        }
        breadcrumbs={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Cart" },
        ]}
      />

      <ScrollReveal className="container mx-auto px-6 py-12">
        <ScrollReveal className="flex justify-end gap-2 mb-8">
          <Link href={ROUTES.SHOP}>
            <button className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors">
              Continue Shopping
            </button>
          </Link>
          {mounted && itemCount > 0 && (
            <button
              onClick={handleClearCart}
              className="border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Clear cart
            </button>
          )}
        </ScrollReveal>

        {!mounted || cartWithProducts.length === 0 ? (
          <ScrollReveal className="text-center py-20" delay={90}>
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2 text-gray-800">No items in your cart</p>
            <p className="text-gray-500 mb-6">
              Add items from the shop to see them here.
            </p>
            <Link href={ROUTES.SHOP}>
              <button className="bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                Browse Shop
              </button>
            </Link>
          </ScrollReveal>
        ) : (
          <ScrollReveal className="grid lg:grid-cols-3 gap-8" delay={90}>
            <div className="lg:col-span-2 space-y-4">
              {cartWithProducts.map(({ item, product }, index) => (
                <ScrollReveal key={`${item.productId}-${item.color}`} delay={index * 70}>
                  <CartRow item={item} product={product} />
                </ScrollReveal>
              ))}
            </div>
            <ScrollReveal className="lg:col-span-1" delay={160}>
              <div className="border border-gray-200 rounded-2xl p-6 bg-gray-50 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order summary</h2>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Subtotal ({itemCount} items)</span>
                    <span className="text-black font-medium">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <button
                  className="w-full mt-6 bg-black text-white py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Proceed to Checkout"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Secure payment powered by Stripe
                </p>
              </div>
            </ScrollReveal>
          </ScrollReveal>
        )}
      </ScrollReveal>

      <SiteFooter />
    </div>
  )
}
