import type { PostgrestError } from "@supabase/supabase-js"
import { requireSupabaseAdmin } from "./supabase"
import type { Design as InteriorDesign } from "@/types/design"
import { resolveAssetUrl } from "./r2"

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

export type TextureType = "floor" | "wall"

export interface Texture {
  id: string
  name: string
  type: TextureType
  category?: string
  file_url: string
  preview_url?: string
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

type TextureRow = {
  id: string
  name: string
  type: TextureType
  category: string | null
  file_url: string
  preview_url: string | null
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
export type CreateTextureInput = Omit<Texture, "id" | "created_at" | "updated_at">
export type UpdateTextureInput = Partial<Omit<Texture, "id" | "created_at" | "updated_at">>

function formatSupabaseError(action: string, error: PostgrestError): Error {
  const details = [error.message, error.code, error.hint, error.details].filter(Boolean).join(" | ")
  return new Error(`Failed to ${action}: ${details}`)
}

function mapProduct(row: ProductRow): Product {
  const imageUrl = resolveAssetUrl(row.image_url)
  const imageUrls = (row.image_urls ?? []).map((value) => resolveAssetUrl(value)).filter(Boolean) as string[]
  const modelUrl = resolveAssetUrl(row.model_url)
  const objUrl = resolveAssetUrl(row.obj_url)
  const mtlUrl = resolveAssetUrl(row.mtl_url)

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: row.price,
    dimensions: row.dimensions,
    colors: row.colors ?? [],
    image_url: imageUrl,
    image_urls: imageUrls,
    model_url: modelUrl ?? objUrl,
    obj_url: objUrl,
    mtl_url: mtlUrl,
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

function mapTexture(row: TextureRow): Texture {
  const fileUrl = resolveAssetUrl(row.file_url)
  const previewUrl = resolveAssetUrl(row.preview_url)

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    category: row.category ?? undefined,
    file_url: fileUrl ?? row.file_url,
    preview_url: previewUrl,
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

export async function getAllTextures(type?: TextureType): Promise<Texture[]> {
  const client = requireSupabaseAdmin()
  let query = client.from("textures").select("*").order("created_at", { ascending: false })

  if (type) {
    query = query.eq("type", type)
  }

  const { data, error } = await query

  if (error) {
    throw formatSupabaseError("fetch textures", error)
  }

  return (data ?? []).map((row) => mapTexture(row as TextureRow))
}

export async function getTextureById(id: string): Promise<Texture | null> {
  const client = requireSupabaseAdmin()
  const { data, error } = await client.from("textures").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw formatSupabaseError(`fetch texture ${id}`, error)
  }

  return data ? mapTexture(data as TextureRow) : null
}

export async function createTexture(texture: CreateTextureInput): Promise<Texture> {
  const client = requireSupabaseAdmin()

  const payload = {
    id: crypto.randomUUID(),
    name: texture.name,
    type: texture.type,
    category: texture.category ?? null,
    file_url: texture.file_url,
    preview_url: texture.preview_url ?? texture.file_url,
  }

  const { data, error } = await client.from("textures").insert(payload).select("*").single()

  if (error) {
    throw formatSupabaseError("create texture", error)
  }

  return mapTexture(data as TextureRow)
}

export async function updateTexture(id: string, updates: UpdateTextureInput): Promise<Texture | null> {
  const client = requireSupabaseAdmin()

  const payload: Record<string, unknown> = {
    ...updates,
  }

  const { data, error } = await client.from("textures").update(payload).eq("id", id).select("*").maybeSingle()

  if (error) {
    throw formatSupabaseError(`update texture ${id}`, error)
  }

  return data ? mapTexture(data as TextureRow) : null
}

export async function deleteTexture(id: string): Promise<boolean> {
  const client = requireSupabaseAdmin()
  const { error } = await client.from("textures").delete().eq("id", id)

  if (error) {
    throw formatSupabaseError(`delete texture ${id}`, error)
  }

  return true
}
