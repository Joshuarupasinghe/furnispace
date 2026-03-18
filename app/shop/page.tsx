import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getAllProducts, getAllCategories } from "@/lib/db-supabase"
import { ShopClient } from "@/components/shop/shop-client"
import { PageHero } from "@/components/page-hero"
import { SiteFooter } from "@/components/site-footer"
import { ROUTES } from "@/lib/config"
import { ScrollReveal } from "@/components/scroll-reveal"

export const dynamic = "force-dynamic"

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories()
  ])

  return (
    <div className="min-h-screen bg-white">
      <PageHero
        title="Our Collection"
        subtitle="Discover thoughtfully designed furniture pieces that transform your space"
        breadcrumbs={[
          { label: "Home", href: ROUTES.HOME },
          { label: "Shop" },
        ]}
      />
      <ScrollReveal>
        <ShopClient products={products} categories={categories} />
      </ScrollReveal>

      <SiteFooter />
    </div>
  )
}
