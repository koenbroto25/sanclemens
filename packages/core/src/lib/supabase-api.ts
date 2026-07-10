import { createClient } from "@supabase/supabase-js";

export function createSupabaseApiServiceRole() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables for API service role.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
}