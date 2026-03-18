import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

const bucketName = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL
const endpoint = process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"])
const MODEL_EXTENSIONS = new Set(["obj", "mtl", "glb", "gltf"])

export interface UploadResult {
  url: string
  key: string
}

function requireBucketName(): string {
  if (!bucketName) {
    throw new Error("R2_BUCKET_NAME is missing")
  }

  return bucketName
}

function getFileExtension(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop()
  return ext || ""
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "-")
}

function getContentType(fileName: string): string {
  const ext = getFileExtension(fileName)
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    obj: "model/obj",
    mtl: "text/plain",
    glb: "model/gltf-binary",
    gltf: "model/gltf+json",
  }

  return contentTypes[ext] || "application/octet-stream"
}

function getPublicUrl(key: string): string {
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`
  }

  return `https://${requireBucketName()}.r2.dev/${key}`
}

export async function uploadToR2(file: Buffer, fileName: string, folder = "uploads"): Promise<UploadResult> {
  const safeFileName = sanitizeFileName(fileName)
  const key = `${folder.replace(/^\/+|\/+$/g, "")}/${Date.now()}-${safeFileName}`

  const command = new PutObjectCommand({
    Bucket: requireBucketName(),
    Key: key,
    Body: file,
    ContentType: getContentType(fileName),
  })

  await r2Client.send(command)

  return {
    url: getPublicUrl(key),
    key,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: requireBucketName(),
    Key: key,
  })

  await r2Client.send(command)
}

export function isValidImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(fileName))
}

export function isValidModelFile(fileName: string): boolean {
  return MODEL_EXTENSIONS.has(getFileExtension(fileName))
}
