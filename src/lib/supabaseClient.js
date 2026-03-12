import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 1. 'sessionStorage' logs out when browser closes.
    //    'localStorage' keeps you logged in until you manually log out.
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
    
    // 2. Keep this true to automatically refresh tokens
    autoRefreshToken: true,
    
    // 3. Keep this true to persist the session
    persistSession: true,
  },
})