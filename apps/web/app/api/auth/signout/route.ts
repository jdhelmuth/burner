import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentSession } from "../../../../lib/server/auth";
import { sha256 } from "../../../../lib/server/crypto";
import { sql } from "../../../../lib/server/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getCurrentSession();
  if (session?.access_token) {
    await sql`delete from user_sessions where token_hash = ${await sha256(session.access_token)}`;
  }
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
