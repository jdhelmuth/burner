import type { AppSession } from "./server/auth";

type AuthListener = (session: AppSession | null) => void;

const listeners = new Set<AuthListener>();
let cachedSession: AppSession | null | undefined;

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;
  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }
  return payload as T;
}

function notify(session: AppSession | null) {
  cachedSession = session;
  for (const listener of listeners) {
    listener(session);
  }
}

export async function getSession() {
  if (cachedSession !== undefined) {
    return cachedSession;
  }
  const payload = await requestJson<{ session: AppSession | null }>(
    "/api/auth/session",
  );
  cachedSession = payload.session;
  return payload.session;
}

export function onAuthStateChange(listener: AuthListener) {
  listeners.add(listener);
  return {
    unsubscribe() {
      listeners.delete(listener);
    },
  };
}

export async function signInWithPassword(input: {
  email: string;
  password: string;
  captchaToken?: string;
}) {
  const payload = await requestJson<{ session: AppSession }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  });
  notify(payload.session);
}

export async function signUp(input: {
  displayName?: string;
  email: string;
  password: string;
  captchaToken?: string;
}) {
  const payload = await requestJson<{ session: AppSession }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
  notify(payload.session);
  return payload;
}

export async function signOut() {
  await requestJson<{ ok: true }>("/api/auth/signout", { method: "POST" });
  notify(null);
}

export async function requestPasswordReset(email: string) {
  return requestJson<{ ok: true }>("/api/auth/password-reset", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export type { AppSession };
