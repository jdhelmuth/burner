export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  burnerAppUrl: process.env.NEXT_PUBLIC_BURNER_APP_URL ?? "burner://",
  webOrigin: process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "",
};

export const runtimeFlags = {
  isSupabaseConfigured: Boolean(env.supabaseUrl && env.supabaseAnonKey),
};
