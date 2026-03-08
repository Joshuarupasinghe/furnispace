import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import ProjectsPageClient from "../../../components/admin/projects-page-client"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  return <ProjectsPageClient />
}
