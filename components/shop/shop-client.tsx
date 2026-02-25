"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Box, Eye, Search, SlidersHorizontal, Grid3X3, LayoutGrid, Heart, ArrowUpDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Product } from "@/lib/db-supabase"
import { UI_TEXT } from "@/lib/config"

interface Category {
  id: string
  name: string
}

interface ShopClientProps {
  products: Product[]
  categories: Category[]
}

export function ShopClient({ products, categories }: ShopClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")
  const [sortOrder, setSortOrder] = useState("asc")
  const [priceRange, setPriceRange] = useState([0, 10000])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "compact">("grid")
  const [favorites, setFavorites] = useState<string[]>([])

  const formatImageUrl = (url: string | undefined) => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    if (!url.startsWith('/')) return '/' + url
    return url
  }

  const priceRangeBounds = useMemo(() => {
    const activeProducts = products.filter((p) => p.status === "active")
    const prices = activeProducts.map(p => parseFloat(p.price.toString()))
    return {
      min: Math.floor(Math.min(...prices, 0)),
      max: Math.ceil(Math.max(...prices, 10000))
    }
  }, [products])

  const processedProducts = useMemo(() => {
    let result = products.filter((p) => p.status === "active")
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
      )
    }
    result = result.filter(p => {
      const price = parseFloat(p.price.toString())
      return price >= priceRange[0] && price <= priceRange[1]
    })
    result.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number
      switch (sortBy) {
        case "price":
          aVal = parseFloat(a.price.toString())
          bVal = parseFloat(b.price.toString())
          break
        case "name":
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case "category":
          aVal = a.category?.toLowerCase() || ""
          bVal = b.category?.toLowerCase() || ""
          break
        default:
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
      }
      if (sortOrder === "desc") {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      }
    })
    return result
  }, [products, selectedCategory, searchQuery, priceRange, sortBy, sortOrder])

  const toggleFavorite = (productId: string) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const categoryList = ["All", ...categories.map((c) => c.name)]

  return (
    <>
      {/* Search & Filter Bar */}
      <section className="border-b bg-white sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder={UI_TEXT.SHOP_SEARCH_PLACEHOLDER}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 border-gray-200 rounded-full focus:border-black focus:ring-black"
              />
            </div>

            <div className="flex gap-2 w-full lg:w-auto">
              {/* Sort */}
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}>
                <SelectTrigger className="w-full lg:w-[180px] h-11 rounded-full border-gray-200">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name A-Z</SelectItem>
                  <SelectItem value="name-desc">Name Z-A</SelectItem>
                  <SelectItem value="price-asc">Price Low-High</SelectItem>
                  <SelectItem value="price-desc">Price High-Low</SelectItem>
                  <SelectItem value="category-asc">Category A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-11 rounded-full border-gray-200 ${showFilters ? 'bg-black text-white hover:bg-gray-800' : 'hover:bg-gray-50'}`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Filters</span>
              </Button>

              {/* View Mode */}
              <div className="flex border border-gray-200 rounded-full overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`h-11 px-3 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`h-11 px-3 ${viewMode === 'compact' ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-6 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Category Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {categoryList.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                          selectedCategory === category
                            ? "bg-black text-white"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-black"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={priceRangeBounds.max}
                    min={priceRangeBounds.min}
                    step={50}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>

                {/* Results */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Results</label>
                  <p className="text-sm font-semibold">{processedProducts.length} products found</p>
                  {(searchQuery || selectedCategory !== "All" || priceRange[0] !== priceRangeBounds.min || priceRange[1] !== priceRangeBounds.max) && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("All")
                        setPriceRange([priceRangeBounds.min, priceRangeBounds.max])
                      }}
                      className="text-xs underline text-gray-500 hover:text-black"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-10">
        <div className="container mx-auto px-6">
          {processedProducts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Box className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">No products found</h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchQuery
                  ? `No products matching "${searchQuery}".`
                  : "No products available in this category."}
              </p>
              {(searchQuery || selectedCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedCategory("All")
                    setPriceRange([priceRangeBounds.min, priceRangeBounds.max])
                  }}
                  className="inline-block bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className={`grid gap-6 ${
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {processedProducts.map((product) => {
                const imageUrl = formatImageUrl(product.image_url) || (product.image_urls?.[0] ? formatImageUrl(product.image_urls[0]) : null)
                const isFavorited = favorites.includes(product.id)

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className="group bg-[#f5f5f0] rounded-xl overflow-hidden relative block"
                  >
                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        toggleFavorite(product.id)
                      }}
                      className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isFavorited
                          ? 'bg-red-50 text-red-500'
                          : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                    </button>

                    {/* 3D badge */}
                    {(product.model_url || product.obj_url) && (
                      <span className="absolute top-3 left-3 z-10 bg-black/70 text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        3D
                      </span>
                    )}

                    <div className={`relative overflow-hidden ${viewMode === 'grid' ? 'aspect-[4/3]' : 'aspect-square'}`}>
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                          <Box className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{product.category}</p>
                      <h3 className="text-sm font-medium text-gray-800 mb-1 group-hover:text-black transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm font-bold text-black">
                        ${parseFloat(product.price.toString()).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
