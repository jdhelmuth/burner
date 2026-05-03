import {
  type PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type DemoSession,
  type DemoUser,
  getDemoSession,
  signInDemo,
  signOutDemo,
} from "../lib/demo-auth";
import { runtimeFlags } from "../lib/env";
import {
  signInWithPassword as signInWithApiPassword,
  signUpWithPassword as signUpWithApiPassword,
} from "../lib/auth-api";

type AuthContextValue = {
  user: DemoUser | null;
  session: DemoSession["session"];
  loading: boolean;
  isDemoAuth: boolean;
  signInWithPassword(email: string, password: string): Promise<void>;
  signUpWithPassword(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  consumeAuthCallbackUrl(url: string): Promise<DemoSession["session"] | null>;
  continueAsDemoSender(email?: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<DemoSession["session"]>(null);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemoSession().then(({ session: demoSession, user: demoUser }) => {
      setSession(demoSession);
      setUser(demoUser);
      setLoading(false);
    });
  }, []);

  async function startDemo(email?: string) {
    const demo = await signInDemo(email);
    setSession(demo.session);
    setUser(demo.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isDemoAuth: !runtimeFlags.isBackendConfigured,
      async signInWithPassword(email: string, password: string) {
        if (runtimeFlags.isBackendConfigured) {
          const next = await signInWithApiPassword(email, password);
          setSession(next.session);
          setUser(next.user);
          return;
        }
        await startDemo(email);
      },
      async signUpWithPassword(email: string, password: string) {
        if (runtimeFlags.isBackendConfigured) {
          const next = await signUpWithApiPassword(email, password);
          setSession(next.session);
          setUser(next.user);
          return;
        }
        await startDemo(email);
      },
      async signInWithGoogle() {
        await startDemo("google-demo@burner.local");
      },
      async signInWithApple() {
        await startDemo("apple-demo@burner.local");
      },
      async consumeAuthCallbackUrl() {
        return session;
      },
      async continueAsDemoSender(email?: string) {
        await startDemo(email);
      },
      async signOut() {
        await signOutDemo();
        setSession(null);
        setUser(null);
      },
    }),
    [loading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
