import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/auth"

export default async function SettingsPage() {
  try {
    await requireAuth()
  } catch {
    redirect("/admin/login")
  }

  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="mb-10">
        <h1 className="text-3xl font-serif tracking-wide text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your admin settings</p>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">R2 Configuration</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Cloudflare R2 bucket settings</p>
          </div>
          <div className="p-6">
            <p className="mb-3 text-sm text-muted-foreground">
              R2 configuration is managed through environment variables.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="font-medium text-foreground">Bucket:</span>
                <span className="text-muted-foreground">{process.env.R2_BUCKET_NAME || "Not configured"}</span>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
                <span className="font-medium text-foreground">Public URL:</span>
                <span className="text-muted-foreground">{process.env.R2_PUBLIC_URL || "Not configured"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="border-b border-border px-6 py-5">
            <h2 className="text-lg font-semibold text-foreground">System Information</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Application details</p>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <span className="font-medium text-foreground">Environment:</span>
              <span className="text-muted-foreground">{process.env.NODE_ENV || "development"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
