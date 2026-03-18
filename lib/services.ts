/**
 * Unified service layer for products and categories.
 * This layer sits above repositories and handles business logic, validation, and orchestration.
 */

import {
  getAllProducts,
  getProductById,
  createProduct as dbCreateProduct,
  updateProduct as dbUpdateProduct,
  deleteProduct as dbDeleteProduct,
  getAllCategories,
  getCategoryById,
  createCategory as dbCreateCategory,
  updateCategory as dbUpdateCategory,
  deleteCategory as dbDeleteCategory,
  getAllTextures,
  getTextureById,
  createTexture as dbCreateTexture,
  updateTexture as dbUpdateTexture,
  deleteTexture as dbDeleteTexture,
  type Product,
  type Category,
  type Texture,
  type TextureType,
} from "./db-supabase"

import { deleteFromR2, extractR2ObjectKey, isR2Configured } from "./r2"
import {
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateCategory,
  validateUpdateCategory,
  validateCreateTexture,
  validateUpdateTexture,
} from "./validation"

export class ProductService {
  async getAllProducts(): Promise<Product[]> {
    return getAllProducts()
  }

  async getProductById(id: string): Promise<Product | null> {
    return getProductById(id)
  }

  async createProduct(input: unknown): Promise<Product> {
    const validated = validateCreateProduct(input)
    return dbCreateProduct(validated)
  }

  async updateProduct(id: string, input: unknown): Promise<Product | null> {
    const validated = validateUpdateProduct(input)
    const existing = await getProductById(id)

    if (!existing) {
      return null
    }

    return dbUpdateProduct(id, validated)
  }

  async deleteProduct(id: string): Promise<boolean> {
    const product = await getProductById(id)

    if (!product) {
      return false
    }

    if (isR2Configured()) {
      const keys = new Set<string>()

      const imageKey = extractR2ObjectKey(product.image_url)
      if (imageKey) {
        keys.add(imageKey)
      }

      for (const url of product.image_urls ?? []) {
        const key = extractR2ObjectKey(url)
        if (key) {
          keys.add(key)
        }
      }

      const modelKey = extractR2ObjectKey(product.model_url)
      if (modelKey) {
        keys.add(modelKey)
      }

      const objKey = extractR2ObjectKey(product.obj_url)
      if (objKey) {
        keys.add(objKey)
      }

      const mtlKey = extractR2ObjectKey(product.mtl_url)
      if (mtlKey) {
        keys.add(mtlKey)
      }

      for (const key of keys) {
        try {
          await deleteFromR2(key)
        } catch (error) {
          console.warn(`Failed to delete asset from R2: ${key}`, error)
        }
      }
    }

    return dbDeleteProduct(id)
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const products = await getAllProducts()
    return products.filter((p) => p.category === categoryId)
  }

  async getActiveProducts(): Promise<Product[]> {
    const products = await getAllProducts()
    return products.filter((p) => p.status === "active")
  }
}

export class CategoryService {
  async getAllCategories(): Promise<Category[]> {
    return getAllCategories()
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return getCategoryById(id)
  }

  async createCategory(input: unknown): Promise<Category> {
    const validated = validateCreateCategory(input)
    return dbCreateCategory(validated)
  }

  async updateCategory(id: string, input: unknown): Promise<Category | null> {
    const validated = validateUpdateCategory(input)
    const existing = await getCategoryById(id)

    if (!existing) {
      return null
    }

    return dbUpdateCategory(id, validated)
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await getCategoryById(id)

    if (!category) {
      return false
    }

    const products = await getAllProducts()
    const inUse = products.some((p) => p.category === id || p.category === category.name)

    if (inUse) {
      throw new Error("Cannot delete category with existing products")
    }

    return dbDeleteCategory(id)
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    const categories = await getAllCategories()
    return categories.find((c) => c.name === name) || null
  }
}

export class TextureService {
  async getAllTextures(type?: TextureType): Promise<Texture[]> {
    return getAllTextures(type)
  }

  async getTextureById(id: string): Promise<Texture | null> {
    return getTextureById(id)
  }

  async createTexture(input: unknown): Promise<Texture> {
    const validated = validateCreateTexture(input)
    return dbCreateTexture(validated)
  }

  async updateTexture(id: string, input: unknown): Promise<Texture | null> {
    const validated = validateUpdateTexture(input)
    const existing = await getTextureById(id)

    if (!existing) {
      return null
    }

    return dbUpdateTexture(id, validated)
  }

  async deleteTexture(id: string): Promise<boolean> {
    const texture = await getTextureById(id)

    if (!texture) {
      return false
    }

    if (isR2Configured()) {
      const keys = new Set<string>()

      const textureKey = extractR2ObjectKey(texture.file_url)
      if (textureKey) {
        keys.add(textureKey)
      }

      const previewKey = extractR2ObjectKey(texture.preview_url)
      if (previewKey) {
        keys.add(previewKey)
      }

      for (const key of keys) {
        try {
          await deleteFromR2(key)
        } catch (error) {
          console.warn(`Failed to delete texture asset from R2: ${key}`, error)
        }
      }
    }

    return dbDeleteTexture(id)
  }
}

export class AdminService {
  readonly products = new ProductService()
  readonly categories = new CategoryService()
  readonly textures = new TextureService()

  async getAdminDashboardStats() {
    const products = await this.products.getAllProducts()
    const categories = await this.categories.getAllCategories()

    return {
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      totalCategories: categories.length,
    }
  }
}

export const adminService = new AdminService()
