export interface WebAuthCallbackParams {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  tokenHash?: string;
  type?: string;
  error?: string;
  errorDescription?: string;
}

function readParams(value: string) {
  return new URLSearchParams(value.startsWith("#") || value.startsWith("?") ? value.slice(1) : value);
}

export function parseWebAuthCallbackUrl(url: string): WebAuthCallbackParams {
  const parsed = new URL(url);
  const search = readParams(parsed.search);
  const hash = readParams(parsed.hash);
  const all = new URLSearchParams([...search.entries(), ...hash.entries()]);

  return {
    accessToken: all.get("access_token") ?? undefined,
    refreshToken: all.get("refresh_token") ?? undefined,
    code: all.get("code") ?? undefined,
    tokenHash: all.get("token_hash") ?? undefined,
    type: all.get("type") ?? undefined,
    error: all.get("error") ?? undefined,
    errorDescription: all.get("error_description") ?? undefined,
  };
}

export function isSupportedOtpType(value?: string): value is "email" | "magiclink" | "recovery" | "invite" | "email_change" {
  return value === "email" || value === "magiclink" || value === "recovery" || value === "invite" || value === "email_change";
}
