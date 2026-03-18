import { z } from "zod"
import { PRODUCT_STATUS_LIST } from "./config"

const Dimensions = z.object({
  width: z.number().min(0.1),
  length: z.number().min(0.1),
  height: z.number().min(0.1),
})

const ProductStatusSchema = z.enum(PRODUCT_STATUS_LIST)

const BaseCreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().default(""),
  category: z.string().min(1).max(100),
  price: z.number().min(0),
  dimensions: Dimensions,
  colors: z.array(z.string()).optional().default([]),
  image_url: z.string().url().optional(),
  image_urls: z.array(z.string().url()).optional().default([]),
  model_url: z.string().url().optional(),
  obj_url: z.string().url().optional(),
  mtl_url: z.string().url().optional(),
  status: ProductStatusSchema.default("active"),
})

function normalizeProductPayload(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input
  }

  const payload = input as Record<string, unknown>

  return {
    ...payload,
    image_url: payload.image_url ?? payload.imageUrl,
    image_urls: payload.image_urls ?? payload.imageUrls,
    model_url: payload.model_url ?? payload.modelUrl,
    obj_url: payload.obj_url ?? payload.objUrl,
    mtl_url: payload.mtl_url ?? payload.mtlUrl,
  }
}

export const CreateProductSchema = z.preprocess(normalizeProductPayload, BaseCreateProductSchema)

export const UpdateProductSchema = z.preprocess(normalizeProductPayload, BaseCreateProductSchema.partial())

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

const TextureTypeSchema = z.enum(["floor", "wall"])

export const CreateTextureSchema = z.object({
  name: z.string().min(1).max(255),
  type: TextureTypeSchema,
  category: z.string().max(100).optional(),
  file_url: z.string().min(1),
  preview_url: z.string().min(1).optional(),
})

export const UpdateTextureSchema = CreateTextureSchema.partial()

export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  folder: z.string().default("uploads"),
  type: z.enum(["image", "model"]).default("image"),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
export type CreateTextureInput = z.infer<typeof CreateTextureSchema>
export type UpdateTextureInput = z.infer<typeof UpdateTextureSchema>
export type FileUploadInput = z.infer<typeof FileUploadSchema>
export type LoginInput = z.infer<typeof LoginSchema>

export function validateCreateProduct(data: unknown) {
  return CreateProductSchema.parse(data)
}

export function validateUpdateProduct(data: unknown) {
  return UpdateProductSchema.parse(data)
}

export function validateCreateCategory(data: unknown) {
  return CreateCategorySchema.parse(data)
}

export function validateUpdateCategory(data: unknown) {
  return UpdateCategorySchema.parse(data)
}

export function validateCreateTexture(data: unknown) {
  return CreateTextureSchema.parse(data)
}

export function validateUpdateTexture(data: unknown) {
  return UpdateTextureSchema.parse(data)
}

export function validateLoginCredentials(data: unknown) {
  return LoginSchema.parse(data)
}
