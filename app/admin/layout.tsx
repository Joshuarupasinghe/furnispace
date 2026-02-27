import { getSession } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/sidebar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  return (
    <div className="flex h-screen bg-muted/40 p-3 md:p-5">
      <div className="flex h-full w-full overflow-hidden rounded-[24px] border border-border bg-background shadow-xl">
        {session && <AdminSidebar />}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
