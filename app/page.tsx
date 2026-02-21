"use client"

import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { ChevronLeft, ChevronRight, Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { API_ROUTES, HOME_CONTENT, ROUTES } from "@/lib/config"
import { ScrollReveal } from "@/components/scroll-reveal"

interface HomeProduct {
  id: string
  name: string
  price: number
  image_url?: string
  image_urls?: string[]
}

const heroSlides = HOME_CONTENT.HERO_SLIDES
const categories = HOME_CONTENT.CATEGORY_CARDS

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState<HomeProduct[]>([])

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      try {
        const response = await fetch(API_ROUTES.PRODUCTS, { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch products")
        }

        const products = (await response.json()) as HomeProduct[]
        setFeaturedProducts(products.slice(0, 4))
      } catch (error) {
        console.error("Failed to load featured products:", error)
      }
    }

    loadFeaturedProducts()
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }, [])

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [nextSlide])

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Navbar overlay */}
      <section className="relative h-[100vh] md:h-[90vh] overflow-hidden">
        <Navbar />

        {/* Carousel Images */}
        {heroSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className="object-cover"
              priority={index === 0}
              sizes="100vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>
        ))}

        {/* Hero Text */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center leading-tight whitespace-pre-line drop-shadow-lg">
            {heroSlides[currentSlide].title}
          </h1>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-sm rounded-full transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-[#1a1a1a] py-5">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ScrollReveal className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-white/80 flex-shrink-0" />
              <span className="text-white text-sm font-medium">Free Shipping Over $50</span>
            </ScrollReveal>
            <ScrollReveal className="flex items-center gap-3" delay={80}>
              <ShieldCheck className="h-8 w-8 text-white/80 flex-shrink-0" />
              <span className="text-white text-sm font-medium">Quality Assurance</span>
            </ScrollReveal>
            <ScrollReveal className="flex items-center gap-3" delay={160}>
              <RotateCcw className="h-8 w-8 text-white/80 flex-shrink-0" />
              <span className="text-white text-sm font-medium">Return within 14 days</span>
            </ScrollReveal>
            <ScrollReveal className="flex items-center gap-3" delay={240}>
              <Headphones className="h-8 w-8 text-white/80 flex-shrink-0" />
              <span className="text-white text-sm font-medium">Support 24/7</span>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 md:py-24 bg-white">
        <ScrollReveal className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <ScrollReveal key={category.name} delay={index * 80}>
                <Link
                key={category.name}
                href={ROUTES.SHOP}
                className="group relative aspect-[3/4] rounded-xl overflow-hidden"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-white text-lg font-semibold">{category.name}</h3>
                  <p className="text-white/70 text-xs uppercase tracking-wider">{category.items} ITEMS</p>
                </div>
              </Link>
              </ScrollReveal>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Featured Section - Luminous Living */}
      <section className="py-16 md:py-24 bg-white">
        <ScrollReveal className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left Content */}
            <div className="max-w-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-4">
                ENLIGHTEN YOUR HOME
              </p>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black leading-tight mb-6">
                Luminous Living: Innovative Lighting Designs
              </h2>
              <p className="text-gray-500 leading-relaxed mb-8">
                Most of the style&apos;s furniture has a touch of modern European
                furniture with a simple design to create harmony with the dark
                interior design...
              </p>
              <Link
                href="/shop"
                className="inline-block bg-black text-white px-8 py-3 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Shop Now
              </Link>
            </div>

            {/* Right Image */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
              <Image
                src={HOME_CONTENT.SPOTLIGHT_IMAGE}
                alt="Modern living room with innovative lighting"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Bestseller Section */}
      <section className="py-16 md:py-24 bg-[#1a1a1a]">
        <ScrollReveal className="container mx-auto px-6">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Bestseller</h2>
              <p className="text-gray-400">Experience the best products at our store!</p>
            </div>
            <Link
                href={ROUTES.SHOP}
              className="hidden md:inline-block border border-white/30 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-colors"
            >
              View All
            </Link>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product, index) => (
              <ScrollReveal key={product.id} delay={index * 90}>
                <Link
                  href={`/shop/${product.id}`}
                  className="group bg-[#f5f5f0] rounded-xl overflow-hidden relative block"
                >
                {/* Badges */}
                {index === 0 && (
                  <span className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    -11%
                  </span>
                )}
                {index === 2 && (
                  <span className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    Out of stock
                  </span>
                )}

                <div className="relative aspect-square overflow-hidden">
                  {product.image_url || product.image_urls?.[0] ? (
                    <Image
                      src={product.image_url || product.image_urls?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 50vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-1">{product.name}</h3>
                  <p className="text-sm font-bold text-black">${product.price}</p>
                </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>

          {/* Mobile View All */}
          <div className="mt-8 text-center md:hidden">
            <Link
              href={ROUTES.SHOP}
              className="inline-block border border-white/30 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-white hover:text-black transition-colors"
            >
              View All
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <SiteFooter description="Premium furniture for modern living spaces. Design your perfect home." />
    </div>
  )
}
