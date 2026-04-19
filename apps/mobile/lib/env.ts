import Constants from "expo-constants";

type ExtraConfig = {
  expoConfig?: {
    scheme?: string | string[];
    extra?: Record<string, unknown>;
  };
};

const expoConfig = (Constants as typeof Constants & ExtraConfig).expoConfig;
const extra = expoConfig?.extra ?? {};
const configuredScheme =
  process.env.EXPO_PUBLIC_AUTH_SCHEME ??
  (typeof expoConfig?.scheme === "string"
    ? expoConfig.scheme
    : Array.isArray(expoConfig?.scheme)
      ? expoConfig.scheme[0]
      : "");

export const env = {
  appScheme: configuredScheme || "burner",
  authRedirectPath: "auth/callback",
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  burnerWebUrl:
    process.env.EXPO_PUBLIC_BURNER_WEB_URL ??
    (typeof extra.EXPO_PUBLIC_BURNER_WEB_URL === "string" ? extra.EXPO_PUBLIC_BURNER_WEB_URL : ""),
};

export const runtimeFlags = {
  isSupabaseConfigured: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  isLocalWebConfigured: Boolean(env.burnerWebUrl),
};
