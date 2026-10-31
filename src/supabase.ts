import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Extend globalThis safely in TypeScript to cache the client across Vite HMR reloads
declare global {
  // eslint-disable-next-line no-var
  var __supabaseInstance: SupabaseClient | undefined
}

export const supabase =
  globalThis.__supabaseInstance ||
  (globalThis.__supabaseInstance = createClient(supabaseUrl, supabaseAnonKey))