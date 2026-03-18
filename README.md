This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Cloudflare R2 Asset Architecture

Product assets are stored in Cloudflare R2 and referenced from the `products` table:

- `image_url` and `image_urls` for product imagery
- `obj_url` and `mtl_url` for OBJ/MTL assets
- `model_url` for GLB/GLTF or fallback model URL

### 1) Configure Environment Variables

Use `.env.example` as a template and create `.env.local`:

```bash
cp .env.example .env.local
```

Required R2 variables:

- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_ENDPOINT` (or `R2_ACCOUNT_ID`)
- `R2_PUBLIC_URL` (recommended custom/public bucket domain)

### 2) Configure Bucket CORS (Required for OBJ/MTL in browser)

Set CORS on your R2 bucket so web clients can fetch model assets:

```json
[
	{
		"AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
		"AllowedMethods": ["GET", "HEAD"],
		"AllowedHeaders": ["*"],
		"ExposeHeaders": ["ETag", "Content-Length"],
		"MaxAgeSeconds": 86400
	}
]
```

If uploading directly from browser in the future, include `PUT`/`POST` as needed.

### 3) Upload Flow

- Admin UI uploads images and model files via `POST /api/admin/upload`.
- Files are stored under R2 prefixes:
	- `products/images`
	- `products/models`
- APIs persist public asset URLs in Supabase.

### 4) Retrieval Flow

- Product APIs return normalized asset URLs.
- Frontend (`shop`, `product detail`, and viewer components) uses these URLs directly.
- `next.config.ts` allows remote image hosts including your R2 public domain.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
