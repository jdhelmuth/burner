const supportedEmailOtpTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

type SupportedEmailOtpType = (typeof supportedEmailOtpTypes)[number];

export type ParsedAuthCallback = {
  accessToken?: string;
  code?: string;
  error?: string;
  errorCode?: string;
  errorDescription?: string;
  refreshToken?: string;
  tokenHash?: string;
  type?: string;
};

function decodeAuthParam(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
}

function parseParamSection(rawSection: string) {
  const params: Record<string, string> = {};

  if (!rawSection) {
    return params;
  }

  for (const pair of rawSection.split("&")) {
    if (!pair) {
      continue;
    }

    const [rawKey, ...rawValue] = pair.split("=");
    const key = decodeAuthParam(rawKey);

    if (!key) {
      continue;
    }

    params[key] = decodeAuthParam(rawValue.join("="));
  }

  return params;
}

export function parseAuthCallbackUrl(url: string): ParsedAuthCallback {
  const queryStart = url.indexOf("?");
  const hashStart = url.indexOf("#");

  const querySection =
    queryStart === -1 ? "" : url.slice(queryStart + 1, hashStart === -1 ? undefined : hashStart);
  const hashSection = hashStart === -1 ? "" : url.slice(hashStart + 1);

  const params = {
    ...parseParamSection(querySection),
    ...parseParamSection(hashSection),
  };

  return {
    accessToken: params.access_token,
    code: params.code,
    error: params.error,
    errorCode: params.error_code,
    errorDescription: params.error_description,
    refreshToken: params.refresh_token,
    tokenHash: params.token_hash,
    type: params.type,
  };
}

export function isSupportedEmailOtpType(value: string | undefined): value is SupportedEmailOtpType {
  return Boolean(value && supportedEmailOtpTypes.includes(value as SupportedEmailOtpType));
}
