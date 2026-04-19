import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session, User } from "@supabase/supabase-js";

const DEMO_SESSION_KEY = "burner.demo.session";

type DemoSession = {
  session: Session | null;
  user: User | null;
};

function buildDemoSession(email = "demo@burner.local"): DemoSession {
  const user: User = {
    id: "demo-sender",
    app_metadata: {},
    user_metadata: {
      display_name: "Demo Sender",
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
  };

  const session: Session = {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  };

  return { session, user };
}

export async function getDemoSession() {
  const raw = await AsyncStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) {
    return { session: null, user: null } satisfies DemoSession;
  }

  return JSON.parse(raw) as DemoSession;
}

export async function signInDemo(email?: string) {
  const next = buildDemoSession(email);
  await AsyncStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(next));
  return next;
}

export async function signOutDemo() {
  await AsyncStorage.removeItem(DEMO_SESSION_KEY);
}
