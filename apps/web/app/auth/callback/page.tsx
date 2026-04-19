"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { isSupportedOtpType, parseWebAuthCallbackUrl } from "../../../lib/auth-callback";
import { getBrowserSupabaseClient } from "../../../lib/supabase";

export default function AuthCallbackPage() {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    let active = true;

    async function completeAuth() {
      try {
        const params = parseWebAuthCallbackUrl(window.location.href);

        if (params.error) {
          throw new Error(params.errorDescription ?? params.error);
        }

        if (params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) {
            throw error;
          }
        } else if (params.accessToken && params.refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });
          if (error) {
            throw error;
          }
        } else if (params.tokenHash && isSupportedOtpType(params.type)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.tokenHash,
            type: params.type,
          });
          if (error) {
            throw error;
          }
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("Burner could not find a usable auth callback.");
          }
        }

        if (active) {
          setMessage("Sign-in complete. Sending you back to the dashboard...");
        }

        window.location.replace("/");
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage((error as Error).message);
      }
    }

    completeAuth();

    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <main className="app-shell">
      <section className="panel auth-shell">
        <span className="eyebrow">auth callback</span>
        <h1 className="panel-title">Almost there.</h1>
        <p className="muted-copy">{message}</p>
        <div className="button-row">
          <Link className="button button--secondary" href="/">
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
