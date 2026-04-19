import * as AppleAuthentication from "expo-apple-authentication";
import { makeRedirectUri } from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";

import { isSupportedEmailOtpType, parseAuthCallbackUrl } from "./auth-callback";
import { env } from "./env";

export function getAuthRedirectUrl() {
  return makeRedirectUri({
    path: env.authRedirectPath,
    scheme: env.appScheme,
  });
}

export async function openOAuthSession(authUrl: string, redirectUrl = getAuthRedirectUrl()) {
  return WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
}

export async function isAppleNativeSignInAvailable() {
  return AppleAuthentication.isAvailableAsync();
}

export async function startAppleNativeSignIn() {
  const rawNonce = Crypto.randomUUID();
  const state = Crypto.randomUUID();

  const credential = await AppleAuthentication.signInAsync({
    nonce: rawNonce,
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    state,
  });

  if (!credential.identityToken || !credential.authorizationCode || !credential.user) {
    throw new Error("Apple sign-in did not return a complete credential payload.");
  }

  return {
    credential: {
      ...credential,
      authorizationCode: credential.authorizationCode,
      identityToken: credential.identityToken,
      user: credential.user,
    },
    rawNonce,
  };
}

export function getAppleDisplayName(credential: AppleAuthentication.AppleAuthenticationCredential) {
  if (!credential.fullName) {
    return null;
  }

  try {
    const fullName = AppleAuthentication.formatFullName(credential.fullName).trim();
    return fullName || null;
  } catch {
    return null;
  }
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Something went wrong while Burner was trying to sign you in.";
}

export { isSupportedEmailOtpType, parseAuthCallbackUrl };
