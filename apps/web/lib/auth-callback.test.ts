import { describe, expect, it } from "vitest";

import { isSupportedOtpType, parseWebAuthCallbackUrl } from "./auth-callback";

describe("parseWebAuthCallbackUrl", () => {
  it("reads tokens from hash fragments", () => {
    expect(
      parseWebAuthCallbackUrl(
        "http://localhost:3000/auth/callback#access_token=access-123&refresh_token=refresh-456&type=magiclink",
      ),
    ).toEqual({
      accessToken: "access-123",
      refreshToken: "refresh-456",
      code: undefined,
      tokenHash: undefined,
      type: "magiclink",
      error: undefined,
      errorDescription: undefined,
    });
  });

  it("reads pkce codes and token hashes from query params", () => {
    expect(
      parseWebAuthCallbackUrl(
        "http://localhost:3000/auth/callback?code=pkce-code&token_hash=hash-123&type=email&error_description=temporarily+unavailable",
      ),
    ).toEqual({
      accessToken: undefined,
      refreshToken: undefined,
      code: "pkce-code",
      tokenHash: "hash-123",
      type: "email",
      error: undefined,
      errorDescription: "temporarily unavailable",
    });
  });
});

describe("isSupportedOtpType", () => {
  it("accepts supported web auth types", () => {
    expect(isSupportedOtpType("magiclink")).toBe(true);
    expect(isSupportedOtpType("email")).toBe(true);
    expect(isSupportedOtpType("invite")).toBe(true);
    expect(isSupportedOtpType("phone_change")).toBe(false);
  });
});
