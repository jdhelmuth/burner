"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { isSupportedOtpType, parseWebAuthCallbackUrl } from "../../../lib/auth-callback";
import { getBrowserSupabaseClient } from "../../../lib/supabase";

type View =
  | { kind: "working"; message: string }
  | { kind: "recovery"; message: string | null }
  | { kind: "error"; message: string };

export default function AuthCallbackPage() {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const [view, setView] = useState<View>({
    kind: "working",
    message: "Completing sign-in...",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function completeAuth() {
      try {
        const params = parseWebAuthCallbackUrl(window.location.href);
        const isRecovery = params.type === "recovery";

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

        if (!active) return;

        if (isRecovery) {
          setView({ kind: "recovery", message: null });
          return;
        }

        setView({
          kind: "working",
          message: "Sign-in complete. Sending you back to the dashboard...",
        });
        window.location.replace("/");
      } catch (error) {
        if (!active) return;
        setView({ kind: "error", message: (error as Error).message });
      }
    }

    completeAuth();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function submitNewPassword(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setView({
        kind: "recovery",
        message: "Use a password with at least 8 characters.",
      });
      return;
    }
    if (password !== confirmPassword) {
      setView({ kind: "recovery", message: "Passwords do not match." });
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      window.location.replace("/");
    } catch (error) {
      setView({ kind: "recovery", message: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="panel auth-shell">
        <span className="eyebrow">auth callback</span>
        <h1 className="panel-title">
          {view.kind === "recovery" ? "Set a new password" : "Almost there."}
        </h1>

        {view.kind === "recovery" ? (
          <form className="itunes-signin__form" onSubmit={submitNewPassword}>
            <label className="field">
              <span>New password</span>
              <input
                autoComplete="new-password"
                className="input"
                minLength={8}
                placeholder="At least 8 characters"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <label className="field">
              <span>Confirm password</span>
              <input
                autoComplete="new-password"
                className="input"
                minLength={8}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
            <button
              className="button button--primary"
              disabled={busy}
              type="submit"
            >
              {busy ? "Saving..." : "Update Password"}
            </button>
            {view.message ? (
              <p className="status-message">{view.message}</p>
            ) : null}
          </form>
        ) : (
          <>
            <p className="muted-copy">{view.message}</p>
            <div className="button-row">
              <Link className="button button--secondary" href="/">
                Back to dashboard
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
