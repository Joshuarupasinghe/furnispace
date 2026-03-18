import { redirect } from "next/navigation"
import { Suspense } from "react"
import { requireAuth } from "@/lib/auth"
import { AdminDesignerClient } from "@/components/admin/admin-designer-client"

export default async function StudioPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login?from=/studio")
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#ececf4]">
          <p className="text-sm text-gray-500">Loading Studio...</p>
        </div>
      }
    >
      <AdminDesignerClient />
    </Suspense>
  )
}