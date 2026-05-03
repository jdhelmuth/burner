"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return new URL(window.location.href).searchParams.get("token") ?? "";
  }, []);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);

  async function submitReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Burner could not reset that password.");
      }
      setComplete(true);
      setPassword("");
      setMessage("Password reset. Sign in with your new password.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="my-burns">
      <header className="my-burns__header">
        <Link className="my-burns__back" href="/">
          ← Back to Burner
        </Link>
        <h1>Reset Password</h1>
      </header>

      {!token ? (
        <p className="my-burns__empty my-burns__empty--error">
          This reset link is missing a token.
        </p>
      ) : complete ? (
        <p className="my-burns__empty">{message}</p>
      ) : (
        <form className="itunes-signin__form" onSubmit={submitReset}>
          <label className="field">
            <span>New password</span>
            <input
              autoComplete="new-password"
              className="input"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
          </label>
          <button
            className="button button--primary"
            disabled={busy || password.length < 8}
            type="submit"
          >
            {busy ? "Resetting..." : "Reset Password"}
          </button>
          {message ? (
            <p className="my-burns__empty my-burns__empty--error">{message}</p>
          ) : null}
        </form>
      )}
    </main>
  );
}
