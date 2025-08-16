import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check that NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel environment variables.'
  )
}

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = supabaseServiceRoleKey && supabaseUrl 
  ? createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
  : null as any

// Helper to get authenticated user
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Helper to check if user is admin
export async function isAdmin(email: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .single()
  
  return !error && !!data
}