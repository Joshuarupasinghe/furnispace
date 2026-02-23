import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getProductById } from "@/lib/db-supabase"
import { notFound } from "next/navigation"
import { ProductDetailClient } from "@/components/shop/product-detail-client"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { ROUTES } from "@/lib/config"

export const dynamic = "force-dynamic"

async function ProductContent({ productId }: { productId: string }) {
  const product = await getProductById(productId)

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Dark header with navbar */}
      <div className="relative bg-[#1a1a1a] pb-8 pt-0">
        <Navbar />
        <div className="pt-28 pb-2 px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Link href={ROUTES.HOME} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={ROUTES.SHOP} className="hover:text-white transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-white">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <Link href={ROUTES.SHOP}>
          <button className="flex items-center gap-2 mb-8 text-sm text-gray-500 hover:text-black transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </button>
        </Link>

        <ProductDetailClient product={product} />
      </div>

      <SiteFooter />
    </div>
  )
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    }>
      <ProductContent productId={id} />
    </Suspense>
  )
}
