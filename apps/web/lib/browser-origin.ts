import { env } from "./env";

export function getCanonicalBrowserOrigin(rawOrigin?: string) {
  const configuredOrigin = env.webOrigin.trim();
  if (configuredOrigin) {
    return configuredOrigin.replace(/\/$/, "");
  }

  const fallbackOrigin =
    rawOrigin ??
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!fallbackOrigin) {
    return "";
  }

  try {
    const url = new URL(fallbackOrigin);
    if (url.hostname === "127.0.0.1" || url.hostname === "0.0.0.0") {
      url.hostname = "localhost";
    }

    return url.origin;
  } catch {
    return fallbackOrigin;
  }
}

export function buildBrowserApiUrl(path: string, rawOrigin?: string) {
  const origin = getCanonicalBrowserOrigin(rawOrigin);
  if (!origin) {
    return path;
  }

  try {
    return new URL(path, origin).toString();
  } catch {
    return path;
  }
}
