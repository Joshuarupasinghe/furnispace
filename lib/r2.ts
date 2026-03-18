import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"

type R2Config = {
  bucketName: string
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
}

let r2Client: S3Client | null = null

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"])
const MODEL_EXTENSIONS = new Set(["obj", "mtl", "glb", "gltf"])

export interface UploadResult {
  url: string
  key: string
}

export interface R2ObjectResult {
  body: Uint8Array
  contentType?: string
  cacheControl?: string
}

function requireR2Config(): R2Config {
  const bucketName = process.env.R2_BUCKET_NAME?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    (process.env.R2_ACCOUNT_ID ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : "")

  if (!bucketName || !accessKeyId || !secretAccessKey || !endpoint) {
    console.error("R2 Configuration missing:", {
      bucketName: !!bucketName,
      accessKeyId: !!accessKeyId,
      secretAccessKey: !!secretAccessKey,
      endpoint: !!endpoint,
    })
    throw new Error(
      "Cloudflare R2 is not fully configured. Required: R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT (or R2_ACCOUNT_ID)."
    )
  }

  return {
    bucketName,
    endpoint,
    accessKeyId,
    secretAccessKey,
  }
}

function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client
  }

  const config = requireR2Config()
  r2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  })

  return r2Client
}

function getFileExtension(fileName: string): string {
  const ext = fileName.toLowerCase().split(".").pop()
  return ext || ""
}

function sanitizeFolderName(folder: string): string {
  return folder
    .split("/")
    .map((segment) => segment.trim().replace(/[^a-zA-Z0-9_-]/g, ""))
    .filter(Boolean)
    .join("/")
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

function toAssetProxyUrl(key: string): string {
  const sanitizedKey = key
    .replace(/^\/+/, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/")

  return `/api/assets/${sanitizedKey}`
}

export function isR2Configured(): boolean {
  try {
    requireR2Config()
    return true
  } catch {
    return false
  }
}

export function resolveAssetUrl(value?: string | null): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  if (trimmed.startsWith("/api/assets/")) {
    return trimmed
  }

  if (trimmed.startsWith("/")) {
    return trimmed
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const key = extractR2ObjectKey(trimmed)
    return key ? toAssetProxyUrl(key) : trimmed
  }

  return toAssetProxyUrl(trimmed)
}

export function extractR2ObjectKey(value?: string | null): string | null {
  if (!value) {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed.replace(/^\/+/, "")
  }

  try {
    const parsed = new URL(trimmed)
    let path = decodeURIComponent(parsed.pathname).replace(/^\/+/, "")
    if (!path) {
      return null
    }

    const bucketName = process.env.R2_BUCKET_NAME?.trim()
    if (bucketName && parsed.hostname === `${bucketName}.r2.dev`) {
      const bucketPrefix = `${bucketName}/`
      if (path.startsWith(bucketPrefix)) {
        path = path.slice(bucketPrefix.length)
      }
    }

    return path
  } catch {
    return null
  }
}

export async function uploadToR2(file: Buffer, fileName: string, folder = "uploads"): Promise<UploadResult> {
  const config = requireR2Config()
  const safeFileName = sanitizeFileName(fileName)
  const safeFolder = sanitizeFolderName(folder)
  const prefix = safeFolder || "uploads"
  const key = `${prefix}/${Date.now()}-${safeFileName}`

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: key,
    Body: file,
    ContentType: getContentType(fileName),
  })

  try {
    await getR2Client().send(command)
  } catch (error) {
    console.error("R2 Upload failed:", {
      key,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }

  return {
    // Return same-origin URL for browser usage to avoid CORS issues.
    url: toAssetProxyUrl(key),
    key,
  }
}

export async function getObjectFromR2(key: string): Promise<R2ObjectResult> {
  const config = requireR2Config()
  const objectKey = key.replace(/^\/+/, "")

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: objectKey,
  })

  const response = await getR2Client().send(command)
  const bodyStream = response.Body as unknown as {
    transformToByteArray?: () => Promise<Uint8Array>
    [Symbol.asyncIterator]?: () => AsyncIterator<Uint8Array | string>
  }

  let body: Uint8Array

  if (bodyStream && typeof bodyStream.transformToByteArray === "function") {
    body = await bodyStream.transformToByteArray()
  } else if (bodyStream && typeof bodyStream[Symbol.asyncIterator] === "function") {
    const chunks: Uint8Array[] = []
    for await (const chunk of bodyStream as AsyncIterable<Uint8Array | string>) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
    }
    body = chunks.length ? Buffer.concat(chunks) : new Uint8Array()
  } else {
    body = new Uint8Array()
  }

  return {
    body,
    contentType: response.ContentType,
    cacheControl: response.CacheControl,
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  const config = requireR2Config()
  const command = new DeleteObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  })

  await getR2Client().send(command)
}

export function isValidImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(getFileExtension(fileName))
}

export function isValidModelFile(fileName: string): boolean {
  return MODEL_EXTENSIONS.has(getFileExtension(fileName))
}
