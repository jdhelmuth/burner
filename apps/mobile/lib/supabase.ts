import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { env } from "./env";

const fallbackUrl = env.supabaseUrl || "http://127.0.0.1:54321";
const fallbackAnonKey =
  env.supabaseAnonKey ||
  "demo-anon-key";

export const supabase = createClient(fallbackUrl, fallbackAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
