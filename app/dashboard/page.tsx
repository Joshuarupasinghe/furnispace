"use client"

import Link from "next/link"
import { ShoppingBag, ShoppingCart, LayoutGrid } from "lucide-react"
import { PageHero } from "@/components/page-hero"
import { SiteFooter } from "@/components/site-footer"
import { ROUTES } from "@/lib/config"
import { ScrollReveal } from "@/components/scroll-reveal"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title="Dashboard"
        subtitle="Quick links and information"
        breadcrumbs={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Dashboard" },
        ]}
      />

      <ScrollReveal className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          <ScrollReveal>
            <Link href={ROUTES.SHOP} className="group block">
              <div className="bg-[#f5f5f0] rounded-2xl p-8 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
                    <ShoppingBag className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">Shop</h3>
                    <p className="text-sm text-gray-500">Browse furniture</p>
                  </div>
                </div>
                <button className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-full text-sm font-medium group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                  Browse Shop
                </button>
              </div>
            </Link>
          </ScrollReveal>

          <ScrollReveal delay={110}>
            <Link href={ROUTES.CART} className="group block">
              <div className="bg-[#f5f5f0] rounded-2xl p-8 hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/5">
                    <ShoppingCart className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">Cart</h3>
                    <p className="text-sm text-gray-500">View your cart</p>
                  </div>
                </div>
                <button className="w-full border border-gray-200 text-gray-700 py-2.5 rounded-full text-sm font-medium group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors">
                  View Cart
                </button>
              </div>
            </Link>
          </ScrollReveal>
        </div>

        <ScrollReveal className="mt-8 max-w-3xl bg-gray-50 rounded-2xl p-6 border border-gray-100" delay={180}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
              <LayoutGrid className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">2D & 3D Room Designer</h3>
              <p className="text-sm text-gray-500">
                The room design tool (3D Studio) is available in the admin panel for staff use.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </ScrollReveal>

      <SiteFooter className="mt-auto" />
    </div>
  )
}
