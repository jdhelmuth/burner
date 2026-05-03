import AsyncStorage from "@react-native-async-storage/async-storage";

const DEMO_SESSION_KEY = "burner.demo.session";

export type DemoUser = {
  id: string;
  app_metadata: Record<string, unknown>;
  user_metadata: {
    display_name?: string;
  };
  aud: string;
  created_at: string;
  email?: string;
};

type DemoAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: "bearer";
  user: DemoUser;
};

export type DemoSession = {
  session: DemoAuthSession | null;
  user: DemoUser | null;
};

function buildDemoSession(email = "demo@burner.local"): DemoSession {
  const user: DemoUser = {
    id: "demo-sender",
    app_metadata: {},
    user_metadata: {
      display_name: "Demo Sender",
    },
    aud: "authenticated",
    created_at: new Date().toISOString(),
    email,
  };

  const session: DemoAuthSession = {
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
