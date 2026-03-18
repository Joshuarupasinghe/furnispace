/**
 * Centralized configuration for the entire application.
 * All hardcoded values, constants, and settings should be defined here.
 */

export const APP_NAME = "FurniSpace"
export const APP_TITLE = "FurniSpace - Premium Furniture & Room Design"
export const CURRENT_YEAR = 2026

export const ROUTES = {
  HOME: "/",
  SHOP: "/shop",
  CONTACT: "/contact",
  CART: "/cart",
  DASHBOARD: "/dashboard",
  AUTH: "/auth",
  ADMIN: "/admin",
  ADMIN_LOGIN: "/admin/login",
  ADMIN_DESIGNER: "/admin/designer",
} as const

export const API_ROUTES = {
  PRODUCTS: "/api/products",
  ADMIN_LOGIN: "/api/admin/auth/login",
  ADMIN_LOGOUT: "/api/admin/auth/logout",
  ADMIN_UPLOAD: "/api/admin/upload",
} as const

export const EXTERNAL_URLS = {
  MODEL_VIEWER_SCRIPT: "https://unpkg.com/@google/model-viewer@3.4.0/dist/model-viewer.min.js",
  MODEL_VIEWER_DEMO: "https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb",
} as const

export const NAV_LINKS = [
  { href: ROUTES.HOME, label: "Home", hasDropdown: true },
  { href: ROUTES.SHOP, label: "Shop", hasDropdown: true },
  { href: ROUTES.CONTACT, label: "Contact", hasDropdown: false },
] as const

export const FOOTER_LINKS = {
  NAVIGATION: [
    { href: ROUTES.HOME, label: "Home" },
    { href: ROUTES.SHOP, label: "Shop" },
    { href: ROUTES.CONTACT, label: "Contact" },
  ],
  CATEGORIES: [
    { href: ROUTES.SHOP, label: "Seating" },
    { href: ROUTES.SHOP, label: "Tables" },
    { href: ROUTES.SHOP, label: "Bedroom" },
    { href: ROUTES.SHOP, label: "Storage" },
  ],
  SUPPORT: [
    { href: ROUTES.CONTACT, label: "Contact Us" },
    { label: "Shipping Info" },
    { label: "Returns & Exchanges" },
  ],
} as const

export const HOME_CONTENT = {
  HERO_SLIDES: [
    {
      image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&h=1080&fit=crop&q=90",
      title: "The Art of Modern\nInterior Living",
    },
    {
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&h=1080&fit=crop&q=90",
      title: "Design Your\nPerfect Space",
    },
    {
      image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&h=1080&fit=crop&q=90",
      title: "Elegance in\nEvery Detail",
    },
  ],
  CATEGORY_CARDS: [
    {
      name: "Seating",
      items: 2,
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=700&fit=crop&q=80",
    },
    {
      name: "Tables",
      items: 2,
      image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=700&fit=crop&q=80",
    },
    {
      name: "Bedroom",
      items: 1,
      image: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=600&h=700&fit=crop&q=80",
    },
    {
      name: "Storage",
      items: 1,
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=700&fit=crop&q=80",
    },
  ],
  SPOTLIGHT_IMAGE:
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=90",
} as const

export const UI_TEXT = {
  SHOP_SEARCH_PLACEHOLDER: "Search furniture...",
} as const

export const STORAGE_KEYS = {
  DESIGNS: "furnispace_designs",
  CART: "furnispace-cart",
} as const

export const SESSION_CONFIG = {
  COOKIE_NAME: "admin_session",
  MAX_AGE_SECONDS: 60 * 60 * 24 * 7, // 7 days
  HTTP_ONLY: true,
  SECURE: process.env.NODE_ENV === "production",
  SAME_SITE: "lax" as const,
} as const

export const FILE_UPLOAD = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_MODEL_SIZE_MB: 50,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_MODEL_SIZE_BYTES: 50 * 1024 * 1024,
  VALID_IMAGE_EXTENSIONS: ["jpg", "jpeg", "png", "webp"],
  VALID_MODEL_EXTENSIONS: ["obj", "mtl", "glb", "gltf"],
} as const

export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const

export const PRODUCT_STATUS_LIST = [PRODUCT_STATUS.ACTIVE, PRODUCT_STATUS.INACTIVE] as const

export const CONTACT_EMAIL = {
  SUPPORT: "support@furnispace.com",
  SALES: "sales@furnispace.com",
} as const
