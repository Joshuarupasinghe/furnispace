import type { PostgrestError } from "@supabase/supabase-js"
import { requireSupabaseAdmin } from "./supabase"
import type { Design as InteriorDesign } from "@/types/design"

export interface ProductDimensions {
  width: number
  length: number
  height: number
}

export interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  dimensions: ProductDimensions
  colors: string[]
  image_url?: string
  image_urls?: string[]
  model_url?: string
  obj_url?: string
  mtl_url?: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface SavedDesign {
  id: string
  name: string
  design: InteriorDesign
  created_at: string
  updated_at: string
}

type ProductRow = {
  id: string
  name: string
  description: string
  category: string
  price: number
  dimensions: ProductDimensions
  colors: string[] | null
  image_url: string | null
  image_urls: string[] | null
  model_url: string | null
  obj_url: string | null
  mtl_url: string | null
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

type CategoryRow = {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

type DesignRow = {
  id: string
  name: string
  design_data: InteriorDesign
  created_at: string
  updated_at: string
}

export type CreateProductInput = Omit<Product, "id" | "created_at" | "updated_at">
export type UpdateProductInput = Partial<Omit<Product, "id" | "created_at" | "updated_at">>
export type CreateCategoryInput = Omit<Category, "id" | "created_at" | "updated_at">
export type UpdateCategoryInput = Partial<Omit<Category, "id" | "created_at" | "updated_at">>
export type CreateDesignInput = {
  id?: string
  name: string
  design: InteriorDesign
}
export type UpdateDesignInput = Partial<Pick<SavedDesign, "name" | "design">>

function formatSupabaseError(action: string, error: PostgrestError): Error {
  const details = [error.message, error.code, error.hint, error.details].filter(Boolean).join(" | ")
  return new Error(`Failed to ${action}: ${details}`)
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    dimensions: row.dimensions,
    colors: row.colors ?? [],
    image_url: row.image_url ?? undefined,
    image_urls: row.image_urls ?? [],
    model_url: row.model_url ?? row.obj_url ?? undefined,
    obj_url: row.obj_url ?? undefined,
    mtl_url: row.mtl_url ?? undefined,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function mapSavedDesign(row: DesignRow): SavedDesign {
  return {
    id: row.id,
    name: row.name,
    design: row.design_data,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw formatSupabaseError("fetch products", error)
  }

  return (data ?? []).map((row) => mapProduct(row as ProductRow))
}

export async function getProductById(id: string): Promise<Product | null> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("products").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw formatSupabaseError(`fetch product ${id}`, error)
  }

  return data ? mapProduct(data as ProductRow) : null
}

export async function createProduct(product: CreateProductInput): Promise<Product> {
  const client = requireSupabaseAdmin()

  const payload = {
    id: crypto.randomUUID(),
    name: product.name,
    description: product.description,
    category: product.category,
    price: product.price,
    dimensions: product.dimensions,
    colors: product.colors,
    image_url: product.image_url ?? null,
    image_urls: product.image_urls ?? [],
    model_url: product.model_url ?? null,
    obj_url: product.obj_url ?? null,
    mtl_url: product.mtl_url ?? null,
    status: product.status,
  }

  const { data, error } = await client.from("products").insert(payload).select("*").single()

  if (error) {
    throw formatSupabaseError("create product", error)
  }

  return mapProduct(data as ProductRow)
}

export async function updateProduct(id: string, updates: UpdateProductInput): Promise<Product | null> {
  const client = requireSupabaseAdmin()

  const payload: Record<string, unknown> = {
    ...updates,
  }

  const { data, error } = await client.from("products").update(payload).eq("id", id).select("*").maybeSingle()

  if (error) {
    throw formatSupabaseError(`update product ${id}`, error)
  }

  return data ? mapProduct(data as ProductRow) : null
}

export async function deleteProduct(id: string): Promise<boolean> {
  const client = requireSupabaseAdmin()
  const { error } = await client.from("products").delete().eq("id", id)

  if (error) {
    throw formatSupabaseError(`delete product ${id}`, error)
  }

  return true
}

export async function getAllCategories(): Promise<Category[]> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("categories").select("*").order("name", { ascending: true })

  if (error) {
    throw formatSupabaseError("fetch categories", error)
  }

  return (data ?? []).map((row) => mapCategory(row as CategoryRow))
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("categories").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw formatSupabaseError(`fetch category ${id}`, error)
  }

  return data ? mapCategory(data as CategoryRow) : null
}

export async function createCategory(category: CreateCategoryInput): Promise<Category> {
  const client = requireSupabaseAdmin()

  const payload = {
    id: crypto.randomUUID(),
    name: category.name,
    description: category.description ?? null,
  }

  const { data, error } = await client.from("categories").insert(payload).select("*").single()

  if (error) {
    throw formatSupabaseError("create category", error)
  }

  return mapCategory(data as CategoryRow)
}

export async function updateCategory(id: string, updates: UpdateCategoryInput): Promise<Category | null> {
  const client = requireSupabaseAdmin()

  const payload: Record<string, unknown> = {
    ...updates,
  }

  const { data, error } = await client.from("categories").update(payload).eq("id", id).select("*").maybeSingle()

  if (error) {
    throw formatSupabaseError(`update category ${id}`, error)
  }

  return data ? mapCategory(data as CategoryRow) : null
}

export async function deleteCategory(id: string): Promise<boolean> {
  const client = requireSupabaseAdmin()
  const { error } = await client.from("categories").delete().eq("id", id)

  if (error) {
    throw formatSupabaseError(`delete category ${id}`, error)
  }

  return true
}

export async function getAllDesigns(): Promise<SavedDesign[]> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("designs").select("*").order("updated_at", { ascending: false })

  if (error) {
    throw formatSupabaseError("fetch designs", error)
  }

  return (data ?? []).map((row) => mapSavedDesign(row as DesignRow))
}

export async function getDesignById(id: string): Promise<SavedDesign | null> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("designs").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw formatSupabaseError(`fetch design ${id}`, error)
  }

  return data ? mapSavedDesign(data as DesignRow) : null
}

export async function createDesign(input: CreateDesignInput): Promise<SavedDesign> {
  const client = requireSupabaseAdmin()

  const designId = input.id || crypto.randomUUID()
  const payload = {
    id: designId,
    name: input.name,
    design_data: {
      ...input.design,
      id: designId,
      name: input.name,
    },
  }

  const { data, error } = await client.from("designs").insert(payload).select("*").single()

  if (error) {
    throw formatSupabaseError("create design", error)
  }

  return mapSavedDesign(data as DesignRow)
}

export async function updateDesign(id: string, updates: UpdateDesignInput): Promise<SavedDesign | null> {
  const client = requireSupabaseAdmin()

  const existing = await getDesignById(id)
  if (!existing) {
    return null
  }

  const nextName = updates.name ?? existing.name
  const nextDesign = updates.design
    ? {
        ...updates.design,
        id,
        name: nextName,
      }
    : {
        ...existing.design,
        id,
        name: nextName,
      }

  const payload: Record<string, unknown> = {
    name: nextName,
    design_data: nextDesign,
  }

  const { data, error } = await client.from("designs").update(payload).eq("id", id).select("*").maybeSingle()

  if (error) {
    throw formatSupabaseError(`update design ${id}`, error)
  }

  return data ? mapSavedDesign(data as DesignRow) : null
}

export async function deleteDesignById(id: string): Promise<boolean> {
  const client = requireSupabaseAdmin()
  const { error } = await client.from("designs").delete().eq("id", id)

  if (error) {
    throw formatSupabaseError(`delete design ${id}`, error)
  }

  return true
}
