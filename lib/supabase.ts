import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseSecretKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabasePublishableKey as string)
  : null

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl as string, supabaseSecretKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY."
    )
  }

  return supabaseAdmin
}
