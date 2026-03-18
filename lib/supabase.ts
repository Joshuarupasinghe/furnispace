import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const isSupabaseAdminConfigured = Boolean(supabaseUrl && supabaseServiceKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null

export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl as string, supabaseServiceKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export function requireSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error(
      "Supabase admin client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    )
  }

  return supabaseAdmin
}
