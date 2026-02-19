"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Search, User, Heart, ShoppingBag, ChevronDown, Menu, X } from "lucide-react"
import { useCartStore } from "@/store/cart-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { APP_NAME, NAV_LINKS, ROUTES } from "@/lib/config"

export function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const items = useCartStore((state) => state.items)

  useEffect(() => {
    setMounted(true)
  }, [])

  const totalItems = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0

  const navLinks = NAV_LINKS

  return (
    <nav className="absolute mt-6 left-0 right-0 z-50">
      <div className="mx-4 md:mx-8 lg:mx-12">
        <div className="bg-white rounded-full shadow-lg px-6 md:px-10 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold tracking-wider text-black" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                {APP_NAME.toUpperCase()}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => {
                const isActive = pathname === link.href && link.label === "Home"
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-black transition-colors",
                      isActive && "text-black font-semibold"
                    )}
                  >
                    {link.label}
                    {link.hasDropdown && <ChevronDown className="h-3.5 w-3.5" />}
                  </Link>
                )
              })}
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="text-gray-700 hover:text-black transition-colors hidden md:block">
                <Search className="h-5 w-5" />
              </button>
              <Link href="/auth" className="text-gray-700 hover:text-black transition-colors hidden md:block">
                <User className="h-5 w-5" />
              </Link>
              <Link href={ROUTES.SHOP} className="relative text-gray-700 hover:text-black transition-colors hidden md:block">
                <Heart className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </Link>
              <Link href={ROUTES.CART} className="relative text-gray-700 hover:text-black transition-colors">
                <ShoppingBag className="h-5 w-5" />
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {mounted ? totalItems : 0}
                </span>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-700 hover:text-black"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t mt-4 pt-4 pb-2 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-sm font-medium text-gray-700 hover:text-black"
                >
                  {link.label}
                  {link.hasDropdown && <ChevronDown className="h-4 w-4" />}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
