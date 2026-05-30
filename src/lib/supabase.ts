import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseEnabled = !!(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: { eventsPerSecond: 10 },
      },
    })
  : null

// Server-side client with service role key (for API routes)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
export const isSupabaseServerEnabled = !!(supabaseUrl && supabaseServiceKey)
export const supabaseServer: SupabaseClient | null = isSupabaseServerEnabled
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

// Helper to get user from request (for API routes)
export async function getSupabaseUser(authHeader?: string) {
  if (!supabaseServer || !authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabaseServer.auth.getUser(token)
  if (error || !user) return null
  return user
}
