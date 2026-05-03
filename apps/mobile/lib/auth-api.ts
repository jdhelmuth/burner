import { env } from "./env";
import type { DemoSession } from "./demo-auth";

function getApiBaseUrl() {
  if (!env.burnerWebUrl.trim()) {
    throw new Error("EXPO_PUBLIC_BURNER_WEB_URL is required for backend auth.");
  }
  return env.burnerWebUrl.replace(/\/$/, "");
}

async function requestAuth(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | (DemoSession & { error?: string })
    | null;
  if (!response.ok || !payload?.session) {
    throw new Error(payload?.error ?? "Authentication failed.");
  }
  return payload;
}

export function signInWithPassword(email: string, password: string) {
  return requestAuth("/api/auth/signin", { email, password });
}

export function signUpWithPassword(email: string, password: string) {
  return requestAuth("/api/auth/signup", { email, password });
}
