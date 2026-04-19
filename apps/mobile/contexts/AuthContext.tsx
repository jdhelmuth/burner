import { type PropsWithChildren, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import type { Session, User } from "@supabase/supabase-js";

import {
  getAppleDisplayName,
  getAuthRedirectUrl,
  isAppleNativeSignInAvailable,
  isSupportedEmailOtpType,
  openOAuthSession,
  parseAuthCallbackUrl,
  startAppleNativeSignIn,
} from "../lib/auth";
import { getDemoSession, signInDemo, signOutDemo } from "../lib/demo-auth";
import { runtimeFlags } from "../lib/env";
import { supabase } from "../lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isDemoAuth: boolean;
  signInWithMagicLink(email: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  signInWithApple(): Promise<void>;
  consumeAuthCallbackUrl(url: string): Promise<Session | null>;
  continueAsDemoSender(email?: string): Promise<void>;
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastHandledAuthUrlRef = useRef<string | null>(null);
  const inFlightAuthUrlRef = useRef<{ promise: Promise<Session | null>; url: string } | null>(null);

  useEffect(() => {
    if (!runtimeFlags.isSupabaseConfigured) {
      getDemoSession().then(({ session: demoSession, user: demoUser }) => {
        setSession(demoSession);
        setUser(demoUser);
        setLoading(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const completeSession = (nextSession: Session | null, nextUser?: User | null) => {
    setSession(nextSession);
    setUser(nextUser ?? nextSession?.user ?? null);
    return nextSession;
  };

  async function consumeAuthCallbackUrl(url: string) {
    if (!runtimeFlags.isSupabaseConfigured) {
      return null;
    }

    if (lastHandledAuthUrlRef.current === url) {
      return session;
    }

    if (inFlightAuthUrlRef.current?.url === url) {
      return inFlightAuthUrlRef.current.promise;
    }

    const promise = (async () => {
      const params = parseAuthCallbackUrl(url);

      if (params.error || params.errorCode || params.errorDescription) {
        throw new Error(params.errorDescription ?? params.error ?? "Authentication failed.");
      }

      if (params.code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);

        if (error) {
          throw error;
        }

        lastHandledAuthUrlRef.current = url;
        return completeSession(data.session, data.user);
      }

      if (params.accessToken && params.refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });

        if (error) {
          throw error;
        }

        lastHandledAuthUrlRef.current = url;
        return completeSession(data.session, data.user);
      }

      if (params.tokenHash && isSupportedEmailOtpType(params.type)) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.tokenHash,
          type: params.type,
        });

        if (error) {
          throw error;
        }

        lastHandledAuthUrlRef.current = url;
        return completeSession(data.session, data.user);
      }

      throw new Error("Burner could not read a usable auth session from that callback.");
    })();

    inFlightAuthUrlRef.current = { promise, url };

    try {
      return await promise;
    } finally {
      if (inFlightAuthUrlRef.current?.url === url) {
        inFlightAuthUrlRef.current = null;
      }
    }
  }

  async function signInWithProviderOAuth(
    provider: "apple" | "google",
    queryParams?: Record<string, string>,
  ) {
    const redirectTo = getAuthRedirectUrl();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        queryParams,
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (!data.url) {
      throw new Error(`Supabase did not return a ${provider} OAuth URL.`);
    }

    const result = await openOAuthSession(data.url, redirectTo);

    if (result.type !== "success" || !result.url) {
      throw new Error(`${provider === "apple" ? "Apple" : "Google"} sign-in was cancelled.`);
    }

    await consumeAuthCallbackUrl(result.url);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      isDemoAuth: !runtimeFlags.isSupabaseConfigured,
      async signInWithMagicLink(email: string) {
        if (!runtimeFlags.isSupabaseConfigured) {
          const demo = await signInDemo(email);
          setSession(demo.session);
          setUser(demo.user);
          return;
        }
        await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
      },
      async signInWithGoogle() {
        if (!runtimeFlags.isSupabaseConfigured) {
          const demo = await signInDemo("google-demo@burner.local");
          setSession(demo.session);
          setUser(demo.user);
          return;
        }
        await signInWithProviderOAuth("google", {
          access_type: "offline",
          prompt: "consent",
        });
      },
      async signInWithApple() {
        if (!runtimeFlags.isSupabaseConfigured) {
          const demo = await signInDemo("apple-demo@burner.local");
          setSession(demo.session);
          setUser(demo.user);
          return;
        }

        if (Platform.OS === "ios" && (await isAppleNativeSignInAvailable())) {
          const { credential, rawNonce } = await startAppleNativeSignIn();
          const { data, error } = await supabase.auth.signInWithIdToken({
            nonce: rawNonce,
            provider: "apple",
            token: credential.identityToken,
          });

          if (error) {
            throw error;
          }

          completeSession(data.session, data.user);

          const fullName = getAppleDisplayName(credential);

          if (fullName) {
            const { error: updateError } = await supabase.auth.updateUser({
              data: {
                full_name: fullName,
              },
            });

            if (updateError) {
              console.warn("Unable to persist Apple profile metadata", updateError);
            }
          }

          return;
        }

        await signInWithProviderOAuth("apple");
      },
      async consumeAuthCallbackUrl(url: string) {
        return consumeAuthCallbackUrl(url);
      },
      async continueAsDemoSender(email?: string) {
        if (!runtimeFlags.isSupabaseConfigured) {
          const demo = await signInDemo(email);
          setSession(demo.session);
          setUser(demo.user);
          return;
        }

        const demoEmail = email?.trim() || "demo@burner.local";
        const demoPassword = "burnerpass123";

        const signIn = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        if (!signIn.error && signIn.data.session) {
          setSession(signIn.data.session);
          setUser(signIn.data.user);
          return;
        }

        const signUp = await supabase.auth.signUp({
          email: demoEmail,
          password: demoPassword,
        });

        if (signUp.data.session) {
          setSession(signUp.data.session);
          setUser(signUp.data.user);
          return;
        }

        const retrySignIn = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

        if (retrySignIn.error) {
          throw retrySignIn.error;
        }

        setSession(retrySignIn.data.session);
        setUser(retrySignIn.data.user);
      },
      async signOut() {
        if (!runtimeFlags.isSupabaseConfigured) {
          await signOutDemo();
          setSession(null);
          setUser(null);
          return;
        }
        await supabase.auth.signOut();
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
