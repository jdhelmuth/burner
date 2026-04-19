import { describe, expect, it } from "vitest";

import { isSupportedEmailOtpType, parseAuthCallbackUrl } from "./auth-callback";

describe("parseAuthCallbackUrl", () => {
  it("reads implicit session params from the hash fragment", () => {
    expect(
      parseAuthCallbackUrl(
        "burner://auth/callback#access_token=access-123&refresh_token=refresh-456&type=magiclink",
      ),
    ).toEqual({
      accessToken: "access-123",
      code: undefined,
      error: undefined,
      errorCode: undefined,
      errorDescription: undefined,
      refreshToken: "refresh-456",
      tokenHash: undefined,
      type: "magiclink",
    });
  });

  it("reads pkce codes and auth errors from query params", () => {
    expect(
      parseAuthCallbackUrl(
        "burner://auth/callback?code=pkce-code&error_description=temporarily+unavailable&error_code=oauth_denied",
      ),
    ).toEqual({
      accessToken: undefined,
      code: "pkce-code",
      error: undefined,
      errorCode: "oauth_denied",
      errorDescription: "temporarily unavailable",
      refreshToken: undefined,
      tokenHash: undefined,
      type: undefined,
    });
  });
});

describe("isSupportedEmailOtpType", () => {
  it("accepts supported Supabase email otp types", () => {
    expect(isSupportedEmailOtpType("magiclink")).toBe(true);
    expect(isSupportedEmailOtpType("email_change")).toBe(true);
  });

  it("rejects unsupported values", () => {
    expect(isSupportedEmailOtpType(undefined)).toBe(false);
    expect(isSupportedEmailOtpType("sms")).toBe(false);
  });
});
