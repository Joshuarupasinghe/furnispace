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
  type Product,
  type Category,
  type CreateProductInput,
  type UpdateProductInput,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from "./db-supabase"

import { deleteFromR2 } from "./r2"
import { validateCreateProduct, validateUpdateProduct, validateCreateCategory, validateUpdateCategory } from "./validation"

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

    if (product.image_urls) {
      for (const url of product.image_urls) {
        try {
          const match = url.match(/\/([^?]+)$/)
          if (match) {
            await deleteFromR2(decodeURIComponent(match[1]))
          }
        } catch (error) {
          console.warn(`Failed to delete image from R2: ${url}`, error)
        }
      }
    }

    if (product.obj_url) {
      try {
        const match = product.obj_url.match(/\/([^?]+)$/)
        if (match) {
          await deleteFromR2(decodeURIComponent(match[1]))
        }
      } catch (error) {
        console.warn(`Failed to delete OBJ from R2: ${product.obj_url}`, error)
      }
    }

    if (product.mtl_url) {
      try {
        const match = product.mtl_url.match(/\/([^?]+)$/)
        if (match) {
          await deleteFromR2(decodeURIComponent(match[1]))
        }
      } catch (error) {
        console.warn(`Failed to delete MTL from R2: ${product.mtl_url}`, error)
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

export class AdminService {
  readonly products = new ProductService()
  readonly categories = new CategoryService()

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
