# FurniSpace

FurniSpace is a 3D furniture visualisation and e-commerce platform built with Next.js, allowing users to explore and place furniture models in an interactive 3D space. 
This project is created by the students of Group 115 of Plymouth Batch 12 for the PUSL3122 Module.
Navigate to /admin to access admin page
Admin credentials are as follows
ADMIN_EMAIL=admin@furnispace.com
ADMIN_PASSWORD=admin123
---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **pnpm** (recommended)

### Environment Variables

Create a `.env.local` file in the root directory and configure the following environment variables (see `.env.example` for reference):

```env.local
STRIPE_SECRET_KEY=sk_test_51SdPE3DjcKeoJZecLWFXpSevzs0qsdyiRCasyVEGC1SXGCia87k4KH05vHJBcMnrMk1VqZnVthDrQea5mABdzZKA00SNbIcfcS
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SdPE3DjcKeoJZeceB0qJSBQIELpk9f8Rba82xqUKyQ6YONL9vjK3iJ527WmrV1MYKMdEgxbP3Wh3xF3vdSYlW6g00lD4rghrU
STRIPE_WEBHOOK_SECRET=whsec_9ce2f6993b366c5fa711721107fb5ebfb2145c1ecc6873fb071f7cad152a4c10

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://riowphxjecfatehsjrzt.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_i8tdr4YAE6tyxatT-2gxMA_EE1yhNeU

SUPABASE_SECRET_KEY=sb_secret_l8UoOdhmU-6GRKWgFeVVLw_oAHylR81

ADMIN_EMAIL=admin@furnispace.com
ADMIN_PASSWORD=admin123

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=983ec065600c45ed776ccf5b514d0bd7
R2_ACCESS_KEY_ID=f2861cfcd27d300747ef263830788d49
R2_SECRET_ACCESS_KEY=ebb9e8afc33254493daf42cc5d6395af68db621bff5d068b0a6c85dc327cae1f
R2_BUCKET_NAME=furnispace
R2_PUBLIC_URL=https://furnispace.r2.dev
R2_ENDPOINT=https://983ec065600c45ed776ccf5b514d0bd7.r2.cloudflarestorage.com

# Session Secret (generate a random string)
SESSION_SECRET=6oNrYv3Pp5rhyhOxhllaVl2o4UfTdGG-ttjqSNdP
```

### Installation

```bash
# Clone the repository
git clone https://github.com/Joshuarupasinghe/furnispace.git
cd furnispace

# Install dependencies
pnpm install
```

### Running the Development Server

```bash
pnpm dev
```

Open your browser and navigate to:

- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3006](http://localhost:3006)

> **Note:** The application is configured to run on **port 3000** or **port 3006**, as Cloudflare tunnelling has been enabled for those ports.

---

## 🏗️ Building for Production

```bash
pnpm build
pnpm start
```

---

## 📁 Project Structure

```
furnispace/
├── app/            # Next.js App Router pages & API routes
├── components/     # Reusable UI components
├── public/         # Static assets
└── ...
```

---

## 📦 Credits

### 3D Textures — Floor Textures
**[ambientCG](https://ambientcg.com/)**  
Floor textures used in the 3D viewer were sourced from ambientCG. All assets are released under the **Creative Commons CC0 1.0 Universal** licence.

---

### 3D Models — Furniture
**[CGTrader](https://www.cgtrader.com/)**  
Furniture 3D models used throughout the application were sourced from CGTrader.

---

### Textures — Walls & Floors
**[Freepik](https://www.freepik.com/)**  
Wall textures and additional floor textures were sourced from Freepik.

---

## 📄 Licence

This project is for academic and demonstration purposes.
