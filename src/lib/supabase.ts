/**
 * Supabase client for frontend auth.
 * Uses anon key only; never expose service role.
 * 
 * IMPORTANT: This is a singleton to ensure session state is shared
 * across all parts of the app.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Singleton instance - created once and reused
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase URL or Anon Key not configured');
    return null;
  }
  
  // Return existing instance if already created
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Create singleton instance
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  
  return supabaseInstance;
}

// Export the client directly for convenience (lazy initialization)
export const supabase = {
  get client() {
    return getSupabaseClient();
  },
};
