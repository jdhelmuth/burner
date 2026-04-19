import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "./env";

let browserClient: SupabaseClient | undefined;

export function createSupabaseClient() {
  return createClient(env.supabaseUrl || "http://127.0.0.1:54321", env.supabaseAnonKey || "demo-anon-key");
}

export function getBrowserSupabaseClient() {
  if (typeof window === "undefined") {
    return createSupabaseClient();
  }

  browserClient ??= createClient(env.supabaseUrl || "http://127.0.0.1:54321", env.supabaseAnonKey || "demo-anon-key", {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  });

  return browserClient;
}
