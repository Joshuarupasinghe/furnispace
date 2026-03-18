import { z } from "zod"
import { PRODUCT_STATUS_LIST, FILE_UPLOAD } from "./config"

const Dimensions = z.object({
  width: z.number().min(0.1),
  length: z.number().min(0.1),
  height: z.number().min(0.1),
})

const ProductStatusSchema = z.enum(PRODUCT_STATUS_LIST)

export const CreateProductSchema = z.object({
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

export const UpdateProductSchema = CreateProductSchema.partial()

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

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

export function validateLoginCredentials(data: unknown) {
  return LoginSchema.parse(data)
}
