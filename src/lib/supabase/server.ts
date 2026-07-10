import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  // return null or throw a different kind of error that Next.js won't turn into HTML
  // For debugging, we'll proceed, but API calls will likely fail.
}
if (!supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  // For debugging, we'll proceed, but API calls will likely fail.
}

// Create a Supabase client for server-side operations (e.g., bypassing RLS with service role key)
export const supabaseServer = createSupabaseClient(supabaseUrl || '', supabaseServiceRoleKey || '', {
  auth: {
    persistSession: false, // Server-side client, no session persistence needed
  },
});
// Alias for compatibility with API routes that import createClient
export function createClient(): typeof supabaseServer {
  return supabaseServer;
}
