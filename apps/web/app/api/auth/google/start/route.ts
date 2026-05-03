import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthorizationUrl,
  getGoogleConfig,
} from "../../../../../lib/server/google-oauth";
import { randomToken } from "../../../../../lib/server/crypto";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "burner_google_oauth_state";
const STATE_MAX_AGE_SECONDS = 10 * 60;

export async function GET(request: Request) {
  try {
    const config = getGoogleConfig(new URL(request.url).origin);
    const state = randomToken(24);
    const url = buildGoogleAuthorizationUrl(config, state);

    const cookieStore = await cookies();
    cookieStore.set(STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: STATE_MAX_AGE_SECONDS,
    });

    return NextResponse.redirect(url);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
