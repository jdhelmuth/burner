"use client";

import Link from "next/link";

export default function AuthCallbackPage() {
  return (
    <main className="auth-callback">
      <h1>Auth callback unavailable</h1>
      <p>
        Burner now uses its Neon-backed email/password auth flow directly on the
        home page. OAuth and email recovery callbacks have not been re-enabled
        yet.
      </p>
      <Link href="/">Back to Burner</Link>
    </main>
  );
}
