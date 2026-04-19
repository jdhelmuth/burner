import { createClient } from "npm:@supabase/supabase-js@2.47.10";

function getSupabaseUrl() {
  const value = Deno.env.get("SUPABASE_URL");
  if (!value) {
    throw new Error("SUPABASE_URL is not configured");
  }
  return value;
}

function getServiceRoleKey() {
  const value = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return value;
}

function getAnonKey() {
  const value = Deno.env.get("SUPABASE_ANON_KEY");
  if (!value) {
    throw new Error("SUPABASE_ANON_KEY is not configured");
  }
  return value;
}

export function createServiceClient() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createUserClient(authHeader: string) {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
