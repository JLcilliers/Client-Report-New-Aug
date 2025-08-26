import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy_key'
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_service_key'

// Create dummy clients that won't actually connect
// These are placeholders since we're not using Supabase
export const supabase = {
  from: (table: string) => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null }),
    upsert: () => Promise.resolve({ data: null, error: null }),
    eq: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      single: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    single: () => Promise.resolve({ data: null, error: null }),
    order: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      limit: () => Promise.resolve({ data: [], error: null }),
    }),
    limit: () => Promise.resolve({ data: [], error: null }),
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => {
      // Return a mock subscription object
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      }
    }
  },
} as any

export const supabaseAdmin = supabase

// Helper to get authenticated user
export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// Helper to check if user is admin
export async function isAdmin(email: string): Promise<boolean> {
  // Use regular supabase client if admin client is not available
  const client = supabaseAdmin || supabase
  
  const { data, error } = await client
    .from('admin_users')
    .select('email')
    .eq('email', email)
    .single()
  
  return !error && !!data
}